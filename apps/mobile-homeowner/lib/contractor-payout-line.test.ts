import { formatContractorPayoutLine } from './contractor-payout-line';

describe('formatContractorPayoutLine', () => {
  it('writes the payment line and leaves out forbidden money words', () => {
    const line = formatContractorPayoutLine({
      amount: 250000,
      gcName: 'Ade Builders',
      sentAt: '2026-11-23T12:00:00.000Z',
      bankReference: 'FT2611230045',
    });
    expect(line).toBe('₦250,000 sent to Ade Builders on 23 Nov 2026 · ref FT2611230045');
    expect(line).not.toMatch(/escrow|\bheld\b|waiting|protected|\bsafe\b/i);
  });
});
