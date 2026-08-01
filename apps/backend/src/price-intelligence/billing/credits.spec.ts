import {
  creditsForSuccessfulProducts,
  isValidLedgerEvent,
  ledgerBalance,
  reserveCredits,
  settleCredits,
  settlementNetDelta,
  CreditLedgerEvent,
} from './credits';

describe('creditsForSuccessfulProducts (approved Stage 1 rules)', () => {
  it('0 successful products cost 0 credits', () => {
    expect(creditsForSuccessfulProducts(0)).toBe(0);
  });

  it('1–5 successful products consume exactly 1 credit', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      expect(creditsForSuccessfulProducts(n)).toBe(1);
    }
  });

  it('6–10 successful products consume exactly 2 credits', () => {
    for (const n of [6, 7, 8, 9, 10]) {
      expect(creditsForSuccessfulProducts(n)).toBe(2);
    }
  });

  it('rejects negative and non-integer counts', () => {
    expect(() => creditsForSuccessfulProducts(-1)).toThrow();
    expect(() => creditsForSuccessfulProducts(2.5)).toThrow();
  });
});

describe('append-only ledger', () => {
  it('computes balance as the sum of signed deltas (never a mutable counter)', () => {
    const events: CreditLedgerEvent[] = [
      { eventType: 'credit_purchased', delta: 3, reason: 'paystack' },
      { eventType: 'credit_reserved', delta: -1, reason: 'research started' },
      { eventType: 'credit_released', delta: 1, reason: 'settlement' },
      { eventType: 'credit_consumed', delta: -1, reason: 'report delivered' },
    ];
    expect(ledgerBalance(events)).toBe(2);
  });

  it('enforces sign rules per event type', () => {
    expect(isValidLedgerEvent({ eventType: 'credit_purchased', delta: 1, reason: 'x' })).toBe(true);
    expect(isValidLedgerEvent({ eventType: 'credit_purchased', delta: -1, reason: 'x' })).toBe(false);
    expect(isValidLedgerEvent({ eventType: 'credit_consumed', delta: -1, reason: 'x' })).toBe(true);
    expect(isValidLedgerEvent({ eventType: 'credit_consumed', delta: 1, reason: 'x' })).toBe(false);
    expect(isValidLedgerEvent({ eventType: 'credit_refunded', delta: 1, reason: 'x' })).toBe(true);
    expect(isValidLedgerEvent({ eventType: 'admin_adjustment', delta: -2, reason: 'x' })).toBe(true);
    expect(isValidLedgerEvent({ eventType: 'admin_adjustment', delta: 2, reason: 'x' })).toBe(true);
  });

  it('rejects zero and non-integer deltas', () => {
    expect(isValidLedgerEvent({ eventType: 'admin_adjustment', delta: 0, reason: 'x' })).toBe(false);
    expect(isValidLedgerEvent({ eventType: 'credit_purchased', delta: 1.5, reason: 'x' })).toBe(false);
    expect(() =>
      ledgerBalance([{ eventType: 'credit_purchased', delta: 0, reason: 'x' }]),
    ).toThrow();
  });
});

describe('reservation and settlement (reserve-then-settle)', () => {
  it('reserves 1 credit for a 5-item request', () => {
    const event = reserveCredits(5, 'req-1');
    expect(event.eventType).toBe('credit_reserved');
    expect(event.delta).toBe(-1);
  });

  it('reserves 2 credits for an 8-item request', () => {
    expect(reserveCredits(8, 'req-1').delta).toBe(-2);
  });

  it('refuses to reserve for an empty request', () => {
    expect(() => reserveCredits(0, 'req-1')).toThrow();
  });

  /**
   * Invariant under reserve-then-settle: the settlement releases the whole
   * reservation and then consumes the true cost, so
   *   reservationDelta + settlementNetDelta === -creditsConsumed.
   */
  const combinedEffect = (reserved: number, s: ReturnType<typeof settleCredits>) =>
    -reserved + settlementNetDelta(s);

  it('5 successful items settle to exactly 1 consumed credit', () => {
    const s = settleCredits(1, ['successful', 'successful', 'successful', 'successful', 'successful'], 'req-1');
    expect(s.creditsConsumed).toBe(1);
    expect(combinedEffect(1, s)).toBe(-1);
    expect(s.events.map((e) => e.eventType)).toEqual(['credit_released', 'credit_consumed']);
  });

  it('insufficient-data items do NOT count against the product allowance', () => {
    // 5 successful + 3 insufficient-data: still 1 credit, not 2
    const s = settleCredits(2, [
      'successful', 'successful', 'successful', 'successful', 'successful',
      'insufficient_data', 'insufficient_data', 'insufficient_data',
    ], 'req-2');
    expect(s.successfulCount).toBe(5);
    expect(s.insufficientDataCount).toBe(3);
    expect(s.creditsConsumed).toBe(1);
    expect(combinedEffect(2, s)).toBe(-1);
  });

  it('a completely failed report consumes NO credit (full refund of reservation)', () => {
    const s = settleCredits(1, ['failed', 'failed', 'failed'], 'req-3');
    expect(s.creditsConsumed).toBe(0);
    expect(combinedEffect(1, s)).toBe(0);
    expect(s.events).toHaveLength(1);
    expect(s.events[0].eventType).toBe('credit_released');
    expect(s.events[0].delta).toBe(1);
  });

  it('all items insufficient-data consumes NO credit', () => {
    const s = settleCredits(1, ['insufficient_data', 'insufficient_data'], 'req-4');
    expect(s.creditsConsumed).toBe(0);
    expect(combinedEffect(1, s)).toBe(0);
  });

  it('6 successful items consume 2 credits', () => {
    const outcomes = Array(6).fill('successful') as 'successful'[];
    const s = settleCredits(2, outcomes, 'req-5');
    expect(s.creditsConsumed).toBe(2);
    expect(combinedEffect(2, s)).toBe(-2);
  });

  it('mixed outcome: 4 successful, 1 insufficient, 1 failed -> 1 credit', () => {
    const s = settleCredits(2, [
      'successful', 'successful', 'successful', 'successful',
      'insufficient_data', 'failed',
    ], 'req-6');
    expect(s.creditsConsumed).toBe(1);
    expect(combinedEffect(2, s)).toBe(-1);
  });

  it('full reserve/settle round-trip leaves the ledger consistent', () => {
    const purchase: CreditLedgerEvent = { eventType: 'credit_purchased', delta: 2, reason: 'paystack' };
    const reservation = reserveCredits(5, 'req-7');
    const settlement = settleCredits(1, ['successful', 'insufficient_data', 'successful'], 'req-7');
    const balance = ledgerBalance([purchase, reservation, ...settlement.events]);
    // bought 2, consumed 1 -> 1 left
    expect(balance).toBe(1);
  });
});
