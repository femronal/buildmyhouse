/**
 * Merchant / admin observation lookup used BEFORE live web research.
 *
 * Flow:
 *   1. Load active, fresh PriceObservation rows from merchant_feed + admin_entry
 *   2. Map to ScoringObservation with clear internal:// source URLs
 *   3. If ≥ minIndependentForRange independent groups → live research may be skipped
 *   4. Otherwise live research runs and results are merged with these observations
 *
 * Merchant evidence never secretly overrides online evidence — both enter the
 * same Stage 5 scoring set with labelled sources.
 */
import { ACTIVE_CONFIDENCE_POLICY } from '../reports/confidence-policy';
import { ScoringObservation } from '../reports/confidence';

export const INTERNAL_COLLECTION_METHODS = ['merchant_feed', 'admin_entry'] as const;

export type InternalCollectionMethod = (typeof INTERNAL_COLLECTION_METHODS)[number];

export type StoredObservationRow = {
  id: string;
  familyId: string;
  sourceId: string;
  originalWording: string;
  originalPrice: { toNumber?: () => number } | number | string;
  currencyCode: string;
  originalUnitCode: string;
  normalizedPrice: { toNumber?: () => number } | number | string | null;
  normalizedUnitCode: string | null;
  checkedDate: Date;
  listingDate: Date | null;
  collectionMethod: string;
  evidenceClass: string;
  condition: string;
  deliveryIncluded: string;
  installationIncluded: string;
  vatIncluded: string;
  source: { id: string; code: string; tier: number; name: string };
};

export type MerchantLink = {
  observationId: string;
  merchantId: string | null;
  businessName: string | null;
  sourceTier: number | null;
};

export type InternalLookupResult = {
  observations: ScoringObservation[];
  independentGroupCount: number;
  sufficientForRange: boolean;
  /** True when live web research can be skipped. */
  skipLiveResearch: boolean;
  reasons: string[];
};

function decimalToNumber(value: { toNumber?: () => number } | number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value.toNumber === 'function') {
    const n = value.toNumber();
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asInclusion(value: string): ScoringObservation['deliveryState'] {
  if (value === 'included' || value === 'excluded' || value === 'not_applicable' || value === 'unknown') {
    return value;
  }
  return 'unknown';
}

function asCondition(value: string): ScoringObservation['condition'] {
  if (value === 'new' || value === 'used' || value === 'refurbished' || value === 'rental') return value;
  return 'unknown';
}

/** Map evidence / source to Stage 5 tier. Admin manual is Tier 2; merchant WhatsApp Tier 3 (or merchant.sourceTier). */
export function tierForInternalObservation(
  row: StoredObservationRow,
  merchant: MerchantLink | undefined,
): 1 | 2 | 3 | 4 {
  if (row.collectionMethod === 'admin_entry' || row.source.code === 'admin-manual') {
    return 2;
  }
  const merchantTier = merchant?.sourceTier;
  if (merchantTier === 1 || merchantTier === 2 || merchantTier === 3 || merchantTier === 4) {
    return merchantTier;
  }
  const sourceTier = row.source.tier;
  if (sourceTier === 1 || sourceTier === 2 || sourceTier === 3 || sourceTier === 4) {
    return sourceTier;
  }
  return 3;
}

export function independentGroupForInternal(
  row: StoredObservationRow,
  merchant: MerchantLink | undefined,
): string {
  if (row.collectionMethod === 'merchant_feed') {
    if (merchant?.merchantId) return `merchant:${merchant.merchantId}`;
    return `merchant-source:${row.sourceId}`;
  }
  // Each admin manual entry is its own independent evidence point.
  return `admin:${row.id}`;
}

export function toInternalScoringObservation(
  row: StoredObservationRow,
  merchant: MerchantLink | undefined,
): ScoringObservation {
  const price = decimalToNumber(row.originalPrice) ?? 0;
  const normalized = decimalToNumber(row.normalizedPrice);
  const tier = tierForInternalObservation(row, merchant);
  const channel =
    row.collectionMethod === 'admin_entry' ? 'admin-manual' : 'merchant-price-list';
  const sellerName =
    merchant?.businessName ??
    (row.collectionMethod === 'admin_entry' ? 'BuildMyHouse verified entry' : 'Merchant price list');

  return {
    observationId: row.id,
    sourceUrl: `internal://${channel}/${row.id}`,
    sourceDomain: `internal.${channel}`,
    sourceTier: tier,
    sellerName,
    independentGroupId: independentGroupForInternal(row, merchant),
    originalPrice: price,
    currency: row.currencyCode || 'NGN',
    originalUnit: row.originalUnitCode,
    normalizedPrice: normalized,
    normalizedUnit: row.normalizedUnitCode,
    checkedAtIso: row.checkedDate.toISOString(),
    listingDateIso: row.listingDate ? row.listingDate.toISOString() : null,
    // Approved ops observations are treated as close matches; Stage 5 still applies
    // location/recency gates. Location is unknown unless later enriched.
    specMatch: 'close',
    locationMatch: 'unknown',
    condition: asCondition(row.condition),
    comparable: true,
    comparabilityNotes: [
      row.collectionMethod === 'merchant_feed'
        ? 'Approved merchant price-list observation'
        : 'Approved admin manual observation',
    ],
    deliveryState: asInclusion(row.deliveryIncluded),
    installationState: asInclusion(row.installationIncluded),
    vatState: asInclusion(row.vatIncluded),
    retailOrWholesale: 'retail',
    negotiable: 'unknown',
  };
}

export function assessInternalSufficiency(
  observations: ScoringObservation[],
  opts?: { minIndependent?: number; forceLiveResearch?: boolean },
): InternalLookupResult {
  const minIndependent =
    opts?.minIndependent ?? ACTIVE_CONFIDENCE_POLICY.hardGates.minIndependentForRange;
  const groups = new Set(observations.map((o) => o.independentGroupId));
  const independentGroupCount = groups.size;
  const sufficientForRange = independentGroupCount >= minIndependent && observations.length >= minIndependent;
  const forceLive = opts?.forceLiveResearch === true;
  const skipLiveResearch = sufficientForRange && !forceLive;

  const reasons: string[] = [];
  if (observations.length === 0) {
    reasons.push('No fresh approved merchant/admin observations for this family.');
  } else {
    reasons.push(
      `Found ${observations.length} approved internal observation(s) across ${independentGroupCount} independent seller group(s).`,
    );
  }
  if (skipLiveResearch) {
    reasons.push(
      `Internal evidence meets the minimum of ${minIndependent} independent sources — live web research skipped.`,
    );
  } else if (observations.length > 0) {
    reasons.push('Internal evidence is thin or single-source — live web research will run and merge.');
  } else {
    reasons.push('Proceeding with live web research.');
  }

  return {
    observations,
    independentGroupCount,
    sufficientForRange,
    skipLiveResearch,
    reasons,
  };
}

/** Soft brand filter: keep rows whose wording mentions the brand when provided. */
export function filterByBrandHint(
  rows: StoredObservationRow[],
  brand: string | null | undefined,
): StoredObservationRow[] {
  if (!brand || !brand.trim()) return rows;
  const needle = brand.trim().toLowerCase();
  const matched = rows.filter((r) => r.originalWording.toLowerCase().includes(needle));
  return matched.length > 0 ? matched : rows;
}

export function mergeScoringObservations(
  internal: ScoringObservation[],
  live: ScoringObservation[],
): ScoringObservation[] {
  const seen = new Set<string>();
  const out: ScoringObservation[] = [];
  for (const o of [...internal, ...live]) {
    if (seen.has(o.observationId)) continue;
    seen.add(o.observationId);
    out.push(o);
  }
  return out;
}
