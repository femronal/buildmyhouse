import { PartnerProgramService } from './partner-program.service';

function service(prisma: any) {
  return new PartnerProgramService(prisma, { send: async () => true } as any, { generatePartnerToken: async () => 'jwt' } as any, {
    get: () => 'test',
  } as any);
}

describe('PartnerProgramService attribution', () => {
  it('keeps the first customer lock after a later code arrives', async () => {
    const prisma = {
      customerAttribution: {
        findUnique: jest.fn(async () => ({
          id: 'lock-1',
          referrerId: 'affiliate-1',
          source: 'link',
          referrer: { id: 'affiliate-1', archivedAt: null, userId: 'other' },
        })),
      },
    };
    const locked = await service(prisma).lockHomeowner({ userId: 'home-1', code: 'LATER1', source: 'link' });
    expect(locked?.referrerId).toBe('affiliate-1');
    expect(prisma.customerAttribution.findUnique).toHaveBeenCalledTimes(1);
  });

  it('does not attribute a link after the click window, and does attribute a typed code', async () => {
    const prisma = {
      customerAttribution: {
        findUnique: jest.fn(async () => null),
        create: jest.fn(async ({ data }: { data: { referrerId: string; source: string } }) => ({
          ...data,
          referrer: { id: data.referrerId, archivedAt: null, userId: null },
        })),
      },
      referralProgramRule: {
        findFirst: jest.fn(async () => ({ attributionRule: 'first_touch', clickWindowDays: 30, status: 'published' })),
      },
      referralClick: { findMany: jest.fn(async () => []) },
      referrer: {
        findUnique: jest.fn(async () => ({ id: 'affiliate-2', code: 'TYPED1', archivedAt: null, userId: null, email: 'a@example.com' })),
      },
      user: { findUnique: jest.fn(async () => ({ email: 'home@example.com' })) },
    };
    const program = service(prisma);
    await expect(program.referralFieldsForNewProject('home-1', 'OLD111', 'link', 'anon-12345678')).resolves.toEqual({});
    await expect(program.referralFieldsForNewProject('home-1', 'TYPED1', 'code_entered')).resolves.toMatchObject({
      referrerId: 'affiliate-2',
      referralSource: 'code_entered',
    });
  });
});

describe('PartnerProgramService commissions', () => {
  function projectPrisma(overrides: Record<string, unknown> = {}) {
    const project = {
      id: 'project-1',
      status: 'completed',
      completedAt: new Date('2026-11-01'),
      homeownerId: 'home-1',
      generalContractorId: 'gc-1',
      referrerId: 'affiliate-1',
      referredAt: new Date('2026-01-01'),
      referralSource: 'link',
      stages: [{ status: 'completed', approvedAt: new Date('2026-11-01') }],
      payments: [{ status: 'completed', amount: 55_000_000 }],
      projectRequests: [{ estimatedBudget: 50_000_000, monitoringFeeAmount: null, coordinationFeeAmount: null, contingencyFeeAmount: null, homeownerAcceptedQuoteAt: new Date() }],
      homeowner: { id: 'home-1', email: 'home@example.com' },
      referrer: null,
      ...overrides,
    };
    return {
      partnerCommission: {
        findUnique: jest.fn(async () => null),
        findFirst: jest.fn(),
        count: jest.fn(async () => 0),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'commission-1', ...data })),
      },
      project: {
        findUnique: jest.fn(async () => project),
        update: jest.fn(),
      },
      customerAttribution: {
        findUnique: jest.fn(async () => ({
          referrer: {
            id: 'affiliate-1',
            type: 'affiliate',
            applicationStatus: 'approved',
            archivedAt: null,
            userId: 'partner-user',
            email: 'partner@example.com',
          },
        })),
      },
      partnerAgreement: {
        findFirst: jest.fn(async () => ({ id: 'agreement-1', rateBps: 250, ruleId: 'rule-1' })),
      },
      referralProgramRule: { findFirst: jest.fn(async () => null) },
    };
  }

  it('records ₦1,250,000 on a ₦50 million project and excludes contingency', async () => {
    const prisma = projectPrisma();
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result).toMatchObject({ action: 'recorded', amount: 1_250_000, status: 'awaiting_checks' });
    expect(prisma.partnerCommission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eligibleContractorAmount: 50_000_000,
          controllingFeeAmount: 5_000_000,
          contingencyAmount: 10_000_000,
          amount: 1_250_000,
        }),
      }),
    );
  });

  it('does not create a commission for a completed project before the controlling fee is received', async () => {
    const prisma = projectPrisma({ payments: [{ status: 'completed', amount: 50_000_000 }] });
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result.action).toBe('skip');
    expect(prisma.partnerCommission.create).not.toHaveBeenCalled();
  });

  it('holds a contractor conflict for review instead of approving it', async () => {
    const prisma = projectPrisma({ generalContractorId: 'partner-user' });
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result).toMatchObject({ action: 'recorded', status: 'needs_review' });
  });

  it('does not pay the lifetime rate to an ordinary referrer while that reward is unpublished', async () => {
    const prisma = projectPrisma();
    prisma.customerAttribution.findUnique = jest.fn(async () => ({
      referrer: {
        id: 'referrer-1',
        type: 'referrer',
        applicationStatus: 'none',
        archivedAt: null,
        userId: 'gc-9',
        email: 'gc@example.com',
      },
    }));
    prisma.partnerAgreement.findFirst = jest.fn(async () => null);
    prisma.referralProgramRule.findFirst = jest.fn(async () => ({
      id: 'rule-r',
      status: 'draft',
      rewardKind: 'unpublished',
      rateBps: null,
    }));
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result.action).toBe('skip');
    expect(String((result as { reasons?: string[] }).reasons?.join(' '))).toMatch(/not published/i);
    expect(prisma.partnerCommission.create).not.toHaveBeenCalled();
  });
});
