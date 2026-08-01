import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditWriteInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorAdminId?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
  reason?: string | null;
  metadata?: unknown;
}

@Injectable()
export class PriceIntelligenceAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Append-only. Never update or delete. */
  async write(input: AuditWriteInput): Promise<{ id: string }> {
    return this.prisma.priceIntelligenceAuditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        actorAdminId: input.actorAdminId ?? null,
        beforeJson:
          input.beforeJson === undefined ? undefined : (input.beforeJson as Prisma.InputJsonValue),
        afterJson:
          input.afterJson === undefined ? undefined : (input.afterJson as Prisma.InputJsonValue),
        reason: input.reason ?? null,
        metadata:
          input.metadata === undefined ? undefined : (input.metadata as Prisma.InputJsonValue),
      },
      select: { id: true },
    });
  }

  async list(args: {
    entityType?: string;
    entityId?: string;
    action?: string;
    take?: number;
    skip?: number;
  }) {
    const take = Math.min(Math.max(args.take ?? 50, 1), 200);
    const skip = Math.max(args.skip ?? 0, 0);
    const where: Prisma.PriceIntelligenceAuditLogWhereInput = {
      ...(args.entityType ? { entityType: args.entityType } : {}),
      ...(args.entityId ? { entityId: args.entityId } : {}),
      ...(args.action ? { action: args.action } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.priceIntelligenceAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.priceIntelligenceAuditLog.count({ where }),
    ]);
    return { items, total, take, skip };
  }
}
