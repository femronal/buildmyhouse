import { ProjectsService } from './projects.service';

function buildService() {
  const tx: any = {
    project: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({ status: 'active', paymentConfirmationStatus: 'confirmed' }) },
    payment: { create: jest.fn().mockResolvedValue({ id: 'pay-1' }), update: jest.fn(), delete: jest.fn() },
    stage: { update: jest.fn() },
  };
  const prisma: any = {
    project: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', name: 'Lekki duplex', homeownerId: 'home-1', generalContractorId: 'gc-1' }) },
    payment: { create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (fn: (client: any) => Promise<unknown>) => fn(tx)),
  };
  const wsService = {
    emitProjectUpdate: jest.fn(),
    sendNotificationToUsers: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ProjectsService(
    wsService as any,
    {} as any,
    {} as any,
    { get: () => undefined } as any,
    { notifyManagedProjectUpdate: jest.fn() } as any,
    { sendNotificationEmail: jest.fn() } as any,
  );
  (service as any).prisma = prisma;
  jest.spyOn(service as any, 'notifyIfStageJustFunded').mockResolvedValue(undefined);
  return { service, prisma, tx };
}

describe('who confirmed a payment', () => {
  it('confirming a manual payment records which admin confirmed it', async () => {
    const { service, tx } = buildService();
    tx.project.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Lekki duplex',
      homeownerId: 'home-1',
      status: 'active',
      paymentModel: 'pay_in_full',
      paymentConfirmationStatus: 'declared',
      stages: [],
      payments: [],
      projectRequests: [],
      aiAnalysis: {},
    });

    await service.confirmManualPayment({ projectId: 'p1', amount: 15000, actorUserId: 'admin-9' });

    expect(tx.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ confirmedById: 'admin-9', amount: 15000, status: 'completed' }),
    });
  });

  it('a homeowner choosing a payment model does not set confirmedBy', async () => {
    const { service, prisma, tx } = buildService();
    prisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Lekki duplex',
      homeownerId: 'home-1',
      status: 'draft',
      paymentModel: null,
      paymentConfirmationStatus: 'not_declared',
      stages: [],
      payments: [],
      aiAnalysis: {},
      budget: 10000,
    });

    await service.setPaymentModel({
      projectId: 'p1',
      actorUserId: 'home-1',
      actorRole: 'homeowner',
      paymentModel: 'pay_in_full',
    });

    expect(tx.payment.create).not.toHaveBeenCalled();
    expect(tx.payment.update).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
