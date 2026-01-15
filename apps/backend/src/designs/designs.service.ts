import { Injectable, InternalServerErrorException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDesignDto } from './dto/create-design.dto';

@Injectable()
export class DesignsService {
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

  private assertDesignValidity(input: {
    name: string;
    description: string | null | undefined;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    estimatedCost: number;
    floors: number | null | undefined;
    estimatedDuration: string | null | undefined;
    rooms: string[];
    materials: string[];
    features: string[];
    constructionPhases: any;
  }) {
    if (!input.name || !input.name.trim()) throw new BadRequestException('Design name is required');
    if (!input.description || !input.description.trim()) throw new BadRequestException('Design description is required');
    if (!input.bedrooms || input.bedrooms < 1) throw new BadRequestException('Bedrooms must be at least 1');
    if (!input.bathrooms || input.bathrooms < 1) throw new BadRequestException('Bathrooms must be at least 1');
    if (!input.squareFootage || input.squareFootage < 1) throw new BadRequestException('Square footage must be at least 1');

    const estCostCents = this.moneyToCents(input.estimatedCost);
    if (!Number.isFinite(estCostCents) || estCostCents <= 0) {
      throw new BadRequestException('Estimated cost must be greater than 0');
    }

    if (!input.floors || input.floors < 1) throw new BadRequestException('Floors must be at least 1');
    if (!input.estimatedDuration || !input.estimatedDuration.trim()) throw new BadRequestException('Estimated duration is required');

    if (!Array.isArray(input.rooms) || input.rooms.length === 0 || input.rooms.some((r) => !String(r).trim())) {
      throw new BadRequestException('Rooms are required (none can be empty)');
    }
    if (!Array.isArray(input.materials) || input.materials.length === 0 || input.materials.some((m) => !String(m).trim())) {
      throw new BadRequestException('Materials are required (none can be empty)');
    }
    if (!Array.isArray(input.features) || input.features.length === 0 || input.features.some((f) => !String(f).trim())) {
      throw new BadRequestException('Features are required (none can be empty)');
    }

    if (!Array.isArray(input.constructionPhases) || input.constructionPhases.length === 0) {
      throw new BadRequestException('Construction phases are required');
    }

    let totalPhaseCents = 0;
    for (let i = 0; i < input.constructionPhases.length; i++) {
      const p = input.constructionPhases[i];
      if (!String(p?.name || '').trim()) throw new BadRequestException(`Phase ${i + 1}: name is required`);
      if (!String(p?.description || '').trim()) throw new BadRequestException(`Phase ${i + 1}: description is required`);
      if (!String(p?.estimatedDuration || '').trim()) throw new BadRequestException(`Phase ${i + 1}: estimatedDuration is required`);
      const cents = this.moneyToCents(p?.estimatedCost);
      if (!Number.isFinite(cents) || cents <= 0) throw new BadRequestException(`Phase ${i + 1}: estimatedCost must be greater than 0`);
      totalPhaseCents += cents;
    }

    if (totalPhaseCents !== estCostCents) {
      throw new BadRequestException(
        `Construction phase costs must sum exactly to estimatedCost. Phase total: ${(totalPhaseCents / 100).toFixed(2)}, estimatedCost: ${(estCostCents / 100).toFixed(2)}`,
      );
    }
  }

  async createDesign(userId: string, createDesignDto: CreateDesignDto) {
    try {
      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        console.error('❌ [DesignsService] User not found:', userId);
        throw new Error(`User with ID ${userId} not found in database`);
      }

      // Validate required fields
      if (!createDesignDto.images || createDesignDto.images.length === 0) {
        throw new BadRequestException('At least one image is required');
      }

      // Calculate square meters (1 sqft = 0.092903 sqm)
      const squareMeters = createDesignDto.squareFootage * 0.092903;

      // Parse string arrays from comma-separated values
      const parseStringArray = (str?: string): string[] => {
        if (!str) return [];
        return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
      };

      // Parse construction phases (expecting JSON string)
      const parseConstructionPhases = (str?: string): any => {
        if (!str) return null;
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(str);
          return parsed;
        } catch (error) {
          console.error('❌ [DesignsService] Failed to parse constructionPhases as JSON:', error);
          // If not JSON, return null (don't store invalid data)
          return null;
        }
      };

      const parsedConstructionPhases = parseConstructionPhases(createDesignDto.constructionPhases);

      const parsedRooms = parseStringArray(createDesignDto.rooms);
      const parsedMaterials = parseStringArray(createDesignDto.materials);
      const parsedFeatures = parseStringArray(createDesignDto.features);

      // Strict validation: all fields required (no optional notes field in designs),
      // and construction phases must sum exactly to estimatedCost.
      this.assertDesignValidity({
        name: createDesignDto.name,
        description: createDesignDto.description,
        bedrooms: createDesignDto.bedrooms,
        bathrooms: createDesignDto.bathrooms,
        squareFootage: createDesignDto.squareFootage,
        estimatedCost: createDesignDto.estimatedCost,
        floors: createDesignDto.floors ?? null,
        estimatedDuration: createDesignDto.estimatedDuration ?? null,
        rooms: parsedRooms,
        materials: parsedMaterials,
        features: parsedFeatures,
        constructionPhases: parsedConstructionPhases,
      });

      const design = await this.prisma.design.create({
        data: {
          name: createDesignDto.name,
          description: createDesignDto.description,
          createdById: userId,
          bedrooms: createDesignDto.bedrooms,
          bathrooms: createDesignDto.bathrooms,
          squareFootage: createDesignDto.squareFootage,
          squareMeters,
          estimatedCost: createDesignDto.estimatedCost,
          floors: createDesignDto.floors || null,
          estimatedDuration: createDesignDto.estimatedDuration || null,
          rooms: parsedRooms,
          materials: parsedMaterials,
          features: parsedFeatures,
          constructionPhases: parsedConstructionPhases,
          images: {
            create: createDesignDto.images.map((img) => ({
              url: img.url,
              label: img.label || `Image`,
              order: img.order || 0,
            })),
          },
        },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      return design;
    } catch (error: any) {
      console.error('❌ [DesignsService] Error creating design:', error);
      
      // If it's a Prisma error, provide more context
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('A design with this name already exists');
      }
      if (error.code === 'P2003') {
        console.error('❌ [DesignsService] Foreign key constraint failed. User ID might not exist:', userId);
        throw new InternalServerErrorException(
          `User with ID ${userId} not found. Please log out and log back in, or contact support.`
        );
      }
      
      // If it's our custom user not found error, pass it through
      if (error.message && error.message.includes('User with ID') && error.message.includes('not found')) {
        throw new InternalServerErrorException(error.message);
      }
      
      throw new InternalServerErrorException(error.message || 'Failed to create design');
    }
  }

  async getAllDesigns() {
    return this.prisma.design.findMany({
      where: {
        isActive: true,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDesignById(designId: string) {
    const design = await this.prisma.design.findUnique({
      where: {
        id: designId,
        isActive: true,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          include: {
            contractorProfile: {
              select: {
                name: true,
                specialty: true,
                location: true,
                verified: true,
                rating: true,
                reviews: true,
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    return design;
  }

  async getDesignsByUser(userId: string) {
    return this.prisma.design.findMany({
      where: {
        createdById: userId,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteDesign(designId: string, userId: string) {
    // Check if design exists and belongs to user
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { createdById: true },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    if (design.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to delete this design');
    }

    await this.prisma.design.delete({
      where: { id: designId },
    });

    return { message: 'Design deleted successfully' };
  }

  async updateDesign(designId: string, userId: string, updateData: any) {
    // Check if design exists and belongs to user
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: {
        id: true,
        createdById: true,
        name: true,
        description: true,
        bedrooms: true,
        bathrooms: true,
        squareFootage: true,
        estimatedCost: true,
        floors: true,
        estimatedDuration: true,
        rooms: true,
        materials: true,
        features: true,
        constructionPhases: true,
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    if (design.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to update this design');
    }

    const updatePayload: any = {};

    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.bedrooms) updatePayload.bedrooms = parseInt(updateData.bedrooms);
    if (updateData.bathrooms) updatePayload.bathrooms = parseInt(updateData.bathrooms);
    if (updateData.squareFootage) {
      updatePayload.squareFootage = parseFloat(updateData.squareFootage);
      updatePayload.squareMeters = parseFloat(updateData.squareFootage) * 0.092903;
    }
    if (updateData.estimatedCost) updatePayload.estimatedCost = parseFloat(updateData.estimatedCost);
    if (updateData.floors !== undefined) updatePayload.floors = updateData.floors ? parseInt(updateData.floors) : null;
    if (updateData.estimatedDuration !== undefined) updatePayload.estimatedDuration = updateData.estimatedDuration || null;
    if (updateData.rooms !== undefined) {
      const parseStringArray = (str?: string): string[] => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
      };
      updatePayload.rooms = parseStringArray(updateData.rooms);
    }
    if (updateData.materials !== undefined) {
      const parseStringArray = (str?: string): string[] => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
      };
      updatePayload.materials = parseStringArray(updateData.materials);
    }
    if (updateData.features !== undefined) {
      const parseStringArray = (str?: string): string[] => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
      };
      updatePayload.features = parseStringArray(updateData.features);
    }
    if (updateData.constructionPhases !== undefined) {
      const parseConstructionPhases = (str?: string): any => {
        if (!str) return null;
        if (typeof str === 'object') return str; // Already parsed
        try {
          return JSON.parse(str);
        } catch (error) {
          console.error('❌ [DesignsService] Failed to parse constructionPhases in update:', error);
          return null;
        }
      };
      updatePayload.constructionPhases = parseConstructionPhases(updateData.constructionPhases);
    }
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

    // Validate merged result so updates cannot create invalid designs
    const merged = {
      name: updatePayload.name ?? design.name,
      description: updatePayload.description ?? design.description,
      bedrooms: updatePayload.bedrooms ?? design.bedrooms,
      bathrooms: updatePayload.bathrooms ?? design.bathrooms,
      squareFootage: updatePayload.squareFootage ?? design.squareFootage,
      estimatedCost: updatePayload.estimatedCost ?? design.estimatedCost,
      floors: updatePayload.floors ?? design.floors,
      estimatedDuration: updatePayload.estimatedDuration ?? design.estimatedDuration,
      rooms: updatePayload.rooms ?? design.rooms,
      materials: updatePayload.materials ?? design.materials,
      features: updatePayload.features ?? design.features,
      constructionPhases: updatePayload.constructionPhases ?? design.constructionPhases,
    };

    this.assertDesignValidity({
      name: merged.name,
      description: merged.description,
      bedrooms: merged.bedrooms,
      bathrooms: merged.bathrooms,
      squareFootage: merged.squareFootage,
      estimatedCost: merged.estimatedCost,
      floors: merged.floors,
      estimatedDuration: merged.estimatedDuration,
      rooms: merged.rooms,
      materials: merged.materials,
      features: merged.features,
      constructionPhases: merged.constructionPhases,
    });

    const updatedDesign = await this.prisma.design.update({
      where: { id: designId },
      data: updatePayload,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return updatedDesign;
  }
}

