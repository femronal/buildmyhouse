/**
 * Stage 4 STEP 8 — deterministic result generation.
 *
 * All arithmetic (range, median, source counting, outlier exclusion,
 * confidence) is deterministic application code (section 2C). GPT-5.6 only
 * writes the plain-language wording later, using ONLY these validated numbers.
 * When evidence is thin the builder returns honest insufficient-data / low
 * confidence rather than manufacturing a price (sections 13 exit criteria).
 */

export type ConfidenceLabel = 'high' | 'moderate' | 'low' | 'insufficient_data';

export interface PricePoint {
  /** One per INDEPENDENT source group (already deduped upstream). */
  independentGroupId: string;
  normalizedPrice: number;
  normalizedUnit: string;
  sourceTier: number; // 1 strongest .. 4 weakest
  checkedAtIso: string;
  locationMatchLevel: string;
  specMatchLevel: 'exact' | 'close' | 'partial';
}

export interface ResultInput {
  points: PricePoint[];
  nowIso?: string;
  /** Recency window in days beyond which a point is considered stale. */
  freshnessDays?: number;
}

export interface PriceResult {
  outcome: 'priced' | 'insufficient_data';
  confidence: ConfidenceLabel;
  confidenceScore: number; // 0..1
  independentSourceCount: number;
  usedSourceCount: number;
  rangeLow: number | null;
  rangeHigh: number | null;
  median: number | null;
  typical: number | null;
  unit: string | null;
  excludedOutliers: number;
  reasons: string[];
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Median Absolute Deviation outlier filter (robust; keeps points within 3.5 MAD). */
function excludeOutliers(values: number[]): { kept: number[]; excluded: number } {
  if (values.length < 4) return { kept: values, excluded: 0 };
  const med = median(values);
  const deviations = values.map((v) => Math.abs(v - med));
  const mad = median(deviations) || 1;
  const kept = values.filter((v) => Math.abs(v - med) / mad <= 3.5);
  return { kept, excluded: values.length - kept.length };
}

const MIN_CREDIBLE_INDEPENDENT_SOURCES = 3;

export function buildResult(input: ResultInput): PriceResult {
  const now = input.nowIso ? new Date(input.nowIso) : new Date();
  const freshnessDays = input.freshnessDays ?? 45;

  // One price per independent group (use the strongest-tier, freshest point).
  const byGroup = new Map<string, PricePoint>();
  for (const p of input.points) {
    const existing = byGroup.get(p.independentGroupId);
    if (!existing) {
      byGroup.set(p.independentGroupId, p);
      continue;
    }
    const better =
      p.sourceTier < existing.sourceTier ||
      (p.sourceTier === existing.sourceTier && new Date(p.checkedAtIso) > new Date(existing.checkedAtIso));
    if (better) byGroup.set(p.independentGroupId, p);
  }
  const groupPoints = [...byGroup.values()];
  const independentSourceCount = groupPoints.length;

  const reasons: string[] = [];

  if (independentSourceCount === 0) {
    return {
      outcome: 'insufficient_data',
      confidence: 'insufficient_data',
      confidenceScore: 0,
      independentSourceCount: 0,
      usedSourceCount: 0,
      rangeLow: null,
      rangeHigh: null,
      median: null,
      typical: null,
      unit: null,
      excludedOutliers: 0,
      reasons: ['No comparable public evidence found.'],
    };
  }

  // Unit must be consistent; pick the modal unit, drop mismatches.
  const unitCounts = new Map<string, number>();
  for (const p of groupPoints) unitCounts.set(p.normalizedUnit, (unitCounts.get(p.normalizedUnit) ?? 0) + 1);
  const unit = [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const sameUnit = groupPoints.filter((p) => p.normalizedUnit === unit);

  const values = sameUnit.map((p) => p.normalizedPrice);
  const { kept, excluded } = excludeOutliers(values);
  if (excluded > 0) reasons.push(`${excluded} outlier price(s) excluded (robust MAD filter).`);

  const usedSourceCount = kept.length;
  if (usedSourceCount === 0) {
    return {
      outcome: 'insufficient_data',
      confidence: 'insufficient_data',
      confidenceScore: 0,
      independentSourceCount,
      usedSourceCount: 0,
      rangeLow: null,
      rangeHigh: null,
      median: null,
      typical: null,
      unit,
      excludedOutliers: excluded,
      reasons: ['No consistent comparable prices after validation.'],
    };
  }

  const rangeLow = Math.min(...kept);
  const rangeHigh = Math.max(...kept);
  const med = Number(median(kept).toFixed(2));

  // --- Deterministic confidence ---
  const freshCount = sameUnit.filter(
    (p) => (now.getTime() - new Date(p.checkedAtIso).getTime()) / 86_400_000 <= freshnessDays,
  ).length;
  const exactSpecCount = sameUnit.filter((p) => p.specMatchLevel === 'exact').length;
  const strongTierCount = sameUnit.filter((p) => p.sourceTier <= 2).length;
  const localCount = sameUnit.filter((p) => ['exact_local_area', 'same_city', 'same_state'].includes(p.locationMatchLevel)).length;

  // cluster tightness: coefficient of variation (low is good)
  const mean = kept.reduce((a, b) => a + b, 0) / kept.length;
  const variance = kept.reduce((a, b) => a + (b - mean) ** 2, 0) / kept.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;

  let score = 0;
  score += Math.min(usedSourceCount / 5, 1) * 0.35; // breadth
  score += Math.min(freshCount / Math.max(usedSourceCount, 1), 1) * 0.15; // recency
  score += Math.min(exactSpecCount / Math.max(usedSourceCount, 1), 1) * 0.2; // spec match
  score += Math.min(strongTierCount / Math.max(usedSourceCount, 1), 1) * 0.15; // source strength
  score += Math.min(localCount / Math.max(usedSourceCount, 1), 1) * 0.05; // locality
  score += Math.max(0, 1 - cv) * 0.1; // tightness
  score = Number(Math.max(0, Math.min(1, score)).toFixed(3));

  let confidence: ConfidenceLabel;
  if (independentSourceCount < MIN_CREDIBLE_INDEPENDENT_SOURCES) {
    confidence = 'low';
    reasons.push(
      `Only ${independentSourceCount} independent credible source(s) found; fewer than ${MIN_CREDIBLE_INDEPENDENT_SOURCES}.`,
    );
  } else if (score >= 0.75) {
    confidence = 'high';
  } else if (score >= 0.5) {
    confidence = 'moderate';
  } else {
    confidence = 'low';
    reasons.push('Evidence spread or quality limits confidence.');
  }

  return {
    outcome: 'priced',
    confidence,
    confidenceScore: score,
    independentSourceCount,
    usedSourceCount,
    rangeLow,
    rangeHigh,
    median: med,
    typical: med,
    unit,
    excludedOutliers: excluded,
    reasons,
  };
}
