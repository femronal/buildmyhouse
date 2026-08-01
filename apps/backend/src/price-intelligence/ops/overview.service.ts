import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PriceIntelligenceOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      openCases,
      overdueCases,
      criticalOpen,
      assignedOpen,
      awaitingInfo,
      sourcesDisabled,
      sourcesFailing,
      manualPending,
      merchantPending,
      reports24h,
      insufficient24h,
      lowConfCases,
      recentAudit,
    ] = await Promise.all([
      this.prisma.priceReviewCase.count({
        where: { status: { notIn: ['closed', 'resolved'] } },
      }),
      this.prisma.priceReviewCase.count({
        where: {
          status: { notIn: ['closed', 'resolved'] },
          dueAt: { lt: now },
        },
      }),
      this.prisma.priceReviewCase.count({
        where: { priority: 'critical', status: { notIn: ['closed', 'resolved'] } },
      }),
      this.prisma.priceReviewCase.count({
        where: { status: { in: ['assigned', 'in_review'] } },
      }),
      this.prisma.priceReviewCase.count({ where: { status: 'awaiting_information' } }),
      this.prisma.priceSource.count({
        where: { OR: [{ healthStatus: 'disabled' }, { disabledAt: { not: null } }], deletedAt: null },
      }),
      this.prisma.priceSource.count({
        where: { healthStatus: { in: ['failing', 'degraded'] }, deletedAt: null },
      }),
      this.prisma.manualPriceEntry.count({
        where: { status: { in: ['submitted'] } },
      }),
      this.prisma.merchantPriceSubmission.count({
        where: { status: { in: ['submitted', 'in_review'] } },
      }),
      this.prisma.priceReport.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.priceReportItem.count({
        where: { outcome: 'insufficient_data', createdAt: { gte: dayAgo } },
      }),
      this.prisma.priceReviewCase.count({
        where: { caseType: 'low_confidence', status: { notIn: ['closed', 'resolved'] } },
      }),
      this.prisma.priceIntelligenceAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          reason: true,
        },
      }),
    ]);

    return {
      queue: {
        openCases,
        overdueCases,
        criticalOpen,
        assignedOpen,
        awaitingInfo,
        lowConfidenceOpen: lowConfCases,
      },
      sources: {
        disabled: sourcesDisabled,
        failingOrDegraded: sourcesFailing,
      },
      intake: {
        manualPendingReview: manualPending,
        merchantPendingReview: merchantPending,
      },
      delivery24h: {
        reports: reports24h,
        insufficientDataItems: insufficient24h,
      },
      recentAudit,
      generatedAt: now.toISOString(),
    };
  }
}
