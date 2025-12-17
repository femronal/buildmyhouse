import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SearchDto } from '../dto/search.dto';

/**
 * Search service for marketplace items
 * 
 * This is a basic implementation using Prisma's full-text search.
 * For production, consider integrating Meilisearch or Elasticsearch
 * for better search performance and features.
 */
@Injectable()
export class SearchService {
  private prisma = new PrismaClient();

  /**
   * Unified search across materials and contractors
   */
  async searchAll(searchDto: SearchDto) {
    const { query, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    if (!query) {
      return {
        materials: { data: [], pagination: { page, limit, total: 0, totalPages: 0 } },
        contractors: { data: [], pagination: { page, limit, total: 0, totalPages: 0 } },
      };
    }

    // Search materials
    const materialsWhere: any = {
      verified: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { brand: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const [materials, materialsTotal] = await Promise.all([
      this.prisma.material.findMany({
        where: materialsWhere,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.material.count({ where: materialsWhere }),
    ]);

    // Search contractors
    const contractorsWhere: any = {
      verified: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { specialty: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const [contractors, contractorsTotal] = await Promise.all([
      this.prisma.contractor.findMany({
        where: contractorsWhere,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.contractor.count({ where: contractorsWhere }),
    ]);

    return {
      materials: {
        data: materials,
        pagination: {
          page,
          limit,
          total: materialsTotal,
          totalPages: Math.ceil(materialsTotal / limit),
        },
      },
      contractors: {
        data: contractors,
        pagination: {
          page,
          limit,
          total: contractorsTotal,
          totalPages: Math.ceil(contractorsTotal / limit),
        },
      },
    };
  }

  /**
   * Get search suggestions/autocomplete
   */
  async getSuggestions(query: string, limit: number = 5) {
    if (!query || query.length < 2) {
      return { materials: [], contractors: [] };
    }

    const [materials, contractors] = await Promise.all([
      this.prisma.material.findMany({
        where: {
          verified: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { brand: { contains: query, mode: 'insensitive' as const } },
          ],
        } as any,
        take: limit,
        select: {
          id: true,
          name: true,
          brand: true,
        },
      }),
      this.prisma.contractor.findMany({
        where: {
          verified: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { specialty: { contains: query, mode: 'insensitive' as const } },
          ],
        } as any,
        take: limit,
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      }),
    ]);

    return { materials, contractors };
  }

  /**
   * Get popular/search trends (for future implementation)
   */
  async getPopularItems(limit: number = 10) {
    const [popularMaterials, popularContractors] = await Promise.all([
      this.prisma.material.findMany({
        where: { verified: true },
        orderBy: [
          { rating: 'desc' },
          { reviews: 'desc' },
        ],
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.contractor.findMany({
        where: { verified: true },
        orderBy: [
          { rating: 'desc' },
          { reviews: 'desc' },
        ],
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      materials: popularMaterials,
      contractors: popularContractors,
    };
  }
}

