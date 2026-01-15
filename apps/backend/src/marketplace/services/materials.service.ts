import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateMaterialDto } from '../dto/create-material.dto';
import { UpdateMaterialDto } from '../dto/update-material.dto';
import { SearchDto } from '../dto/search.dto';

@Injectable()
export class MaterialsService {
  private prisma = new PrismaClient();

  async create(vendorId: string, createMaterialDto: CreateMaterialDto) {
    return this.prisma.material.create({
      data: {
        ...createMaterialDto,
        vendorId,
        verified: true, // Auto-verify for testing (in production, admin would verify)
      },
      include: {
        vendor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(searchDto: SearchDto) {
    const {
      query,
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    const skip = (page - 1) * limit;
    const where: any = {
      verified: true, // Only show verified materials by default
    };

    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Rating filter
    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    // Sort
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [materials, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          vendor: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              materialReviews: true,
            },
          },
        },
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      data: materials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        materialReviews: {
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
            materialReviews: true,
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async update(id: string, vendorId: string, updateMaterialDto: UpdateMaterialDto) {
    // Verify ownership
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    if (material.vendorId !== vendorId) {
      throw new NotFoundException('You do not have permission to update this material');
    }

    return this.prisma.material.update({
      where: { id },
      data: updateMaterialDto,
      include: {
        vendor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async remove(id: string, vendorId: string) {
    // Verify ownership
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    if (material.vendorId !== vendorId) {
      throw new NotFoundException('You do not have permission to delete this material');
    }

    await this.prisma.material.delete({
      where: { id },
    });

    return { message: 'Material deleted successfully' };
  }

  async getVendorMaterials(vendorId: string) {
    return this.prisma.material.findMany({
      where: { vendorId },
      include: {
        _count: {
          select: {
            materialReviews: true,
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}




