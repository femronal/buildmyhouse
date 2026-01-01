import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateReviewDto } from '../dto/create-review.dto';

@Injectable()
export class ReviewsService {
  private prisma = new PrismaClient();

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { materialId, contractorId, rating, comment } = createReviewDto;

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
      const existing = await this.prisma.review.findFirst({
        where: {
          userId,
          contractorId,
        },
      });

      if (existing) {
        throw new BadRequestException('You have already reviewed this contractor');
      }

      // Create review
      const review = await this.prisma.review.create({
        data: {
          userId,
          contractorId,
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

  async getContractorReviews(contractorId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { contractorId },
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
      this.prisma.review.count({ where: { contractorId } }),
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

  async update(id: string, userId: string, rating?: number, comment?: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (review.userId !== userId) {
      throw new NotFoundException('You do not have permission to update this review');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
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
          rating: 0,
          reviews: 0,
        },
      });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.contractor.update({
      where: { id: contractorId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviews: reviews.length,
      },
    });
  }
}



