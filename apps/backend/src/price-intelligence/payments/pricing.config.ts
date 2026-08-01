/**
 * Stage 7 — server-owned Price Checker pricing configuration.
 *
 * PRICE_CHECKER_PRICE_PER_REPORT_KOBO is required for checkout. Missing or
 * invalid values disable payment initialization with a safe error — we never
 * invent a production price.
 */

export interface PriceCheckerPricingConfig {
  /** Unit price per chargeable report in integer kobo. Null = checkout disabled. */
  pricePerReportKobo: number | null;
  pricingVersion: string;
  currency: 'NGN';
  /** Target gross margin in basis points (informational / alerts). */
  targetGrossMarginBps: number;
  /** Soft ceiling for research cost per item in kobo (alerts). */
  maxResearchCostPerItemKobo: number;
  quoteTtlMinutes: number;
  /** Alias of anonymous free rolling-window limit. */
  freeReportsPerWindow: number;
  freeWindowHours: number;
  maxItemsPerCheckout: number;
  insufficientDataCountsAsCompleted: boolean;
  /** Hours after payment during which the one-time entitlement remains usable. */
  entitlementWindowHours: number;
  /** NGN per 1 USD used to estimate research cost in kobo (never authoritative FX). */
  usdNgnRate: number | null;
  checkoutEnabled: boolean;
  checkoutDisabledReason: string | null;
}

function intEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const v = Number(env[name]);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
}

function boolEnv(env: NodeJS.ProcessEnv, name: string, fallback: boolean): boolean {
  const raw = env[name];
  if (raw === undefined) return fallback;
  return raw.trim().toLowerCase() !== 'false';
}

/**
 * Resolve unit price from env. Returns null when missing/invalid so callers
 * can disable checkout rather than guessing a price.
 */
export function resolvePricePerReportKobo(env: NodeJS.ProcessEnv = process.env): number | null {
  const raw = env.PRICE_CHECKER_PRICE_PER_REPORT_KOBO;
  if (raw === undefined || raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function loadPricingConfig(env: NodeJS.ProcessEnv = process.env): PriceCheckerPricingConfig {
  const pricePerReportKobo = resolvePricePerReportKobo(env);
  const freeFromAlias = env.PRICE_CHECKER_FREE_REPORTS_PER_WINDOW;
  const freeReportsPerWindow =
    freeFromAlias !== undefined && freeFromAlias.trim() !== ''
      ? intEnv(env, 'PRICE_CHECKER_FREE_REPORTS_PER_WINDOW', 2)
      : intEnv(env, 'PRICE_CHECKER_ANONYMOUS_DAILY_LIMIT', 2);

  const insuffAlias = env.PRICE_CHECKER_INSUFFICIENT_DATA_COUNTS_AS_COMPLETED;
  const insufficientDataCountsAsCompleted =
    insuffAlias !== undefined
      ? boolEnv(env, 'PRICE_CHECKER_INSUFFICIENT_DATA_COUNTS_AS_COMPLETED', true)
      : boolEnv(env, 'PRICE_CHECKER_COUNT_INSUFFICIENT_DATA', true);

  const usdRaw = env.PRICE_CHECKER_USD_NGN_RATE ?? env.USD_NGN_RATE;
  const usdNgn = usdRaw !== undefined && usdRaw.trim() !== '' ? Number(usdRaw) : null;
  const usdNgnRate = usdNgn !== null && Number.isFinite(usdNgn) && usdNgn > 0 ? usdNgn : null;

  const checkoutEnabled = pricePerReportKobo !== null;
  return {
    pricePerReportKobo,
    pricingVersion: env.PRICE_CHECKER_PRICING_VERSION?.trim() || 'v1',
    currency: 'NGN',
    targetGrossMarginBps: intEnv(env, 'PRICE_CHECKER_TARGET_GROSS_MARGIN_BPS', 7000),
    maxResearchCostPerItemKobo: intEnv(env, 'PRICE_CHECKER_MAX_RESEARCH_COST_PER_ITEM_KOBO', 500_000),
    quoteTtlMinutes: Math.max(1, intEnv(env, 'PRICE_CHECKER_PAYMENT_QUOTE_TTL_MINUTES', 15)),
    freeReportsPerWindow,
    freeWindowHours: Math.max(1, intEnv(env, 'PRICE_CHECKER_FREE_WINDOW_HOURS', 24)),
    maxItemsPerCheckout: Math.max(1, intEnv(env, 'PRICE_CHECKER_MAX_ITEMS_PER_CHECKOUT', 10)),
    insufficientDataCountsAsCompleted,
    entitlementWindowHours: Math.max(1, intEnv(env, 'PRICE_CHECKER_ENTITLEMENT_WINDOW_HOURS', 24)),
    usdNgnRate,
    checkoutEnabled,
    checkoutDisabledReason: checkoutEnabled
      ? null
      : 'Checkout is temporarily unavailable: PRICE_CHECKER_PRICE_PER_REPORT_KOBO is missing or invalid.',
  };
}
