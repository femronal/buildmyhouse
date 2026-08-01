/**
 * Stage 4 section 15 — cache identity + freshness.
 *
 * Cache identity must account for every dimension that materially changes the
 * answer, so a cached result is NEVER returned for a different specification.
 * A cached FREE check must never trigger new live research (enforced by the
 * caller: free tier reads cache only). A paid request may reuse recent valid
 * observations and research only the missing/stale evidence.
 *
 * All hashing here is deterministic and content-addressed.
 */
import { createHash } from 'crypto';

export type CacheLayer =
  | 'search_query'
  | 'retrieved_page'
  | 'extraction'
  | 'observation'
  | 'research_result';

export type CacheStatus = 'cache_hit' | 'partial_cache_hit' | 'cache_miss' | 'stale_cache';

export interface ResultCacheIdentity {
  productFamilyId: string | null;
  canonicalProductName: string;
  /** Normalised, sorted spec map so attribute order never changes the key. */
  specification: Record<string, string>;
  locationCode: string;
  quantityClass: string; // e.g. 'single' | 'small' | 'bulk'
  condition: string;
  deliveryRequired: boolean;
  installationRequired: boolean;
}

function stableStringify(obj: Record<string, string>): string {
  return Object.keys(obj)
    .sort()
    .map((k) => `${k}=${obj[k]}`)
    .join('&');
}

export function resultCacheKey(id: ResultCacheIdentity): string {
  const canonical = [
    id.productFamilyId ?? 'custom',
    id.canonicalProductName.trim().toLowerCase(),
    stableStringify(id.specification),
    id.locationCode,
    id.quantityClass,
    id.condition,
    `del:${id.deliveryRequired}`,
    `ins:${id.installationRequired}`,
  ].join('|');
  return 'res_' + createHash('sha256').update(canonical).digest('hex').slice(0, 24);
}

export function searchQueryCacheKey(query: string, locationCode: string): string {
  const canonical = `${query.trim().toLowerCase()}|${locationCode}`;
  return 'sq_' + createHash('sha256').update(canonical).digest('hex').slice(0, 24);
}

export function pageCacheKey(url: string): string {
  return 'pg_' + createHash('sha256').update(url.trim()).digest('hex').slice(0, 24);
}

export function extractionCacheKey(url: string, matrixFingerprint: string): string {
  const canonical = `${url.trim()}|${matrixFingerprint}`;
  return 'ex_' + createHash('sha256').update(canonical).digest('hex').slice(0, 24);
}

/**
 * Freshness decision. `ageHours` older than `ttlHours` is stale.
 * Returns 'cache_hit' only when the entry exists AND is fresh.
 */
export function freshnessStatus(exists: boolean, ageHours: number, ttlHours: number): CacheStatus {
  if (!exists) return 'cache_miss';
  return ageHours <= ttlHours ? 'cache_hit' : 'stale_cache';
}

/** Coarse quantity class so "1 bag" and "2 bags" share a cache entry but "500 bags" does not. */
export function quantityClass(quantity: number): string {
  if (!Number.isFinite(quantity) || quantity <= 0) return 'unknown';
  if (quantity <= 5) return 'single';
  if (quantity <= 100) return 'small';
  return 'bulk';
}
