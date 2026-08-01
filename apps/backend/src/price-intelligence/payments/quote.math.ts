/**
 * Pure free/chargeable math for Stage 7 quotes. Integer kobo only.
 * Server recalculates; client-supplied totals are never authoritative.
 */

export interface QuoteItemInput {
  /** Stable key for matching line items within a quote/order. */
  clientItemKey: string;
  familyKey: string;
  kind: 'product' | 'service';
  answers: Record<string, string>;
  locationKey: string;
  rawProductName: string;
  productLabel: string;
}

export interface PricedQuoteLine {
  clientItemKey: string;
  familyKey: string;
  kind: 'product' | 'service';
  answers: Record<string, string>;
  locationKey: string;
  rawProductName: string;
  productLabel: string;
  free: boolean;
  amountKobo: number;
}

export interface QuoteTotals {
  requestedItemCount: number;
  freeItemCountApplied: number;
  chargeableItemCount: number;
  unitPriceKobo: number;
  subtotalKobo: number;
  discountKobo: number;
  totalKobo: number;
  currency: 'NGN';
  lines: PricedQuoteLine[];
}

/**
 * freeItemCountApplied = min(requested, remainingFree)
 * chargeableItemCount  = max(0, requested - freeApplied)
 * Free lines are amount 0; chargeable lines use unitPriceKobo each.
 */
export function calculateQuoteTotals(args: {
  items: readonly QuoteItemInput[];
  remainingFreeReports: number;
  unitPriceKobo: number;
}): QuoteTotals {
  const { items, unitPriceKobo } = args;
  if (!Number.isInteger(unitPriceKobo) || unitPriceKobo <= 0) {
    throw new Error('unitPriceKobo must be a positive integer (kobo)');
  }
  if (!Number.isInteger(args.remainingFreeReports) || args.remainingFreeReports < 0) {
    throw new Error('remainingFreeReports must be a non-negative integer');
  }
  if (items.length === 0) {
    throw new Error('At least one item is required');
  }

  const requestedItemCount = items.length;
  const freeItemCountApplied = Math.min(requestedItemCount, args.remainingFreeReports);
  const chargeableItemCount = Math.max(0, requestedItemCount - freeItemCountApplied);

  const lines: PricedQuoteLine[] = items.map((item, index) => {
    const free = index < freeItemCountApplied;
    return {
      clientItemKey: item.clientItemKey,
      familyKey: item.familyKey,
      kind: item.kind,
      answers: { ...item.answers },
      locationKey: item.locationKey,
      rawProductName: item.rawProductName,
      productLabel: item.productLabel,
      free,
      amountKobo: free ? 0 : unitPriceKobo,
    };
  });

  const subtotalKobo = chargeableItemCount * unitPriceKobo;
  const discountKobo = 0;
  const totalKobo = subtotalKobo - discountKobo;

  return {
    requestedItemCount,
    freeItemCountApplied,
    chargeableItemCount,
    unitPriceKobo,
    subtotalKobo,
    discountKobo,
    totalKobo,
    currency: 'NGN',
    lines,
  };
}

/** True when the entire request is covered by remaining free allowance. */
export function isFullyCoveredByFreeAllowance(totals: QuoteTotals): boolean {
  return totals.chargeableItemCount === 0 && totals.totalKobo === 0;
}
