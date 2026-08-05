import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAccessAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    actorUserId?: string | null;
    targetUserId?: string | null;
    action: string;
    summary?: string;
    previousValue?: unknown;
    newValue?: unknown;
    reason?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.adminAccessAuditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId ?? null,
        action: input.action,
        summary: input.summary,
        previousValue:
          input.previousValue === undefined
            ? undefined
            : (input.previousValue as Prisma.InputJsonValue),
        newValue:
          input.newValue === undefined ? undefined : (input.newValue as Prisma.InputJsonValue),
        reason: input.reason,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  async list(params?: {
    targetUserId?: string;
    action?: string;
    take?: number;
  }) {
    return this.prisma.adminAccessAuditLog.findMany({
      where: {
        targetUserId: params?.targetUserId,
        action: params?.action,
      },
      include: {
        actor: { select: { id: true, fullName: true, email: true } },
        target: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params?.take ?? 100,
    });
  }
}
