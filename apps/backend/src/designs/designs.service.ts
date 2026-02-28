import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDesignDto } from './dto/create-design.dto';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class DesignsService {
  // Use `any` for model access to avoid tight coupling when Prisma schema evolves.
  private prisma = new PrismaClient() as any;
  constructor(private readonly wsService: WebSocketService) {}

  async getAllDesigns() {
    const designs = await this.prisma.design.findMany({
      where: { isActive: true, adminApprovalStatus: 'approved' },
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

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!actor) {
      throw new NotFoundException('User not found');
    }

    // Product rule: only verified GCs can publish plan uploads.
    if (actor.role === 'general_contractor') {
      const contractor = await this.prisma.contractor.findUnique({
        where: { userId },
        select: { verified: true },
      });
      if (!contractor?.verified) {
        throw new ForbiddenException(
          'Your account is not verified yet. Upload required verification documents and wait for admin approval before uploading plans.',
        );
      }
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
        planType: dto.planType || 'homebuilding',
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
        isActive: false,
        adminApprovalStatus: 'pending',
        adminReviewReason: null,
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

    await this.wsService.sendNotificationToRole('admin', {
      type: 'design_plan_pending_verification',
      title: 'New design plan pending review',
      message: `${created.createdBy?.fullName || 'A GC'} uploaded "${created.name}". Review and go live from Verification Center.`,
      data: {
        designId: created.id,
        createdById: created.createdById,
      },
    });

    return created;
  }

  async getPendingDesignsForAdmin(params: { actorRole: string }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can view pending design plans');
    }

    return this.prisma.design.findMany({
      where: { adminApprovalStatus: 'pending' },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDesignGoLive(params: {
    designId: string;
    adminUserId: string;
    actorRole: string;
  }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can approve design plans');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }

    const updated = await this.prisma.design.update({
      where: { id: params.designId },
      data: {
        isActive: true,
        adminApprovalStatus: 'approved',
        adminReviewReason: null,
        adminReviewedAt: new Date(),
        adminReviewedById: params.adminUserId,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.wsService.sendNotification(updated.createdById, {
      type: 'design_plan_went_live',
      title: 'Design plan is live',
      message: `Great news! Your design plan "${updated.name}" has been approved and is now visible to homeowners.`,
      data: {
        designId: updated.id,
      },
    });

    return updated;
  }

  async rejectDesignPlan(params: {
    designId: string;
    adminUserId: string;
    actorRole: string;
    reason: string;
  }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can reject design plans');
    }
    const reason = String(params.reason || '').trim();
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }

    const updated = await this.prisma.design.update({
      where: { id: params.designId },
      data: {
        isActive: false,
        adminApprovalStatus: 'rejected',
        adminReviewReason: reason,
        adminReviewedAt: new Date(),
        adminReviewedById: params.adminUserId,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.wsService.sendNotification(updated.createdById, {
      type: 'design_plan_rejected',
      title: 'Design plan requires updates',
      message: `Your design plan "${updated.name}" was not approved yet. Reason: ${reason}`,
      data: {
        designId: updated.id,
        reason,
      },
    });

    return updated;
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

    const parseCsvToArray = (value: unknown): string[] | undefined => {
      if (typeof value !== 'string') return undefined;
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    };

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
      'planType',
      'isActive',
    ];
    for (const key of fields) {
      if (params.data?.[key] !== undefined) {
        allowed[key] = params.data[key];
      }
    }

    // Keep update payload compatible with DB types (frontend sends CSV strings)
    if (typeof allowed.rooms === 'string') {
      allowed.rooms = parseCsvToArray(allowed.rooms);
    }
    if (typeof allowed.materials === 'string') {
      allowed.materials = parseCsvToArray(allowed.materials);
    }
    if (typeof allowed.features === 'string') {
      allowed.features = parseCsvToArray(allowed.features);
    }
    if (typeof allowed.constructionPhases === 'string') {
      const raw = allowed.constructionPhases.trim();
      try {
        allowed.constructionPhases = JSON.parse(raw);
      } catch {
        // If not valid JSON, keep raw string for backward compatibility.
        allowed.constructionPhases = raw;
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

