import { loadPricingConfig, resolvePricePerReportKobo } from './pricing.config';

describe('pricing.config', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it('disables checkout when PRICE_CHECKER_PRICE_PER_REPORT_KOBO is missing', () => {
    delete process.env.PRICE_CHECKER_PRICE_PER_REPORT_KOBO;
    expect(resolvePricePerReportKobo({})).toBeNull();
    const cfg = loadPricingConfig({});
    expect(cfg.checkoutEnabled).toBe(false);
    expect(cfg.checkoutDisabledReason).toMatch(/PRICE_CHECKER_PRICE_PER_REPORT_KOBO/);
  });

  it('rejects non-positive / non-integer prices', () => {
    expect(resolvePricePerReportKobo({ PRICE_CHECKER_PRICE_PER_REPORT_KOBO: '0' })).toBeNull();
    expect(resolvePricePerReportKobo({ PRICE_CHECKER_PRICE_PER_REPORT_KOBO: '12.5' })).toBeNull();
    expect(resolvePricePerReportKobo({ PRICE_CHECKER_PRICE_PER_REPORT_KOBO: '-100' })).toBeNull();
  });

  it('loads integer kobo price and aliases free-window limit', () => {
    const cfg = loadPricingConfig({
      PRICE_CHECKER_PRICE_PER_REPORT_KOBO: '1500000',
      PRICE_CHECKER_PRICING_VERSION: 'v1.1',
      PRICE_CHECKER_FREE_REPORTS_PER_WINDOW: '2',
    });
    expect(cfg.checkoutEnabled).toBe(true);
    expect(cfg.pricePerReportKobo).toBe(1_500_000);
    expect(cfg.pricingVersion).toBe('v1.1');
    expect(cfg.freeReportsPerWindow).toBe(2);
    expect(cfg.currency).toBe('NGN');
  });
});
