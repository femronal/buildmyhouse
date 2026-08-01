import { calculateQuoteTotals, isFullyCoveredByFreeAllowance } from './quote.math';

const item = (i: number) => ({
  clientItemKey: `item_${i}`,
  familyKey: 'cement',
  kind: 'product' as const,
  answers: { brand: 'Dangote' },
  locationKey: 'lagos-mainland',
  rawProductName: `Cement ${i}`,
  productLabel: `Cement ${i}`,
});

describe('calculateQuoteTotals', () => {
  it('covers all items when free allowance is enough', () => {
    const totals = calculateQuoteTotals({
      items: [item(1), item(2)],
      remainingFreeReports: 2,
      unitPriceKobo: 500_000,
    });
    expect(totals.freeItemCountApplied).toBe(2);
    expect(totals.chargeableItemCount).toBe(0);
    expect(totals.totalKobo).toBe(0);
    expect(isFullyCoveredByFreeAllowance(totals)).toBe(true);
  });

  it('charges only for items beyond free allowance', () => {
    const totals = calculateQuoteTotals({
      items: [item(1), item(2), item(3), item(4), item(5)],
      remainingFreeReports: 2,
      unitPriceKobo: 500_000,
    });
    expect(totals.freeItemCountApplied).toBe(2);
    expect(totals.chargeableItemCount).toBe(3);
    expect(totals.subtotalKobo).toBe(1_500_000);
    expect(totals.totalKobo).toBe(1_500_000);
    expect(totals.lines.filter((l) => l.free)).toHaveLength(2);
    expect(totals.lines.filter((l) => !l.free).every((l) => l.amountKobo === 500_000)).toBe(true);
  });

  it('charges all items when no free allowance remains', () => {
    const totals = calculateQuoteTotals({
      items: [item(1), item(2), item(3)],
      remainingFreeReports: 0,
      unitPriceKobo: 250_000,
    });
    expect(totals.chargeableItemCount).toBe(3);
    expect(totals.totalKobo).toBe(750_000);
    expect(isFullyCoveredByFreeAllowance(totals)).toBe(false);
  });

  it('rejects non-integer kobo prices', () => {
    expect(() =>
      calculateQuoteTotals({
        items: [item(1)],
        remainingFreeReports: 0,
        unitPriceKobo: 100.5,
      }),
    ).toThrow(/positive integer/);
  });
});
