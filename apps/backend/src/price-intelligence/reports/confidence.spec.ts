import {
  assessConfidence,
  AssessmentContext,
  ScoringObservation,
  conservativeDate,
  canonicalJson,
  sha256Hex,
} from './confidence';
import { CONFIDENCE_POLICY_V1, ConfidencePolicy } from './confidence-policy';

const NOW = '2026-07-30T12:00:00.000Z';

function daysAgo(n: number): string {
  return new Date(new Date(NOW).getTime() - n * 86_400_000).toISOString();
}

let seq = 0;
function obs(over: Partial<ScoringObservation> = {}): ScoringObservation {
  seq += 1;
  const id = over.observationId ?? `obs-${seq}`;
  return {
    observationId: id,
    sourceUrl: over.sourceUrl ?? `https://seller${seq}.example.ng/product`,
    sourceDomain: over.sourceDomain ?? `seller${seq}.example.ng`,
    sourceTier: over.sourceTier ?? 2,
    sellerName: over.sellerName ?? `Seller ${seq}`,
    independentGroupId: over.independentGroupId ?? `group-${id}`,
    originalPrice: over.originalPrice ?? 100_000,
    currency: over.currency ?? 'NGN',
    originalUnit: over.originalUnit ?? 'bag',
    normalizedPrice: over.normalizedPrice !== undefined ? over.normalizedPrice : (over.originalPrice ?? 100_000),
    normalizedUnit: over.normalizedUnit !== undefined ? over.normalizedUnit : 'bag',
    checkedAtIso: over.checkedAtIso ?? daysAgo(3),
    listingDateIso: over.listingDateIso ?? null,
    specMatch: over.specMatch ?? 'exact',
    locationMatch: over.locationMatch ?? 'exact_city',
    condition: over.condition ?? 'new',
    comparable: over.comparable ?? true,
    comparabilityNotes: over.comparabilityNotes ?? [],
    deliveryState: over.deliveryState ?? 'excluded',
    installationState: over.installationState ?? 'not_applicable',
    vatState: over.vatState ?? 'unknown',
    retailOrWholesale: over.retailOrWholesale ?? 'retail',
    negotiable: over.negotiable ?? 'unknown',
  };
}

const ctx: AssessmentContext = { nowIso: NOW, requestedCondition: 'new' };

describe('Stage 5 confidence engine — determinism', () => {
  it('same observations + same policy version always produce the same result', () => {
    const observations = [
      obs({ normalizedPrice: 100_000 }),
      obs({ normalizedPrice: 104_000 }),
      obs({ normalizedPrice: 98_000 }),
    ];
    const a = assessConfidence(observations, ctx);
    const b = assessConfidence(observations, ctx);
    expect(a).toEqual(b);
    expect(sha256Hex(canonicalJson(a))).toEqual(sha256Hex(canonicalJson(b)));
  });
});

describe('Scenario 1 — high confidence', () => {
  it('3+ independent strong-tier exact-spec local recent tight cluster ⇒ high', () => {
    const observations = [
      obs({ sourceTier: 1, normalizedPrice: 100_000 }),
      obs({ sourceTier: 2, normalizedPrice: 101_500 }),
      obs({ sourceTier: 2, normalizedPrice: 102_000 }),
      obs({ sourceTier: 3, normalizedPrice: 99_500 }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.label).toBe('high');
    expect(result.resultKind).toBe('market_range');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.hardGateFailures).toEqual([]);
    expect(result.pricing.independentSourceCount).toBe(4);
    expect(result.positiveReasons.length).toBeGreaterThan(0);
    expect(result.scoringVersion).toBe('price-confidence-v1');
  });
});

describe('Scenario 2 — moderate confidence', () => {
  it('2 independent tier-3 sources with limitations ⇒ moderate, defensible range', () => {
    const observations = [
      obs({ sourceTier: 3, specMatch: 'close', locationMatch: 'same_state', checkedAtIso: daysAgo(20), normalizedPrice: 100_000 }),
      obs({ sourceTier: 3, specMatch: 'close', locationMatch: 'same_state', checkedAtIso: daysAgo(25), normalizedPrice: 108_000 }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.label).toBe('moderate');
    expect(result.resultKind).toBe('market_range');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
    expect(result.pricing.observedLow).toBe(100_000);
    expect(result.pricing.observedHigh).toBe(108_000);
  });
});

describe('Scenario 3 — low confidence', () => {
  it('weak tiers, stale and distant sources, wide cluster ⇒ low with explained limitations', () => {
    const observations = [
      obs({ sourceTier: 4, locationMatch: 'different_region', checkedAtIso: daysAgo(100), normalizedPrice: 100_000 }),
      obs({ sourceTier: 4, locationMatch: 'different_region', checkedAtIso: daysAgo(120), normalizedPrice: 145_000 }),
      obs({ sourceTier: 4, locationMatch: 'different_region', checkedAtIso: daysAgo(110), normalizedPrice: 175_000 }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.label).toBe('low');
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
    expect(result.limitingReasons.length).toBeGreaterThan(0);
    expect(result.limitingReasons.join(' ')).toMatch(/outside the requested area|classified/i);
  });
});

describe('Scenario 4 — insufficient data', () => {
  it('zero accepted observations ⇒ insufficient_data', () => {
    const result = assessConfidence([], ctx);
    expect(result.label).toBe('insufficient_data');
    expect(result.resultKind).toBe('insufficient_data');
    expect(result.pricing.typicalPrice).toBeNull();
  });

  it('all observations excluded (mismatch/stale) ⇒ insufficient_data with audit trail', () => {
    const observations = [
      obs({ specMatch: 'mismatch' }),
      obs({ checkedAtIso: daysAgo(400) }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.label).toBe('insufficient_data');
    expect(result.excludedObservations).toHaveLength(2);
    expect(result.excludedObservations.map((e) => e.rule).sort()).toEqual(
      ['specification_mismatch', 'stale_observation'].sort(),
    );
  });
});

describe('Scenario 5 — single official source', () => {
  it('one tier-1 source ⇒ single_source_observation, never high, never a market range', () => {
    const result = assessConfidence([obs({ sourceTier: 1 })], ctx);
    expect(result.resultKind).toBe('single_source_observation');
    expect(result.label).not.toBe('high');
    expect(result.label).toBe('low');
    expect(result.hardGateFailures.join(' ')).toMatch(/below the 2-source minimum/);
    expect(result.pricing.independentSourceCount).toBe(1);
  });
});

describe('Scenario 6 — duplicate seller URLs are not independent', () => {
  it('three URLs from one independence group count as one source', () => {
    const observations = [
      obs({ independentGroupId: 'seller-x', normalizedPrice: 100_000, sourceTier: 3 }),
      obs({ independentGroupId: 'seller-x', normalizedPrice: 101_000, sourceTier: 3 }),
      obs({ independentGroupId: 'seller-x', normalizedPrice: 102_000, sourceTier: 3 }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.pricing.independentSourceCount).toBe(1);
    expect(result.resultKind).toBe('single_source_observation');
    const dupes = result.excludedObservations.filter((e) => e.rule === 'duplicate_seller_listing');
    expect(dupes).toHaveLength(2);
  });

  it('keeps the best-tier freshest listing as the group representative', () => {
    const observations = [
      obs({ observationId: 'weak', independentGroupId: 'g', sourceTier: 4, checkedAtIso: daysAgo(2) }),
      obs({ observationId: 'strong', independentGroupId: 'g', sourceTier: 2, checkedAtIso: daysAgo(5) }),
      obs({ observationId: 'other', independentGroupId: 'g2', sourceTier: 3 }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.includedObservationIds).toContain('strong');
    expect(result.includedObservationIds).not.toContain('weak');
  });
});

describe('Scenario 7 — statistical outliers', () => {
  it('an extreme price is excluded and the exclusion is fully recorded', () => {
    const observations = [
      obs({ observationId: 'a', normalizedPrice: 100_000 }),
      obs({ observationId: 'b', normalizedPrice: 102_000 }),
      obs({ observationId: 'c', normalizedPrice: 98_000 }),
      obs({ observationId: 'd', normalizedPrice: 101_000 }),
      obs({ observationId: 'outlier', originalPrice: 950_000, normalizedPrice: 950_000 }),
    ];
    const result = assessConfidence(observations, ctx);
    const excluded = result.excludedObservations.find((e) => e.observationId === 'outlier');
    expect(excluded).toBeDefined();
    expect(excluded?.rule).toBe('statistical_outlier');
    expect(excluded?.originalPrice).toBe(950_000);
    expect(excluded?.normalizedPrice).toBe(950_000);
    expect(excluded?.scoringVersion).toBe('price-confidence-v1');
    expect(result.includedObservationIds).not.toContain('outlier');
    expect(result.pricing.observedHigh).toBe(102_000);
  });
});

describe('Scenario 8 — wrong specification', () => {
  it('mismatch is excluded; ambiguous is excluded; partial is down-scored', () => {
    const mismatch = assessConfidence([obs({ specMatch: 'mismatch' }), obs(), obs()], ctx);
    expect(mismatch.excludedObservations.some((e) => e.rule === 'specification_mismatch')).toBe(true);

    const ambiguous = assessConfidence([obs({ specMatch: 'ambiguous' }), obs(), obs()], ctx);
    expect(ambiguous.excludedObservations.some((e) => e.rule === 'specification_ambiguous')).toBe(true);

    const exact = assessConfidence([obs(), obs(), obs()], ctx);
    const partial = assessConfidence([obs({ specMatch: 'partial' }), obs({ specMatch: 'partial' }), obs({ specMatch: 'partial' })], ctx);
    expect(partial.components.specificationMatch).toBeLessThan(exact.components.specificationMatch);
    expect(partial.label).not.toBe('high');
  });
});

describe('Scenario 9 — used products in a new-product request', () => {
  it('used listings never enter a requested-new range', () => {
    const observations = [obs({ condition: 'used', normalizedPrice: 40_000 }), obs(), obs()];
    const result = assessConfidence(observations, { ...ctx, requestedCondition: 'new' });
    const used = result.excludedObservations.find((e) => e.rule === 'used_product_in_new_request');
    expect(used).toBeDefined();
    expect(result.pricing.observedLow).toBe(100_000);
  });

  it('used listings are allowed when any condition was requested', () => {
    const result = assessConfidence([obs({ condition: 'used' }), obs(), obs()], { ...ctx, requestedCondition: 'any' });
    expect(result.excludedObservations.filter((e) => e.rule === 'used_product_in_new_request')).toHaveLength(0);
  });
});

describe('Scenario 10 — location mismatch', () => {
  it('another-state observations reduce the location component', () => {
    const local = assessConfidence([obs(), obs(), obs()], ctx);
    const distant = assessConfidence(
      [obs({ locationMatch: 'different_region' }), obs({ locationMatch: 'different_region' }), obs({ locationMatch: 'different_region' })],
      ctx,
    );
    expect(distant.components.locationMatch).toBeLessThan(local.components.locationMatch);
    expect(distant.limitingReasons.join(' ')).toMatch(/outside the requested area/i);
    expect(distant.label).not.toBe('high');
  });
});

describe('Scenario 11 — stale observations', () => {
  it('older evidence scores less recency; >180 days is excluded', () => {
    const fresh = assessConfidence([obs(), obs(), obs()], ctx);
    const staleish = assessConfidence(
      [obs({ checkedAtIso: daysAgo(80) }), obs({ checkedAtIso: daysAgo(85) }), obs({ checkedAtIso: daysAgo(88) })],
      ctx,
    );
    expect(staleish.components.recency).toBeLessThan(fresh.components.recency);

    const tooOld = assessConfidence([obs({ checkedAtIso: daysAgo(200) }), obs({ checkedAtIso: daysAgo(210) })], ctx);
    expect(tooOld.label).toBe('insufficient_data');
    expect(tooOld.excludedObservations.every((e) => e.rule === 'stale_observation')).toBe(true);
  });

  it('uses the conservative listing date, never the fetch date as proof of freshness', () => {
    expect(conservativeDate({ checkedAtIso: daysAgo(1), listingDateIso: daysAgo(90) })).toEqual({
      dateUsedIso: daysAgo(90),
      dateSource: 'listing_date',
    });
    // A listing date newer than the check date is not trusted.
    expect(conservativeDate({ checkedAtIso: daysAgo(10), listingDateIso: daysAgo(1) })).toEqual({
      dateUsedIso: daysAgo(10),
      dateSource: 'checked_date',
    });
    const result = assessConfidence(
      [obs({ checkedAtIso: daysAgo(1), listingDateIso: daysAgo(90) }), obs(), obs()],
      ctx,
    );
    const audit = result.recencyAudit.find((a) => a.dateSource === 'listing_date');
    expect(audit).toBeDefined();
    expect(audit?.ageDays).toBeCloseTo(90, 0);
  });
});

describe('Scenario 13 — cluster tightness bands (relative MAD)', () => {
  const tightnessFor = (prices: number[]) =>
    assessConfidence(prices.map((p) => obs({ normalizedPrice: p, originalPrice: p })), ctx).components.clusterTightness;

  it('maps relative MAD to the policy bands', () => {
    // rMAD ≈ 0.99% ⇒ full 15 points
    expect(tightnessFor([100_000, 101_000, 102_000])).toBe(15);
    // rMAD ≈ 9.1% ⇒ 0.8 × 15 = 12
    expect(tightnessFor([100_000, 110_000, 120_000])).toBe(12);
    // rMAD ≈ 28.6% ⇒ 0.25 × 15 = 3.75
    expect(tightnessFor([100_000, 140_000, 180_000])).toBe(3.75);
    // rMAD ≈ 50% ⇒ 0 points
    expect(tightnessFor([100_000, 200_000, 300_000])).toBe(0);
  });

  it('records the cluster metric used', () => {
    const result = assessConfidence([obs(), obs(), obs()], ctx);
    expect(result.pricing.clusterMetric).toBe('relative_median_absolute_deviation');
    expect(result.pricing.relativeMad).not.toBeNull();
  });
});

describe('Scenario 14 — hard gates beat arithmetic', () => {
  it('a score ≥ 80 with only 2 independent sources is downgraded from high', () => {
    const observations = [
      obs({ sourceTier: 1, normalizedPrice: 100_000 }),
      obs({ sourceTier: 1, normalizedPrice: 101_000 }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe('moderate');
    expect(result.hardGateFailures.join(' ')).toMatch(/at least 3 independent sources/);
  });

  it('a score ≥ 80 with no Tier 1/2 source is downgraded from high', () => {
    const policy: ConfidencePolicy = {
      ...CONFIDENCE_POLICY_V1,
      // Inflate tier-3/4 scores so ONLY the tier gate (not arithmetic) blocks high.
      tierScores: { 1: 1, 2: 1, 3: 1, 4: 1 },
      version: 'test-tier-gate',
    };
    const observations = [obs({ sourceTier: 3 }), obs({ sourceTier: 3 }), obs({ sourceTier: 4 })];
    const result = assessConfidence(observations, ctx, policy);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe('moderate');
    expect(result.hardGateFailures.join(' ')).toMatch(/Tier 1 or Tier 2/);
  });
});

describe('Scenario 16 — scoring-version change is identifiable', () => {
  it('a new policy version produces a separately identifiable result', () => {
    const observations = [obs(), obs(), obs()];
    const v1 = assessConfidence(observations, ctx, CONFIDENCE_POLICY_V1);
    const v2 = assessConfidence(observations, ctx, { ...CONFIDENCE_POLICY_V1, version: 'price-confidence-v2-test' });
    expect(v1.scoringVersion).toBe('price-confidence-v1');
    expect(v2.scoringVersion).toBe('price-confidence-v2-test');
    expect(v2.excludedObservations.every((e) => e.scoringVersion === 'price-confidence-v2-test')).toBe(true);
  });
});

describe('Unit consistency gate', () => {
  it('observations in a different normalized unit are excluded, not mixed', () => {
    const observations = [
      obs({ normalizedUnit: 'bag' }),
      obs({ normalizedUnit: 'bag' }),
      obs({ normalizedUnit: 'tonne', normalizedPrice: 2_600_000 }),
    ];
    const result = assessConfidence(observations, ctx);
    expect(result.pricing.unit).toBe('bag');
    const unitExcluded = result.excludedObservations.find((e) => e.rule === 'unit_not_comparable');
    expect(unitExcluded).toBeDefined();
    expect(result.pricing.observedHigh).toBeLessThan(2_600_000);
  });
});

describe('Traceability gate', () => {
  it('observations without a source URL or check date are excluded as untraceable', () => {
    const noUrl = obs();
    (noUrl as { sourceUrl: string }).sourceUrl = '';
    const result = assessConfidence([noUrl, obs(), obs()], ctx);
    expect(result.excludedObservations.some((e) => e.rule === 'untraceable_source')).toBe(true);
  });
});
