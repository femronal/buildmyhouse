/**
 * Stage 5 — versioned confidence-scoring policy.
 *
 * Every number that affects a score, gate or label lives HERE, in one
 * versioned object. The engine (`confidence.ts`) contains no magic numbers.
 * A policy change requires a new version string, and every report persists
 * the version it was scored with, so historical results stay identifiable
 * and reproducible.
 */

export interface RecencyBand {
  /** Inclusive upper bound in days. */
  maxDays: number;
  /** Fraction of the recency weight awarded (0..1). */
  score: number;
}

export interface TightnessBand {
  /** Inclusive upper bound for relative MAD (MAD ÷ median). */
  maxRelativeMad: number;
  score: number;
}

export interface ConfidencePolicy {
  version: string;
  weights: {
    sourceQuality: number;
    recency: number;
    specificationMatch: number;
    locationMatch: number;
    clusterTightness: number;
  };
  /** Fraction of tier weight per source tier (1 = strongest). */
  tierScores: Record<1 | 2 | 3 | 4, number>;
  /** Fraction of spec weight per classification. 'mismatch' is excluded upstream. */
  specScores: { exact: number; close: number; partial: number; ambiguous: number };
  /** Fraction of location weight per classification. */
  locationScores: {
    exact_city: number;
    same_state: number;
    nearby_market: number;
    national_supplier: number;
    different_region: number;
    unknown: number;
  };
  recencyBands: RecencyBand[];
  /** Observations older than this are EXCLUDED, not merely down-scored. */
  maxObservationAgeDays: number;
  tightnessBands: TightnessBand[];
  /** MAD multiplier for statistical outlier exclusion (kept from Stage 4). */
  outlierMadMultiplier: number;
  /** Label thresholds on the 0–100 score (subject to hard gates). */
  labelThresholds: { high: number; moderate: number; low: number };
  hardGates: {
    /** Minimum independent accepted observations for ANY market range. */
    minIndependentForRange: number;
    /** High label requirements. */
    high: {
      minIndependentSources: number;
      requireTier1or2: boolean;
      /** Minimum spec component as a fraction of its weight. */
      minSpecFraction: number;
      /** Minimum location component as a fraction of its weight. */
      minLocationFraction: number;
      /** Minimum recency component as a fraction of its weight. */
      minRecencyFraction: number;
      /** Maximum relative MAD of the accepted cluster. */
      maxRelativeMad: number;
    };
    moderate: {
      minIndependentSources: number;
    };
  };
}

export const CONFIDENCE_POLICY_V1: ConfidencePolicy = {
  version: 'price-confidence-v1',
  weights: {
    sourceQuality: 25,
    recency: 20,
    specificationMatch: 25,
    locationMatch: 15,
    clusterTightness: 15,
  },
  tierScores: { 1: 1.0, 2: 0.85, 3: 0.55, 4: 0.25 },
  specScores: { exact: 1.0, close: 0.7, partial: 0.3, ambiguous: 0.1 },
  locationScores: {
    exact_city: 1.0,
    same_state: 0.8,
    nearby_market: 0.55,
    national_supplier: 0.3,
    different_region: 0.1,
    unknown: 0,
  },
  recencyBands: [
    { maxDays: 7, score: 1.0 },
    { maxDays: 30, score: 0.85 },
    { maxDays: 60, score: 0.6 },
    { maxDays: 90, score: 0.35 },
    { maxDays: 180, score: 0.15 },
  ],
  maxObservationAgeDays: 180,
  tightnessBands: [
    { maxRelativeMad: 0.08, score: 1.0 },
    { maxRelativeMad: 0.15, score: 0.8 },
    { maxRelativeMad: 0.25, score: 0.55 },
    { maxRelativeMad: 0.4, score: 0.25 },
  ],
  outlierMadMultiplier: 3.5,
  labelThresholds: { high: 80, moderate: 60, low: 40 },
  hardGates: {
    minIndependentForRange: 2,
    high: {
      minIndependentSources: 3,
      requireTier1or2: true,
      minSpecFraction: 0.8,
      minLocationFraction: 0.5,
      minRecencyFraction: 0.6,
      maxRelativeMad: 0.25,
    },
    moderate: {
      minIndependentSources: 2,
    },
  },
};

/** The active policy. Swap only by introducing a NEW versioned object. */
export const ACTIVE_CONFIDENCE_POLICY: ConfidencePolicy = CONFIDENCE_POLICY_V1;
