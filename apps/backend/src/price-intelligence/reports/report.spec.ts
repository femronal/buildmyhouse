import { ScoringObservation } from './confidence';
import { CONFIDENCE_POLICY_V1 } from './confidence-policy';
import { generateReport, renderReportText, ReportRequest, PriceCheckerReport } from './report';

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
    deliveryState: over.deliveryState ?? 'unknown',
    installationState: over.installationState ?? 'not_applicable',
    vatState: over.vatState ?? 'unknown',
    retailOrWholesale: over.retailOrWholesale ?? 'retail',
    negotiable: over.negotiable ?? 'unknown',
  };
}

function request(over: Partial<ReportRequest> = {}): ReportRequest {
  return {
    reportId: over.reportId ?? 'report-test-1',
    productName: over.productName ?? 'Dangote Cement 42.5R',
    brand: over.brand ?? 'Dangote',
    specification: over.specification ?? { grade: '42.5R', bagSizeKg: 50 },
    requestedUnit: over.requestedUnit ?? 'bag',
    requestedLocationLabel: over.requestedLocationLabel ?? 'Lagos',
    requestedCondition: over.requestedCondition ?? 'new',
    generatedAtIso: over.generatedAtIso ?? NOW,
  };
}

describe('Report contract', () => {
  it('a complete report carries range, typical price, sources, confidence and cautions', () => {
    const report = generateReport(request(), [
      obs({ normalizedPrice: 100_000 }),
      obs({ normalizedPrice: 104_000 }),
      obs({ normalizedPrice: 98_000 }),
    ]);
    expect(report.status).toBe('complete');
    expect(report.pricing.observedLow).toBe(98_000);
    expect(report.pricing.observedHigh).toBe(104_000);
    expect(report.pricing.typicalPrice).toBe(100_000);
    expect(report.pricing.currency).toBe('NGN');
    expect(report.sources).toHaveLength(3);
    expect(report.confidence.scoringVersion).toBe(CONFIDENCE_POLICY_V1.version);
    expect(report.cautions.length).toBeGreaterThan(0);
    expect(report.buildMyHouseNextStep.label).toMatch(/budget/i);
    expect(report.insufficientData).toBeNull();
  });

  it('every source shows tier, prices, units, location class, URL and dates', () => {
    const report = generateReport(request(), [
      obs({ listingDateIso: daysAgo(10) }),
      obs(),
      obs(),
    ]);
    for (const source of report.sources) {
      expect(source.sourceUrl).toMatch(/^https:/);
      expect(source.dateChecked).toBeTruthy();
      expect(source.sourceTier).toBeGreaterThanOrEqual(1);
      expect(source.displayedPrice).toBeGreaterThan(0);
      expect(source.sellerLocationClass).toBeTruthy();
    }
  });
});

describe('Scenario 5 — single official source report', () => {
  it('is presented as a single-source observed price, never a market range', () => {
    const report = generateReport(request(), [obs({ sourceTier: 1, normalizedPrice: 9_500_000 })]);
    expect(report.status).toBe('single_source');
    expect(report.pricing.singleSourcePrice).toBe(9_500_000);
    expect(report.pricing.observedLow).toBeNull();
    expect(report.pricing.observedHigh).toBeNull();
    expect(report.pricing.typicalPrice).toBeNull();
    expect(report.confidence.label).not.toBe('high');

    const text = renderReportText(report);
    expect(text).toContain('SINGLE-SOURCE OBSERVED PRICE');
    expect(text).not.toContain('LATEST OBSERVED RANGE');
    expect(text).not.toContain('TYPICAL OBSERVED PRICE');
    expect(text).toContain('not a market range');
  });
});

describe('Scenario 12 — unknown delivery is never reported as excluded', () => {
  it('says delivery not stated when listings are silent', () => {
    const report = generateReport(request(), [
      obs({ deliveryState: 'unknown' }),
      obs({ deliveryState: 'unknown' }),
      obs({ deliveryState: 'unknown' }),
    ]);
    expect(report.unknowns.join(' ')).toMatch(/Delivery not stated/);
    expect(report.exclusions.join(' ')).not.toMatch(/Delivery excluded/);
  });

  it('reports delivery excluded only when every listing states it', () => {
    const report = generateReport(request(), [
      obs({ deliveryState: 'excluded' }),
      obs({ deliveryState: 'excluded' }),
      obs({ deliveryState: 'excluded' }),
    ]);
    expect(report.exclusions).toContain('Delivery excluded');
  });

  it('a mix of stated and silent listings stays in unknowns', () => {
    const report = generateReport(request(), [
      obs({ deliveryState: 'included' }),
      obs({ deliveryState: 'unknown' }),
      obs({ deliveryState: 'unknown' }),
    ]);
    expect(report.inclusions).not.toContain('Delivery included');
    expect(report.unknowns.join(' ')).toMatch(/Delivery not stated/);
  });
});

describe('Scenario 15 — reproducibility', () => {
  const observations = [
    obs({ observationId: 'r1', normalizedPrice: 100_000 }),
    obs({ observationId: 'r2', normalizedPrice: 104_000 }),
    obs({ observationId: 'r3', normalizedPrice: 98_000 }),
  ];

  it('same inputs and policy version produce identical reports and hashes', () => {
    const a = generateReport(request(), observations);
    const b = generateReport(request(), observations);
    expect(a).toEqual(b);
    expect(a.reproducibility.reportInputHash).toBe(b.reproducibility.reportInputHash);
  });

  it('observation order does not change the hash (canonical ordering)', () => {
    const a = generateReport(request(), observations);
    const b = generateReport(request(), [...observations].reverse());
    expect(a.reproducibility.reportInputHash).toBe(b.reproducibility.reportInputHash);
    expect(a.pricing).toEqual(b.pricing);
    expect(a.confidence.score).toBe(b.confidence.score);
  });

  it('a different policy version produces a different hash', () => {
    const a = generateReport(request(), observations);
    const b = generateReport(request(), observations, {
      ...CONFIDENCE_POLICY_V1,
      version: 'price-confidence-v2-test',
    });
    expect(a.reproducibility.reportInputHash).not.toBe(b.reproducibility.reportInputHash);
    expect(b.reproducibility.scoringVersion).toBe('price-confidence-v2-test');
  });

  it('changing an observation changes the hash', () => {
    const a = generateReport(request(), observations);
    const mutated = [obs({ observationId: 'r1', normalizedPrice: 100_001 }), observations[1], observations[2]];
    const b = generateReport(request(), mutated);
    expect(a.reproducibility.reportInputHash).not.toBe(b.reproducibility.reportInputHash);
  });
});

describe('Scenario 17 — no ungrounded report claims', () => {
  it('every source, date, price and observation id in the report maps to input data', () => {
    const inputs = [
      obs({ observationId: 'g1' }),
      obs({ observationId: 'g2' }),
      obs({ observationId: 'g3', specMatch: 'mismatch' }),
    ];
    const byId = new Map(inputs.map((o) => [o.observationId, o]));
    const report = generateReport(request(), inputs);

    for (const source of report.sources) {
      const origin = byId.get(source.observationId);
      expect(origin).toBeDefined();
      expect(source.sourceUrl).toBe(origin?.sourceUrl);
      expect(source.displayedPrice).toBe(origin?.originalPrice);
      expect(source.dateChecked).toBe(origin?.checkedAtIso);
    }
    for (const id of report.reproducibility.observationIds) expect(byId.has(id)).toBe(true);
    for (const id of report.reproducibility.excludedObservationIds) expect(byId.has(id)).toBe(true);
    // The mismatch observation is audited as excluded, not silently dropped.
    expect(report.reproducibility.excludedObservationIds).toContain('g3');
  });
});

describe('Scenario 18 — insufficient-data report', () => {
  it('produces no fake typical price and explains what was missing', () => {
    const report = generateReport(request({ requestedLocationLabel: 'Benin City' }), [
      obs({ specMatch: 'mismatch' }),
      obs({ comparable: false, normalizedPrice: null, normalizedUnit: null, comparabilityNotes: ['deposit only'] }),
    ]);
    expect(report.status).toBe('insufficient_data');
    expect(report.pricing.typicalPrice).toBeNull();
    expect(report.pricing.observedLow).toBeNull();
    expect(report.pricing.singleSourcePrice).toBeNull();
    expect(report.insufficientData).not.toBeNull();
    expect(report.insufficientData?.explanation).toContain('Insufficient reliable data');
    expect(report.insufficientData?.explanation).toContain('Benin City');
    expect(report.insufficientData?.sourcesChecked).toBe(2);
    expect(report.insufficientData?.missingData.length).toBeGreaterThan(0);
    expect(report.insufficientData?.nextSteps.length).toBeGreaterThan(0);

    const text = renderReportText(report);
    expect(text).toContain('Insufficient reliable data');
    expect(text).not.toContain('TYPICAL OBSERVED PRICE');
    expect(text).not.toMatch(/NGN [\d,]+/); // no price appears anywhere
  });
});

describe('Renderer — consumer structure', () => {
  it('renders every required section for a complete report', () => {
    const report = generateReport(request(), [obs(), obs(), obs()]);
    const text = renderReportText(report);
    for (const section of [
      'PRODUCT',
      'LOCATION',
      'LATEST OBSERVED RANGE',
      'TYPICAL OBSERVED PRICE',
      'WHAT THE PRICE APPEARS TO INCLUDE',
      'SOURCES CHECKED',
      'CONFIDENCE',
      'IMPORTANT CAUTION',
      'BUILDMYHOUSE NEXT STEP',
    ]) {
      expect(text).toContain(section);
    }
    expect(text).toContain('Dangote Cement 42.5R');
    expect(text).toContain('Lagos');
  });

  it('location caveat appears when accepted prices come from elsewhere', () => {
    const report = generateReport(request({ requestedLocationLabel: 'Benin City' }), [
      obs({ locationMatch: 'different_region' }),
      obs({ locationMatch: 'different_region' }),
      obs({ locationMatch: 'different_region' }),
    ]);
    expect(report.location.limitations.join(' ')).toMatch(/No accepted price was confirmed in the exact requested city/);
    const text = renderReportText(report);
    expect(text).toContain('No accepted price was confirmed in the exact requested city');
  });
});

describe('Persisted snapshot payload shape', () => {
  it('the report object is JSON-serialisable for PriceReportItem.payload storage', () => {
    const report = generateReport(request(), [obs(), obs(), obs()]);
    const roundTripped = JSON.parse(JSON.stringify(report)) as PriceCheckerReport;
    expect(roundTripped).toEqual(report);
  });
});
