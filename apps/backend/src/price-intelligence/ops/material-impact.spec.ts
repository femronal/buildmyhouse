import { detectMaterialImpact, medianPrice, rangeFromPrices } from './material-impact';

describe('material-impact', () => {
  it('flags ≥10% typical price change', () => {
    const r = detectMaterialImpact(
      { typicalPrice: 10000, confidenceLabel: 'moderate' },
      { typicalPrice: 12000, confidenceLabel: 'moderate' },
    );
    expect(r.material).toBe(true);
    expect(r.typicalPriceChangePct).toBeCloseTo(20, 5);
  });

  it('ignores small price moves', () => {
    const r = detectMaterialImpact(
      { typicalPrice: 10000, confidenceLabel: 'high' },
      { typicalPrice: 10400, confidenceLabel: 'high' },
    );
    expect(r.material).toBe(false);
  });

  it('flags confidence label change', () => {
    const r = detectMaterialImpact(
      { typicalPrice: 10000, confidenceLabel: 'high' },
      { typicalPrice: 10000, confidenceLabel: 'low' },
    );
    expect(r.material).toBe(true);
    expect(r.reasons.join(' ')).toMatch(/confidence label/);
  });

  it('flags status flip to insufficient_data', () => {
    const r = detectMaterialImpact(
      { status: 'complete', typicalPrice: 5000 },
      { status: 'insufficient_data', typicalPrice: null },
    );
    expect(r.material).toBe(true);
  });

  it('medianPrice is deterministic', () => {
    expect(medianPrice([3, 1, 2])).toBe(2);
    expect(medianPrice([4, 1, 2, 3])).toBe(2.5);
    expect(medianPrice([])).toBeNull();
  });

  it('rangeFromPrices', () => {
    expect(rangeFromPrices([100, 200, 300])).toEqual({ low: 100, high: 300, typical: 200 });
  });
});
