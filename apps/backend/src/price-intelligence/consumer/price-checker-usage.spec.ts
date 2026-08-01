import { PriceCheckerUsageService } from './price-checker-usage.service';

describe('PriceCheckerUsageService limits', () => {
  const prisma = { priceResearchRequest: { findMany: jest.fn().mockResolvedValue([]) } } as any;
  const service = new PriceCheckerUsageService(prisma);

  afterEach(() => {
    delete process.env.PRICE_CHECKER_ANONYMOUS_DAILY_LIMIT;
    delete process.env.PRICE_CHECKER_AUTHENTICATED_DAILY_LIMIT;
    delete process.env.PRICE_CHECKER_IP_DAILY_CAP;
  });

  it('reads anonymous and authenticated limits from env (not UI hardcodes)', () => {
    process.env.PRICE_CHECKER_ANONYMOUS_DAILY_LIMIT = '2';
    process.env.PRICE_CHECKER_AUTHENTICATED_DAILY_LIMIT = '5';
    expect(service.limitFor(false)).toBe(2);
    expect(service.limitFor(true)).toBe(5);
  });

  it('enforces an IP backstop without invasive fingerprinting', () => {
    process.env.PRICE_CHECKER_IP_DAILY_CAP = '2';
    const ip = '203.0.113.10';
    expect(service.ipAllowed(ip)).toBe(true);
    service.recordIpStart(ip);
    service.recordIpStart(ip);
    expect(service.ipAllowed(ip)).toBe(false);
  });

  it('usageStatus reports remaining capacity for a fresh anonymous session', async () => {
    process.env.PRICE_CHECKER_ANONYMOUS_DAILY_LIMIT = '2';
    const status = await service.usageStatus({
      userId: null,
      anonymousSessionId: '11111111-1111-4111-8111-111111111111',
      ip: null,
    });
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(2);
    expect(status.authenticated).toBe(false);
  });
});
