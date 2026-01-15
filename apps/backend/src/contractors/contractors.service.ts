import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class ContractorsService {
  private prisma = new PrismaClient();

  private moneyToCents(value: unknown): number {
    const n =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.replace(/[^0-9.-]/g, ''))
          : NaN;
    if (!Number.isFinite(n)) return NaN;
    return Math.round(n * 100);
  }

  private extractEditedAnalysisFromNotes(gcNotes?: string): any | null {
    if (!gcNotes) return null;
    const marker = '[Edited AI Analysis]';
    const idx = gcNotes.indexOf(marker);
    if (idx === -1) return null;
    const jsonPart = gcNotes.slice(idx + marker.length).trim();
    if (!jsonPart) return null;
    try {
      return JSON.parse(jsonPart);
    } catch {
      return null;
    }
  }

  private validateEditedProjectAnalysisOrThrow(analysis: any, estimatedBudget?: number) {
    const budgetCents = this.moneyToCents(estimatedBudget);
    if (!Number.isFinite(budgetCents) || budgetCents <= 0) {
      throw new BadRequestException('estimatedBudget is required and must be greater than 0');
    }

    const rooms = analysis?.rooms;
    const materials = analysis?.materials;
    const features = analysis?.features;
    const phases = analysis?.phases;
    const summary = analysis?.summary;

    if (!Array.isArray(rooms) || rooms.length === 0 || rooms.some((r) => !String(r || '').trim())) {
      throw new BadRequestException('All rooms are required (none can be empty)');
    }
    if (!Array.isArray(materials) || materials.length === 0 || materials.some((m) => !String(m || '').trim())) {
      throw new BadRequestException('All materials are required (none can be empty)');
    }
    if (!Array.isArray(features) || features.length === 0 || features.some((f) => !String(f || '').trim())) {
      throw new BadRequestException('All features are required (none can be empty)');
    }
    if (!Array.isArray(phases) || phases.length === 0) {
      throw new BadRequestException('Construction phases are required');
    }
    if (!String(summary || '').trim()) {
      throw new BadRequestException('Project summary is required');
    }

    let totalPhaseCents = 0;
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      if (!String(p?.name || '').trim()) throw new BadRequestException(`Phase ${i + 1}: name is required`);
      if (!String(p?.description || '').trim()) throw new BadRequestException(`Phase ${i + 1}: description is required`);
      if (!String(p?.estimatedDuration || '').trim()) throw new BadRequestException(`Phase ${i + 1}: estimatedDuration is required`);
      const cents = this.moneyToCents(p?.estimatedCost);
      if (!Number.isFinite(cents) || cents <= 0) throw new BadRequestException(`Phase ${i + 1}: estimatedCost must be greater than 0`);
      totalPhaseCents += cents;
    }

    if (totalPhaseCents !== budgetCents) {
      throw new BadRequestException(
        `Construction phase costs must sum exactly to estimatedBudget. Phase total: ${(totalPhaseCents / 100).toFixed(2)}, estimatedBudget: ${(budgetCents / 100).toFixed(2)}`,
      );
    }
  }

  constructor(
    @Inject(forwardRef(() => WebSocketService))
    private readonly wsService: WebSocketService,
  ) {}

  /**
   * Recommend GCs based on project details
   * Matching criteria:
   * - Location (same city/state)
   * - Specialty (residential vs commercial)
   * - Rating (4.5+)
   * - Verified status
   * 
   * For now, returns all GCs in database for testing purposes
   */
  async recommendGCs(
    projectId: string,
    limit: number = 3,
  ) {
    // Get project details
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.error('❌ [ContractorsService] Project not found:', projectId);
      throw new Error('Project not found');
    }

    // First, try to find contractors matching strict criteria
    let contractors = await this.prisma.contractor.findMany({
      where: {
        type: 'general_contractor',
        verified: true,
        rating: {
          gte: 4.5,
        },
        // Location matching (if available)
        ...(project.city && {
          location: {
            contains: project.city,
            mode: 'insensitive',
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { projects: 'desc' },
      ],
      take: limit,
    });

    // If no contractors found with strict criteria, get all GCs (for testing)
    if (contractors.length === 0) {
      contractors = await this.prisma.contractor.findMany({
        where: {
          type: 'general_contractor',
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { projects: 'desc' },
        ],
        take: limit,
      });
    }

    // Calculate match score for each contractor
    const scoredContractors = contractors.map((contractor) => {
      let matchScore = 70; // Base score

      // Location bonus
      if (project.city && contractor.location?.toLowerCase().includes(project.city.toLowerCase())) {
        matchScore += 15;
      }
      if (project.state && contractor.location?.toLowerCase().includes(project.state.toLowerCase())) {
        matchScore += 10;
      }

      // Rating bonus
      if (contractor.rating >= 4.9) matchScore += 5;
      else if (contractor.rating >= 4.7) matchScore += 3;

      // Experience bonus
      if (contractor.projects >= 80) matchScore += 5;
      else if (contractor.projects >= 50) matchScore += 3;

      // Verified bonus
      if (contractor.verified) matchScore += 5;

      return {
        ...contractor,
        matchScore: Math.min(matchScore, 100),
      };
    });

    // Sort by match score
    scoredContractors.sort((a, b) => b.matchScore - a.matchScore);

    return scoredContractors;
  }

  /**
   * Send project request to contractors/subcontractors
   */
  async sendProjectRequests(
    projectId: string,
    contractorIds: string[],
    stageId?: string,
    workDetails?: string,
    estimatedBudget?: number,
    estimatedDuration?: string,
    senderId?: string, // GC who is sending the request
  ) {
    // If senderId is provided (GC sending request), ensure project has generalContractorId set
    if (senderId) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { generalContractorId: true },
      });
      
      // If project doesn't have a GC assigned, set it to the sender
      if (!project?.generalContractorId) {
        await this.prisma.project.update({
          where: { id: projectId },
          data: { generalContractorId: senderId },
        });
      }
    }

    const requests = await Promise.all(
      contractorIds.map((contractorId) =>
        this.prisma.projectRequest.create({
          data: {
            projectId,
            contractorId,
            senderId: senderId || undefined, // Track who sent the request
            status: 'pending',
            stageId,
            estimatedBudget,
            estimatedDuration,
            gcNotes: workDetails || undefined, // Store work details in gcNotes for now
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                address: true,
                budget: true,
                aiAnalysis: true,
              },
            },
            contractor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ),
    );

    // Notifications intentionally deferred for MVP.

    return requests;
  }

  /**
   * Get pending requests for a contractor
   */
  async getPendingRequests(contractorId: string) {
    const requests = await this.prisma.projectRequest.findMany({
      where: {
        contractorId,
        status: 'pending',
      },
      include: {
        project: {
          include: {
            homeowner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
            generalContractor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                pictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });
    
    
    return requests;
  }

  /**
   * Accept a project request
   */
  async acceptRequest(
    requestId: string,
    contractorId: string,
    estimatedBudget?: number,
    estimatedDuration?: string,
    gcNotes?: string,
  ) {
    try {
      // Verify the request belongs to this contractor
      const request = await this.prisma.projectRequest.findFirst({
        where: {
          id: requestId,
          contractorId,
          status: 'pending',
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              homeownerId: true,
            },
          },
        },
      });

      if (!request) {
        console.error('❌ [ContractorsService] Request not found or already processed');
        console.error('  Request ID:', requestId);
        console.error('  Contractor ID:', contractorId);
        throw new Error('Request not found or already processed');
      }


      // Get contractor info to determine role
      const contractor = await this.prisma.user.findUnique({
        where: { id: contractorId },
        select: { role: true },
      });

      // Backend guardrail: for GC project-level accept, ensure edited analysis is complete
      // and phase costs sum exactly to estimatedBudget. GC Notes (free text) is optional.
      if (contractor?.role === 'general_contractor' && !request.stageId) {
        if (!estimatedDuration || !String(estimatedDuration).trim()) {
          throw new BadRequestException('estimatedDuration is required');
        }
        const editedAnalysis = this.extractEditedAnalysisFromNotes(gcNotes);
        if (!editedAnalysis) {
          throw new BadRequestException('Edited project analysis is required');
        }
        this.validateEditedProjectAnalysisOrThrow(editedAnalysis, estimatedBudget);
      }

      // Update request
      const updatedRequest = await this.prisma.projectRequest.update({
        where: { id: requestId },
        data: {
          status: 'accepted',
          respondedAt: new Date(),
          estimatedBudget,
          estimatedDuration,
          gcNotes,
        },
        include: {
          project: {
            include: {
              generalContractor: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          contractor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              contractorProfile: {
                select: {
                  id: true,
                  name: true,
                  specialty: true,
                  imageUrl: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      // Only update project generalContractorId if the contractor accepting is a GC
      // (This happens when a GC accepts a homeowner's request)
      // For subcontractors accepting GC requests, we don't change the project's GC
      if (contractor?.role === 'general_contractor') {
        // If this is a project-level request (not a single stage request), persist the edited analysis
        // to the project so the homeowner can see it even if they left the AI summary screen.
        const editedAnalysis = !request.stageId ? this.extractEditedAnalysisFromNotes(gcNotes) : null;

        const updatedProject = await this.prisma.project.update({
          where: { id: request.projectId },
          data: {
            generalContractorId: contractorId,
            // Update budget if GC provided one
            ...(estimatedBudget && { budget: estimatedBudget }),
            // Move project into "awaiting payment" once GC has reviewed/accepted
            ...( !request.stageId && { status: 'pending_payment' } ),
            // Persist edited analysis for homeowner visibility (and future stage generation)
            ...(editedAnalysis && { aiAnalysis: editedAnalysis, aiProcessedAt: new Date() }),
          },
        });
        // Emit real-time update to homeowner that GC has accepted
        this.wsService.emitProjectUpdate(request.projectId, {
          type: 'status_change',
          data: {
            event: 'gc_accepted',
            projectId: request.projectId,
            generalContractorId: contractorId,
            message: 'A General Contractor has accepted your project request',
          },
        });
        
        // Also send notification to homeowner
        if (request.project?.homeownerId) {
          this.wsService.sendNotification(request.project.homeownerId, {
            type: 'gc_accepted',
            title: 'Project Request Accepted!',
            message: `A contractor has accepted your project: ${request.project.name}`,
            data: {
              projectId: request.projectId,
              requestId: updatedRequest.id,
            },
          });
        }
      } else {
        // Non-GC accept: do not modify project generalContractorId.
      }

      // Notifications intentionally deferred for MVP.

      // Get project with GC info for response (ensure we have the GC)
      let projectWithGC = await this.prisma.project.findUnique({
        where: { id: request.projectId },
        include: {
          generalContractor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              pictureUrl: true,
            },
          },
        },
      });

      // If project doesn't have a GC but the request was sent by a GC, try to find who sent it
      // This can happen if the project GC wasn't set when the request was sent
      if (!projectWithGC?.generalContractor) {
        // For now, we'll return what we have - the GC should be set when sending requests
      }

      return {
        success: true,
        message: 'Project request accepted successfully',
        request: updatedRequest,
        project: projectWithGC,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sent requests by GC (requests sent by the GC that are pending)
   */
  async getSentRequests(gcId: string) {
    // Get all requests sent by this GC (using senderId) - including rejected ones
    const requests = await this.prisma.projectRequest.findMany({
      where: {
        senderId: gcId, // Requests sent by this GC
        status: { in: ['pending', 'rejected'] }, // Include both pending and rejected
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        contractor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                imageUrl: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return requests;
  }

  /**
   * Get accepted GCs for a subcontractor (GCs who sent requests that were accepted)
   */
  async getAcceptedGCsForSubcontractor(subcontractorId: string) {
    try {
      // Get all accepted requests for this subcontractor
      const acceptedRequests = await this.prisma.projectRequest.findMany({
        where: {
          contractorId: subcontractorId,
          status: 'accepted',
        },
        include: {
          project: {
            include: {
              generalContractor: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  pictureUrl: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: {
          respondedAt: 'desc',
        },
      });

      // Map to return GC info, filtering out requests without GC
      const gcs = acceptedRequests
        .filter(req => req.project?.generalContractor) // Only include requests where GC exists
        .map(req => ({
          id: req.project.generalContractor!.id,
          fullName: req.project.generalContractor!.fullName,
          email: req.project.generalContractor!.email,
          phone: req.project.generalContractor!.phone,
          imageUrl: req.project.generalContractor!.pictureUrl,
          role: req.project.generalContractor!.role,
          projectId: req.projectId,
          projectName: req.project.name,
          requestId: req.id,
        }));

      return gcs;
    } catch (error) {
      console.error('❌ [ContractorsService] Error fetching accepted GCs for subcontractor:', error);
      throw error;
    }
  }

  /**
   * Get all accepted contractors (subs, vendors, homeowners) for GC's projects
   */
  async getAcceptedContractorsForGC(gcId: string) {
    // Get all projects where this user is the GC
    const projects = await this.prisma.project.findMany({
      where: {
        generalContractorId: gcId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const projectIds = projects.map(p => p.id);

    // If no projects, return empty array
    if (projectIds.length === 0) {
      return [];
    }

    // Get all accepted requests for these projects
    const acceptedRequests = await this.prisma.projectRequest.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'accepted',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        contractor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            pictureUrl: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                imageUrl: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
    });

    // Also include homeowners from GC's projects
    const projectsWithHomeowners = await this.prisma.project.findMany({
      where: {
        generalContractorId: gcId,
      },
      include: {
        homeowner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            pictureUrl: true,
          },
        },
      },
    });

    // Combine accepted contractors and homeowners
    const contractors = acceptedRequests.map(req => ({
      id: req.contractor.id,
      fullName: req.contractor.contractorProfile?.name || req.contractor.fullName,
      email: req.contractor.email,
      phone: req.contractor.phone,
      role: req.contractor.role,
      imageUrl: req.contractor.contractorProfile?.imageUrl || req.contractor.pictureUrl,
      specialty: req.contractor.contractorProfile?.specialty,
      type: req.contractor.contractorProfile?.type,
      projectId: req.projectId,
      projectName: req.project.name,
      requestId: req.id,
    }));

    const homeowners = projectsWithHomeowners.map(project => ({
      id: project.homeowner.id,
      fullName: project.homeowner.fullName,
      email: project.homeowner.email,
      phone: project.homeowner.phone,
      role: project.homeowner.role,
      imageUrl: project.homeowner.pictureUrl,
      projectId: project.id,
      projectName: project.name,
      requestId: `homeowner-${project.homeowner.id}-${project.id}`, // Create unique ID for homeowners
    }));

    return [...contractors, ...homeowners];
  }

  /**
   * Reject a project request
   */
  async rejectRequest(requestId: string, contractorId: string, reason?: string) {
    const request = await this.prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        contractorId,
        status: 'pending',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            address: true,
            homeownerId: true,
            homeowner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new Error('Request not found or already processed');
    }

    const updatedRequest = await this.prisma.projectRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
        gcNotes: reason,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            address: true,
            homeownerId: true,
            homeowner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        contractor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                imageUrl: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Emit real-time update to homeowner that GC has rejected
    this.wsService.emitProjectUpdate(request.projectId, {
      type: 'status_change',
      data: {
        event: 'gc_rejected',
        projectId: request.projectId,
        requestId: updatedRequest.id,
        message: 'A contractor has declined your project request',
      },
    });

    // Send notification to homeowner
    if (request.project?.homeownerId) {
      this.wsService.sendNotification(request.project.homeownerId, {
        type: 'gc_rejected',
        title: 'Request Declined',
        message: `A contractor has declined your project: ${request.project.name}`,
        data: {
          projectId: request.projectId,
          requestId: updatedRequest.id,
        },
      });
    }

    return updatedRequest;
  }

  /**
   * Delete a request (only for rejected requests by GC)
   */
  async deleteRequest(requestId: string, gcId: string) {
    // Verify the request was sent by this GC and is rejected
    const request = await this.prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        senderId: gcId,
        status: 'rejected',
      },
    });

    if (!request) {
      throw new Error('Request not found or cannot be deleted');
    }

    return this.prisma.projectRequest.delete({
      where: { id: requestId },
    });
  }

  /**
   * Get accepted subcontractors for a project
   */
  async getAcceptedSubcontractors(projectId: string) {
    const requests = await this.prisma.projectRequest.findMany({
      where: {
        projectId,
        status: 'accepted',
      },
      include: {
        contractor: {
          include: {
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                type: true,
                rating: true,
                reviews: true,
                imageUrl: true,
                verified: true,
              },
            },
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            status: true,
            order: true,
          },
        },
      },
    });

    // Filter to only return subcontractors (not GCs)
    const subcontractors = requests
      .filter(req => req.contractor.contractorProfile?.type === 'subcontractor')
      .map(req => ({
        id: req.contractor.contractorProfile?.id || '',
        userId: req.contractor.id,
        name: req.contractor.contractorProfile?.name || req.contractor.fullName,
        specialty: req.contractor.contractorProfile?.specialty || '',
        rating: req.contractor.contractorProfile?.rating || 0,
        reviews: req.contractor.contractorProfile?.reviews || 0,
        imageUrl: req.contractor.contractorProfile?.imageUrl,
        verified: req.contractor.contractorProfile?.verified || false,
        stageId: req.stageId,
        stageName: req.stage?.name || 'General Work',
        stageStatus: req.stage?.status || 'not_started', // 'not_started' | 'in_progress' | 'completed' | 'blocked'
        requestId: req.id,
        user: {
          id: req.contractor.id,
          fullName: req.contractor.fullName,
          email: req.contractor.email,
          phone: req.contractor.phone,
        },
      }));

    return subcontractors;
  }

  /**
   * Get all accepted projects for a subcontractor
   */
  async getAcceptedProjectsForSubcontractor(subcontractorId: string) {
    // Get all accepted requests for this subcontractor
    const acceptedRequests = await this.prisma.projectRequest.findMany({
      where: {
        contractorId: subcontractorId,
        status: 'accepted',
      },
      include: {
        project: {
          include: {
            generalContractor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                pictureUrl: true,
              },
            },
            homeowner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
            stages: {
              orderBy: { order: 'asc' },
            },
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            status: true,
            order: true,
            estimatedCost: true,
            estimatedDuration: true,
            startDate: true,
            completionDate: true,
          },
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
    });

    // Map to project format with request details
    return acceptedRequests.map((request) => ({
      id: request.project.id,
      projectName: request.project.name,
      address: request.project.address,
      status: request.project.status,
      budget: request.project.budget,
      progress: request.project.progress,
      dueDate: request.project.dueDate,
      startDate: request.project.startDate,
      gcName: request.project.generalContractor?.fullName || 'General Contractor',
      gcId: request.project.generalContractor?.id,
      gcEmail: request.project.generalContractor?.email,
      gcPhone: request.project.generalContractor?.phone,
      homeownerName: request.project.homeowner?.fullName,
      requestId: request.id,
      stageId: request.stageId,
      stageName: request.stage?.name || 'General Work',
      stageStatus: request.stage?.status || 'not_started',
      workDetails: request.gcNotes || '',
      estimatedBudget: request.estimatedBudget,
      estimatedDuration: request.estimatedDuration,
      sentAt: request.sentAt,
      respondedAt: request.respondedAt,
      // Get current stage from project stages
      currentStage: request.stage?.name || request.project.stages?.[0]?.name || 'Not Started',
      stages: request.project.stages || [],
    }));
  }
}


