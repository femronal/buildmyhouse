/**
 * Deterministic credit accounting for the Price Checker (Stage 3).
 *
 * Credit integrity is NEVER a mutable counter: the balance is the sum of
 * signed deltas in the append-only price_credit_ledger table. This module
 * contains the pure rules; services persist the events it returns.
 *
 * Approved Stage 1 commercial rules enforced here:
 *  - up to 5 successfully researched products consume 1 credit;
 *  - 6–10 successfully researched products consume 2 credits;
 *  - insufficient-data items do NOT count against the product allowance;
 *  - a completely failed report consumes NO credit;
 *  - credits may be reserved while research runs but are consumed only
 *    according to the final valid result.
 */

export const PRODUCTS_PER_CREDIT = 5;

export type CreditEventType =
  | 'credit_purchased'
  | 'credit_reserved'
  | 'credit_consumed'
  | 'credit_released'
  | 'credit_refunded'
  | 'admin_adjustment';

export interface CreditLedgerEvent {
  eventType: CreditEventType;
  /** Signed delta: purchases/releases/refunds > 0; reservations/consumption < 0. */
  delta: number;
  reason: string;
  requestId?: string;
}

export type ResearchItemOutcome =
  | 'successful'
  | 'insufficient_data'
  | 'failed'
  | 'cancelled';

/** Sign rules per event type (admin_adjustment may go either way). */
const SIGN_RULES: Record<CreditEventType, 'positive' | 'negative' | 'any'> = {
  credit_purchased: 'positive',
  credit_reserved: 'negative',
  credit_consumed: 'negative',
  credit_released: 'positive',
  credit_refunded: 'positive',
  admin_adjustment: 'any',
};

export function isValidLedgerEvent(event: CreditLedgerEvent): boolean {
  if (!Number.isInteger(event.delta) || event.delta === 0) return false;
  const rule = SIGN_RULES[event.eventType];
  if (rule === 'positive') return event.delta > 0;
  if (rule === 'negative') return event.delta < 0;
  return true;
}

/** Balance = fold over the append-only ledger. Rejects malformed events. */
export function ledgerBalance(events: readonly CreditLedgerEvent[]): number {
  return events.reduce((sum, event) => {
    if (!isValidLedgerEvent(event)) {
      throw new Error(
        `Invalid ledger event: ${event.eventType} with delta ${event.delta}`,
      );
    }
    return sum + event.delta;
  }, 0);
}

/**
 * Credits required for N successfully researched products.
 * 0 -> 0, 1–5 -> 1, 6–10 -> 2, and so on (ceil(n / 5)).
 */
export function creditsForSuccessfulProducts(count: number): number {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid successful-product count: ${count}`);
  }
  return Math.ceil(count / PRODUCTS_PER_CREDIT);
}

/**
 * Reservation when research starts: reserve the credits the request WOULD
 * cost if every submitted item succeeds.
 */
export function reserveCredits(
  itemCount: number,
  requestId: string,
): CreditLedgerEvent {
  const credits = creditsForSuccessfulProducts(itemCount);
  if (credits === 0) {
    throw new Error('Cannot reserve credits for an empty request');
  }
  return {
    eventType: 'credit_reserved',
    delta: -credits,
    reason: `Reserved ${credits} credit(s) for ${itemCount} item(s)`,
    requestId,
  };
}

export interface CreditSettlement {
  /** Events to append (release of the reservation, then final consumption). */
  events: CreditLedgerEvent[];
  creditsConsumed: number;
  successfulCount: number;
  insufficientDataCount: number;
  failedCount: number;
}

/**
 * Final settlement when research completes. The reservation is fully
 * released, then the true cost (based ONLY on successful items) is consumed.
 * Net ledger effect therefore always equals the final valid result:
 *  - all items failed / insufficient data  -> net 0 (no credit consumed);
 *  - 1–5 successful                        -> net -1;
 *  - 6–10 successful                       -> net -2.
 */
export function settleCredits(
  reservedCredits: number,
  itemOutcomes: readonly ResearchItemOutcome[],
  requestId: string,
): CreditSettlement {
  if (!Number.isInteger(reservedCredits) || reservedCredits < 0) {
    throw new Error(`Invalid reserved credits: ${reservedCredits}`);
  }

  const successfulCount = itemOutcomes.filter((o) => o === 'successful').length;
  const insufficientDataCount = itemOutcomes.filter((o) => o === 'insufficient_data').length;
  const failedCount = itemOutcomes.filter((o) => o === 'failed').length;
  const creditsConsumed = creditsForSuccessfulProducts(successfulCount);

  const events: CreditLedgerEvent[] = [];

  if (reservedCredits > 0) {
    events.push({
      eventType: 'credit_released',
      delta: reservedCredits,
      reason: `Released reservation of ${reservedCredits} credit(s) at settlement`,
      requestId,
    });
  }

  if (creditsConsumed > 0) {
    events.push({
      eventType: 'credit_consumed',
      delta: -creditsConsumed,
      reason:
        `Consumed ${creditsConsumed} credit(s) for ${successfulCount} successful item(s)` +
        (insufficientDataCount > 0
          ? ` (${insufficientDataCount} insufficient-data item(s) not charged)`
          : ''),
      requestId,
    });
  }

  return { events, creditsConsumed, successfulCount, insufficientDataCount, failedCount };
}

/** Net ledger effect of a settlement (for verification/tests). */
export function settlementNetDelta(settlement: CreditSettlement): number {
  return settlement.events.reduce((sum, e) => sum + e.delta, 0);
}
