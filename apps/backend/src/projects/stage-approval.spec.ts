import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { StageApprovalReminderScheduler } from '../notifications/stage-approval-reminder.scheduler';

function buildService() {
  const prisma: any = {
    stage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    project: { update: jest.fn() },
    notification: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
    contractor: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  };
  const wsService = {
    sendNotification: jest.fn().mockResolvedValue(undefined),
    emitStageCompletion: jest.fn(),
    emitProjectUpdate: jest.fn(),
    sendNotificationToUsers: jest.fn().mockResolvedValue(undefined),
    sendNotificationToRole: jest.fn().mockResolvedValue(undefined),
  };
  const emailService = { sendNotificationEmail: jest.fn().mockResolvedValue(true) };
  const service = new ProjectsService(
    wsService as any,
    {} as any,
    {} as any,
    { get: () => undefined } as any,
    { notifyManagedProjectUpdate: jest.fn().mockResolvedValue(undefined) } as any,
    emailService as any,
  );
  (service as any).prisma = prisma;
  return { service, prisma, emailService, wsService };
}

const project = {
  id: 'p1',
  name: 'House',
  homeownerId: 'home-1',
  generalContractorId: 'gc-1',
  progress: 0,
  status: 'active',
  homeowner: { id: 'home-1', email: 'h@example.com', fullName: 'Ada Home' },
  generalContractor: { id: 'gc-1', email: 'g@example.com', fullName: 'Chidi Build' },
};

describe('stage homeowner approval', () => {
  it('turns a GC completion request into pending approval and blocks missing evidence', async () => {
    const { service, prisma } = buildService();
    prisma.stage.findUnique.mockResolvedValue({
      id: 's1',
      projectId: 'p1',
      name: 'Roof',
      status: 'in_progress',
      project,
      teamMembers: [],
      materials: [],
      media: [],
      documents: [],
    });
    await expect(
      service.updateStageStatus('p1', 's1', 'completed', 'general_contractor'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.stage.update).not.toHaveBeenCalled();

    jest.spyOn(service as any, 'validateStageCompletion').mockResolvedValue(undefined);
    prisma.stage.update.mockResolvedValue({ id: 's1', status: 'pending_homeowner_approval' });
    const updated = await service.updateStageStatus('p1', 's1', 'completed', 'general_contractor');
    expect(updated.status).toBe('pending_homeowner_approval');
    expect(prisma.stage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'pending_homeowner_approval' }),
      }),
    );
  });

  it('lets only the homeowner approve a pending stage and completes the project on the last stage', async () => {
    const { service, prisma } = buildService();
    const charge = jest.spyOn(service as any, 'handleAutomaticStageChargeAndPayout');
    prisma.stage.findUnique.mockResolvedValue({
      id: 's1',
      projectId: 'p1',
      name: 'Roof',
      status: 'in_progress',
      project,
    });
    await expect(
      service.approveStage({ projectId: 'p1', stageId: 's1', approverId: 'home-1', method: 'homeowner_app' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.stage.findUnique.mockResolvedValue({
      id: 's1',
      projectId: 'p1',
      name: 'Roof',
      status: 'pending_homeowner_approval',
      project,
    });
    await expect(
      service.approveStage({ projectId: 'p1', stageId: 's1', approverId: 'other', method: 'homeowner_app' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    jest.spyOn(service as any, 'validateStageCompletion').mockResolvedValue(undefined);
    prisma.stage.findMany.mockResolvedValue([{ id: 's1', status: 'pending_homeowner_approval', estimatedCost: 10, order: 1 }]);
    prisma.stage.update.mockResolvedValue({ id: 's1', name: 'Roof', status: 'completed', project });
    prisma.project.update.mockResolvedValue({ id: 'p1', status: 'completed', progress: 100 });
    const approved = await service.approveStage({
      projectId: 'p1',
      stageId: 's1',
      approverId: 'home-1',
      method: 'homeowner_app',
    });
    expect(approved.status).toBe('completed');
    expect(prisma.stage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvedById: 'home-1',
          approvalMethod: 'homeowner_app',
          status: 'completed',
        }),
      }),
    );
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'completed', acceptedById: 'home-1' }),
      }),
    );
    expect(charge).not.toHaveBeenCalled();
  });

  it('still charges when a stage starts', async () => {
    const { service, prisma } = buildService();
    const charge = jest
      .spyOn(service as any, 'handleAutomaticStageChargeAndPayout')
      .mockResolvedValue(undefined);
    prisma.stage.findUnique.mockResolvedValue({
      id: 's1',
      projectId: 'p1',
      status: 'not_started',
      name: 'Roof',
      project,
      startDate: null,
    });
    prisma.stage.update.mockResolvedValue({ id: 's1', name: 'Roof', status: 'in_progress', project });
    prisma.stage.findMany.mockResolvedValue([{ id: 's1', status: 'in_progress', estimatedCost: 1, order: 1, name: 'Roof' }]);
    prisma.project.update.mockResolvedValue({ status: 'active' });
    await service.updateStageStatus('p1', 's1', 'in_progress');
    expect(charge).toHaveBeenCalledTimes(1);
  });

  it('requires a note for admin approval and records the method', async () => {
    const { service, prisma } = buildService();
    prisma.stage.findUnique.mockResolvedValue({
      id: 's1',
      projectId: 'p1',
      name: 'Roof',
      status: 'pending_homeowner_approval',
      project,
    });
    await expect(
      service.approveStage({ projectId: 'p1', stageId: 's1', approverId: 'admin-1', method: 'admin_on_behalf' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    jest.spyOn(service as any, 'validateStageCompletion').mockResolvedValue(undefined);
    prisma.stage.findMany.mockResolvedValue([
      { id: 's1', status: 'pending_homeowner_approval', estimatedCost: 1, order: 1 },
      { id: 's2', status: 'in_progress', estimatedCost: 1, order: 2 },
    ]);
    prisma.stage.update.mockResolvedValue({ id: 's1', name: 'Roof', status: 'completed', project });
    prisma.project.update.mockResolvedValue({ status: 'active' });
    await service.approveStage({
      projectId: 'p1',
      stageId: 's1',
      approverId: 'admin-1',
      method: 'admin_on_behalf',
      note: 'Confirmed on WhatsApp',
    });
    expect(prisma.stage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvalMethod: 'admin_on_behalf',
          approvalNote: 'Confirmed on WhatsApp',
          approvedById: 'admin-1',
        }),
      }),
    );
  });

  it('does not throw when the approval email fails', async () => {
    const { service, prisma, emailService } = buildService();
    emailService.sendNotificationEmail.mockRejectedValue(new Error('smtp down'));
    jest.spyOn(service as any, 'validateStageCompletion').mockResolvedValue(undefined);
    prisma.stage.findUnique.mockResolvedValue({
      id: 's1',
      projectId: 'p1',
      name: 'Roof',
      status: 'pending_homeowner_approval',
      project,
    });
    prisma.stage.findMany.mockResolvedValue([
      { id: 's1', status: 'pending_homeowner_approval', estimatedCost: 1, order: 1, name: 'Roof' },
      { id: 's2', status: 'not_started', estimatedCost: 1, order: 2, name: 'Paint' },
    ]);
    prisma.stage.update.mockResolvedValue({ id: 's1', name: 'Roof', status: 'completed', project });
    prisma.project.update.mockResolvedValue({ status: 'active' });
    await expect(
      service.approveStage({ projectId: 'p1', stageId: 's1', approverId: 'home-1', method: 'homeowner_app' }),
    ).resolves.toEqual(expect.objectContaining({ status: 'completed' }));
  });
});

describe('stage approval reminders', () => {
  it('skips a recent reminder and stops after seven', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const scheduler = new StageApprovalReminderScheduler(
      { stage: { findMany, update: jest.fn() }, notification: { create: jest.fn() } } as any,
      { sendNotificationEmail: jest.fn() } as any,
      { get: () => undefined } as any,
    );
    const now = new Date('2026-10-19T09:00:00Z');
    await scheduler.run(now);
    const where = findMany.mock.calls[0][0].where;
    expect(where.approvalReminderCount).toEqual({ lt: 7 });
    expect(where.submittedForApprovalAt).toEqual({ lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) });
    expect(where.OR[1].lastApprovalReminderAt.lte).toEqual(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  });
});
