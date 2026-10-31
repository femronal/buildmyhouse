import { ProjectsService } from './projects.service';

function buildService() {
  const prisma: any = {
    stage: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    stageMaterial: { create: jest.fn() },
    stageTeamMember: { create: jest.fn() },
    project: {
      update: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn(),
    },
    notification: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
    contractor: {
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  };
  const service = new ProjectsService(
    { sendNotification: jest.fn(), emitStageCompletion: jest.fn(), emitProjectUpdate: jest.fn() } as any,
    {} as any,
    {} as any,
    { get: () => undefined } as any,
    { notifyManagedProjectUpdate: jest.fn() } as any,
    { sendNotificationEmail: jest.fn() } as any,
  );
  (service as any).prisma = prisma;
  return { service, prisma };
}

describe('contractor project recount', () => {
  it('writes the number of finished projects after the last stage is approved', async () => {
    const { service, prisma } = buildService();
    const project = {
      id: 'p1',
      name: 'House',
      homeownerId: 'home-1',
      generalContractorId: 'gc-1',
      progress: 0,
      status: 'active',
      homeowner: { id: 'home-1', email: 'h@example.com', fullName: 'Ada' },
      generalContractor: { id: 'gc-1', email: 'g@example.com', fullName: 'Chidi' },
    };
    jest.spyOn(service as any, 'validateStageCompletion').mockResolvedValue(undefined);
    prisma.stage.findUnique.mockResolvedValue({
      id: 's1',
      projectId: 'p1',
      name: 'Roof',
      status: 'pending_homeowner_approval',
      project,
    });
    prisma.stage.findMany.mockResolvedValue([
      { id: 's1', status: 'pending_homeowner_approval', estimatedCost: 10, order: 1 },
    ]);
    prisma.stage.update.mockResolvedValue({ id: 's1', name: 'Roof', status: 'completed', project });
    prisma.project.update.mockResolvedValue({ id: 'p1', status: 'completed', progress: 100 });
    prisma.project.count.mockResolvedValue(1);

    await service.approveStage({
      projectId: 'p1',
      stageId: 's1',
      approverId: 'home-1',
      method: 'homeowner_app',
    });

    expect(prisma.contractor.updateMany).toHaveBeenCalledWith({
      where: { userId: 'gc-1' },
      data: { projects: 1 },
    });
  });

  it('returns the same count when recount runs twice', async () => {
    const { service, prisma } = buildService();
    prisma.project.count.mockResolvedValue(2);
    await service.recountContractorProjects('gc-1');
    await service.recountContractorProjects('gc-1');
    expect(prisma.contractor.updateMany).toHaveBeenNthCalledWith(1, {
      where: { userId: 'gc-1' },
      data: { projects: 2 },
    });
    expect(prisma.contractor.updateMany).toHaveBeenNthCalledWith(2, {
      where: { userId: 'gc-1' },
      data: { projects: 2 },
    });
  });

  it('lowers the count when a finished project is no longer finished', async () => {
    const { service, prisma } = buildService();
    prisma.project.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await service.recountContractorProjects('gc-1');
    await service.recountContractorProjects('gc-1');
    expect(prisma.contractor.updateMany.mock.calls[1][0].data.projects).toBe(0);
  });

  it('does nothing harmful when the GC has no contractor row', async () => {
    const { service, prisma } = buildService();
    prisma.project.count.mockResolvedValue(3);
    prisma.contractor.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.recountContractorProjects('gc-1')).resolves.toBeUndefined();
  });
});
