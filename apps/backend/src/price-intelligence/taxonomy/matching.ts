/**
 * Deterministic alias matching and observation comparison.
 * AI may PROPOSE matches for messy text later; this module is the
 * deterministic core that gates what counts as comparable.
 */
import { LEVEL1_FAMILIES } from './families';
import { SERVICE_FAMILIES } from './services.data';
import { ProductFamily, ServiceFamily } from './types';

export function normalizeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s./"]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface FamilyMatch {
  kind: 'product' | 'service';
  key: string;
  name: string;
  confidence: 'exact_alias' | 'partial_alias';
  matchedAlias: string;
}

function aliasCandidates(marketNames: readonly string[], name: string, key: string): string[] {
  return [name.toLowerCase(), key.replace(/-/g, ' '), ...marketNames.map((m) => m.toLowerCase())];
}

function matchAgainst(
  query: string,
  entries: readonly { key: string; name: string; marketNames: readonly string[] }[],
  kind: FamilyMatch['kind'],
): FamilyMatch[] {
  const results: FamilyMatch[] = [];
  for (const entry of entries) {
    for (const alias of aliasCandidates(entry.marketNames, entry.name, entry.key)) {
      if (query === alias) {
        results.push({ kind, key: entry.key, name: entry.name, confidence: 'exact_alias', matchedAlias: alias });
        break;
      }
      // Whole-word containment either way ("bag of cement" contains alias "cement";
      // alias "stone coated" contains query "stone coated sheets" tokens).
      const queryHasAlias = new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`).test(query);
      if (queryHasAlias) {
        results.push({ kind, key: entry.key, name: entry.name, confidence: 'partial_alias', matchedAlias: alias });
        break;
      }
    }
  }
  return results;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match a raw user query to product and service families.
 * Returns matches ordered: exact alias first, then partial.
 * Empty array means "unsupported" → route to custom research.
 */
export function matchQueryToFamilies(rawQuery: string): FamilyMatch[] {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];
  const matches = [
    ...matchAgainst(query, LEVEL1_FAMILIES, 'product'),
    ...matchAgainst(query, SERVICE_FAMILIES, 'service'),
  ];
  return matches.sort((a, b) => (a.confidence === b.confidence ? 0 : a.confidence === 'exact_alias' ? -1 : 1));
}

// ---------------------------------------------------------------------------
// Observation comparability
// ---------------------------------------------------------------------------

export type ComparisonLevel = 'exact' | 'close' | 'partial' | 'not_comparable';

export interface SpecComparison {
  level: ComparisonLevel;
  /** Attribute keys that blocked or weakened the comparison. */
  blockingKeys: readonly string[];
}

type AttributeValues = Readonly<Record<string, string | undefined>>;

/**
 * Compare two observations' attribute sets under a family's matching rules.
 * - Differing values on any `neverComparableAcross` key → not_comparable.
 * - All exactMatchKeys equal (and known) → exact.
 * - All closeMatchKeys equal (and known) → close.
 * - Otherwise → partial (usable only with explicit low-confidence caveats).
 */
export function compareSpecifications(family: ProductFamily, a: AttributeValues, b: AttributeValues): SpecComparison {
  const differsKnown = (key: string): boolean =>
    a[key] !== undefined && b[key] !== undefined && a[key] !== b[key];
  const equalKnown = (key: string): boolean =>
    a[key] !== undefined && b[key] !== undefined && a[key] === b[key];

  const hardBlocks = family.matching.neverComparableAcross.filter(differsKnown);
  if (hardBlocks.length > 0) {
    return { level: 'not_comparable', blockingKeys: hardBlocks };
  }

  if (family.matching.exactMatchKeys.every(equalKnown)) {
    return { level: 'exact', blockingKeys: [] };
  }

  if (family.matching.closeMatchKeys.every(equalKnown)) {
    const missing = family.matching.exactMatchKeys.filter((k) => !equalKnown(k));
    return { level: 'close', blockingKeys: missing };
  }

  const weak = family.matching.closeMatchKeys.filter((k) => !equalKnown(k));
  return { level: 'partial', blockingKeys: weak };
}

/**
 * Guard against mixing labour/service observations into product comparisons.
 */
export function isServiceKey(key: string): boolean {
  return SERVICE_FAMILIES.some((s: ServiceFamily) => s.key === key);
}
