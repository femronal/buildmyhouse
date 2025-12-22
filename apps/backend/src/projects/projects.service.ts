import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/websocket.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  private prisma = new PrismaClient();

  constructor(private readonly wsService: WebSocketService) {}

  /**
   * Update project status and emit real-time update
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
   * Complete a stage and emit notification
   */
  async completeStage(projectId: string, stageId: string) {
    const stage = await this.prisma.stage.update({
      where: { id: stageId },
      data: {
        status: 'completed',
        completionDate: new Date(),
      },
      include: { project: true },
    });

    // Update project progress
    const allStages = await this.prisma.stage.findMany({
      where: { projectId },
    });
    const completedStages = allStages.filter((s) => s.status === 'completed');
    const progress = Math.round(
      (completedStages.length / allStages.length) * 100,
    );

    await this.prisma.project.update({
      where: { id: projectId },
      data: { progress },
    });

    // Emit stage completion notification
    this.wsService.emitStageCompletion(projectId, {
      id: stage.id,
      name: stage.name,
      status: stage.status,
      completionDate: stage.completionDate,
    });

    // Also emit project progress update
    this.wsService.emitProjectUpdate(projectId, {
      type: 'progress_update',
      data: {
        progress,
        stageCompleted: {
          id: stage.id,
          name: stage.name,
        },
      },
    });

    return stage;
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
          },
        },
        projectRequests: {
          where: {
            status: 'accepted',
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
          take: 1, // Get the accepted request
        },
        stages: {
          orderBy: { order: 'asc' },
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
  async getUserProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [
          { homeownerId: userId },
          { generalContractorId: userId },
        ],
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
      orderBy: { updatedAt: 'desc' },
    });
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
   * Update a project
   */
  async updateProject(projectId: string, userId: string, updateProjectDto: UpdateProjectDto) {
    // Check if project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check authorization: homeowner or contractor can update
    if (project.homeownerId !== userId && project.generalContractorId !== userId) {
      throw new ForbiddenException('You do not have permission to update this project');
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
   * Delete a project (only homeowner can delete)
   */
  async deleteProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only homeowner can delete
    if (project.homeownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

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
  async getAllProjects() {
    return this.prisma.project.findMany({
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
}
