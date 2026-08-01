import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceIntelligenceAuditService } from './audit.service';
import { detectMaterialImpact, rangeFromPrices } from './material-impact';
import { PriceCheckerReport } from '../reports/report';

@Injectable()
export class ReportCorrectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  /**
   * Apply a correction to a delivered report:
   * - Preserves original payload in revision 1 (created lazily if missing)
   * - Creates a new revision with updated consumer-facing payload
   * - Sets customerUpdateNotice when material impact detected
   *
   * Prefer simple deterministic recalc from approved prices (median/range).
   */
  async applyCorrection(input: {
    reportId: string;
    reviewCaseId?: string | null;
    actorAdminId: string;
    reason: string;
    /** Approved observation prices for the report item (NGN). */
    approvedPrices?: number[];
    /** Explicit structured overrides when prices not provided. */
    pricingOverride?: {
      typicalPrice?: number | null;
      rangeLow?: number | null;
      rangeHigh?: number | null;
      confidenceLabel?: string;
      confidenceScore?: number;
      status?: PriceCheckerReport['status'];
    };
    customerNotice?: string | null;
  }) {
    if (!input.reason?.trim()) throw new BadRequestException('Reason is required');

    const report = await this.prisma.priceReport.findUnique({
      where: { id: input.reportId },
      include: { items: true, revisions: { orderBy: { version: 'asc' } } },
    });
    if (!report) throw new NotFoundException('Report not found');

    const originalPayload = report.payload as unknown as PriceCheckerReport;
    const before = {
      typicalPrice: originalPayload.pricing?.typicalPrice ?? null,
      rangeLow: originalPayload.pricing?.observedLow ?? null,
      rangeHigh: originalPayload.pricing?.observedHigh ?? null,
      confidenceLabel: originalPayload.confidence?.label ?? null,
      confidenceScore:
        typeof originalPayload.confidence?.score === 'number'
          ? originalPayload.confidence.score / 100
          : null,
      status: originalPayload.status,
    };

    let range = {
      low: before.rangeLow,
      high: before.rangeHigh,
      typical: before.typicalPrice,
    };
    if (input.approvedPrices && input.approvedPrices.length > 0) {
      range = rangeFromPrices(input.approvedPrices);
    } else if (input.pricingOverride) {
      range = {
        low: input.pricingOverride.rangeLow ?? range.low,
        high: input.pricingOverride.rangeHigh ?? range.high,
        typical: input.pricingOverride.typicalPrice ?? range.typical,
      };
    }

    const afterLabel =
      input.pricingOverride?.confidenceLabel ??
      (range.typical == null ? 'insufficient_data' : originalPayload.confidence?.label ?? 'moderate');
    const afterStatus: PriceCheckerReport['status'] =
      input.pricingOverride?.status ??
      (range.typical == null
        ? 'insufficient_data'
        : input.approvedPrices && input.approvedPrices.length === 1
          ? 'single_source'
          : 'complete');

    const after = {
      typicalPrice: range.typical,
      rangeLow: range.low,
      rangeHigh: range.high,
      confidenceLabel: afterLabel,
      confidenceScore: input.pricingOverride?.confidenceScore ?? before.confidenceScore,
      status: afterStatus,
    };

    const impact = detectMaterialImpact(before, after);

    const updatedPayload: PriceCheckerReport = {
      ...originalPayload,
      status: afterStatus,
      pricing: {
        ...originalPayload.pricing,
        observedLow: range.low,
        observedHigh: range.high,
        typicalPrice: range.typical,
        singleSourcePrice:
          afterStatus === 'single_source' ? range.typical : originalPayload.pricing.singleSourcePrice,
        acceptedObservationCount:
          input.approvedPrices?.length ?? originalPayload.pricing.acceptedObservationCount,
        independentSourceCount:
          input.approvedPrices?.length ?? originalPayload.pricing.independentSourceCount,
      },
      confidence: {
        ...originalPayload.confidence,
        label: afterLabel as PriceCheckerReport['confidence']['label'],
        score:
          typeof after.confidenceScore === 'number'
            ? Math.round(after.confidenceScore * 100)
            : originalPayload.confidence.score,
        limitingReasons: [
          ...(originalPayload.confidence.limitingReasons ?? []),
          `Admin correction: ${input.reason.trim()}`,
        ],
      },
      cautions: [
        ...(originalPayload.cautions ?? []),
        ...(impact.material
          ? [
              input.customerNotice?.trim() ||
                `This report was updated after review. ${impact.reasons.join('; ')}.`,
            ]
          : [`Admin correction applied: ${input.reason.trim()}`]),
      ],
    };

    const result = await this.prisma.$transaction(async (tx) => {
      // Ensure revision 1 preserves the original delivery snapshot
      if (report.revisions.length === 0) {
        await tx.priceReportRevision.create({
          data: {
            reportId: report.id,
            version: 1,
            payload: report.payload as Prisma.InputJsonValue,
            itemsSnapshot: report.items as unknown as Prisma.InputJsonValue,
            materialChange: false,
            reason: 'Original delivery snapshot',
            createdByAdminId: null,
          },
        });
      }

      const nextVersion = Math.max(report.currentVersion, 1) + 1;
      const customerNotice = impact.material
        ? input.customerNotice?.trim() ||
          `Updated after review: ${impact.reasons.join('; ')}.`
        : null;

      const revision = await tx.priceReportRevision.create({
        data: {
          reportId: report.id,
          version: nextVersion,
          payload: updatedPayload as unknown as Prisma.InputJsonValue,
          itemsSnapshot: report.items as unknown as Prisma.InputJsonValue,
          customerNotice,
          materialChange: impact.material,
          createdByAdminId: input.actorAdminId,
          reviewCaseId: input.reviewCaseId ?? null,
          reason: input.reason.trim(),
        },
      });

      const item = report.items[0];
      if (item) {
        await tx.priceReportItem.update({
          where: { id: item.id },
          data: {
            outcome: afterStatus === 'insufficient_data' ? 'insufficient_data' : 'priced',
            rangeLow: range.low != null ? new Prisma.Decimal(range.low) : null,
            rangeHigh: range.high != null ? new Prisma.Decimal(range.high) : null,
            medianPrice: range.typical != null ? new Prisma.Decimal(range.typical) : null,
            typicalPrice: range.typical != null ? new Prisma.Decimal(range.typical) : null,
            confidence:
              typeof after.confidenceScore === 'number' ? after.confidenceScore : item.confidence,
            sourceCount: input.approvedPrices?.length ?? item.sourceCount,
          },
        });
      }

      const updatedReport = await tx.priceReport.update({
        where: { id: report.id },
        data: {
          payload: updatedPayload as unknown as Prisma.InputJsonValue,
          currentVersion: nextVersion,
          customerUpdateNotice: customerNotice,
        },
      });

      return { revision, report: updatedReport, impact };
    });

    await this.audit.write({
      action: 'report.correct',
      entityType: 'PriceReport',
      entityId: report.id,
      actorAdminId: input.actorAdminId,
      reason: input.reason,
      afterJson: {
        version: result.revision.version,
        material: impact.material,
        reasons: impact.reasons,
      },
    });

    return result;
  }
}
