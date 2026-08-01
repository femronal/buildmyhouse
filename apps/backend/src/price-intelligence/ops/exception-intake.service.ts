import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceCheckerReport } from '../reports/report';
import { computePriority } from './priority';
import { computeDueAt } from './sla';
import { PriceIntelligenceSettingsService } from './settings.service';
import { PriceIntelligenceAuditService } from './audit.service';

export interface ReportIntakeContext {
  reportId: string;
  reportItemId: string;
  familyKey?: string | null;
  productLabel?: string | null;
  locationKey?: string | null;
  paidCustomerImpactCount?: number;
  report: PriceCheckerReport;
}

/**
 * Creates review cases from report outcomes after persistReport.
 * High-confidence auto deliveries do NOT create cases.
 */
@Injectable()
export class ExceptionIntakeService {
  private readonly logger = new Logger(ExceptionIntakeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PriceIntelligenceSettingsService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  async createReviewCasesForReport(ctx: ReportIntakeContext): Promise<{ caseIds: string[] }> {
    const { report } = ctx;
    const label = (report.confidence?.label ?? '').toLowerCase();
    const score = typeof report.confidence?.score === 'number' ? report.confidence.score / 100 : null;
    const threshold = await this.settings.getLowConfidenceScoreThreshold();
    const sla = await this.settings.getSlaHours();

    const isInsufficient = report.status === 'insufficient_data' || label === 'insufficient_data';
    const isLowConfidence =
      !isInsufficient && (label === 'low' || (score !== null && score < threshold));

    // Do NOT create cases for high/moderate auto deliveries
    if (!isInsufficient && !isLowConfidence) {
      return { caseIds: [] };
    }

    // Idempotency: one open-ish case per report item + trigger
    const triggerCode = isInsufficient ? 'report_insufficient_data' : 'report_low_confidence';
    const existing = await this.prisma.priceReviewCase.findFirst({
      where: {
        reportItemId: ctx.reportItemId,
        triggerCode,
        status: { notIn: ['closed', 'resolved', 'rejected'] },
      },
      select: { id: true },
    });
    if (existing) return { caseIds: [existing.id] };

    const caseType = isInsufficient ? 'insufficient_data' : 'low_confidence';
    const paid = ctx.paidCustomerImpactCount ?? 0;
    const priority = computePriority({
      caseType,
      confidenceLabel: label || null,
      confidenceScore: score,
      paidCustomerImpactCount: paid,
      customerImpactCount: 1,
    });
    const openedAt = new Date();
    const dueAt = computeDueAt(priority.label, openedAt, sla);

    try {
      const created = await this.prisma.priceReviewCase.create({
        data: {
          caseType,
          priority: priority.label,
          priorityScore: priority.score,
          priorityReason: priority.reason,
          status: 'open',
          triggerCode,
          triggerDetails: {
            reportStatus: report.status,
            confidenceLabel: label,
            confidenceScore: score,
            generatorVersion: report.generatorVersion,
          } as Prisma.InputJsonValue,
          productFamilyKey: ctx.familyKey ?? null,
          productLabel: ctx.productLabel ?? report.product?.name ?? null,
          locationKey: ctx.locationKey ?? null,
          confidenceLabel: label || null,
          confidenceScore: score,
          reportId: ctx.reportId,
          reportItemId: ctx.reportItemId,
          customerImpactCount: 1,
          paidCustomerImpactCount: paid,
          dueAt,
          openedAt,
          createdByType: 'system',
          events: {
            create: {
              eventType: 'created',
              toStatus: 'open',
              note: `Auto-created from ${triggerCode}`,
              metadata: { priorityReason: priority.reason } as Prisma.InputJsonValue,
            },
          },
        },
      });

      await this.audit.write({
        action: 'review_case.auto_created',
        entityType: 'PriceReviewCase',
        entityId: created.id,
        afterJson: { caseType, triggerCode, priority: priority.label },
      });

      return { caseIds: [created.id] };
    } catch (err) {
      this.logger.warn(
        `Failed to create review case for report ${ctx.reportId}: ${(err as Error).message}`,
      );
      return { caseIds: [] };
    }
  }
}
