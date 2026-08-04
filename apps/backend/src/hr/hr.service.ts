import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { HrAuditService } from './hr-audit.service';
import { HrPermissionsService } from './permissions/hr-permissions.service';
import {
  CANDIDATE_STAGES,
  HR_EMAIL_TEMPLATES,
  ONBOARDING_TASK_TEMPLATES,
} from './permissions/permission-catalog';
import {
  AcknowledgePolicyDto,
  AssignStaffRoleDto,
  ChangeCandidateStageDto,
  CreateCandidateDto,
  CreateDepartmentDto,
  CreateDocumentDto,
  CreatePerformanceGoalDto,
  CreatePolicyDto,
  CreatePositionDto,
  CreateStaffDto,
  CreateStaffLoginDto,
  HireCandidateDto,
  OffboardStaffDto,
  SendHrCommunicationDto,
  UpdateCandidateDto,
  UpdateDepartmentDto,
  UpdateOnboardingTaskDto,
  UpdatePerformanceGoalDto,
  UpdatePolicyDto,
  UpdatePositionDto,
  UpdateStaffDto,
  UpsertAdminRoleDto,
} from './dto/hr.dto';

const STAFF_INCLUDE = {
  department: true,
  position: true,
  manager: { select: { id: true, fullName: true, email: true } },
  user: { select: { id: true, email: true, adminDashboardAccess: true, role: true } },
  roleAssignments: {
    where: { revokedAt: null },
    include: { role: { select: { id: true, key: true, name: true } } },
  },
  onboardingTasks: { orderBy: { sortOrder: 'asc' as const } },
} as const;

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: HrAuditService,
    private readonly permissions: HrPermissionsService,
    private readonly email: EmailService,
  ) {}

  // ---------------------------------------------------------------------------
  // Me / dashboard
  // ---------------------------------------------------------------------------

  async getMyPermissions(userId: string) {
    return this.permissions.getPermissionKeysForUser(userId);
  }

  async getDashboard(actorUserId: string) {
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [
      activeStaff,
      activeConsultants,
      candidatesOpen,
      awaitingInterview,
      onProbation,
      contractsExpiring,
      missingDocsStaff,
      pendingReviews,
      openRoles,
      pipeline,
      recentActivity,
    ] = await Promise.all([
      this.prisma.staffProfile.count({
        where: { archivedAt: null, employmentStatus: { in: ['active', 'probation', 'onboarding'] } },
      }),
      this.prisma.staffProfile.count({
        where: {
          archivedAt: null,
          workforceType: { in: ['consultant', 'independent_contractor', 'freelancer'] },
          employmentStatus: { in: ['active', 'probation', 'onboarding'] },
        },
      }),
      this.prisma.candidate.count({
        where: {
          archivedAt: null,
          stage: { notIn: ['hired', 'rejected', 'withdrawn'] },
        },
      }),
      this.prisma.candidate.count({
        where: { archivedAt: null, stage: 'interview' },
      }),
      this.prisma.staffProfile.count({
        where: { archivedAt: null, employmentStatus: 'probation' },
      }),
      this.prisma.hrDocument.count({
        where: {
          archivedAt: null,
          expiryDate: { gte: now, lte: in14Days },
          category: { in: ['employment_contract', 'consultancy_agreement', 'nda'] },
        },
      }),
      this.prisma.staffProfile.count({
        where: {
          archivedAt: null,
          employmentStatus: { in: ['active', 'probation', 'onboarding'] },
          documents: { none: { category: 'employment_contract', archivedAt: null } },
        },
      }),
      this.prisma.onboardingTask.count({
        where: { status: 'pending', staffProfile: { employmentStatus: 'onboarding' } },
      }),
      this.prisma.position.count({ where: { active: true } }),
      this.prisma.candidate.groupBy({
        by: ['stage'],
        where: { archivedAt: null },
        _count: { _all: true },
      }),
      this.audit.list({ limit: 15 }),
    ]);

    const stageOrder = CANDIDATE_STAGES.filter(
      (s) => !['rejected', 'withdrawn'].includes(s),
    );
    const pipelineSummary = stageOrder.map((stage) => ({
      stage,
      count: pipeline.find((p) => p.stage === stage)?._count._all ?? 0,
    }));

    const alerts: Array<{ type: string; message: string }> = [];
    if (contractsExpiring > 0) {
      alerts.push({
        type: 'contract_expiry',
        message: `${contractsExpiring} contract(s)/agreement(s) expire within 14 days`,
      });
    }
    if (onProbation > 0) {
      alerts.push({
        type: 'probation',
        message: `${onProbation} person(s) currently on probation`,
      });
    }
    const noDepartment = await this.prisma.staffProfile.count({
      where: {
        archivedAt: null,
        departmentId: null,
        employmentStatus: { not: 'exited' },
      },
    });
    if (noDepartment > 0) {
      alerts.push({
        type: 'missing_department',
        message: `${noDepartment} staff member(s) have no department`,
      });
    }
    if (missingDocsStaff > 0) {
      alerts.push({
        type: 'missing_documents',
        message: `${missingDocsStaff} active staff missing an employment contract`,
      });
    }

    void actorUserId;
    return {
      cards: {
        activeStaff,
        activeConsultants,
        candidatesInRecruitment: candidatesOpen,
        candidatesAwaitingInterview: awaitingInterview,
        peopleOnProbation: onProbation,
        contractsExpiringSoon: contractsExpiring,
        missingDocuments: missingDocsStaff,
        pendingReviews,
        openRoles,
      },
      pipelineSummary,
      recentActivity,
      alerts,
    };
  }

  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------

  listDepartments() {
    return this.prisma.department.findMany({
      where: { archivedAt: null },
      include: {
        head: { select: { id: true, fullName: true, email: true } },
        _count: { select: { staff: true, positions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(actorUserId: string, dto: CreateDepartmentDto) {
    const dept = await this.prisma.department.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        headUserId: dto.headUserId,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'department.created',
      entityType: 'department',
      entityId: dept.id,
      summary: `Created department ${dept.name}`,
    });
    return dept;
  }

  async updateDepartment(actorUserId: string, id: string, dto: UpdateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Department not found');
    const dept = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.headUserId !== undefined ? { headUserId: dto.headUserId } : {}),
        ...(dto.archive ? { archivedAt: new Date() } : {}),
      },
    });
    await this.audit.log({
      actorUserId,
      action: dto.archive ? 'department.archived' : 'department.updated',
      entityType: 'department',
      entityId: id,
      summary: dto.archive ? `Archived department ${dept.name}` : `Updated department ${dept.name}`,
    });
    return dept;
  }

  listPositions() {
    return this.prisma.position.findMany({
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { staff: true, candidates: true } },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async createPosition(actorUserId: string, dto: CreatePositionDto) {
    const position = await this.prisma.position.create({
      data: {
        departmentId: dto.departmentId,
        name: dto.name.trim(),
        description: dto.description,
        purpose: dto.purpose,
        responsibilities: dto.responsibilities || [],
        requiredSkills: dto.requiredSkills || [],
        reportsToPositionId: dto.reportsToPositionId,
        allowedWorkforceTypes: dto.allowedWorkforceTypes || [],
        kpiDefinitions: (dto.kpiDefinitions as Prisma.InputJsonValue) ?? undefined,
        compensationMin: dto.compensationMin,
        compensationMax: dto.compensationMax,
        currencyCode: dto.currencyCode || 'NGN',
        active: dto.active ?? true,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'position.created',
      entityType: 'position',
      entityId: position.id,
      summary: `Created position ${position.name}`,
    });
    return position;
  }

  async updatePosition(actorUserId: string, id: string, dto: UpdatePositionDto) {
    const existing = await this.prisma.position.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Position not found');
    const position = await this.prisma.position.update({
      where: { id },
      data: {
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.purpose !== undefined ? { purpose: dto.purpose } : {}),
        ...(dto.responsibilities !== undefined
          ? { responsibilities: dto.responsibilities }
          : {}),
        ...(dto.requiredSkills !== undefined ? { requiredSkills: dto.requiredSkills } : {}),
        ...(dto.reportsToPositionId !== undefined
          ? { reportsToPositionId: dto.reportsToPositionId }
          : {}),
        ...(dto.allowedWorkforceTypes !== undefined
          ? { allowedWorkforceTypes: dto.allowedWorkforceTypes }
          : {}),
        ...(dto.kpiDefinitions !== undefined
          ? { kpiDefinitions: dto.kpiDefinitions as Prisma.InputJsonValue }
          : {}),
        ...(dto.compensationMin !== undefined ? { compensationMin: dto.compensationMin } : {}),
        ...(dto.compensationMax !== undefined ? { compensationMax: dto.compensationMax } : {}),
        ...(dto.currencyCode !== undefined ? { currencyCode: dto.currencyCode } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'position.updated',
      entityType: 'position',
      entityId: id,
      summary: `Updated position ${position.name}`,
    });
    return position;
  }

  // ---------------------------------------------------------------------------
  // Candidates
  // ---------------------------------------------------------------------------

  listCandidates(stage?: string) {
    return this.prisma.candidate.findMany({
      where: {
        archivedAt: null,
        ...(stage ? { stage } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        hiringManager: { select: { id: true, fullName: true, email: true } },
        hiredStaff: { select: { id: true } },
        _count: { select: { stageEvents: true, communications: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getCandidate(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        hiringManager: { select: { id: true, fullName: true, email: true } },
        hiredStaff: { select: { id: true, fullName: true, employmentStatus: true } },
        stageEvents: { orderBy: { createdAt: 'desc' } },
        documents: { where: { archivedAt: null }, orderBy: { createdAt: 'desc' } },
        communications: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!candidate || candidate.archivedAt) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async createCandidate(actorUserId: string, dto: CreateCandidateDto) {
    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim();
    const stage = dto.stage || 'applied';
    if (!CANDIDATE_STAGES.includes(stage as any)) {
      throw new BadRequestException('Invalid stage');
    }
    const candidate = await this.prisma.candidate.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        fullName,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone,
        location: dto.location,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        cvUrl: dto.cvUrl,
        source: dto.source,
        stage,
        hiringManagerUserId: dto.hiringManagerUserId,
        internalNotes: dto.internalNotes,
        stageEvents: {
          create: {
            fromStage: null,
            toStage: stage,
            note: 'Candidate created',
            actorUserId,
          },
        },
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'candidate.created',
      entityType: 'candidate',
      entityId: candidate.id,
      summary: `Created candidate ${fullName}`,
    });
    return this.getCandidate(candidate.id);
  }

  async updateCandidate(actorUserId: string, id: string, dto: UpdateCandidateDto) {
    await this.getCandidate(id);
    const fullName =
      dto.firstName || dto.lastName
        ? undefined
        : undefined;
    const existing = await this.prisma.candidate.findUniqueOrThrow({ where: { id } });
    const nextFirst = dto.firstName?.trim() ?? existing.firstName;
    const nextLast = dto.lastName?.trim() ?? existing.lastName;
    const candidate = await this.prisma.candidate.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: nextFirst } : {}),
        ...(dto.lastName !== undefined ? { lastName: nextLast } : {}),
        ...((dto.firstName !== undefined || dto.lastName !== undefined)
          ? { fullName: `${nextFirst} ${nextLast}`.trim() }
          : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
        ...(dto.positionId !== undefined ? { positionId: dto.positionId } : {}),
        ...(dto.cvUrl !== undefined ? { cvUrl: dto.cvUrl } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.hiringManagerUserId !== undefined
          ? { hiringManagerUserId: dto.hiringManagerUserId }
          : {}),
        ...(dto.interviewDate !== undefined
          ? { interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : null }
          : {}),
        ...(dto.interviewNotes !== undefined ? { interviewNotes: dto.interviewNotes } : {}),
        ...(dto.interviewScore !== undefined ? { interviewScore: dto.interviewScore } : {}),
        ...(dto.assessmentInstructions !== undefined
          ? { assessmentInstructions: dto.assessmentInstructions }
          : {}),
        ...(dto.assessmentSubmission !== undefined
          ? { assessmentSubmission: dto.assessmentSubmission }
          : {}),
        ...(dto.assessmentScore !== undefined ? { assessmentScore: dto.assessmentScore } : {}),
        ...(dto.pilotNotes !== undefined ? { pilotNotes: dto.pilotNotes } : {}),
        ...(dto.referencesJson !== undefined
          ? { referencesJson: dto.referencesJson as Prisma.InputJsonValue }
          : {}),
        ...(dto.referenceCheckNotes !== undefined
          ? { referenceCheckNotes: dto.referenceCheckNotes }
          : {}),
        ...(dto.offerDetails !== undefined ? { offerDetails: dto.offerDetails } : {}),
        ...(dto.rejectionReason !== undefined ? { rejectionReason: dto.rejectionReason } : {}),
        ...(dto.internalNotes !== undefined ? { internalNotes: dto.internalNotes } : {}),
      },
    });
    void fullName;
    await this.audit.log({
      actorUserId,
      action: 'candidate.updated',
      entityType: 'candidate',
      entityId: id,
      summary: `Updated candidate ${candidate.fullName}`,
    });
    return this.getCandidate(id);
  }

  async changeCandidateStage(
    actorUserId: string,
    id: string,
    dto: ChangeCandidateStageDto,
  ) {
    const candidate = await this.getCandidate(id);
    if (!CANDIDATE_STAGES.includes(dto.stage as any)) {
      throw new BadRequestException('Invalid stage');
    }
    if (candidate.stage === dto.stage) return candidate;

    await this.prisma.$transaction([
      this.prisma.candidate.update({
        where: { id },
        data: {
          stage: dto.stage,
          ...(dto.stage === 'rejected' && dto.note ? { rejectionReason: dto.note } : {}),
        },
      }),
      this.prisma.candidateStageEvent.create({
        data: {
          candidateId: id,
          fromStage: candidate.stage,
          toStage: dto.stage,
          note: dto.note,
          actorUserId,
        },
      }),
    ]);

    await this.audit.log({
      actorUserId,
      action: dto.stage === 'rejected' ? 'candidate.rejected' : 'candidate.stage_changed',
      entityType: 'candidate',
      entityId: id,
      summary: `${candidate.fullName}: ${candidate.stage} → ${dto.stage}`,
      metadata: { fromStage: candidate.stage, toStage: dto.stage },
    });
    return this.getCandidate(id);
  }

  async hireCandidate(actorUserId: string, id: string, dto: HireCandidateDto) {
    const candidate = await this.getCandidate(id);
    if (candidate.hiredStaff) {
      throw new BadRequestException('Candidate already hired');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const probationEndDate = dto.probationEndDate ? new Date(dto.probationEndDate) : null;

    const result = await this.prisma.$transaction(async (tx) => {
      const staff = await tx.staffProfile.create({
        data: {
          candidateId: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone,
          location: candidate.location,
          workforceType: dto.workforceType,
          departmentId: candidate.departmentId,
          positionId: candidate.positionId,
          managerUserId: dto.managerUserId,
          startDate,
          probationEndDate,
          employmentStatus: probationEndDate ? 'probation' : 'onboarding',
          baseCompensation: dto.baseCompensation,
          paymentFrequency: dto.paymentFrequency,
          onboardingTasks: {
            create: ONBOARDING_TASK_TEMPLATES.map((task, index) => ({
              key: task.key,
              title: task.title,
              sortOrder: index,
              status:
                (task.key === 'department_assigned' && candidate.departmentId) ||
                (task.key === 'position_assigned' && candidate.positionId) ||
                (task.key === 'manager_assigned' && dto.managerUserId)
                  ? 'completed'
                  : 'pending',
              completedAt:
                (task.key === 'department_assigned' && candidate.departmentId) ||
                (task.key === 'position_assigned' && candidate.positionId) ||
                (task.key === 'manager_assigned' && dto.managerUserId)
                  ? new Date()
                  : null,
              completedByUserId:
                (task.key === 'department_assigned' && candidate.departmentId) ||
                (task.key === 'position_assigned' && candidate.positionId) ||
                (task.key === 'manager_assigned' && dto.managerUserId)
                  ? actorUserId
                  : null,
            })),
          },
        },
      });

      await tx.candidate.update({
        where: { id },
        data: { stage: 'hired' },
      });
      await tx.candidateStageEvent.create({
        data: {
          candidateId: id,
          fromStage: candidate.stage,
          toStage: 'hired',
          note: 'Hired — staff profile created',
          actorUserId,
        },
      });

      let userId: string | null = null;
      if (dto.createLogin) {
        if (!dto.temporaryPassword) {
          throw new BadRequestException('temporaryPassword is required when createLogin is true');
        }
        const existingUser = await tx.user.findUnique({ where: { email: candidate.email } });
        if (existingUser) {
          userId = existingUser.id;
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              role: 'admin',
              adminDashboardAccess: dto.enableDashboardAccess === true,
            },
          });
        } else {
          const password = await bcrypt.hash(dto.temporaryPassword, 10);
          const user = await tx.user.create({
            data: {
              email: candidate.email,
              password,
              fullName: candidate.fullName,
              phone: candidate.phone,
              role: 'admin',
              verified: true,
              adminDashboardAccess: dto.enableDashboardAccess === true,
            },
          });
          userId = user.id;
        }
        await tx.staffProfile.update({
          where: { id: staff.id },
          data: { userId },
        });
        await tx.onboardingTask.updateMany({
          where: { staffProfileId: staff.id, key: 'company_account_created' },
          data: {
            status: 'completed',
            completedAt: new Date(),
            completedByUserId: actorUserId,
          },
        });
        if (dto.adminRoleId) {
          await tx.staffRoleAssignment.create({
            data: {
              staffProfileId: staff.id,
              roleId: dto.adminRoleId,
              grantedByUserId: actorUserId,
            },
          });
          await tx.onboardingTask.updateMany({
            where: { staffProfileId: staff.id, key: 'permissions_approved' },
            data: {
              status: 'completed',
              completedAt: new Date(),
              completedByUserId: actorUserId,
            },
          });
        }
      }

      return staff.id;
    });

    await this.audit.log({
      actorUserId,
      action: 'person.hired',
      entityType: 'staff',
      entityId: result,
      summary: `Hired ${candidate.fullName} from candidate pipeline`,
      metadata: { candidateId: id, createLogin: !!dto.createLogin },
    });

    return this.getStaff(result, true);
  }

  // ---------------------------------------------------------------------------
  // People
  // ---------------------------------------------------------------------------

  private stripCompensation<T extends Record<string, any>>(person: T, canView: boolean): T {
    if (canView) return person;
    const {
      baseCompensation: _b,
      transportAllowance: _t,
      communicationAllowance: _c,
      otherAllowances: _o,
      bonusNotes: _bn,
      paymentFrequency: _pf,
      ...rest
    } = person;
    return {
      ...rest,
      compensationRestricted: true,
    } as unknown as T;
  }

  async listPeople(actorUserId: string, query?: string) {
    const canViewComp = await this.permissions.userHasPermission(
      actorUserId,
      'hr.compensation.view',
    );
    const people = await this.prisma.staffProfile.findMany({
      where: {
        archivedAt: null,
        ...(query
          ? {
              OR: [
                { fullName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        manager: { select: { id: true, fullName: true } },
        user: { select: { id: true, adminDashboardAccess: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    return people.map((p) => this.stripCompensation(p, canViewComp));
  }

  async getStaff(id: string, includeCompensation: boolean) {
    const person = await this.prisma.staffProfile.findUnique({
      where: { id },
      include: {
        ...STAFF_INCLUDE,
        documents: { where: { archivedAt: null }, orderBy: { createdAt: 'desc' } },
        performanceGoals: { orderBy: { createdAt: 'desc' } },
        performanceReviews: { orderBy: { reviewedAt: 'desc' } },
        communications: { orderBy: { createdAt: 'desc' }, take: 50 },
        candidate: { select: { id: true, stage: true, fullName: true } },
        policyAcks: { include: { policy: { select: { id: true, title: true, version: true } } } },
      },
    });
    if (!person || person.archivedAt) throw new NotFoundException('Staff profile not found');
    return this.stripCompensation(person, includeCompensation);
  }

  async getStaffForActor(actorUserId: string, id: string) {
    const canViewComp = await this.permissions.userHasPermission(
      actorUserId,
      'hr.compensation.view',
    );
    return this.getStaff(id, canViewComp);
  }

  async createStaff(actorUserId: string, dto: CreateStaffDto) {
    const canViewComp = await this.permissions.userHasPermission(
      actorUserId,
      'hr.compensation.view',
    );
    if (
      !canViewComp &&
      (dto.baseCompensation != null ||
        dto.transportAllowance != null ||
        dto.communicationAllowance != null ||
        dto.otherAllowances != null)
    ) {
      throw new ForbiddenException('Missing permission: hr.compensation.view');
    }

    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim();
    const staff = await this.prisma.staffProfile.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        fullName,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone,
        pictureUrl: dto.pictureUrl,
        address: dto.address,
        location: dto.location,
        emergencyContact: dto.emergencyContact,
        emergencyPhone: dto.emergencyPhone,
        workforceType: dto.workforceType,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        managerUserId: dto.managerUserId,
        workLocation: dto.workLocation,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : null,
        employmentStatus: dto.employmentStatus || 'onboarding',
        baseCompensation: dto.baseCompensation,
        transportAllowance: dto.transportAllowance,
        communicationAllowance: dto.communicationAllowance,
        otherAllowances: dto.otherAllowances,
        bonusNotes: dto.bonusNotes,
        paymentFrequency: dto.paymentFrequency,
        currencyCode: dto.currencyCode || 'NGN',
        notes: dto.notes,
        onboardingTasks: {
          create: ONBOARDING_TASK_TEMPLATES.map((task, index) => ({
            key: task.key,
            title: task.title,
            sortOrder: index,
          })),
        },
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'person.created',
      entityType: 'staff',
      entityId: staff.id,
      summary: `Added staff member ${fullName}`,
    });
    return this.getStaff(staff.id, canViewComp);
  }

  async updateStaff(actorUserId: string, id: string, dto: UpdateStaffDto) {
    await this.getStaff(id, true);
    const canViewComp = await this.permissions.userHasPermission(
      actorUserId,
      'hr.compensation.view',
    );
    const touchingComp =
      dto.baseCompensation !== undefined ||
      dto.transportAllowance !== undefined ||
      dto.communicationAllowance !== undefined ||
      dto.otherAllowances !== undefined ||
      dto.bonusNotes !== undefined ||
      dto.paymentFrequency !== undefined;
    if (touchingComp && !canViewComp) {
      throw new ForbiddenException('Missing permission: hr.compensation.view');
    }

    const existing = await this.prisma.staffProfile.findUniqueOrThrow({ where: { id } });
    const nextFirst = dto.firstName?.trim() ?? existing.firstName;
    const nextLast = dto.lastName?.trim() ?? existing.lastName;

    await this.prisma.staffProfile.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: nextFirst } : {}),
        ...(dto.lastName !== undefined ? { lastName: nextLast } : {}),
        ...((dto.firstName !== undefined || dto.lastName !== undefined)
          ? { fullName: `${nextFirst} ${nextLast}`.trim() }
          : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.pictureUrl !== undefined ? { pictureUrl: dto.pictureUrl } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.emergencyContact !== undefined
          ? { emergencyContact: dto.emergencyContact }
          : {}),
        ...(dto.emergencyPhone !== undefined ? { emergencyPhone: dto.emergencyPhone } : {}),
        ...(dto.workforceType !== undefined ? { workforceType: dto.workforceType } : {}),
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
        ...(dto.positionId !== undefined ? { positionId: dto.positionId } : {}),
        ...(dto.managerUserId !== undefined ? { managerUserId: dto.managerUserId } : {}),
        ...(dto.workLocation !== undefined ? { workLocation: dto.workLocation } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
        ...(dto.probationEndDate !== undefined
          ? { probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : null }
          : {}),
        ...(dto.employmentStatus !== undefined
          ? { employmentStatus: dto.employmentStatus }
          : {}),
        ...(dto.baseCompensation !== undefined
          ? { baseCompensation: dto.baseCompensation }
          : {}),
        ...(dto.transportAllowance !== undefined
          ? { transportAllowance: dto.transportAllowance }
          : {}),
        ...(dto.communicationAllowance !== undefined
          ? { communicationAllowance: dto.communicationAllowance }
          : {}),
        ...(dto.otherAllowances !== undefined ? { otherAllowances: dto.otherAllowances } : {}),
        ...(dto.bonusNotes !== undefined ? { bonusNotes: dto.bonusNotes } : {}),
        ...(dto.paymentFrequency !== undefined
          ? { paymentFrequency: dto.paymentFrequency }
          : {}),
        ...(dto.currencyCode !== undefined ? { currencyCode: dto.currencyCode } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    if (touchingComp) {
      await this.audit.log({
        actorUserId,
        action: 'compensation.changed',
        entityType: 'staff',
        entityId: id,
        summary: 'Compensation fields updated',
      });
    } else {
      await this.audit.log({
        actorUserId,
        action: 'person.updated',
        entityType: 'staff',
        entityId: id,
        summary: `Updated staff ${existing.fullName}`,
      });
    }

    return this.getStaff(id, canViewComp);
  }

  async updateOnboardingTask(
    actorUserId: string,
    staffId: string,
    taskId: string,
    dto: UpdateOnboardingTaskDto,
  ) {
    const task = await this.prisma.onboardingTask.findFirst({
      where: { id: taskId, staffProfileId: staffId },
    });
    if (!task) throw new NotFoundException('Onboarding task not found');
    await this.prisma.onboardingTask.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        completedAt: dto.status === 'pending' ? null : new Date(),
        completedByUserId: dto.status === 'pending' ? null : actorUserId,
      },
    });
    return this.getStaffForActor(actorUserId, staffId);
  }

  async offboardStaff(actorUserId: string, id: string, dto: OffboardStaffDto) {
    const person = await this.getStaff(id, true);
    await this.prisma.$transaction(async (tx) => {
      await tx.staffProfile.update({
        where: { id },
        data: {
          employmentStatus: 'exited',
          exitDate: new Date(dto.exitDate),
          exitReason: dto.exitReason,
          finalHandoverNotes: dto.finalHandoverNotes,
          companyPropertyReturned: dto.companyPropertyReturned ?? false,
          exitNotes: dto.exitNotes,
          endDate: new Date(dto.exitDate),
          accountDisabledAt: dto.disableAccount !== false ? new Date() : null,
          permissionsRevokedAt: dto.revokePermissions !== false ? new Date() : null,
          documentsArchivedAt: dto.archiveDocuments ? new Date() : null,
        },
      });

      if (dto.revokePermissions !== false) {
        await tx.staffRoleAssignment.updateMany({
          where: { staffProfileId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      if (dto.disableAccount !== false && person.userId) {
        await tx.user.update({
          where: { id: person.userId },
          data: { adminDashboardAccess: false },
        });
      }

      if (dto.archiveDocuments) {
        await tx.hrDocument.updateMany({
          where: { staffProfileId: id, archivedAt: null },
          data: { archivedAt: new Date() },
        });
      }
    });

    await this.audit.log({
      actorUserId,
      action: 'person.exited',
      entityType: 'staff',
      entityId: id,
      summary: `Offboarded ${person.fullName}`,
      metadata: {
        disableAccount: dto.disableAccount !== false,
        revokePermissions: dto.revokePermissions !== false,
      },
    });

    return this.getStaffForActor(actorUserId, id);
  }

  async createStaffLogin(actorUserId: string, staffId: string, dto: CreateStaffLoginDto) {
    const person = await this.getStaff(staffId, true);
    if (person.userId) {
      throw new BadRequestException('Staff already linked to a user account');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: person.email } });
    let userId: string;
    if (existing) {
      userId = existing.id;
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'admin',
          adminDashboardAccess: dto.enableDashboardAccess === true,
        },
      });
    } else {
      const password = await bcrypt.hash(dto.temporaryPassword, 10);
      const user = await this.prisma.user.create({
        data: {
          email: person.email,
          password,
          fullName: person.fullName,
          phone: person.phone,
          role: 'admin',
          verified: true,
          adminDashboardAccess: dto.enableDashboardAccess === true,
        },
      });
      userId = user.id;
    }
    await this.prisma.staffProfile.update({
      where: { id: staffId },
      data: { userId },
    });
    if (dto.adminRoleId) {
      await this.prisma.staffRoleAssignment.create({
        data: {
          staffProfileId: staffId,
          roleId: dto.adminRoleId,
          grantedByUserId: actorUserId,
        },
      });
    }
    await this.prisma.onboardingTask.updateMany({
      where: { staffProfileId: staffId, key: 'company_account_created' },
      data: { status: 'completed', completedAt: new Date(), completedByUserId: actorUserId },
    });
    await this.audit.log({
      actorUserId,
      action: 'person.login_created',
      entityType: 'staff',
      entityId: staffId,
      summary: `Created/linked login for ${person.fullName}`,
    });
    return this.getStaffForActor(actorUserId, staffId);
  }

  // ---------------------------------------------------------------------------
  // Roles / permissions
  // ---------------------------------------------------------------------------

  listPermissionCatalog() {
    return this.prisma.adminPermission.findMany({ orderBy: [{ groupLabel: 'asc' }, { key: 'asc' }] });
  }

  listRoles() {
    return this.prisma.adminRole.findMany({
      where: { archivedAt: null },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async upsertRole(actorUserId: string, dto: UpsertAdminRoleDto) {
    const permissions = await this.prisma.adminPermission.findMany({
      where: { key: { in: dto.permissionKeys } },
    });
    if (permissions.length !== dto.permissionKeys.length) {
      throw new BadRequestException('One or more permission keys are invalid');
    }

    const role = await this.prisma.adminRole.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        permissions: {
          create: permissions.map((p) => ({ permissionId: p.id })),
        },
      },
      update: {
        name: dto.name,
        description: dto.description,
        permissions: {
          deleteMany: {},
          create: permissions.map((p) => ({ permissionId: p.id })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });

    await this.audit.log({
      actorUserId,
      action: 'permission.role_upserted',
      entityType: 'admin_role',
      entityId: role.id,
      summary: `Upserted role ${role.name}`,
    });
    return role;
  }

  async assignStaffRole(actorUserId: string, staffId: string, dto: AssignStaffRoleDto) {
    await this.getStaff(staffId, true);
    const role = await this.prisma.adminRole.findUnique({ where: { id: dto.roleId } });
    if (!role || role.archivedAt) throw new NotFoundException('Role not found');

    const existing = await this.prisma.staffRoleAssignment.findFirst({
      where: { staffProfileId: staffId, roleId: dto.roleId, revokedAt: null },
    });
    if (existing) return this.getStaffForActor(actorUserId, staffId);

    await this.prisma.staffRoleAssignment.create({
      data: {
        staffProfileId: staffId,
        roleId: dto.roleId,
        grantedByUserId: actorUserId,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'permission.assigned',
      entityType: 'staff',
      entityId: staffId,
      summary: `Assigned role ${role.name}`,
      metadata: { roleId: role.id, roleKey: role.key },
    });
    return this.getStaffForActor(actorUserId, staffId);
  }

  async revokeStaffRole(actorUserId: string, staffId: string, assignmentId: string) {
    const assignment = await this.prisma.staffRoleAssignment.findFirst({
      where: { id: assignmentId, staffProfileId: staffId, revokedAt: null },
      include: { role: true },
    });
    if (!assignment) throw new NotFoundException('Role assignment not found');
    await this.prisma.staffRoleAssignment.update({
      where: { id: assignmentId },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      actorUserId,
      action: 'permission.revoked',
      entityType: 'staff',
      entityId: staffId,
      summary: `Revoked role ${assignment.role.name}`,
      metadata: { roleId: assignment.roleId },
    });
    return this.getStaffForActor(actorUserId, staffId);
  }

  // ---------------------------------------------------------------------------
  // Documents
  // ---------------------------------------------------------------------------

  listDocuments(filters?: { staffProfileId?: string; candidateId?: string }) {
    return this.prisma.hrDocument.findMany({
      where: {
        archivedAt: null,
        ...(filters?.staffProfileId ? { staffProfileId: filters.staffProfileId } : {}),
        ...(filters?.candidateId ? { candidateId: filters.candidateId } : {}),
      },
      include: {
        staffProfile: { select: { id: true, fullName: true } },
        candidate: { select: { id: true, fullName: true } },
        uploadedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(actorUserId: string, dto: CreateDocumentDto) {
    if (!dto.staffProfileId && !dto.candidateId) {
      throw new BadRequestException('staffProfileId or candidateId is required');
    }
    const doc = await this.prisma.hrDocument.create({
      data: {
        category: dto.category,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        staffProfileId: dto.staffProfileId,
        candidateId: dto.candidateId,
        uploadedByUserId: actorUserId,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        signatureStatus: dto.signatureStatus || 'unsigned',
        notes: dto.notes,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'contract.uploaded',
      entityType: 'document',
      entityId: doc.id,
      summary: `Uploaded ${dto.category}`,
      metadata: {
        staffProfileId: dto.staffProfileId,
        candidateId: dto.candidateId,
      },
    });
    return doc;
  }

  async archiveDocument(actorUserId: string, id: string) {
    const doc = await this.prisma.hrDocument.findUnique({ where: { id } });
    if (!doc || doc.archivedAt) throw new NotFoundException('Document not found');
    await this.prisma.hrDocument.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await this.audit.log({
      actorUserId,
      action: 'contract.deleted',
      entityType: 'document',
      entityId: id,
      summary: `Archived document ${doc.category}`,
    });
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Performance
  // ---------------------------------------------------------------------------

  listPerformanceGoals(staffProfileId?: string) {
    return this.prisma.staffPerformanceGoal.findMany({
      where: staffProfileId ? { staffProfileId } : undefined,
      include: { staffProfile: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPerformanceGoal(actorUserId: string, dto: CreatePerformanceGoalDto) {
    const goal = await this.prisma.staffPerformanceGoal.create({
      data: {
        staffProfileId: dto.staffProfileId,
        kpi: dto.kpi,
        target: dto.target,
        period: dto.period,
        actualResult: dto.actualResult,
        status: dto.status || 'open',
        managerComments: dto.managerComments,
        reviewType: dto.reviewType || 'monthly',
        bonusEligibleNotes: dto.bonusEligibleNotes,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'performance.goal_created',
      entityType: 'performance_goal',
      entityId: goal.id,
      summary: `Created KPI ${dto.kpi}`,
    });
    return goal;
  }

  async updatePerformanceGoal(
    actorUserId: string,
    id: string,
    dto: UpdatePerformanceGoalDto,
  ) {
    const existing = await this.prisma.staffPerformanceGoal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Performance goal not found');
    const goal = await this.prisma.staffPerformanceGoal.update({
      where: { id },
      data: { ...dto },
    });
    await this.audit.log({
      actorUserId,
      action: 'performance.goal_updated',
      entityType: 'performance_goal',
      entityId: id,
      summary: `Updated KPI ${goal.kpi}`,
    });
    return goal;
  }

  // ---------------------------------------------------------------------------
  // Policies
  // ---------------------------------------------------------------------------

  listPolicies() {
    return this.prisma.hrPolicy.findMany({
      include: {
        _count: { select: { acknowledgements: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPolicy(id: string) {
    const policy = await this.prisma.hrPolicy.findUnique({
      where: { id },
      include: {
        acknowledgements: {
          include: { staffProfile: { select: { id: true, fullName: true, email: true } } },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!policy) throw new NotFoundException('Policy not found');

    const requiredStaff = await this.prisma.staffProfile.count({
      where: {
        archivedAt: null,
        employmentStatus: { in: ['active', 'probation', 'onboarding'] },
        ...(policy.appliesCompanyWide
          ? {}
          : {
              OR: [
                { departmentId: { in: policy.departmentIds } },
                { positionId: { in: policy.positionIds } },
              ],
            }),
      },
    });

    const ackCount = policy.acknowledgements.filter((a) => a.version === policy.version).length;
    return {
      ...policy,
      acknowledgementSummary: {
        acknowledged: ackCount,
        required: requiredStaff,
        label: `${ackCount} of ${requiredStaff} required employees acknowledged this policy.`,
      },
    };
  }

  async createPolicy(actorUserId: string, dto: CreatePolicyDto) {
    const policy = await this.prisma.hrPolicy.create({
      data: {
        title: dto.title,
        category: dto.category,
        content: dto.content,
        version: dto.version || '1.0',
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        status: dto.status || 'draft',
        appliesCompanyWide: dto.appliesCompanyWide ?? true,
        departmentIds: dto.departmentIds || [],
        positionIds: dto.positionIds || [],
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'policy.created',
      entityType: 'policy',
      entityId: policy.id,
      summary: `Created policy ${policy.title}`,
    });
    return this.getPolicy(policy.id);
  }

  async updatePolicy(actorUserId: string, id: string, dto: UpdatePolicyDto) {
    await this.getPolicy(id);
    await this.prisma.hrPolicy.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.effectiveDate !== undefined
          ? { effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null }
          : {}),
        updatedByUserId: actorUserId,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'policy.changed',
      entityType: 'policy',
      entityId: id,
      summary: 'Policy updated',
    });
    return this.getPolicy(id);
  }

  async acknowledgePolicy(actorUserId: string, policyId: string, dto: AcknowledgePolicyDto) {
    const policy = await this.getPolicy(policyId);
    await this.prisma.policyAcknowledgement.upsert({
      where: {
        policyId_staffProfileId_version: {
          policyId,
          staffProfileId: dto.staffProfileId,
          version: policy.version,
        },
      },
      create: {
        policyId,
        staffProfileId: dto.staffProfileId,
        version: policy.version,
      },
      update: { acknowledgedAt: new Date() },
    });
    await this.audit.log({
      actorUserId,
      action: 'policy.acknowledged',
      entityType: 'policy',
      entityId: policyId,
      summary: 'Policy acknowledged',
      metadata: { staffProfileId: dto.staffProfileId, version: policy.version },
    });
    return this.getPolicy(policyId);
  }

  // ---------------------------------------------------------------------------
  // Communications
  // ---------------------------------------------------------------------------

  listCommunicationTemplates() {
    return Object.entries(HR_EMAIL_TEMPLATES).map(([key, value]) => ({
      key,
      subject: value.subject,
      bodyText: value.bodyText,
    }));
  }

  listCommunications(filters?: { candidateId?: string; staffProfileId?: string }) {
    return this.prisma.hrCommunication.findMany({
      where: {
        ...(filters?.candidateId ? { candidateId: filters.candidateId } : {}),
        ...(filters?.staffProfileId ? { staffProfileId: filters.staffProfileId } : {}),
      },
      include: {
        sentBy: { select: { id: true, fullName: true } },
        candidate: { select: { id: true, fullName: true } },
        staffProfile: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async sendCommunication(actorUserId: string, dto: SendHrCommunicationDto) {
    let subject = dto.subject;
    let bodyText = dto.bodyText;
    if (dto.templateKey) {
      const template = HR_EMAIL_TEMPLATES[dto.templateKey];
      if (!template) throw new BadRequestException('Unknown template key');
      const name = dto.name || 'there';
      const position = dto.position || 'the role';
      subject = (dto.subject || template.subject)
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{position\}\}/g, position);
      bodyText = (dto.bodyText || template.bodyText)
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{position\}\}/g, position);
    }
    if (!subject || !bodyText) {
      throw new BadRequestException('subject and bodyText are required');
    }

    const html =
      dto.bodyHtml ||
      `<p>${bodyText
        .split('\n')
        .map((line) => this.escapeHtml(line))
        .join('<br/>')}</p>`;

    const record = await this.prisma.hrCommunication.create({
      data: {
        templateKey: dto.templateKey,
        subject,
        bodyText,
        bodyHtml: html,
        recipientEmail: dto.recipientEmail.trim().toLowerCase(),
        candidateId: dto.candidateId,
        staffProfileId: dto.staffProfileId,
        status: 'queued',
        sentByUserId: actorUserId,
      },
    });

    const sent = await this.email.send({
      to: record.recipientEmail,
      subject,
      text: bodyText,
      html,
    });

    const updated = await this.prisma.hrCommunication.update({
      where: { id: record.id },
      data: {
        status: sent ? 'sent' : 'failed',
        sentAt: sent ? new Date() : null,
        errorMessage: sent ? null : 'Email provider failed or is not configured',
      },
    });

    await this.audit.log({
      actorUserId,
      action: 'hr.email_sent',
      entityType: 'communication',
      entityId: updated.id,
      summary: `${sent ? 'Sent' : 'Failed'} HR email: ${subject}`,
      metadata: {
        recipientEmail: updated.recipientEmail,
        candidateId: dto.candidateId,
        staffProfileId: dto.staffProfileId,
        status: updated.status,
      },
    });

    return updated;
  }

  listAudit(params?: { limit?: number; entityType?: string; entityId?: string }) {
    return this.audit.list(params);
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
