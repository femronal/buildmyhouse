import { Injectable, InternalServerErrorException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDesignDto } from './dto/create-design.dto';

@Injectable()
export class DesignsService {
  private prisma = new PrismaClient();

  async createDesign(userId: string, createDesignDto: CreateDesignDto) {
    try {
      console.log('🎨 [DesignsService] Creating design for user:', userId);
      console.log('🎨 [DesignsService] Design data:', JSON.stringify(createDesignDto, null, 2));

      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        console.error('❌ [DesignsService] User not found:', userId);
        throw new Error(`User with ID ${userId} not found in database`);
      }

      console.log('✅ [DesignsService] User found:', user.id, 'Role:', user.role);

      // Validate required fields
      if (!createDesignDto.name || !createDesignDto.name.trim()) {
        throw new Error('Design name is required');
      }
      if (!createDesignDto.bedrooms || createDesignDto.bedrooms < 1) {
        throw new Error('Bedrooms must be at least 1');
      }
      if (!createDesignDto.bathrooms || createDesignDto.bathrooms < 1) {
        throw new Error('Bathrooms must be at least 1');
      }
      if (!createDesignDto.squareFootage || createDesignDto.squareFootage < 1) {
        throw new Error('Square footage must be at least 1');
      }
      if (!createDesignDto.estimatedCost || createDesignDto.estimatedCost < 0) {
        throw new Error('Estimated cost must be 0 or greater');
      }
      if (!createDesignDto.images || createDesignDto.images.length === 0) {
        throw new Error('At least one image is required');
      }

      // Calculate square meters (1 sqft = 0.092903 sqm)
      const squareMeters = createDesignDto.squareFootage * 0.092903;

      console.log('💾 [DesignsService] Saving to database...');

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
          console.log('📋 [DesignsService] Parsed constructionPhases:', typeof parsed, Array.isArray(parsed) ? 'array' : typeof parsed);
          return parsed;
        } catch (error) {
          console.error('❌ [DesignsService] Failed to parse constructionPhases as JSON:', error);
          console.log('📋 [DesignsService] constructionPhases value:', str);
          // If not JSON, return null (don't store invalid data)
          return null;
        }
      };

      const parsedConstructionPhases = parseConstructionPhases(createDesignDto.constructionPhases);
      console.log('📋 [DesignsService] Saving constructionPhases:', parsedConstructionPhases);

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
          rooms: parseStringArray(createDesignDto.rooms),
          materials: parseStringArray(createDesignDto.materials),
          features: parseStringArray(createDesignDto.features),
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

      console.log('✅ [DesignsService] Design created successfully:', design.id);
      return design;
    } catch (error: any) {
      console.error('❌ [DesignsService] Error creating design:', error);
      console.error('❌ [DesignsService] Error code:', error.code);
      console.error('❌ [DesignsService] Error meta:', error.meta);
      
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
      select: { createdById: true },
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
      console.log('📋 [DesignsService] Updating constructionPhases:', updatePayload.constructionPhases);
    }
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

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

