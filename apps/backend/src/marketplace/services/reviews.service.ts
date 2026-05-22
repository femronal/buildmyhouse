import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateReviewDto } from '../dto/create-review.dto';
import {
  getContractorReviewReasonOptions,
  normalizeContractorSpecialtyCategory,
} from '../constants/contractor-review-reasons';

@Injectable()
export class ReviewsService {
  private prisma = new PrismaClient();

  private countWords(text?: string | null): number {
    const normalized = String(text || '').trim();
    if (!normalized) return 0;
    return normalized.split(/\s+/).filter(Boolean).length;
  }

  private normalizeReasons(reasons?: string[]): string[] {
    return Array.from(
      new Set(
        (reasons || [])
          .map((reason) => String(reason || '').trim())
          .filter(Boolean),
      ),
    ).slice(0, 10);
  }

  private async getContractorCategory(contractorId: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id: contractorId },
      select: { id: true, specialtyCategory: true, userId: true },
    });
    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }
    return {
      ...contractor,
      normalizedCategory: normalizeContractorSpecialtyCategory(contractor.specialtyCategory),
    };
  }

  private validateOtherReason(otherReason?: string | null) {
    const normalized = String(otherReason || '').trim();
    if (!normalized) return null;
    const wordCount = this.countWords(normalized);
    if (wordCount > 500) {
      throw new BadRequestException('Other reason cannot exceed 500 words');
    }
    return normalized;
  }

  private async validateContractorReviewReasons(params: {
    contractorId: string;
    rating: number;
    reasons?: string[];
    otherReason?: string | null;
  }) {
    const contractor = await this.getContractorCategory(params.contractorId);
    const options = getContractorReviewReasonOptions({
      category: contractor.normalizedCategory,
      rating: params.rating,
    });
    const allowed = new Set(options.reasons.map((reason) => reason.toLowerCase()));
    const normalizedReasons = this.normalizeReasons(params.reasons);
    const invalid = normalizedReasons.filter((reason) => !allowed.has(reason.toLowerCase()));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid review reasons: ${invalid.join(', ')}`);
    }
    const normalizedOther = this.validateOtherReason(params.otherReason);
    const hasAnyReason = normalizedReasons.length > 0 || !!normalizedOther;
    if (!hasAnyReason) {
      throw new BadRequestException('Select at least one review reason or provide "Other" details');
    }
    return {
      contractor,
      reasons: normalizedReasons,
      otherReason: normalizedOther,
      options,
    };
  }

  async getContractorReviewReasonOptions(contractorId: string, rating: number) {
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new BadRequestException('rating must be between 1 and 5');
    }
    const contractor = await this.getContractorCategory(contractorId);
    const options = getContractorReviewReasonOptions({
      category: contractor.normalizedCategory,
      rating: parsedRating,
    });
    return {
      ...options,
      contractorId: contractor.id,
    };
  }

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const {
      materialId,
      contractorId,
      rating,
      comment,
      projectId,
      reasons,
      otherReason,
    } = createReviewDto;

    // Validate that exactly one of materialId or contractorId is provided
    if (!materialId && !contractorId) {
      throw new BadRequestException('Either materialId or contractorId must be provided');
    }

    if (materialId && contractorId) {
      throw new BadRequestException('Cannot review both material and contractor in one review');
    }

    // Check if user already reviewed this item
    if (materialId) {
      const existing = await this.prisma.review.findFirst({
        where: {
          userId,
          materialId,
        },
      });

      if (existing) {
        throw new BadRequestException('You have already reviewed this material');
      }

      // Create review
      const review = await this.prisma.review.create({
        data: {
          userId,
          materialId,
          rating,
          comment,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Update material rating
      await this.updateMaterialRating(materialId);

      return review;
    } else if (contractorId) {
      const normalizedProjectId = String(projectId || '').trim() || null;
      const normalizedComment = String(comment || '').trim() || null;
      const validated = await this.validateContractorReviewReasons({
        contractorId,
        rating,
        reasons,
        otherReason,
      });

      if (normalizedProjectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: normalizedProjectId },
          select: { id: true, homeownerId: true, generalContractorId: true, progress: true, status: true },
        });
        if (!project) {
          throw new NotFoundException('Project not found');
        }
        if (project.homeownerId !== userId) {
          throw new BadRequestException('Only the homeowner of this project can submit this review');
        }
        if (project.generalContractorId !== validated.contractor.userId) {
          throw new BadRequestException('Selected contractor is not assigned to this project');
        }
        const isComplete = Number(project.progress || 0) >= 100 || project.status === 'completed';
        if (!isComplete) {
          throw new BadRequestException('Project must be fully complete before submitting a GC review');
        }
      }

      const existing = await this.prisma.review.findFirst({
        where: normalizedProjectId
          ? {
              userId,
              contractorId,
              projectId: normalizedProjectId,
            }
          : {
              userId,
              contractorId,
              projectId: null,
            },
      });

      if (existing) {
        throw new BadRequestException('You have already reviewed this contractor for this context');
      }

      // Create review
      const review = await this.prisma.review.create({
        data: {
          userId,
          contractorId,
          projectId: normalizedProjectId,
          rating,
          comment: normalizedComment || validated.otherReason,
          reasons: validated.reasons,
          otherReason: validated.otherReason,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Update contractor rating
      await this.updateContractorRating(contractorId);

      return review;
    }

    throw new BadRequestException('Invalid review data');
  }

  async getMaterialReviews(materialId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { materialId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where: { materialId } }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContractorReviews(
    contractorId: string,
    page: number = 1,
    limit: number = 20,
    projectId?: string,
  ) {
    const skip = (page - 1) * limit;
    const normalizedProjectId = String(projectId || '').trim();
    const whereClause: any = {
      contractorId,
      ...(normalizedProjectId ? { projectId: normalizedProjectId } : {}),
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where: whereClause }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    userId: string,
    data?: {
      rating?: number;
      comment?: string;
      reasons?: string[];
      otherReason?: string | null;
    },
  ) {
    const rating = data?.rating;
    const comment = data?.comment;
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new NotFoundException('You do not have permission to update this review');
    }

    const nextRating = rating ?? review.rating;
    let nextReasons = review.reasons || [];
    let nextOtherReason = review.otherReason || null;

    if (review.contractorId) {
      if (data?.reasons !== undefined) {
        nextReasons = this.normalizeReasons(data.reasons);
      }
      if (data?.otherReason !== undefined) {
        nextOtherReason = this.validateOtherReason(data.otherReason);
      }
      if (data?.reasons !== undefined || data?.otherReason !== undefined || rating !== undefined) {
        const validated = await this.validateContractorReviewReasons({
          contractorId: review.contractorId,
          rating: nextRating,
          reasons: nextReasons,
          otherReason: nextOtherReason,
        });
        nextReasons = validated.reasons;
        nextOtherReason = validated.otherReason;
      }
    }

    const normalizedComment = comment !== undefined ? String(comment || '').trim() || null : undefined;

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(normalizedComment !== undefined && { comment: normalizedComment }),
        ...(review.contractorId && {
          reasons: nextReasons,
          otherReason: nextOtherReason,
          ...(normalizedComment === undefined && { comment: nextOtherReason || review.comment }),
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Update ratings
    if (review.materialId) {
      await this.updateMaterialRating(review.materialId);
    } else if (review.contractorId) {
      await this.updateContractorRating(review.contractorId);
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new NotFoundException('You do not have permission to delete this review');
    }

    const materialId = review.materialId;
    const contractorId = review.contractorId;

    await this.prisma.review.delete({
      where: { id },
    });

    // Update ratings
    if (materialId) {
      await this.updateMaterialRating(materialId);
    } else if (contractorId) {
      await this.updateContractorRating(contractorId);
    }

    return { message: 'Review deleted successfully' };
  }

  private async updateMaterialRating(materialId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { materialId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      await this.prisma.material.update({
        where: { id: materialId },
        data: {
          rating: 0,
          reviews: 0,
        },
      });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.material.update({
      where: { id: materialId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviews: reviews.length,
      },
    });
  }

  private async updateContractorRating(contractorId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { contractorId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      await this.prisma.contractor.update({
        where: { id: contractorId },
        data: {
          rating: 5.0,
          reviews: 0,
        },
      });
      return;
    }

    // Confidence-weighted (Bayesian) average similar to supply platforms:
    // protects against unstable scores from very few ratings while still reacting over time.
    const priorMean = 4.7;
    const priorWeight = 8;
    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const weightedAverage =
      (totalRatings + priorMean * priorWeight) / (reviews.length + priorWeight);
    const bounded = Math.max(1, Math.min(5, weightedAverage));

    await this.prisma.contractor.update({
      where: { id: contractorId },
      data: {
        rating: Math.round(bounded * 10) / 10, // Round to 1 decimal
        reviews: reviews.length,
      },
    });
  }
}



