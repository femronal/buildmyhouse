import { ProjectsService } from './projects.service';

function buildService() {
  const prisma: any = {
    stage: { findUnique: jest.fn() },
    contractor: { findUnique: jest.fn() },
    contractorPayout: { findMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (run: any) => run(prisma)),
  };
  const wsService = { emitProjectUpdate: jest.fn() };
  const service = new ProjectsService(
    wsService as any,
    {} as any,
    {} as any,
    { get: () => undefined } as any,
    { notifyManagedProjectUpdate: jest.fn() } as any,
    { sendNotificationEmail: jest.fn() } as any,
  );
  (service as any).prisma = prisma;
  return { service, prisma, wsService };
}

function stage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'stage-1',
    projectId: 'project-1',
    status: 'in_progress',
    approvedAt: null,
    estimatedCost: 100000,
    contractorPayouts: [],
    project: {
      id: 'project-1',
      generalContractorId: 'gc-user',
      generalContractor: { fullName: 'Fallback Name' },
    },
    ...overrides,
  };
}

const body = {
  projectId: 'project-1',
  stageId: 'stage-1',
  actorUserId: 'admin-1',
  amount: 25000,
  bankReference: 'FT2611230045',
  proofFileUrl: 'https://files.example/receipt.pdf',
  sentAt: '2026-11-22T12:00:00.000Z',
  bankAccountId: 'bank-1',
  earlyPaymentReason: 'GC needs cash for blocks',
};

describe('recordContractorPayout', () => {
  it('saves the reason for an unapproved stage and never returns the full account number', async () => {
    const { service, prisma, wsService } = buildService();
    prisma.stage.findUnique.mockResolvedValue(stage());
    prisma.contractor.findUnique.mockResolvedValue({
      id: 'contractor-1',
      name: 'Ade Builders',
      bankAccounts: [{ id: 'bank-1', bankName: 'GTBank', accountNumber: '0123456789' }],
    });
    prisma.contractorPayout.findMany.mockResolvedValue([]);
    prisma.contractorPayout.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'payout-1', ...data }));

    const saved = await service.recordContractorPayout(body);
    expect(saved.earlyPaymentReason).toBe('GC needs cash for blocks');
    expect(saved.gcName).toBe('Ade Builders');
    expect(saved.bankLabel).toBe('GTBank, account ending 6789');
    expect(saved.method).toBe('bank_transfer');
    expect(JSON.stringify(saved)).not.toContain('0123456789');
    expect(wsService.emitProjectUpdate).toHaveBeenCalledWith('project-1', {
      type: 'status_change',
      data: { event: 'contractor_payout_recorded', stageId: 'stage-1' },
    });
  });

  it('saves a null reason when the stage is already approved', async () => {
    const { service, prisma } = buildService();
    prisma.stage.findUnique.mockResolvedValue(stage({
      status: 'completed',
      approvedAt: new Date('2026-11-20T12:00:00.000Z'),
    }));
    prisma.contractor.findUnique.mockResolvedValue({
      id: 'contractor-1',
      name: 'Ade Builders',
      bankAccounts: [{ id: 'bank-1', bankName: 'GTBank', accountNumber: '0123456789' }],
    });
    prisma.contractorPayout.findMany.mockResolvedValue([]);
    prisma.contractorPayout.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'payout-2', ...data }));

    const saved = await service.recordContractorPayout({
      ...body,
      earlyPaymentReason: 'This reason should not be stored',
    });
    expect(saved.earlyPaymentReason).toBeNull();
    expect(JSON.stringify(saved)).not.toContain('0123456789');
  });
});
