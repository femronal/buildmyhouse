import { ForbiddenException } from '@nestjs/common';
import { PriceCheckerPaymentService } from './payment.service';
import { PaystackVerifyResult } from './paystack.provider';

describe('PriceCheckerPaymentService fulfilment gates', () => {
  function buildService(order: Record<string, unknown>) {
    const updates: unknown[] = [];
    const prisma = {
      priceCheckPaymentOrder: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockImplementation(async ({ data }: { data: unknown }) => {
          updates.push(data);
          return { ...order, ...(data as object) };
        }),
      },
      priceCheckPaymentLineItem: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      priceCheckPaymentQuote: {
        update: jest.fn().mockResolvedValue({}),
      },
      priceCheckPaymentEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
    };

    const paystack = {
      initialize: jest.fn(),
      verify: jest.fn(),
      refund: jest.fn(),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    const quotes = { getActiveQuote: jest.fn() };
    const service = new PriceCheckerPaymentService(prisma as any, quotes as any, paystack as any);
    return { service, prisma, paystack, updates };
  }

  const baseOrder = {
    id: 'order-1',
    quoteId: 'quote-1',
    status: 'pending',
    fulfilmentStatus: 'not_started',
    amountExpectedKobo: 500_000,
    currency: 'NGN',
    amountPaidKobo: null,
    metadataSafe: {},
  };

  it('blocks fulfilment on amount/currency mismatch', async () => {
    const { service, updates } = buildService({ ...baseOrder });
    const verified: PaystackVerifyResult = {
      status: 'success',
      reference: 'pc_ref',
      amountKobo: 499_000, // mismatch
      currency: 'NGN',
      paidAt: new Date().toISOString(),
      transactionId: '1',
      gatewayResponse: 'Approved',
      rawStatus: 'success',
    };

    await service.applyVerifiedPayment('order-1', verified, { source: 'test', fingerprint: 'fp1' });

    const failedUpdate = updates.find((u) => (u as { status?: string }).status === 'failed') as {
      status: string;
      metadataSafe?: { mismatch?: unknown };
    };
    expect(failedUpdate).toBeTruthy();
    expect(failedUpdate.metadataSafe?.mismatch).toBeTruthy();
    expect(updates.some((u) => (u as { fulfilmentStatus?: string }).fulfilmentStatus === 'ready')).toBe(false);
  });

  it('marks paid + ready on matching success (does not start research)', async () => {
    process.env.PRICE_CHECKER_ENTITLEMENT_WINDOW_HOURS = '24';
    const { service, updates, prisma } = buildService({ ...baseOrder });
    const verified: PaystackVerifyResult = {
      status: 'success',
      reference: 'pc_ref',
      amountKobo: 500_000,
      currency: 'NGN',
      paidAt: new Date().toISOString(),
      transactionId: '99',
      gatewayResponse: 'Approved',
      rawStatus: 'success',
    };

    await service.applyVerifiedPayment('order-1', verified, { source: 'webhook', fingerprint: 'fp2' });

    expect(updates.some((u) => (u as { status?: string }).status === 'success')).toBe(true);
    expect(updates.some((u) => (u as { fulfilmentStatus?: string }).fulfilmentStatus === 'ready')).toBe(true);
    // No research tables touched
    expect((prisma as any).priceResearchRequest).toBeUndefined();
  });

  it('is idempotent when already success+ready', async () => {
    const { service, updates } = buildService({
      ...baseOrder,
      status: 'success',
      fulfilmentStatus: 'ready',
    });
    const verified: PaystackVerifyResult = {
      status: 'success',
      reference: 'pc_ref',
      amountKobo: 500_000,
      currency: 'NGN',
      paidAt: new Date().toISOString(),
      transactionId: '99',
      gatewayResponse: 'Approved',
      rawStatus: 'success',
    };

    await service.applyVerifiedPayment('order-1', verified, { source: 'webhook', fingerprint: 'fp3' });
    expect(updates).toHaveLength(0);
  });

  it('rejects invalid webhook signatures', async () => {
    const { service, paystack } = buildService({ ...baseOrder });
    paystack.verifyWebhookSignature.mockReturnValue(false);
    await expect(service.handleWebhook('{}', 'bad')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('idempotent webhook: already-processed fingerprint returns ok without re-applying', async () => {
    const { service, prisma } = buildService({ ...baseOrder });
    prisma.priceCheckPaymentEvent.findUnique.mockResolvedValue({ processed: true });
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'pc_x', id: 1, status: 'success' } });
    const result = await service.handleWebhook(body, 'sig');
    expect(result).toEqual({ ok: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('Stage 7 wallet invariant', () => {
  it('does not reference PriceCreditLedger / CreditWallet in payment flow modules', () => {
    // Structural guarantee: payment services must not import billing/credits wallet.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const paymentSrc = require('fs').readFileSync(
      require('path').join(__dirname, 'payment.service.ts'),
      'utf8',
    ) as string;
    expect(paymentSrc).not.toMatch(/PriceCreditLedger|CreditWallet|credit_purchased/);
    const fulfilmentSrc = require('fs').readFileSync(
      require('path').join(__dirname, 'fulfilment.service.ts'),
      'utf8',
    ) as string;
    expect(fulfilmentSrc).not.toMatch(/PriceCreditLedger|CreditWallet/);
  });
});
