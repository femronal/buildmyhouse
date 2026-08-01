import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceIntelligenceAuditService } from './audit.service';

@Injectable()
export class SourceHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  async list() {
    const sources = await this.prisma.priceSource.findMany({
      where: { deletedAt: null },
      orderBy: [{ healthStatus: 'asc' }, { tier: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { observations: true, healthSnapshots: true } },
        disabledByAdmin: { select: { id: true, fullName: true, email: true } },
      },
    });
    return { items: sources, total: sources.length };
  }

  async get(sourceId: string) {
    const source = await this.prisma.priceSource.findUnique({
      where: { id: sourceId },
      include: {
        healthSnapshots: { orderBy: { createdAt: 'desc' }, take: 20 },
        disabledByAdmin: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!source) throw new NotFoundException('Source not found');
    return source;
  }

  async disable(sourceId: string, actorAdminId: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('Disable reason is required');
    await this.requireSource(sourceId);
    const updated = await this.prisma.priceSource.update({
      where: { id: sourceId },
      data: {
        healthStatus: 'disabled',
        disabledAt: new Date(),
        disabledByAdminId: actorAdminId,
        disabledReason: reason.trim(),
      },
    });
    await this.audit.write({
      action: 'source.disable',
      entityType: 'PriceSource',
      entityId: sourceId,
      actorAdminId,
      reason,
    });
    return updated;
  }

  async enable(sourceId: string, actorAdminId: string, note?: string) {
    await this.requireSource(sourceId);
    const updated = await this.prisma.priceSource.update({
      where: { id: sourceId },
      data: {
        healthStatus: 'unknown',
        disabledAt: null,
        disabledByAdminId: null,
        disabledReason: null,
        healthNote: note ?? null,
        consecutiveFailures: 0,
      },
    });
    await this.audit.write({
      action: 'source.enable',
      entityType: 'PriceSource',
      entityId: sourceId,
      actorAdminId,
      reason: note,
    });
    return updated;
  }

  /**
   * Manual recheck — records a snapshot only. Does not scrape illegally.
   */
  async recheck(
    sourceId: string,
    actorAdminId: string,
    input?: {
      healthStatus?: string;
      successRate?: number;
      parseSuccessRate?: number;
      avgLatencyMs?: number;
      note?: string;
    },
  ) {
    const source = await this.requireSource(sourceId);
    if (source.disabledAt) {
      throw new BadRequestException('Enable the source before rechecking');
    }

    const healthStatus = input?.healthStatus ?? 'healthy';
    const now = new Date();

    const updated = await this.prisma.priceSource.update({
      where: { id: sourceId },
      data: {
        healthStatus,
        lastCheckedAt: now,
        healthNote: input?.note ?? 'Manual admin check (no automated scrape)',
        successRate: input?.successRate ?? source.successRate,
        parseSuccessRate: input?.parseSuccessRate ?? source.parseSuccessRate,
        avgLatencyMs: input?.avgLatencyMs ?? source.avgLatencyMs,
        consecutiveFailures: healthStatus === 'healthy' ? 0 : source.consecutiveFailures,
        lastSuccessAt: healthStatus === 'healthy' ? now : source.lastSuccessAt,
        lastFailureAt: healthStatus === 'failing' ? now : source.lastFailureAt,
      },
    });

    const snapshot = await this.prisma.sourceHealthSnapshot.create({
      data: {
        sourceId,
        healthStatus,
        successRate: updated.successRate,
        parseSuccessRate: updated.parseSuccessRate,
        avgLatencyMs: updated.avgLatencyMs,
        consecutiveFailures: updated.consecutiveFailures,
        checkType: 'manual',
        note: input?.note ?? 'Manual admin check — no automated scrape performed',
        checkedByAdminId: actorAdminId,
      },
    });

    await this.audit.write({
      action: 'source.recheck',
      entityType: 'PriceSource',
      entityId: sourceId,
      actorAdminId,
      afterJson: { healthStatus, snapshotId: snapshot.id },
    });

    return { source: updated, snapshot };
  }

  private async requireSource(id: string) {
    const source = await this.prisma.priceSource.findUnique({ where: { id } });
    if (!source || source.deletedAt) throw new NotFoundException('Source not found');
    return source;
  }
}
