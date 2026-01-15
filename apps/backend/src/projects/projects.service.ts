import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/websocket.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateStageTeamMemberDto } from '../stages/dto/create-stage-team-member.dto';
import { CreateStageMaterialDto } from '../stages/dto/create-stage-material.dto';
import { CreateStageMediaDto } from '../stages/dto/create-stage-media.dto';
import { CreateStageDocumentDto } from '../stages/dto/create-stage-document.dto';

@Injectable()
export class ProjectsService {
  private prisma = new PrismaClient();

  constructor(private readonly wsService: WebSocketService) {}

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
    if (!phases || !Array.isArray(phases) || phases.length === 0) {
      return;
    }

    // Check if stages already exist
    const existingStages = await this.prisma.stage.findMany({
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
      const phaseDescription = phase.description || '';
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

    await this.prisma.stage.createMany({
      data: stagesToCreate,
    });
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
