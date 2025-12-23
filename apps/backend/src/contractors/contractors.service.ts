import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContractorsService {
  private prisma = new PrismaClient();

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
    console.log('🔍 [ContractorsService] Recommending GCs for project:', projectId);
    
    // Get project details
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.error('❌ [ContractorsService] Project not found:', projectId);
      throw new Error('Project not found');
    }

    console.log('📋 [ContractorsService] Project details:', {
      id: project.id,
      name: project.name,
      city: project.city,
      state: project.state,
    });

    // First, try to find contractors matching strict criteria
    console.log('🔍 [ContractorsService] Searching for GCs with strict criteria...');
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

    console.log(`✅ [ContractorsService] Recommended ${scoredContractors.length} GCs for project ${projectId}`);
    scoredContractors.forEach((gc, index) => {
      console.log(`  GC ${index + 1}: ${gc.name} (${gc.matchScore}% match, rating: ${gc.rating})`);
    });
    
    return scoredContractors;
  }

  /**
   * Send project request to GCs
   */
  async sendProjectRequests(
    projectId: string,
    contractorIds: string[],
  ) {
    const requests = await Promise.all(
      contractorIds.map((contractorId) =>
        this.prisma.projectRequest.create({
          data: {
            projectId,
            contractorId,
            status: 'pending',
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

    console.log('✅ Created requests:', requests.length);
    requests.forEach((req, i) => {
      console.log(`  Request ${i + 1}:`, {
        id: req.id,
        projectId: req.projectId,
        contractorId: req.contractorId,
        status: req.status,
      });
    });

    // TODO: Send email/push notifications to GCs

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
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });
    
    console.log('✅ Found requests:', requests.length);
    console.log('📋 Request IDs:', requests.map(r => r.id));
    
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

      console.log('✅ [ContractorsService] Request found:', request.id);
      console.log('  Project ID:', request.projectId);

      // Update request
      console.log('📝 [ContractorsService] Updating request status...');
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
          project: true,
        },
      });

      // Update project with GC
      const updatedProject = await this.prisma.project.update({
        where: { id: request.projectId },
        data: {
          generalContractorId: contractorId,
          // Update budget if GC provided one
          ...(estimatedBudget && { budget: estimatedBudget }),
        },
      });
      console.log('✅ [ContractorsService] Project updated with GC:', updatedProject.generalContractorId);

      // Reject other pending requests for this project
      console.log('📝 [ContractorsService] Rejecting other pending requests...');
      const rejectedCount = await this.prisma.projectRequest.updateMany({
        where: {
          projectId: request.projectId,
          id: { not: requestId },
          status: 'pending',
        },
        data: {
          status: 'rejected',
          respondedAt: new Date(),
        },
      });

      // TODO: Notify homeowner via email/push notification

      return {
        success: true,
        message: 'Project request accepted successfully',
        request: updatedRequest,
        project: {
          id: request.projectId,
          generalContractorId: contractorId,
        },
      };
    } catch (error) {
      throw error;
    }
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
    });

    if (!request) {
      throw new Error('Request not found or already processed');
    }

    return this.prisma.projectRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
        gcNotes: reason,
      },
    });
  }
}

