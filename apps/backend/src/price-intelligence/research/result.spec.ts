import { buildResult, PricePoint } from './result';

function point(over: Partial<PricePoint> & { independentGroupId: string; normalizedPrice: number }): PricePoint {
  return {
    normalizedUnit: 'bag_50kg',
    sourceTier: 2,
    checkedAtIso: '2026-07-29T00:00:00.000Z',
    locationMatchLevel: 'same_city',
    specMatchLevel: 'exact',
    ...over,
  };
}

const NOW = '2026-07-30T00:00:00.000Z';

describe('buildResult', () => {
  it('returns insufficient_data with no points', () => {
    const r = buildResult({ points: [], nowIso: NOW });
    expect(r.outcome).toBe('insufficient_data');
    expect(r.rangeLow).toBeNull();
  });

  it('flags low confidence when fewer than 3 independent sources', () => {
    const r = buildResult({
      points: [
        point({ independentGroupId: 'g1', normalizedPrice: 9500 }),
        point({ independentGroupId: 'g2', normalizedPrice: 9700 }),
      ],
      nowIso: NOW,
    });
    expect(r.outcome).toBe('priced');
    expect(r.confidence).toBe('low');
    expect(r.independentSourceCount).toBe(2);
  });

  it('collapses multiple points from one group into a single source', () => {
    const r = buildResult({
      points: [
        point({ independentGroupId: 'g1', normalizedPrice: 9500 }),
        point({ independentGroupId: 'g1', normalizedPrice: 9600 }),
        point({ independentGroupId: 'g1', normalizedPrice: 9700 }),
      ],
      nowIso: NOW,
    });
    expect(r.independentSourceCount).toBe(1);
    expect(r.confidence).toBe('low');
  });

  it('produces a tight high-confidence range for many aligned sources', () => {
    const prices = [9400, 9500, 9500, 9600, 9550];
    const r = buildResult({
      points: prices.map((p, i) => point({ independentGroupId: `g${i}`, normalizedPrice: p })),
      nowIso: NOW,
    });
    expect(r.outcome).toBe('priced');
    expect(r.independentSourceCount).toBe(5);
    expect(r.rangeLow).toBe(9400);
    expect(r.rangeHigh).toBe(9600);
    expect(r.median).toBe(9500);
    expect(['high', 'moderate']).toContain(r.confidence);
  });

  it('excludes an extreme outlier via the MAD filter', () => {
    const prices = [9400, 9500, 9550, 9600, 900000];
    const r = buildResult({
      points: prices.map((p, i) => point({ independentGroupId: `g${i}`, normalizedPrice: p })),
      nowIso: NOW,
    });
    expect(r.excludedOutliers).toBeGreaterThanOrEqual(1);
    expect(r.rangeHigh).toBeLessThan(900000);
  });

  it('picks the modal unit and ignores mismatched-unit points', () => {
    const r = buildResult({
      points: [
        point({ independentGroupId: 'g1', normalizedPrice: 9500, normalizedUnit: 'bag_50kg' }),
        point({ independentGroupId: 'g2', normalizedPrice: 9600, normalizedUnit: 'bag_50kg' }),
        point({ independentGroupId: 'g3', normalizedPrice: 190000, normalizedUnit: 'tonne' }),
      ],
      nowIso: NOW,
    });
    expect(r.unit).toBe('bag_50kg');
  });
});
