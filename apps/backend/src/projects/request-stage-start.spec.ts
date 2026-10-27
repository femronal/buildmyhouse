import { ProjectsService } from './projects.service';

function buildService() {
  const prisma: any = {
    stage: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    project: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    payment: { create: jest.fn().mockResolvedValue({ id: 'pay-1' }) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
  };
  const wsService = {
    sendNotification: jest.fn().mockResolvedValue(undefined),
    sendNotificationToUsers: jest.fn().mockResolvedValue(undefined),
    sendNotificationToRole: jest.fn().mockResolvedValue(undefined),
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
  return { service, prisma, wsService };
}

const project = {
  id: 'p1',
  name: 'Washing Machine Repair',
  status: 'active',
  paymentModel: 'pay_by_stage',
  homeownerId: 'home-1',
  generalContractorId: 'gc-1',
  aiAnalysis: {},
  homeowner: { id: 'home-1', fullName: 'Ada Home' },
  generalContractor: { id: 'gc-1', fullName: 'Chidi Build' },
  projectRequests: [],
  payments: [{ status: 'completed', amount: 15000 }],
  stages: [
    { id: 's1', name: 'Inspection', status: 'completed', order: 1, depositDue: 10500, estimatedCost: 10500 },
    { id: 's2', name: 'Scope', status: 'completed', order: 2, depositDue: 4500, estimatedCost: 4500 },
    { id: 's3', name: 'Part Procurement', status: 'not_started', order: 3, depositDue: 7500, estimatedCost: 7500 },
  ],
};

describe('requestStageStart', () => {
  it('asks the homeowner to fund the stage and does not start it', async () => {
    const { service, prisma, wsService } = buildService();
    prisma.project.findUnique.mockResolvedValue(project);
    const start = jest.spyOn(service, 'updateStageStatus');

    const result = await service.requestStageStart('p1', 's3', { userId: 'gc-1', role: 'general_contractor' });

    expect(result.outcome).toBe('waiting_for_funding');
    expect(result.message).toBe('Waiting on homeowner to fund the stage.');
    expect(start).not.toHaveBeenCalled();
    expect(prisma.project.update).toHaveBeenCalled();
    expect(wsService.sendNotification).toHaveBeenCalledWith(
      'home-1',
      expect.objectContaining({
        type: 'stage_funding_requested',
        message: expect.stringContaining('₦7,500'),
      }),
    );
  });

  it('starts the stage once the deposit is already covered', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue({
      ...project,
      payments: [{ status: 'completed', amount: 22500 }],
    });
    const start = jest.spyOn(service, 'updateStageStatus').mockResolvedValue({ id: 's3', status: 'in_progress' } as any);

    const result = await service.requestStageStart('p1', 's3', { userId: 'gc-1', role: 'general_contractor' });

    expect(result.outcome).toBe('started');
    expect(start).toHaveBeenCalledWith('p1', 's3', 'in_progress', 'general_contractor');
  });

  it('records the stage payment when the receipt is confirmed', async () => {
    const { service, prisma, wsService } = buildService();
    const fundedProject = {
      ...project,
      payments: [{ status: 'completed', amount: 22500 }],
    };
    prisma.project.findUnique
      .mockResolvedValueOnce(project)
      .mockResolvedValueOnce(fundedProject)
      .mockResolvedValue(fundedProject);

    const result = await service.confirmStageFunding('p1', 's3');

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 7500,
        status: 'completed',
        method: 'manual',
        transactionId: 'stage-fund-s3',
        stageId: 's3',
      }),
    });
    expect(wsService.sendNotification).toHaveBeenCalledWith(
      'gc-1',
      expect.objectContaining({
        type: 'stage_funded',
        message: expect.stringContaining('You can start this step.'),
      }),
    );
    expect(result.stageStart?.funded).toBe(true);
  });

  it('records that the homeowner is ready without starting the stage', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue(project);
    const start = jest.spyOn(service, 'updateStageStatus');

    const result = await service.requestStageStart('p1', 's3', { userId: 'home-1', role: 'homeowner' });

    expect(result.outcome).toBe('waiting_for_confirmation');
    expect(result.message).toContain('Send ₦7,500');
    expect(start).not.toHaveBeenCalled();
  });
});
