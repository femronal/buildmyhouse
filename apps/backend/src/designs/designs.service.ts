import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDesignDto } from './dto/create-design.dto';

@Injectable()
export class DesignsService {
  // Use `any` for model access to avoid tight coupling when Prisma schema evolves.
  private prisma = new PrismaClient() as any;

  async getAllDesigns() {
    const designs = await this.prisma.design.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return designs;
  }

  async getDesignById(id: string) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    return design;
  }

  async getMyDesigns(userId: string) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.prisma.design.findMany({
      where: { createdById: userId },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDesign(userId: string, dto: CreateDesignDto) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    // DTO currently models some list fields as strings (for easy admin input). Convert to arrays if provided.
    const rooms =
      typeof dto.rooms === 'string' && dto.rooms.trim()
        ? dto.rooms
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const materials =
      typeof dto.materials === 'string' && dto.materials.trim()
        ? dto.materials
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const features =
      typeof dto.features === 'string' && dto.features.trim()
        ? dto.features
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    // constructionPhases is stored as JSONB in DB; accept either JSON string or plain text.
    let constructionPhases: any = undefined;
    if (typeof dto.constructionPhases === 'string' && dto.constructionPhases.trim()) {
      const raw = dto.constructionPhases.trim();
      try {
        constructionPhases = JSON.parse(raw);
      } catch {
        constructionPhases = raw;
      }
    }

    const created = await this.prisma.design.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: userId,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        squareFootage: dto.squareFootage,
        estimatedCost: dto.estimatedCost,
        floors: dto.floors,
        estimatedDuration: dto.estimatedDuration,
        rooms,
        materials,
        features,
        constructionPhases,
        images: {
          create: (dto.images || []).map((img) => ({
            url: img.url,
            label: img.label,
            order: img.order ?? 0,
          })),
        },
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    return created;
  }

  async updateDesign(params: { designId: string; actorUserId: string; actorRole: string; data: any }) {
    if (!params.actorUserId) {
      throw new BadRequestException('User not found');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      include: { images: true },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }
    if (params.actorRole !== 'admin' && existing.createdById !== params.actorUserId) {
      throw new ForbiddenException('You do not have permission to update this design');
    }

    // Only allow updating safe scalar fields via this endpoint for now.
    const allowed: Record<string, any> = {};
    const fields = [
      'name',
      'description',
      'bedrooms',
      'bathrooms',
      'squareFootage',
      'estimatedCost',
      'floors',
      'estimatedDuration',
      'rooms',
      'materials',
      'features',
      'constructionPhases',
      'isActive',
    ];
    for (const key of fields) {
      if (params.data?.[key] !== undefined) {
        allowed[key] = params.data[key];
      }
    }

    const updated = await this.prisma.design.update({
      where: { id: params.designId },
      data: allowed,
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    return updated;
  }

  async deleteDesign(params: { designId: string; actorUserId: string; actorRole: string }) {
    if (!params.actorUserId) {
      throw new BadRequestException('User not found');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      select: { id: true, createdById: true },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }
    if (params.actorRole !== 'admin' && existing.createdById !== params.actorUserId) {
      throw new ForbiddenException('You do not have permission to delete this design');
    }

    // Images are onDelete: Cascade via relation; this is safe.
    await this.prisma.design.delete({ where: { id: params.designId } });
    return { message: 'Design deleted successfully' };
  }
}

