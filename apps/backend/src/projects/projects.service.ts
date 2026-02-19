import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/websocket.service';
import { StripeService } from '../payments/services/stripe.service';
import { PaymentsService } from '../payments/services/payments.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateStageTeamMemberDto } from '../stages/dto/create-stage-team-member.dto';
import { CreateStageMaterialDto } from '../stages/dto/create-stage-material.dto';
import { CreateStageMediaDto } from '../stages/dto/create-stage-media.dto';
import { CreateStageDocumentDto } from '../stages/dto/create-stage-document.dto';

@Injectable()
export class ProjectsService {
  // Use `any` for model access to reduce coupling to Prisma schema changes.
  private prisma = new PrismaClient() as any;
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly wsService: WebSocketService,
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async createStagesFromPhasesWithClient(prisma: any, projectId: string, phases: any[]): Promise<void> {
    if (!phases || !Array.isArray(phases) || phases.length === 0) {
      return;
    }

    // Check if stages already exist
    const existingStages = await prisma.stage.findMany({
      where: { projectId },
    });

    if (existingStages.length > 0) {
      // Stages already exist, don't recreate
      return;
    }

    // Create stages from phases
    const stagesToCreate = phases.map((phase: any, index: number) => {
      // Handle different phase formats
      const phaseName = phase.name || phase.phase_name || phase.phaseName || `Phase ${index + 1}`;
      const estimatedDuration = phase.estimatedDuration || phase.time_period || phase.timePeriod || '2 weeks';
      const estimatedCost = phase.estimatedCost || phase.estimated_cost || 0;

      return {
        projectId,
        name: phaseName,
        status: 'not_started',
        order: index + 1,
        estimatedCost: typeof estimatedCost === 'number' ? estimatedCost : parseFloat(estimatedCost) || 0,
        estimatedDuration: typeof estimatedDuration === 'string' ? estimatedDuration : String(estimatedDuration),
      };
    });

    await prisma.stage.createMany({
      data: stagesToCreate,
    });
  }

  private async handleAutomaticStageChargeAndPayout(params: {
    stageId: string;
    projectId: string;
  }) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: params.stageId },
      include: { project: true },
    });
    if (!stage || stage.projectId !== params.projectId) {
      throw new NotFoundException('Stage not found');
    }

    const project: any = stage.project;
    const projectType = project?.projectType as string | null;
    if (projectType !== 'renovation' && projectType !== 'interior_design') {
      return; // Only auto-charge for renovation/interior flows.
    }

    const amount = Number(stage.estimatedCost || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Stage estimatedCost must be greater than 0 to start the stage');
    }

    // Idempotency: if we already have a payment for this stage, do not charge again.
    const existing = await this.prisma.payment.findFirst({
      where: {
        stageId: stage.id,
        method: 'stripe',
        status: { in: ['pending', 'processing', 'completed'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return;

    if (!project?.homeownerId) {
      throw new BadRequestException('Project homeowner not found');
    }
    if (!project?.generalContractorId) {
      throw new BadRequestException('Project does not have a general contractor assigned');
    }

    const homeowner = await this.prisma.user.findUnique({
      where: { id: project.homeownerId },
      select: { id: true, email: true, stripeCustomerId: true },
    });
    if (!homeowner) {
      throw new BadRequestException('Homeowner not found');
    }

    // Ensure we have a Stripe customer for off-session charging.
    let stripeCustomerId = homeowner.stripeCustomerId as string | null;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.getOrCreateCustomer(homeowner.email, homeowner.id);
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: homeowner.id },
        data: { stripeCustomerId },
      });
    }

    // Find default card (isBackup=false). Fallback to most recent card if no default is set.
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        userId: homeowner.id,
        stripePaymentMethodId: { not: null },
      },
      orderBy: [{ isBackup: 'asc' }, { createdAt: 'desc' }],
    });
    if (!paymentMethod?.stripePaymentMethodId) {
      throw new BadRequestException('No saved payment method found. Please add a card before starting this stage.');
    }

    // We route funds to the GC’s Connect account using a destination charge.
    const contractor = await this.prisma.contractor.findUnique({
      where: { userId: project.generalContractorId },
      select: { connectAccountId: true },
    });
    if (!contractor?.connectAccountId) {
      throw new BadRequestException('GC has not completed Stripe Connect onboarding. Cannot start stage.');
    }

    // Create a Payment record up-front so we can reference it in Stripe metadata.
    const payment = await this.prisma.payment.create({
      data: {
        projectId: project.id,
        stageId: stage.id,
        amount,
        status: 'processing',
        method: 'stripe',
        transactionId: null,
      },
    });

    const transferGroup = `project_${project.id}_stage_${stage.id}`;

    try {
      const intent = await this.stripeService.createOffSessionDestinationCharge({
        amount,
        currency: 'usd',
        customerId: stripeCustomerId,
        paymentMethodId: paymentMethod.stripePaymentMethodId,
        destinationAccountId: contractor.connectAccountId,
        transferGroup,
        description: `Stage payment: ${stage.name}`,
        metadata: {
          type: 'stage_commencement',
          paymentId: payment.id,
          projectId: project.id,
          stageId: stage.id,
          homeownerId: homeowner.id,
          gcUserId: project.generalContractorId,
        },
        idempotencyKey: `stage_commencement_${stage.id}`,
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: intent.id,
          status: intent.status === 'succeeded' ? 'completed' : 'processing',
        },
      });
    } catch (e: any) {
      // Record the failure for audit/debugging.
      try {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
          },
        });
      } catch {
        // Ignore DB update failure here; we still rethrow original error.
      }

      const stripeMessage =
        e?.raw?.message ||
        e?.message ||
        'Payment failed';

      // Common case for off-session charges: SCA required.
      if (e?.code === 'authentication_required' || e?.raw?.code === 'authentication_required') {
        throw new BadRequestException(
          'Card authentication required. Please update your payment method before starting this stage.',
        );
      }

      this.logger.error(`Stage commencement charge failed: ${stripeMessage}`, e?.stack);
      throw new BadRequestException(`Unable to charge for stage commencement: ${stripeMessage}`);
    }
  }

  /**
   * Update project status and emit real-time updateimage.png
   */
  async updateProjectStatus(projectId: string, status: string) {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { status },
    });

    // Emit real-time update to all clients watching this project
    this.wsService.emitProjectUpdate(projectId, {
      type: 'status_change',
      data: {
        status: project.status,
        updatedAt: project.updatedAt,
      },
    });

    return project;
  }

  /**
   * Update project budget and emit real-time update
   */
  
  async updateProjectBudget(projectId: string, budget: number) {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { budget },
    });

    // Emit real-time update
    this.wsService.emitProjectUpdate(projectId, {
      type: 'budget_update',
      data: {
        budget: project.budget,
        updatedAt: project.updatedAt,
      },
    });

    return project;
  }

  /**
   * Update project progress and emit real-time update
   */
  async updateProjectProgress(projectId: string, progress: number) {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { progress },
    });

    // Emit real-time update
    this.wsService.emitProjectUpdate(projectId, {
      type: 'progress_update',
      data: {
        progress: project.progress,
        updatedAt: project.updatedAt,
      },
    });

    return project;
  }

  // ==================== Homebuilding manual payment flow ====================

  async updateProjectReviewStatus(params: {
    projectId: string;
    reviewStatus: 'pending_admin_review' | 'changes_requested' | 'approved';
  }) {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const updated = await this.prisma.project.update({
      where: { id: params.projectId },
      data: {
        reviewStatus: params.reviewStatus,
      },
    });

    this.wsService.emitProjectUpdate(params.projectId, {
      type: 'status_change',
      data: {
        event: 'review_status_change',
        reviewStatus: (updated as any).reviewStatus,
        updatedAt: (updated as any).updatedAt,
      },
    });

    return updated;
  }

  async setProjectRiskLevel(params: { projectId: string; riskLevel: 'low' | 'medium' | 'high' }) {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const updated = await this.prisma.project.update({
      where: { id: params.projectId },
      data: { riskLevel: params.riskLevel },
    });

    this.wsService.emitProjectUpdate(params.projectId, {
      type: 'status_change',
      data: {
        event: 'risk_level_change',
        riskLevel: (updated as any).riskLevel,
        updatedAt: (updated as any).updatedAt,
      },
    });

    return updated;
  }

  async activateProjectAsAdmin(params: { projectId: string }) {
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const project = await tx.project.findUnique({
        where: { id: params.projectId },
        include: { stages: true },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Idempotent: if already active, do nothing.
      if ((project as any).status === 'active') {
        return project;
      }

      // Unlock tracking by creating stages from aiAnalysis phases if needed.
      if (!project.stages || project.stages.length === 0) {
        const aiAnalysis = (project as any).aiAnalysis as any;
        if (aiAnalysis && aiAnalysis.phases && Array.isArray(aiAnalysis.phases)) {
          await this.createStagesFromPhasesWithClient(tx, params.projectId, aiAnalysis.phases);
        }
      }

      const now = new Date();
      return tx.project.update({
        where: { id: params.projectId },
        data: {
          status: 'active',
          startDate: (project as any).startDate ?? now,
        },
        include: {
          homeowner: {
            select: { id: true, email: true, fullName: true, phone: true },
          },
          generalContractor: {
            select: { id: true, email: true, fullName: true, phone: true },
          },
          stages: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    this.wsService.emitProjectUpdate(params.projectId, {
      type: 'status_change',
      data: { ...(updated as any), event: 'project_activated_by_admin' },
    });

    return updated;
  }

  async deactivateProjectAsAdmin(params: { projectId: string }) {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
      include: { stages: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Idempotent: if already paused, do nothing.
    if ((project as any).status === 'paused') {
      return project;
    }

    const updated = await this.prisma.project.update({
      where: { id: params.projectId },
      data: { status: 'paused' },
      include: {
        homeowner: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        generalContractor: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.wsService.emitProjectUpdate(params.projectId, {
      type: 'status_change',
      data: { ...(updated as any), event: 'project_deactivated_by_admin' },
    });

    return updated;
  }

  async setExternalPaymentLink(params: {
    projectId: string;
    actorUserId: string;
    actorRole: string;
    externalPaymentLink: string;
  }) {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
      select: {
        id: true,
        projectType: true,
        generalContractorId: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Admin can always set; GC can only set for their assigned project.
    if (params.actorRole !== 'admin' && project.generalContractorId !== params.actorUserId) {
      throw new ForbiddenException('You do not have permission to set the payment link for this project');
    }

    // If projectType is present, restrict this to homebuilding.
    if (project.projectType && project.projectType !== 'homebuilding') {
      throw new BadRequestException('External payment link is only supported for homebuilding projects');
    }

    const updated = await this.prisma.project.update({
      where: { id: params.projectId },
      data: {
        externalPaymentLink: params.externalPaymentLink,
      },
    });

    this.wsService.emitProjectUpdate(params.projectId, {
      type: 'status_change',
      data: {
        event: 'external_payment_link_set',
        externalPaymentLink: (updated as any).externalPaymentLink,
        updatedAt: (updated as any).updatedAt,
      },
    });

    return updated;
  }

  async declareManualPayment(params: { projectId: string; homeownerId: string }) {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
      select: {
        id: true,
        homeownerId: true,
        status: true,
        projectType: true,
        externalPaymentLink: true,
        paymentConfirmationStatus: true,
        paymentDeclaredAt: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.homeownerId !== params.homeownerId) {
      throw new ForbiddenException('You do not have permission to declare payment for this project');
    }

    // If projectType is present, restrict this to homebuilding.
    if (project.projectType && project.projectType !== 'homebuilding') {
      throw new BadRequestException('Manual payment declaration is only supported for homebuilding projects');
    }

    if (!project.externalPaymentLink) {
      throw new BadRequestException('Payment link is not available yet for this project');
    }
    if (project.status === 'active') {
      throw new BadRequestException('Project is already active');
    }

    // Idempotency: if already declared/confirmed, do not change timestamps.
    if (project.paymentConfirmationStatus === 'declared' || project.paymentConfirmationStatus === 'confirmed') {
      return this.prisma.project.findUnique({ where: { id: params.projectId } });
    }

    const now = new Date();
    const updated = await this.prisma.project.update({
      where: { id: params.projectId },
      data: {
        paymentDeclaredAt: project.paymentDeclaredAt ?? now,
        paymentConfirmationStatus: 'declared',
        // Reuse existing status for "awaiting admin confirmation" filtering.
        status: project.status === 'draft' ? 'pending_payment' : project.status,
      },
    });

    this.wsService.emitProjectUpdate(params.projectId, {
      type: 'status_change',
      data: {
        event: 'manual_payment_declared',
        paymentConfirmationStatus: (updated as any).paymentConfirmationStatus,
        paymentDeclaredAt: (updated as any).paymentDeclaredAt,
        status: (updated as any).status,
      },
    });

    return updated;
  }

  async confirmManualPayment(params: { projectId: string }) {
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const project = await tx.project.findUnique({
        where: { id: params.projectId },
        include: { stages: true },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // If projectType is present, restrict this to homebuilding.
      if ((project as any).projectType && (project as any).projectType !== 'homebuilding') {
        throw new BadRequestException('Manual payment confirmation is only supported for homebuilding projects');
      }

      if ((project as any).paymentConfirmationStatus === 'confirmed') {
        return project;
      }
      if ((project as any).paymentConfirmationStatus !== 'declared') {
        throw new BadRequestException('Payment has not been declared by the homeowner yet');
      }

      const now = new Date();
      const isActivating = (project as any).status !== 'active';

      const next = await tx.project.update({
        where: { id: params.projectId },
        data: {
          paymentConfirmedAt: now,
          paymentConfirmationStatus: 'confirmed',
          status: 'active',
        },
      });

      // On first activation, create stages from phases if they don't exist (unlock tracking).
      if (isActivating && (!project.stages || project.stages.length === 0)) {
        const aiAnalysis = (project as any).aiAnalysis as any;
        if (aiAnalysis && aiAnalysis.phases && Array.isArray(aiAnalysis.phases)) {
          await this.createStagesFromPhasesWithClient(tx, params.projectId, aiAnalysis.phases);
        }
      }

      return next;
    });

    // Record one activation payment when admin confirms (idempotent)
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
      select: { budget: true },
    });
    if (project?.budget != null) {
      await this.paymentsService.createManualActivationPayment(params.projectId, project.budget);
    }

    this.wsService.emitProjectUpdate(params.projectId, {
      type: 'status_change',
      data: {
        event: 'manual_payment_confirmed',
        paymentConfirmationStatus: (updated as any).paymentConfirmationStatus,
        paymentConfirmedAt: (updated as any).paymentConfirmedAt,
        status: (updated as any).status,
      },
    });

    return updated;
  }

  /**
   * Validate that a stage has required documentation before completion
   */
  private async validateStageCompletion(stageId: string): Promise<void> {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        teamMembers: true,
        materials: true,
        media: true,
        documents: true,
      },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const errors: string[] = [];

    // Check for at least one team member with photo and invoice
    const teamMembersWithDocs = stage.teamMembers.filter(
      (tm) => tm.photoUrl && tm.invoiceUrl,
    );
    if (teamMembersWithDocs.length === 0 && stage.teamMembers.length > 0) {
      errors.push('At least one team member must have a photo and invoice/receipt');
    }

    // Check for at least one material with receipt and photo
    const materialsWithDocs = stage.materials.filter(
      (m) => m.receiptUrl && m.photoUrl,
    );
    if (materialsWithDocs.length === 0 && stage.materials.length > 0) {
      errors.push('At least one material must have a receipt and photo');
    }

    // Check for at least one process photo
    const processPhotos = stage.media.filter((m) => m.type === 'photo');
    if (processPhotos.length === 0) {
      errors.push('At least one process photo is required');
    }

    // Check for at least one process video
    const processVideos = stage.media.filter((m) => m.type === 'video');
    if (processVideos.length === 0) {
      errors.push('At least one process video is required');
    }

    if (errors.length > 0) {
      throw new BadRequestException(
        `Cannot complete stage. Missing required documentation: ${errors.join('; ')}`,
      );
    }
  }

  /**
   * Update stage status (start or complete)
   */
  async updateStageStatus(projectId: string, stageId: string, status: 'not_started' | 'in_progress' | 'completed' | 'blocked') {
    // Verify stage belongs to project
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      include: { project: true },
    });

    if (!stage || stage.projectId !== projectId) {
      throw new NotFoundException('Stage not found');
    }

    // Validate completion requirements if marking as completed
    if (status === 'completed') {
      await this.validateStageCompletion(stageId);
    }

    // Automatic stage funding (renovation/interior) on stage commencement.
    // Run before updating the stage so a failed charge doesn't start the stage.
    if (status === 'in_progress' && stage.status !== 'in_progress') {
      await this.handleAutomaticStageChargeAndPayout({ stageId, projectId });
    }

    // Update stage status
    const updateData: any = { status };
    if (status === 'in_progress' && !stage.startDate) {
      updateData.startDate = new Date();
    }
    if (status === 'completed') {
      updateData.completionDate = new Date();
    }
    if (status === 'not_started') {
      updateData.startDate = null;
      updateData.completionDate = null;
    }

    const updatedStage = await this.prisma.stage.update({
      where: { id: stageId },
      data: updateData,
      include: { project: true },
    });

    // Update project progress and currentStage
    const allStages = await this.prisma.stage.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
    const completedStages = allStages.filter((s) => s.status === 'completed');
    const progress = allStages.length > 0 ? Math.round(
      (completedStages.length / allStages.length) * 100,
    ) : 0;

    // Calculate spent amount from completed stages' estimatedCost
    const spent = completedStages.reduce((sum, stage) => sum + (stage.estimatedCost || 0), 0);

    // Find current stage (first in_progress stage, or last completed stage if none in progress)
    const inProgressStage = allStages.find((s) => s.status === 'in_progress');
    const currentStage = inProgressStage?.name || (completedStages.length > 0 ? completedStages[completedStages.length - 1].name : null);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { 
        progress,
        currentStage,
        spent,
      },
    });

    // Emit stage update notification
    this.wsService.emitStageCompletion(projectId, {
      id: updatedStage.id,
      name: updatedStage.name,
      status: updatedStage.status,
      completionDate: updatedStage.completionDate,
      startDate: updatedStage.startDate,
    });

    // Also emit project progress update
    this.wsService.emitProjectUpdate(projectId, {
      type: 'progress_update',
      data: {
        progress,
        currentStage,
        stageUpdated: {
          id: updatedStage.id,
          name: updatedStage.name,
          status: updatedStage.status,
        },
      },
    });

    return updatedStage;
  }

  /**
   * Complete a stage and emit notification
   */
  async completeStage(projectId: string, stageId: string) {
    return this.updateStageStatus(projectId, stageId, 'completed');
  }

  /**
   * Check if a subcontractor has an accepted request for a project
   */
  async hasAcceptedRequestForProject(contractorId: string, projectId: string): Promise<boolean> {
    const request = await this.prisma.projectRequest.findFirst({
      where: {
        contractorId,
        projectId,
        status: 'accepted',
      },
    });
    return !!request;
  }

  /**
   * Check if a subcontractor has an accepted request for a specific stage
   */
  async hasAcceptedRequestForStage(contractorId: string, projectId: string, stageId: string): Promise<boolean> {
    const request = await this.prisma.projectRequest.findFirst({
      where: {
        contractorId,
        projectId,
        stageId,
        status: 'accepted',
      },
    });
    return !!request;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        generalContractor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                rating: true,
                reviews: true,
                projects: true,
                verified: true,
                location: true,
              },
            },
          },
        },
        projectRequests: {
          // Return all project requests (pending and accepted) so frontend can show proper status
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            contractor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                contractorProfile: {
                  select: {
                    id: true,
                    name: true,
                    specialty: true,
                    rating: true,
                    reviews: true,
                    projects: true,
                    verified: true,
                    location: true,
                  },
                },
              },
            },
          },
        },
        stages: {
          orderBy: { order: 'asc' },
          include: {
            teamMembers: true,
            materials: true,
            media: {
              orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            },
            documents: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string, status?: string) {
    const whereClause: any = {
      OR: [
        { homeownerId: userId },
        { generalContractorId: userId },
      ],
    };

    // Add status filter if provided.
    if (status) {
      whereClause.status = status;
    }

    return this.prisma.project.findMany({
      where: whereClause,
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        generalContractor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        stages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Create a project from a design and send request to GC
   */
  async createProjectFromDesign(
    homeownerId: string,
    designId: string,
    address: string,
    street?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string,
    latitude?: number,
    longitude?: number,
  ) {
    // Get design with creator info
    const design = await this.prisma.design.findUnique({
      where: { id: designId, isActive: true },
      include: {
        createdBy: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    // Create project from design
    const project = await this.prisma.project.create({
      data: {
        name: design.name,
        address,
        street: street || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country: country || null,
        latitude: latitude || null,
        longitude: longitude || null,
        budget: design.estimatedCost,
        homeownerId,
        status: 'draft',
        progress: 0,
        spent: 0,
        aiAnalysis: {
          bedrooms: design.bedrooms,
          bathrooms: design.bathrooms,
          squareFootage: design.squareFootage,
          floors: design.floors || Math.ceil(design.bedrooms / 4) || 2,
          estimatedBudget: design.estimatedCost,
          estimatedDuration: design.estimatedDuration || '12-18 months',
          phases: design.constructionPhases || [],
          rooms: design.rooms || [],
          materials: design.materials || [],
          features: design.features || [],
        },
      },
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    // Create project request for the GC who created the design
    const projectRequest = await this.prisma.projectRequest.create({
      data: {
        projectId: project.id,
        contractorId: design.createdById,
        status: 'pending',
      },
      include: {
        contractor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                rating: true,
                reviews: true,
                projects: true,
                verified: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Fetch project with all relations including the newly created request
    const projectWithRequests = await this.prisma.project.findUnique({
      where: { id: project.id },
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        projectRequests: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            contractor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                contractorProfile: {
                  select: {
                    id: true,
                    name: true,
                    specialty: true,
                    rating: true,
                    reviews: true,
                    projects: true,
                    verified: true,
                    location: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Emit real-time update
    this.wsService.emitProjectUpdate(project.id, {
      type: 'status_change',
      data: { ...project, event: 'project_created_from_design' },
    });

    return projectWithRequests || project;
  }

  /**
   * Create a new project
   */
  async createProject(homeownerId: string, createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        address: createProjectDto.address,
        street: createProjectDto.street,
        city: createProjectDto.city,
        state: createProjectDto.state,
        zipCode: createProjectDto.zipCode,
        country: createProjectDto.country,
        latitude: createProjectDto.latitude,
        longitude: createProjectDto.longitude,
        budget: createProjectDto.budget,
        homeownerId,
        generalContractorId: createProjectDto.generalContractorId,
        startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : null,
        dueDate: createProjectDto.dueDate ? new Date(createProjectDto.dueDate) : null,
        status: 'draft',
        progress: 0,
        spent: 0,
      },
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        generalContractor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        stages: true,
      },
    });

    // Emit real-time update
    this.wsService.emitProjectUpdate(project.id, {
      type: 'status_change',
      data: { ...project, event: 'project_created' },
    });

    return project;
  }

  /**
   * Create stages from project phases (from aiAnalysis or design)
   */
  private async createStagesFromPhases(projectId: string, phases: any[]): Promise<void> {
    return this.createStagesFromPhasesWithClient(this.prisma, projectId, phases);
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, userId: string, updateProjectDto: UpdateProjectDto) {
    // Check if project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        stages: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check authorization: homeowner or contractor can update
    if (project.homeownerId !== userId && project.generalContractorId !== userId) {
      throw new ForbiddenException('You do not have permission to update this project');
    }

    // If status is changing to 'active', create stages from phases if they don't exist
    const isActivating = updateProjectDto.status === 'active' && project.status !== 'active';
    if (isActivating && project.stages.length === 0) {
      // Get phases from aiAnalysis
      const aiAnalysis = project.aiAnalysis as any;
      if (aiAnalysis && aiAnalysis.phases && Array.isArray(aiAnalysis.phases)) {
        await this.createStagesFromPhases(projectId, aiAnalysis.phases);
      }
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(updateProjectDto.name && { name: updateProjectDto.name }),
        ...(updateProjectDto.address && { address: updateProjectDto.address }),
        ...(updateProjectDto.street && { street: updateProjectDto.street }),
        ...(updateProjectDto.city && { city: updateProjectDto.city }),
        ...(updateProjectDto.state && { state: updateProjectDto.state }),
        ...(updateProjectDto.zipCode && { zipCode: updateProjectDto.zipCode }),
        ...(updateProjectDto.country && { country: updateProjectDto.country }),
        ...(updateProjectDto.latitude !== undefined && { latitude: updateProjectDto.latitude }),
        ...(updateProjectDto.longitude !== undefined && { longitude: updateProjectDto.longitude }),
        ...(updateProjectDto.budget !== undefined && { budget: updateProjectDto.budget }),
        ...(updateProjectDto.spent !== undefined && { spent: updateProjectDto.spent }),
        ...(updateProjectDto.progress !== undefined && { progress: updateProjectDto.progress }),
        ...(updateProjectDto.currentStage && { currentStage: updateProjectDto.currentStage }),
        ...(updateProjectDto.status && { status: updateProjectDto.status }),
        ...(updateProjectDto.startDate && { startDate: new Date(updateProjectDto.startDate) }),
        ...(updateProjectDto.dueDate && { dueDate: new Date(updateProjectDto.dueDate) }),
        ...(updateProjectDto.generalContractorId && { generalContractorId: updateProjectDto.generalContractorId }),
      },
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        generalContractor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Emit real-time update
    this.wsService.emitProjectUpdate(projectId, {
      type: 'status_change',
      data: { ...updatedProject, event: 'project_updated' },
    });

    return updatedProject;
  }

  /**
   * Delete a project
   * - homeowner: can delete their own project
   * - general_contractor: can delete their own UNPAID projects (draft/pending_payment only, no completed payments)
   * - admin: can delete any project
   */
  async deleteProject(projectId: string, userId: string, userRole?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        payments: true,
        stages: true,
        projectRequests: true,
        orders: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Admin can delete anything
    if (userRole === 'admin') {
      // allowed
    } else if (userRole === 'general_contractor') {
      // GC can only delete projects assigned to them AND not yet paid/activated
      if (project.generalContractorId !== userId) {
        throw new ForbiddenException('You can only delete projects assigned to you');
      }
      if (project.status !== 'draft' && project.status !== 'pending_payment') {
        throw new ForbiddenException('Only unpaid projects can be deleted');
      }
      const hasCompletedPayment = (project.payments || []).some((p) => p.status === 'completed');
      if (hasCompletedPayment) {
        throw new ForbiddenException('This project already has a completed payment and cannot be deleted');
      }
    } else {
      // homeowner (default path)
      if (project.homeownerId !== userId) {
        throw new ForbiddenException('Only the project owner can delete this project');
      }
    }

    // Delete related records first to avoid foreign key constraint errors
    // Payments have ON DELETE RESTRICT, so we need to delete them first
    // Always try to delete, even if not included in query
    try {
      await this.prisma.payment.deleteMany({
        where: { projectId },
      });
    } catch (error) {
      console.error(`[ProjectsService] Error deleting payments for project ${projectId}:`, error);
      // Continue - payments might not exist
    }

    // Delete stages (these have ON DELETE CASCADE, but being explicit for safety)
    try {
      await this.prisma.stage.deleteMany({
        where: { projectId },
      });
    } catch (error) {
      console.error(`[ProjectsService] Error deleting stages for project ${projectId}:`, error);
      // Continue - stages might not exist
    }

    // Delete project requests (these have ON DELETE CASCADE, but being explicit)
    try {
      await this.prisma.projectRequest.deleteMany({
        where: { projectId },
      });
    } catch (error) {
      console.error(`[ProjectsService] Error deleting project requests for project ${projectId}:`, error);
      // Continue - project requests might not exist
    }

    // Delete orders related to this project
    try {
      await this.prisma.order.deleteMany({
        where: { projectId },
      });
    } catch (error) {
      console.error(`[ProjectsService] Error deleting orders for project ${projectId}:`, error);
      // Continue - orders might not exist
    }

    // Now delete the project
    await this.prisma.project.delete({
      where: { id: projectId },
    });

    // Emit real-time update
    this.wsService.emitProjectUpdate(projectId, {
      type: 'status_change',
      data: { id: projectId, event: 'project_deleted' },
    });

    return { message: 'Project deleted successfully' };
  }

  /**
   * Get all projects (for admin or public listing)
   */
  async getAllProjects(status?: string) {
    const whereClause: any = {};
    
    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    return this.prisma.project.findMany({
      where: whereClause,
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        generalContractor: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        stages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== Stage Documentation Methods ====================

  /**
   * Add team member to a stage
   */
  async addStageTeamMember(stageId: string, dto: CreateStageTeamMemberDto) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.stageTeamMember.create({
      data: {
        stageId,
        ...dto,
      },
    });
  }

  /**
   * Get team members for a stage
   */
  async getStageTeamMembers(stageId: string) {
    return this.prisma.stageTeamMember.findMany({
      where: { stageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update team member
   */
  async updateStageTeamMember(teamMemberId: string, dto: Partial<CreateStageTeamMemberDto>) {
    return this.prisma.stageTeamMember.update({
      where: { id: teamMemberId },
      data: dto,
    });
  }

  /**
   * Delete team member
   */
  async deleteStageTeamMember(teamMemberId: string) {
    return this.prisma.stageTeamMember.delete({
      where: { id: teamMemberId },
    });
  }

  /**
   * Add material to a stage
   */
  async addStageMaterial(stageId: string, dto: CreateStageMaterialDto) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const totalPrice = dto.quantity * dto.unitPrice;

    return this.prisma.stageMaterial.create({
      data: {
        stageId,
        ...dto,
        totalPrice,
      },
    });
  }

  /**
   * Get materials for a stage
   */
  async getStageMaterials(stageId: string) {
    return this.prisma.stageMaterial.findMany({
      where: { stageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update material
   */
  async updateStageMaterial(materialId: string, dto: Partial<CreateStageMaterialDto>) {
    const updateData: any = { ...dto };
    
    // Recalculate totalPrice if quantity or unitPrice changed
    if (dto.quantity !== undefined || dto.unitPrice !== undefined) {
      const existing = await this.prisma.stageMaterial.findUnique({
        where: { id: materialId },
      });
      if (existing) {
        const quantity = dto.quantity ?? existing.quantity;
        const unitPrice = dto.unitPrice ?? existing.unitPrice;
        updateData.totalPrice = quantity * unitPrice;
      }
    }

    return this.prisma.stageMaterial.update({
      where: { id: materialId },
      data: updateData,
    });
  }

  /**
   * Delete material
   */
  async deleteStageMaterial(materialId: string) {
    return this.prisma.stageMaterial.delete({
      where: { id: materialId },
    });
  }

  /**
   * Add media (photo/video) to a stage
   */
  async addStageMedia(stageId: string, dto: CreateStageMediaDto) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.stageMedia.create({
      data: {
        stageId,
        ...dto,
        order: dto.order ?? 0,
      },
    });
  }

  /**
   * Get media for a stage
   */
  async getStageMedia(stageId: string) {
    return this.prisma.stageMedia.findMany({
      where: { stageId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Update media
   */
  async updateStageMedia(mediaId: string, dto: Partial<CreateStageMediaDto>) {
    return this.prisma.stageMedia.update({
      where: { id: mediaId },
      data: dto,
    });
  }

  /**
   * Delete media
   */
  async deleteStageMedia(mediaId: string) {
    return this.prisma.stageMedia.delete({
      where: { id: mediaId },
    });
  }

  /**
   * Add document to a stage
   */
  async addStageDocument(stageId: string, dto: CreateStageDocumentDto) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.stageDocument.create({
      data: {
        stageId,
        ...dto,
      },
    });
  }

  /**
   * Get documents for a stage
   */
  async getStageDocuments(stageId: string) {
    return this.prisma.stageDocument.findMany({
      where: { stageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update document
   */
  async updateStageDocument(documentId: string, dto: Partial<CreateStageDocumentDto>) {
    return this.prisma.stageDocument.update({
      where: { id: documentId },
      data: dto,
    });
  }

  /**
   * Delete document
   */
  async deleteStageDocument(documentId: string) {
    return this.prisma.stageDocument.delete({
      where: { id: documentId },
    });
  }
}
