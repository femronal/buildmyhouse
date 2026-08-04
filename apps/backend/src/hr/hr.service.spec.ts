import { ForbiddenException } from '@nestjs/common';
import { HrService } from './hr.service';

function createService(overrides?: {
  permissionKeys?: string[];
  isSuperAdmin?: boolean;
}) {
  const permissionKeys = overrides?.permissionKeys ?? ['*'];
  const isSuperAdmin = overrides?.isSuperAdmin ?? permissionKeys.includes('*');

  const prisma: any = {
    candidate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    candidateStageEvent: {
      create: jest.fn(),
    },
    staffProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    staffRoleAssignment: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    onboardingTask: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    hrDocument: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    policyAcknowledgement: {
      upsert: jest.fn(),
    },
    hrPolicy: {
      findUnique: jest.fn(),
    },
    hrCommunication: {
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === 'function') return arg(prisma);
      return Promise.all(arg);
    }),
  };

  const audit = {
    log: jest.fn().mockResolvedValue({}),
    list: jest.fn().mockResolvedValue([]),
  };

  const permissions = {
    getPermissionKeysForUser: jest.fn().mockResolvedValue({
      isSuperAdmin,
      permissions: permissionKeys,
    }),
    userHasPermission: jest.fn(async (_userId: string, required: string | string[]) => {
      if (isSuperAdmin || permissionKeys.includes('*')) return true;
      const needed = Array.isArray(required) ? required : [required];
      return needed.every((key) => permissionKeys.includes(key));
    }),
  };

  const email = {
    send: jest.fn().mockResolvedValue(true),
  };

  const service = new HrService(prisma as any, audit as any, permissions as any, email as any);
  return { service, prisma, audit, permissions, email };
}

describe('HrService', () => {
  it('creates a candidate and logs audit', async () => {
    const { service, prisma, audit } = createService();
    prisma.candidate.create.mockResolvedValue({
      id: 'cand-1',
      fullName: 'Ada Lovelace',
    });
    prisma.candidate.findUnique.mockResolvedValue({
      id: 'cand-1',
      fullName: 'Ada Lovelace',
      archivedAt: null,
      department: null,
      position: null,
      hiringManager: null,
      hiredStaff: null,
      stageEvents: [],
      documents: [],
      communications: [],
    });

    const result = await service.createCandidate('admin-1', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      stage: 'screening',
    });

    expect(prisma.candidate.create).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'candidate.created', entityId: 'cand-1' }),
    );
    expect(result.id).toBe('cand-1');
  });

  it('changes candidate stage and writes stage event', async () => {
    const { service, prisma, audit } = createService();
    prisma.candidate.findUnique.mockResolvedValue({
      id: 'cand-1',
      fullName: 'Ada Lovelace',
      stage: 'screening',
      archivedAt: null,
      department: null,
      position: null,
      hiringManager: null,
      hiredStaff: null,
      stageEvents: [],
      documents: [],
      communications: [],
    });
    prisma.candidate.update.mockResolvedValue({});
    prisma.candidateStageEvent.create.mockResolvedValue({});

    await service.changeCandidateStage('admin-1', 'cand-1', {
      stage: 'interview',
      note: 'Ready for interview',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'candidate.stage_changed',
        summary: expect.stringContaining('screening → interview'),
      }),
    );
  });

  it('hires a candidate into a staff profile with onboarding tasks', async () => {
    const { service, prisma, audit } = createService();
    prisma.candidate.findUnique
      .mockResolvedValueOnce({
        id: 'cand-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: null,
        location: null,
        departmentId: 'dept-1',
        positionId: 'pos-1',
        stage: 'offer',
        archivedAt: null,
        hiredStaff: null,
        department: null,
        position: null,
        hiringManager: null,
        stageEvents: [],
        documents: [],
        communications: [],
      })
      .mockResolvedValue(null);

    prisma.staffProfile.create.mockResolvedValue({ id: 'staff-1' });
    prisma.candidate.update.mockResolvedValue({});
    prisma.candidateStageEvent.create.mockResolvedValue({});
    prisma.staffProfile.findUnique.mockResolvedValue({
      id: 'staff-1',
      fullName: 'Ada Lovelace',
      archivedAt: null,
      baseCompensation: null,
      transportAllowance: null,
      communicationAllowance: null,
      otherAllowances: null,
      bonusNotes: null,
      paymentFrequency: null,
      department: null,
      position: null,
      manager: null,
      user: null,
      roleAssignments: [],
      onboardingTasks: [],
      documents: [],
      performanceGoals: [],
      performanceReviews: [],
      communications: [],
      candidate: null,
      policyAcks: [],
    });

    const hired = await service.hireCandidate('admin-1', 'cand-1', {
      workforceType: 'fixed_term',
    });

    expect(prisma.staffProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateId: 'cand-1',
          onboardingTasks: expect.objectContaining({ create: expect.any(Array) }),
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'person.hired', entityId: 'staff-1' }),
    );
    expect(hired.id).toBe('staff-1');
  });

  it('hides compensation without hr.compensation.view', async () => {
    const { service, prisma } = createService({
      isSuperAdmin: false,
      permissionKeys: ['hr.view'],
    });
    prisma.staffProfile.findUnique.mockResolvedValue({
      id: 'staff-1',
      fullName: 'Ada',
      archivedAt: null,
      baseCompensation: 500000,
      transportAllowance: 20000,
      communicationAllowance: 10000,
      otherAllowances: 0,
      bonusNotes: 'secret',
      paymentFrequency: 'monthly',
      department: null,
      position: null,
      manager: null,
      user: null,
      roleAssignments: [],
      onboardingTasks: [],
      documents: [],
      performanceGoals: [],
      performanceReviews: [],
      communications: [],
      candidate: null,
      policyAcks: [],
    });

    const person = await service.getStaffForActor('user-1', 'staff-1');
    expect((person as any).baseCompensation).toBeUndefined();
    expect((person as any).compensationRestricted).toBe(true);
  });

  it('rejects compensation updates without permission', async () => {
    const { service, prisma } = createService({
      isSuperAdmin: false,
      permissionKeys: ['hr.people.manage'],
    });
    prisma.staffProfile.findUnique.mockResolvedValue({
      id: 'staff-1',
      fullName: 'Ada',
      archivedAt: null,
      baseCompensation: null,
      transportAllowance: null,
      communicationAllowance: null,
      otherAllowances: null,
      bonusNotes: null,
      paymentFrequency: null,
      department: null,
      position: null,
      manager: null,
      user: null,
      roleAssignments: [],
      onboardingTasks: [],
      documents: [],
      performanceGoals: [],
      performanceReviews: [],
      communications: [],
      candidate: null,
      policyAcks: [],
    });
    prisma.staffProfile.findUniqueOrThrow.mockResolvedValue({
      id: 'staff-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
    });

    await expect(
      service.updateStaff('user-1', 'staff-1', {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        workforceType: 'employee',
        baseCompensation: 900000,
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('revokes permissions and disables account on offboard', async () => {
    const { service, prisma, audit } = createService();
    prisma.staffProfile.findUnique.mockResolvedValue({
      id: 'staff-1',
      fullName: 'Ada Lovelace',
      userId: 'user-9',
      archivedAt: null,
      baseCompensation: null,
      transportAllowance: null,
      communicationAllowance: null,
      otherAllowances: null,
      bonusNotes: null,
      paymentFrequency: null,
      department: null,
      position: null,
      manager: null,
      user: { id: 'user-9' },
      roleAssignments: [],
      onboardingTasks: [],
      documents: [],
      performanceGoals: [],
      performanceReviews: [],
      communications: [],
      candidate: null,
      policyAcks: [],
    });
    prisma.staffProfile.update.mockResolvedValue({});
    prisma.staffRoleAssignment.updateMany.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    await service.offboardStaff('admin-1', 'staff-1', {
      exitDate: new Date().toISOString(),
      disableAccount: true,
      revokePermissions: true,
    });

    expect(prisma.staffRoleAssignment.updateMany).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-9' },
        data: { adminDashboardAccess: false },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'person.exited' }),
    );
  });

  it('acknowledges a policy version for a staff member', async () => {
    const { service, prisma, audit } = createService();
    prisma.hrPolicy.findUnique.mockResolvedValue({
      id: 'pol-1',
      version: '1.0',
      appliesCompanyWide: true,
      departmentIds: [],
      positionIds: [],
      acknowledgements: [],
      createdBy: null,
      updatedBy: null,
    });
    prisma.staffProfile = {
      ...prisma.staffProfile,
      count: jest.fn().mockResolvedValue(2),
    };
    // getPolicy uses staffProfile.count
    const prismaAny = prisma as any;
    prismaAny.staffProfile.count = jest.fn().mockResolvedValue(2);
    prisma.policyAcknowledgement.upsert.mockResolvedValue({});

    await service.acknowledgePolicy('admin-1', 'pol-1', { staffProfileId: 'staff-1' });

    expect(prisma.policyAcknowledgement.upsert).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'policy.acknowledged' }),
    );
  });

  it('sends HR communication through email service and stores status', async () => {
    const { service, prisma, email, audit } = createService();
    prisma.hrCommunication.create.mockResolvedValue({
      id: 'comm-1',
      recipientEmail: 'ada@example.com',
    });
    prisma.hrCommunication.update.mockResolvedValue({
      id: 'comm-1',
      recipientEmail: 'ada@example.com',
      status: 'sent',
      subject: 'Interview invitation — BuildMyHouse',
    });

    const result = await service.sendCommunication('admin-1', {
      templateKey: 'interview_invitation',
      recipientEmail: 'ada@example.com',
      candidateId: 'cand-1',
      name: 'Ada',
      position: 'Partnership Development Executive',
    });

    expect(email.send).toHaveBeenCalled();
    expect(result.status).toBe('sent');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'hr.email_sent' }),
    );
  });
});
