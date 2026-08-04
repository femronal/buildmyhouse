import { ForbiddenException } from '@nestjs/common';
import { PriceCheckerResearchService } from '../consumer/price-checker-research.service';

describe('research.start payment_required', () => {
  it('returns payment_required (not usage_limit_reached) when free allowance exhausted', async () => {
    const usage = {
      usageStatus: jest.fn().mockResolvedValue({
        allowed: false,
        remaining: 0,
        used: 2,
        limit: 2,
        authenticated: false,
        resetsAt: null,
      }),
      recordIpStart: jest.fn(),
      countInsufficientData: true,
    };
    const catalogue = {
      questionsPreview: jest.fn().mockReturnValue({
        contradictions: [],
        missingRequiredIds: [],
        questions: [{ id: 'brand' }],
      }),
      requireLocation: jest.fn(),
    };
    const prisma = {};
    const service = new PriceCheckerResearchService(
      prisma as any,
      catalogue as any,
      usage as any,
      null,
      null,
    );

    await expect(
      service.start(
        {
          familyKey: 'cement',
          kind: 'product',
          answers: { brand: 'Dangote' },
          locationKey: 'lagos',
          rawProductName: 'Dangote cement 50kg',
        },
        { userId: null, anonymousSessionId: '11111111-1111-4111-8111-111111111111', ip: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    try {
      await service.start(
        {
          familyKey: 'cement',
          kind: 'product',
          answers: { brand: 'Dangote' },
          locationKey: 'lagos',
          rawProductName: 'Dangote cement 50kg',
        },
        { userId: null, anonymousSessionId: '11111111-1111-4111-8111-111111111111', ip: null },
      );
    } catch (err) {
      const e = err as ForbiddenException;
      const body = e.getResponse() as { code?: string; remainingFree?: number };
      expect(body.code).toBe('payment_required');
      expect(body.remainingFree).toBe(0);
      expect(body.code).not.toBe('usage_limit_reached');
    }
  });
});
