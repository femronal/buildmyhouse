import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceIntelligenceAuditService } from './audit.service';

@Injectable()
export class PriceIntelligenceReviewerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  list() {
    return this.prisma.priceIntelligenceReviewer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: { select: { id: true, email: true, fullName: true, role: true } },
      },
    });
  }

  async upsert(input: {
    adminUserId: string;
    active?: boolean;
    categoryScope?: string[] | null;
    availabilityNotes?: string | null;
    maximumOpenCases?: number;
    actorAdminId: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: input.adminUserId } });
    if (!user || user.role !== 'admin') {
      throw new BadRequestException('Reviewer must be an admin user');
    }

    const before = await this.prisma.priceIntelligenceReviewer.findUnique({
      where: { adminUserId: input.adminUserId },
    });

    const row = await this.prisma.priceIntelligenceReviewer.upsert({
      where: { adminUserId: input.adminUserId },
      create: {
        adminUserId: input.adminUserId,
        active: input.active ?? true,
        categoryScope:
          input.categoryScope === undefined
            ? undefined
            : (input.categoryScope as Prisma.InputJsonValue),
        availabilityNotes: input.availabilityNotes ?? null,
        maximumOpenCases: input.maximumOpenCases ?? 25,
      },
      update: {
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.categoryScope !== undefined
          ? { categoryScope: input.categoryScope as Prisma.InputJsonValue }
          : {}),
        ...(input.availabilityNotes !== undefined
          ? { availabilityNotes: input.availabilityNotes }
          : {}),
        ...(input.maximumOpenCases !== undefined
          ? { maximumOpenCases: input.maximumOpenCases }
          : {}),
      },
    });

    await this.audit.write({
      action: 'reviewer.upsert',
      entityType: 'PriceIntelligenceReviewer',
      entityId: row.id,
      actorAdminId: input.actorAdminId,
      beforeJson: before,
      afterJson: row,
    });
    return row;
  }

  async setActive(adminUserId: string, active: boolean, actorAdminId: string) {
    const existing = await this.prisma.priceIntelligenceReviewer.findUnique({
      where: { adminUserId },
    });
    if (!existing) throw new NotFoundException('Reviewer not found');
    const row = await this.prisma.priceIntelligenceReviewer.update({
      where: { adminUserId },
      data: { active },
    });
    await this.audit.write({
      action: active ? 'reviewer.activate' : 'reviewer.deactivate',
      entityType: 'PriceIntelligenceReviewer',
      entityId: row.id,
      actorAdminId,
    });
    return row;
  }
}
