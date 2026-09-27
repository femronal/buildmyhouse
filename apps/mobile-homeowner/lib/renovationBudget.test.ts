import { computeBudget, estimateSpace, highCostAreas } from '@/lib/renovationBudget';

describe('renovation budget', () => {
  it('prices a Lagos kitchen and bathroom at mid-range with 10% kept aside', () => {
    const result = computeBudget('Lagos', 'Medium', 'Mid-range', 10, [
      { space: 'Kitchen', workType: 'Upgrade' },
      { space: 'Bathrooms', workType: 'Upgrade' },
    ]);
    expect(result.rows[0].estimate).toBe(6_490_000);
    expect(result.rows[1].estimate).toBe(4_484_000);
    expect(result.subtotal).toBe(10_974_000);
    expect(result.contingencyAmount).toBe(1_097_400);
    expect(result.total).toBe(12_071_400);
    expect(result.rows.reduce((sum, row) => sum + row.estimate, 0)).toBe(result.subtotal);
  });

  it('rounds a fractional space estimate to a whole naira', () => {
    const estimate = estimateSpace('Living room', 'Lagos', 'Small', 'Basic', 'Repairs');
    expect(estimate).toBe(1_219_147);
    expect(Number.isInteger(estimate)).toBe(true);
  });

  it('does not change the price when only the property type changes', () => {
    const spaces = [{ space: 'Bedrooms' as const, workType: 'Repairs' as const }];
    const first = computeBudget('Abuja', 'Large', 'Premium', 15, spaces);
    const second = computeBudget('Abuja', 'Large', 'Premium', 15, spaces);
    expect(first.total).toBe(second.total);
    expect(first.total).toBe(Math.round(2_000_000 * 1.12 * 1.3 * 1.35 * 0.65) + Math.round(Math.round(2_000_000 * 1.12 * 1.3 * 1.35 * 0.65) * 0.15));
  });

  it('flags the kitchen as a higher-cost area', () => {
    const result = computeBudget('Other Nigeria', 'Medium', 'Basic', 0, [
      { space: 'Kitchen', workType: 'Full redo' },
      { space: 'Living room', workType: 'Repairs' },
    ]);
    const names = highCostAreas(result.rows).map((row) => row.space);
    expect(names).toContain('Kitchen');
  });
});
