import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    summary?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.hrAuditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        summary: params.summary || null,
        metadata: (params.metadata || undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async list(params?: { limit?: number; entityType?: string; entityId?: string }) {
    const take = Math.min(Math.max(params?.limit || 50, 1), 200);
    return this.prisma.hrAuditLog.findMany({
      where: {
        ...(params?.entityType ? { entityType: params.entityType } : {}),
        ...(params?.entityId ? { entityId: params.entityId } : {}),
      },
      include: {
        actor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
