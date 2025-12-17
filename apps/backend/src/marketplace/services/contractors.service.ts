import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SearchDto } from '../dto/search.dto';

@Injectable()
export class ContractorsService {
  private prisma = new PrismaClient();

  async findAll(searchDto: SearchDto) {
    const {
      query,
      page = 1,
      limit = 20,
      minRating,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = searchDto;

    const skip = (page - 1) * limit;
    const where: any = {
      verified: true, // Only show verified contractors by default
    };

    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { specialty: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Type filter (if category is provided)
    if (searchDto.category) {
      where.type = searchDto.category;
    }

    // Rating filter
    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    // Sort
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [contractors, total] = await Promise.all([
      this.prisma.contractor.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              contractorReviews: true,
            },
          },
        },
      }),
      this.prisma.contractor.count({ where }),
    ]);

    return {
      data: contractors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        contractorReviews: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            contractorReviews: true,
          },
        },
      },
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with ID ${id} not found`);
    }

    return contractor;
  }

  async findByUserId(userId: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            contractorReviews: true,
          },
        },
      },
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor profile not found for user ${userId}`);
    }

    return contractor;
  }

  async createContractorProfile(userId: string, data: {
    name: string;
    specialty: string;
    description?: string;
    location?: string;
    hiringFee: number;
    type: 'general_contractor' | 'subcontractor';
    imageUrl?: string;
  }) {
    // Check if profile already exists
    const existing = await this.prisma.contractor.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new NotFoundException('Contractor profile already exists');
    }

    return this.prisma.contractor.create({
      data: {
        ...data,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateContractorProfile(userId: string, data: {
    name?: string;
    specialty?: string;
    description?: string;
    location?: string;
    hiringFee?: number;
    imageUrl?: string;
  }) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { userId },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor profile not found');
    }

    return this.prisma.contractor.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }
}

