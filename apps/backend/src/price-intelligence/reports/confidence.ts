/**
 * Stage 5 — deterministic confidence-scoring engine.
 *
 * AI (Stage 4) classifies listings: spec match, seller location, source type,
 * duplicates — always WITH evidence. This engine converts those stored
 * classifications into the final range/median/outlier/score/label decisions
 * using only the versioned policy. No LLM is ever asked "what confidence
 * score should this report receive"; the same observations + policy version
 * always produce the same numbers.
 */
import { createHash } from 'crypto';
import { InclusionState } from '../observations/observations';
import { ConfidencePolicy, ACTIVE_CONFIDENCE_POLICY } from './confidence-policy';

export type { InclusionState };

export type SpecMatchClass = 'exact' | 'close' | 'partial' | 'ambiguous' | 'mismatch';
export type LocationMatchClass =
  | 'exact_city'
  | 'same_state'
  | 'nearby_market'
  | 'national_supplier'
  | 'different_region'
  | 'unknown';
export type ConfidenceLabel = 'high' | 'moderate' | 'low' | 'insufficient_data';
export type ResultKind = 'market_range' | 'single_source_observation' | 'insufficient_data';

/** Normalised evidence the engine scores. Produced from persisted Stage 4 observations. */
export interface ScoringObservation {
  observationId: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTier: 1 | 2 | 3 | 4;
  sellerName: string | null;
  /** Stage 4 independence group — several URLs from one seller share a group. */
  independentGroupId: string;
  originalPrice: number;
  currency: string;
  originalUnit: string | null;
  normalizedPrice: number | null;
  normalizedUnit: string | null;
  checkedAtIso: string;
  /** Listing/update date shown by the source, when available. */
  listingDateIso: string | null;
  specMatch: SpecMatchClass;
  locationMatch: LocationMatchClass;
  condition: 'new' | 'used' | 'refurbished' | 'rental' | 'unknown';
  /** False when Stage 4 flagged it (bundle/accessory/deposit/instalment/currency/spec). */
  comparable: boolean;
  comparabilityNotes: string[];
  deliveryState: InclusionState;
  installationState: InclusionState;
  vatState: InclusionState;
  retailOrWholesale: 'retail' | 'wholesale' | 'unknown';
  negotiable: 'yes' | 'no' | 'unknown';
}

export type ExclusionRule =
  | 'not_comparable_full_price'
  | 'specification_mismatch'
  | 'specification_ambiguous'
  | 'used_product_in_new_request'
  | 'unit_not_comparable'
  | 'stale_observation'
  | 'untraceable_source'
  | 'duplicate_seller_listing'
  | 'statistical_outlier';

export interface ExcludedObservation {
  observationId: string;
  originalPrice: number;
  normalizedPrice: number | null;
  reason: string;
  rule: ExclusionRule;
  scoringVersion: string;
}

export interface ObservationRecencyAudit {
  observationId: string;
  dateUsedIso: string;
  dateSource: 'listing_date' | 'checked_date';
  ageDays: number;
  bandScore: number;
}

export interface ConfidenceAssessment {
  score: number; // 0..100
  label: ConfidenceLabel;
  resultKind: ResultKind;
  scoringVersion: string;
  components: {
    sourceQuality: number;
    recency: number;
    specificationMatch: number;
    locationMatch: number;
    clusterTightness: number;
  };
  positiveReasons: string[];
  limitingReasons: string[];
  hardGateFailures: string[];
  includedObservationIds: string[];
  excludedObservations: ExcludedObservation[];
  /** Deterministic pricing over the included set. */
  pricing: {
    observedLow: number | null;
    observedHigh: number | null;
    median: number | null;
    typicalPrice: number | null;
    unit: string | null;
    currency: string | null;
    acceptedObservationCount: number;
    independentSourceCount: number;
    relativeMad: number | null;
    clusterMetric: 'relative_median_absolute_deviation';
  };
  recencyAudit: ObservationRecencyAudit[];
}

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function relativeMad(values: number[]): number | null {
  if (values.length < 2) return null;
  const med = median(values);
  if (med <= 0) return null;
  const mad = median(values.map((v) => Math.abs(v - med)));
  return mad / med;
}

function ageDays(fromIso: string, nowIso: string): number {
  return Math.max(0, (new Date(nowIso).getTime() - new Date(fromIso).getTime()) / 86_400_000);
}

/**
 * Conservative observation date: the listing/update date when shown (a fetch
 * date never proves the seller updated the listing that day); otherwise the
 * checked date. Never newer than the checked date.
 */
export function conservativeDate(obs: Pick<ScoringObservation, 'checkedAtIso' | 'listingDateIso'>): {
  dateUsedIso: string;
  dateSource: 'listing_date' | 'checked_date';
} {
  if (obs.listingDateIso) {
    const listing = new Date(obs.listingDateIso).getTime();
    const checked = new Date(obs.checkedAtIso).getTime();
    if (Number.isFinite(listing) && listing <= checked) {
      return { dateUsedIso: obs.listingDateIso, dateSource: 'listing_date' };
    }
  }
  return { dateUsedIso: obs.checkedAtIso, dateSource: 'checked_date' };
}

function bandScore(bands: { maxDays?: number; maxRelativeMad?: number; score: number }[], value: number, key: 'maxDays' | 'maxRelativeMad'): number {
  for (const band of bands) {
    const bound = band[key];
    if (bound !== undefined && value <= bound) return band.score;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export interface AssessmentContext {
  /** ISO timestamp used for all age maths (injectable ⇒ reproducible). */
  nowIso: string;
  /** 'new' requests must never mix in used prices. */
  requestedCondition: 'new' | 'used' | 'any';
}

export function assessConfidence(
  observations: readonly ScoringObservation[],
  context: AssessmentContext,
  policy: ConfidencePolicy = ACTIVE_CONFIDENCE_POLICY,
): ConfidenceAssessment {
  const excluded: ExcludedObservation[] = [];
  const exclude = (obs: ScoringObservation, rule: ExclusionRule, reason: string) => {
    excluded.push({
      observationId: obs.observationId,
      originalPrice: obs.originalPrice,
      normalizedPrice: obs.normalizedPrice,
      reason,
      rule,
      scoringVersion: policy.version,
    });
  };

  // --- Eligibility gates (rule-coded, auditable) ---
  let pool: ScoringObservation[] = [];
  for (const obs of observations) {
    if (!obs.sourceUrl || !obs.checkedAtIso) {
      exclude(obs, 'untraceable_source', 'Missing source URL or check date.');
      continue;
    }
    if (obs.specMatch === 'mismatch') {
      exclude(obs, 'specification_mismatch', 'Listing is a materially different specification.');
      continue;
    }
    if (context.requestedCondition === 'new' && obs.condition === 'used') {
      exclude(obs, 'used_product_in_new_request', 'Used item cannot enter a new-product range.');
      continue;
    }
    if (!obs.comparable || obs.normalizedPrice === null || obs.normalizedUnit === null) {
      exclude(
        obs,
        'not_comparable_full_price',
        obs.comparabilityNotes.join('; ') || 'Not a comparable full purchase price.',
      );
      continue;
    }
    if (obs.specMatch === 'ambiguous') {
      exclude(obs, 'specification_ambiguous', 'Specification too ambiguous to compare safely.');
      continue;
    }
    const { dateUsedIso } = conservativeDate(obs);
    if (ageDays(dateUsedIso, context.nowIso) > policy.maxObservationAgeDays) {
      exclude(obs, 'stale_observation', `Older than ${policy.maxObservationAgeDays} days.`);
      continue;
    }
    pool.push(obs);
  }

  // --- Unit consistency: score only the modal normalized unit ---
  const unitCounts = new Map<string, number>();
  for (const obs of pool) unitCounts.set(obs.normalizedUnit as string, (unitCounts.get(obs.normalizedUnit as string) ?? 0) + 1);
  const modalUnit = [...unitCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
  pool = pool.filter((obs) => {
    if (obs.normalizedUnit === modalUnit) return true;
    exclude(obs, 'unit_not_comparable', `Unit '${obs.normalizedUnit}' cannot join the '${modalUnit}' comparison.`);
    return false;
  });

  // --- Independence: one representative per group (best tier, then freshest) ---
  const byGroup = new Map<string, ScoringObservation>();
  const groupLosers: ScoringObservation[] = [];
  for (const obs of pool) {
    const current = byGroup.get(obs.independentGroupId);
    if (!current) {
      byGroup.set(obs.independentGroupId, obs);
      continue;
    }
    const better =
      obs.sourceTier < current.sourceTier ||
      (obs.sourceTier === current.sourceTier && new Date(obs.checkedAtIso) > new Date(current.checkedAtIso));
    if (better) {
      groupLosers.push(current);
      byGroup.set(obs.independentGroupId, obs);
    } else {
      groupLosers.push(obs);
    }
  }
  for (const loser of groupLosers) {
    exclude(loser, 'duplicate_seller_listing', 'Same seller/source group as another accepted listing.');
  }
  let included = [...byGroup.values()];

  // --- Statistical outliers (Stage 4 MAD rule, now with per-observation audit) ---
  if (included.length >= 4) {
    const prices = included.map((o) => o.normalizedPrice as number);
    const med = median(prices);
    const mad = median(prices.map((v) => Math.abs(v - med))) || 1;
    const keep: ScoringObservation[] = [];
    for (const obs of included) {
      if (Math.abs((obs.normalizedPrice as number) - med) / mad <= policy.outlierMadMultiplier) keep.push(obs);
      else exclude(obs, 'statistical_outlier', `Beyond ${policy.outlierMadMultiplier}× median absolute deviation.`);
    }
    included = keep;
  }

  const independentSourceCount = included.length; // one per group by construction
  const prices = included.map((o) => o.normalizedPrice as number);
  const rMad = relativeMad(prices);

  // --- Component scores ---
  const w = policy.weights;
  const frac = {
    sourceQuality: 0,
    recency: 0,
    specificationMatch: 0,
    locationMatch: 0,
    clusterTightness: 0,
  };
  const recencyAudit: ObservationRecencyAudit[] = [];

  if (included.length > 0) {
    const tierFracs = included.map((o) => policy.tierScores[o.sourceTier]);
    const bestTier = Math.max(...tierFracs);
    const avgTier = tierFracs.reduce((a, b) => a + b, 0) / tierFracs.length;
    const countFactor = Math.min(independentSourceCount / 4, 1);
    const domainDiversity = new Set(included.map((o) => o.sourceDomain)).size / included.length;
    frac.sourceQuality = bestTier * 0.4 + avgTier * 0.3 + countFactor * 0.2 + domainDiversity * 0.1;

    let recencySum = 0;
    for (const obs of included) {
      const { dateUsedIso, dateSource } = conservativeDate(obs);
      const age = ageDays(dateUsedIso, context.nowIso);
      const score = bandScore(policy.recencyBands, age, 'maxDays');
      recencySum += score;
      recencyAudit.push({
        observationId: obs.observationId,
        dateUsedIso,
        dateSource,
        ageDays: Math.round(age * 10) / 10,
        bandScore: score,
      });
    }
    frac.recency = recencySum / included.length;

    frac.specificationMatch =
      included.reduce((sum, o) => sum + policy.specScores[o.specMatch as 'exact' | 'close' | 'partial' | 'ambiguous'], 0) /
      included.length;

    frac.locationMatch = included.reduce((sum, o) => sum + policy.locationScores[o.locationMatch], 0) / included.length;

    frac.clusterTightness = rMad === null ? 0 : bandScore(policy.tightnessBands, rMad, 'maxRelativeMad');
  }

  const components = {
    sourceQuality: round2(frac.sourceQuality * w.sourceQuality),
    recency: round2(frac.recency * w.recency),
    specificationMatch: round2(frac.specificationMatch * w.specificationMatch),
    locationMatch: round2(frac.locationMatch * w.locationMatch),
    clusterTightness: round2(frac.clusterTightness * w.clusterTightness),
  };
  const score = Math.round(
    components.sourceQuality + components.recency + components.specificationMatch + components.locationMatch + components.clusterTightness,
  );

  // --- Hard gates & result kind ---
  const hardGateFailures: string[] = [];
  let resultKind: ResultKind;
  if (independentSourceCount === 0) {
    resultKind = 'insufficient_data';
    hardGateFailures.push('No accepted comparable observations.');
  } else if (independentSourceCount < policy.hardGates.minIndependentForRange) {
    resultKind = 'single_source_observation';
    hardGateFailures.push(
      `Only ${independentSourceCount} independent source — below the ${policy.hardGates.minIndependentForRange}-source minimum for a market range.`,
    );
  } else {
    resultKind = 'market_range';
  }

  const highGates = policy.hardGates.high;
  const highGateChecks: { ok: boolean; failure: string }[] = [
    {
      ok: independentSourceCount >= highGates.minIndependentSources,
      failure: `High confidence requires at least ${highGates.minIndependentSources} independent sources (found ${independentSourceCount}).`,
    },
    {
      ok: !highGates.requireTier1or2 || included.some((o) => o.sourceTier <= 2),
      failure: 'High confidence requires at least one Tier 1 or Tier 2 source.',
    },
    {
      ok: frac.specificationMatch >= highGates.minSpecFraction,
      failure: 'High confidence requires a strong specification match.',
    },
    {
      ok: frac.locationMatch >= highGates.minLocationFraction,
      failure: 'High confidence requires a defensible location match.',
    },
    {
      ok: frac.recency >= highGates.minRecencyFraction,
      failure: 'High confidence requires recent evidence.',
    },
    {
      ok: rMad !== null && rMad <= highGates.maxRelativeMad,
      failure: 'High confidence requires a reasonably tight price cluster.',
    },
  ];

  // --- Label (thresholds subject to hard gates; gates only ever lower a label) ---
  let label: ConfidenceLabel;
  if (resultKind === 'insufficient_data' || score < policy.labelThresholds.low) {
    label = 'insufficient_data';
  } else if (resultKind === 'single_source_observation') {
    label = 'low'; // a single credible price is shown, but never as a market range
  } else if (score >= policy.labelThresholds.high) {
    const failedHigh = highGateChecks.filter((c) => !c.ok);
    if (failedHigh.length === 0) {
      label = 'high';
    } else {
      hardGateFailures.push(...failedHigh.map((c) => c.failure));
      label = independentSourceCount >= policy.hardGates.moderate.minIndependentSources ? 'moderate' : 'low';
    }
  } else if (score >= policy.labelThresholds.moderate) {
    if (independentSourceCount >= policy.hardGates.moderate.minIndependentSources) {
      label = 'moderate';
    } else {
      hardGateFailures.push('Moderate confidence requires at least two independent sources.');
      label = 'low';
    }
  } else {
    label = 'low';
  }
  if (resultKind === 'insufficient_data') label = 'insufficient_data';

  // --- Deterministic reasons (every sentence maps to computed facts) ---
  const { positiveReasons, limitingReasons } = buildReasons(included, excluded, {
    independentSourceCount,
    rMad,
    fractions: frac,
    policy,
  });

  const pricing = {
    observedLow: prices.length ? Math.min(...prices) : null,
    observedHigh: prices.length ? Math.max(...prices) : null,
    median: prices.length ? round2(median(prices)) : null,
    typicalPrice: prices.length ? round2(median(prices)) : null,
    unit: included.length ? modalUnit : null,
    currency: included.length ? included[0].currency : null,
    acceptedObservationCount: included.length,
    independentSourceCount,
    relativeMad: rMad === null ? null : round4(rMad),
    clusterMetric: 'relative_median_absolute_deviation' as const,
  };

  return {
    score,
    label,
    resultKind,
    scoringVersion: policy.version,
    components,
    positiveReasons,
    limitingReasons,
    hardGateFailures,
    includedObservationIds: included.map((o) => o.observationId),
    excludedObservations: excluded,
    pricing,
    recencyAudit,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Deterministic reason templates
// ---------------------------------------------------------------------------

function buildReasons(
  included: ScoringObservation[],
  excluded: ExcludedObservation[],
  facts: {
    independentSourceCount: number;
    rMad: number | null;
    fractions: Record<string, number>;
    policy: ConfidencePolicy;
  },
): { positiveReasons: string[]; limitingReasons: string[] } {
  const positive: string[] = [];
  const limiting: string[] = [];
  const n = facts.independentSourceCount;

  if (n >= 3) positive.push(`${n} independent sources were accepted after validation.`);
  else if (n === 2) limiting.push('Only two independent sellers were available.');
  else if (n === 1) limiting.push('Only one independent source was available; this is not a market range.');

  const tier12 = included.filter((o) => o.sourceTier <= 2).length;
  if (tier12 > 0) positive.push(`The evidence includes ${tier12} manufacturer/distributor or established retailer source(s).`);
  const tier34 = included.length - tier12;
  if (included.length > 0 && tier34 / included.length > 0.5) {
    limiting.push('Most observations came from classified or informal listings (asking prices, often negotiable).');
  }

  if (facts.fractions.specificationMatch >= 0.8) positive.push('The accepted listings closely matched the requested specification.');
  else if (included.length > 0 && facts.fractions.specificationMatch < 0.5) {
    limiting.push('Several listings did not fully state the requested specification.');
  }

  if (facts.fractions.locationMatch >= 0.7) positive.push('Most accepted sellers were located in or near the requested area.');
  else if (included.length > 0 && facts.fractions.locationMatch < 0.4) {
    limiting.push('The closest available prices were from outside the requested area, or seller locations were unclear.');
  }

  if (facts.fractions.recency >= 0.8) positive.push('The evidence is recent.');
  else if (included.length > 0 && facts.fractions.recency < 0.5) {
    limiting.push('The listing dates could not be fully confirmed as current.');
  }

  if (facts.rMad !== null && facts.rMad <= 0.15) positive.push('Observed prices were grouped within a relatively narrow range.');
  else if (facts.rMad !== null && facts.rMad > 0.25) limiting.push('Observed prices varied widely between sellers.');

  const dupCount = excluded.filter((e) => e.rule === 'duplicate_seller_listing').length;
  if (dupCount > 0) limiting.push(`${dupCount} duplicate listing(s) from the same seller were counted only once.`);
  const outlierCount = excluded.filter((e) => e.rule === 'statistical_outlier').length;
  if (outlierCount > 0) limiting.push(`${outlierCount} price(s) far outside the cluster were excluded.`);

  const deliveryUnknown = included.filter((o) => o.deliveryState === 'unknown').length;
  if (included.length > 0 && deliveryUnknown / included.length >= 0.5) {
    limiting.push('Some listings did not clearly state whether delivery was included.');
  }

  return { positiveReasons: positive, limitingReasons: limiting };
}

// ---------------------------------------------------------------------------
// Canonical hashing (reproducibility)
// ---------------------------------------------------------------------------

/** Stable stringify with sorted keys, for deterministic hashing. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const obj = value as Record<string, unknown>;
  return (
    '{' +
    Object.keys(obj)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k]))
      .join(',') +
    '}'
  );
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
