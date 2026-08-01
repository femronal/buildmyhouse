/**
 * Stage 8 — detect material customer impact from report corrections.
 */

export type ConfidenceLabelLike = 'high' | 'moderate' | 'low' | 'insufficient_data' | string;

export interface MaterialImpactBefore {
  typicalPrice?: number | null;
  rangeLow?: number | null;
  rangeHigh?: number | null;
  confidenceLabel?: ConfidenceLabelLike | null;
  confidenceScore?: number | null;
  status?: string | null;
}

export interface MaterialImpactAfter {
  typicalPrice?: number | null;
  rangeLow?: number | null;
  rangeHigh?: number | null;
  confidenceLabel?: ConfidenceLabelLike | null;
  confidenceScore?: number | null;
  status?: string | null;
}

export interface MaterialImpactResult {
  material: boolean;
  reasons: string[];
  typicalPriceChangePct: number | null;
}

/** Default threshold: ≥10% change in typical price is material. */
export const DEFAULT_TYPICAL_PRICE_CHANGE_PCT = 10;

const LABEL_RANK: Record<string, number> = {
  high: 3,
  moderate: 2,
  low: 1,
  insufficient_data: 0,
};

function pctChange(before: number, after: number): number {
  if (before === 0) return after === 0 ? 0 : 100;
  return (Math.abs(after - before) / Math.abs(before)) * 100;
}

/**
 * Material if:
 * - typical price moves by ≥ thresholdPct
 * - confidence label changes
 * - status flips between priced and insufficient_data
 * - range bounds move materially when typical is absent
 */
export function detectMaterialImpact(
  before: MaterialImpactBefore,
  after: MaterialImpactAfter,
  thresholdPct: number = DEFAULT_TYPICAL_PRICE_CHANGE_PCT,
): MaterialImpactResult {
  const reasons: string[] = [];
  let typicalPriceChangePct: number | null = null;

  const bTyp = before.typicalPrice;
  const aTyp = after.typicalPrice;
  if (typeof bTyp === 'number' && typeof aTyp === 'number' && Number.isFinite(bTyp) && Number.isFinite(aTyp)) {
    typicalPriceChangePct = pctChange(bTyp, aTyp);
    if (typicalPriceChangePct >= thresholdPct) {
      reasons.push(`typical price changed ${typicalPriceChangePct.toFixed(1)}%`);
    }
  } else if ((bTyp == null) !== (aTyp == null)) {
    reasons.push('typical price presence changed');
  }

  const bLabel = (before.confidenceLabel ?? '').toLowerCase();
  const aLabel = (after.confidenceLabel ?? '').toLowerCase();
  if (bLabel && aLabel && bLabel !== aLabel) {
    reasons.push(`confidence label ${bLabel} → ${aLabel}`);
  } else if (bLabel && aLabel && LABEL_RANK[bLabel] !== undefined && LABEL_RANK[aLabel] !== undefined) {
    // same label — no-op
  }

  const bStatus = (before.status ?? '').toLowerCase();
  const aStatus = (after.status ?? '').toLowerCase();
  const insuff = (s: string) => s === 'insufficient_data';
  if (bStatus && aStatus && insuff(bStatus) !== insuff(aStatus)) {
    reasons.push(`status ${bStatus} → ${aStatus}`);
  }

  if (typicalPriceChangePct == null) {
    const bLow = before.rangeLow;
    const aLow = after.rangeLow;
    const bHigh = before.rangeHigh;
    const aHigh = after.rangeHigh;
    if (
      typeof bLow === 'number' &&
      typeof aLow === 'number' &&
      typeof bHigh === 'number' &&
      typeof aHigh === 'number'
    ) {
      const midBefore = (bLow + bHigh) / 2;
      const midAfter = (aLow + aHigh) / 2;
      const midPct = pctChange(midBefore, midAfter);
      if (midPct >= thresholdPct) {
        reasons.push(`range midpoint changed ${midPct.toFixed(1)}%`);
        typicalPriceChangePct = midPct;
      }
    }
  }

  if (
    typeof before.confidenceScore === 'number' &&
    typeof after.confidenceScore === 'number' &&
    Math.abs(after.confidenceScore - before.confidenceScore) >= 0.2
  ) {
    reasons.push('confidence score shifted by ≥0.20');
  }

  return {
    material: reasons.length > 0,
    reasons,
    typicalPriceChangePct,
  };
}

/** Median of numbers (for deterministic recalc from approved observation prices). */
export function medianPrice(prices: readonly number[]): number | null {
  const vals = prices.filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (vals.length === 0) return null;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 === 0 ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid];
}

export function rangeFromPrices(prices: readonly number[]): {
  low: number | null;
  high: number | null;
  typical: number | null;
} {
  const vals = prices.filter((n) => Number.isFinite(n));
  if (vals.length === 0) return { low: null, high: null, typical: null };
  return {
    low: Math.min(...vals),
    high: Math.max(...vals),
    typical: medianPrice(vals),
  };
}
