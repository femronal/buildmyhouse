/**
 * Stage 6 — consumer report access, DTO mapping, save-to-account and PDF.
 *
 * Access rules (server-enforced):
 * - The owning authenticated user can always read their report.
 * - An anonymous report is readable with its secure random access token, or
 *   by the anonymous session that created it.
 * - Reports are keyed by UUID + token; they can never be enumerated.
 * - The consumer DTO strips the per-observation audit internals (those remain
 *   admin-only via /admin/price-research/reports/:id).
 */
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../../prisma/prisma.service';
import { PriceCheckerReport } from '../reports/report';
import { CONFIDENCE_POLICY_V1 } from '../reports/confidence-policy';
import { UsageIdentity } from './price-checker-usage.service';
import { ConsumerReportDto, ConsumerReportSource, SOURCE_TIER_LABELS } from './price-checker.types';

interface ReportRow {
  id: string;
  userId: string | null;
  anonymousSessionId: string | null;
  accessToken: string | null;
  payload: unknown;
  generatedAt: Date;
  currentVersion: number;
  customerUpdateNotice: string | null;
  updatedAt: Date;
}

@Injectable()
export class PriceCheckerReportService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadAuthorized(reportId: string, identity: UsageIdentity, token: string | null): Promise<ReportRow> {
    const report = await this.prisma.priceReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        userId: true,
        anonymousSessionId: true,
        accessToken: true,
        payload: true,
        generatedAt: true,
        currentVersion: true,
        customerUpdateNotice: true,
        updatedAt: true,
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const ownedByUser = Boolean(report.userId && identity.userId === report.userId);
    const ownedBySession = Boolean(report.anonymousSessionId && identity.anonymousSessionId === report.anonymousSessionId);
    const tokenOk = Boolean(token && report.accessToken && token === report.accessToken);
    if (!ownedByUser && !ownedBySession && !tokenOk) {
      throw new ForbiddenException('You do not have access to this report.');
    }
    return report;
  }

  async getConsumerReport(reportId: string, identity: UsageIdentity, token: string | null): Promise<ConsumerReportDto> {
    const row = await this.loadAuthorized(reportId, identity, token);
    return this.toConsumerDto(row);
  }

  /** Preserve an anonymous report in the signed-in user's history. */
  async saveToAccount(reportId: string, identity: UsageIdentity, token: string | null): Promise<{ saved: boolean }> {
    if (!identity.userId) throw new ForbiddenException('Sign in to save reports.');
    const row = await this.loadAuthorized(reportId, identity, token);
    if (row.userId && row.userId !== identity.userId) {
      throw new ForbiddenException('This report already belongs to another account.');
    }
    if (!row.userId) {
      await this.prisma.priceReport.update({ where: { id: reportId }, data: { userId: identity.userId } });
    }
    return { saved: true };
  }

  /** Signed-in user's report history (most recent first). */
  async listMyReports(userId: string): Promise<Array<{ reportId: string; generatedAt: string; title: string; status: string }>> {
    const rows = await this.prisma.priceReport.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      take: 50,
      select: { id: true, generatedAt: true, payload: true },
    });
    return rows.map((r) => {
      const payload = r.payload as unknown as PriceCheckerReport;
      return {
        reportId: r.id,
        generatedAt: r.generatedAt.toISOString(),
        title: payload?.product?.name ?? 'Price report',
        status: payload?.status ?? 'complete',
      };
    });
  }

  // -------------------------------------------------------------------------
  // Consumer DTO
  // -------------------------------------------------------------------------

  private toConsumerDto(row: ReportRow): ConsumerReportDto {
    const report = row.payload as unknown as PriceCheckerReport;
    const weights = CONFIDENCE_POLICY_V1.weights;
    const sources: ConsumerReportSource[] = report.sources.map((s) => ({
      sellerName: s.sellerName,
      sourceTierLabel: SOURCE_TIER_LABELS[s.sourceTier] ?? 'Marketplace listing',
      displayedPrice: s.displayedPrice,
      currency: s.currency,
      normalizedPrice: s.normalizedPrice,
      originalUnit: s.originalUnit,
      normalizedUnit: s.normalizedUnit,
      sellerLocationClass: s.sellerLocationClass,
      sourceUrl: s.sourceUrl,
      listingDate: s.listingDate,
      dateChecked: s.dateChecked,
    }));

    return {
      reportId: report.reportId,
      status: report.status,
      generatedAt: report.generatedAt,
      product: report.product,
      location: report.location,
      pricing: {
        currency: report.pricing.currency,
        observedLow: report.pricing.observedLow,
        observedHigh: report.pricing.observedHigh,
        typicalPrice: report.pricing.typicalPrice,
        normalisedUnit: report.pricing.normalisedUnit,
        acceptedObservationCount: report.pricing.acceptedObservationCount,
        independentSourceCount: report.pricing.independentSourceCount,
        excludedListingCount: report.confidence.excludedObservations.length,
        singleSourcePrice: report.pricing.singleSourcePrice,
      },
      inclusions: report.inclusions,
      exclusions: report.exclusions,
      unknowns: report.unknowns,
      sources,
      confidence: {
        score: report.confidence.score,
        label: report.confidence.label,
        positiveReasons: report.confidence.positiveReasons,
        limitingReasons: report.confidence.limitingReasons,
        limitations: report.confidence.hardGateFailures,
        components: {
          sourceQuality: { score: report.confidence.components.sourceQuality, max: weights.sourceQuality },
          recency: { score: report.confidence.components.recency, max: weights.recency },
          specificationMatch: { score: report.confidence.components.specificationMatch, max: weights.specificationMatch },
          locationMatch: { score: report.confidence.components.locationMatch, max: weights.locationMatch },
          priceClustering: { score: report.confidence.components.clusterTightness, max: weights.clusterTightness },
        },
      },
      cautions: report.cautions,
      insufficientData: report.insufficientData,
      buildMyHouseNextStep: report.buildMyHouseNextStep,
      scoringVersion: report.confidence.scoringVersion,
      savedToAccount: Boolean(row.userId),
      reportVersion: row.currentVersion,
      updateNotice: row.customerUpdateNotice,
      updatedAt: row.currentVersion > 1 ? row.updatedAt.toISOString() : null,
    };
  }

  // -------------------------------------------------------------------------
  // PDF (server-side, on demand, same access control as the report)
  // -------------------------------------------------------------------------

  async generatePdf(reportId: string, identity: UsageIdentity, token: string | null): Promise<Buffer> {
    const row = await this.loadAuthorized(reportId, identity, token);
    const dto = this.toConsumerDto(row);
    const webBase = (process.env.PRICE_CHECKER_WEB_BASE_URL ?? 'https://buildmyhouse.app').replace(/\/+$/, '');
    const onlineUrl = `${webBase}/tools/price-checker/reports/${dto.reportId}${
      row.accessToken ? `?token=${encodeURIComponent(row.accessToken)}` : ''
    }`;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 48, autoFirstPage: true, bufferPages: true });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        const safe = (value: unknown) => String(value ?? '').replace(/\u0000/g, '');
        const naira = (v: number | null) => (v === null || Number.isNaN(v) ? '—' : `NGN ${Number(v).toLocaleString('en-NG')}`);
        const write = (text: string, options?: { link?: string }) => {
          doc.text(safe(text), options);
        };
        const writeLink = (label: string, href: string | null | undefined) => {
          const url = safe(href).trim();
          if (/^https?:\/\//i.test(url)) {
            write(label || url, { link: url });
          } else {
            write(label || url || '—');
          }
        };
        const heading = (text: string) => {
          doc.moveDown(0.9);
          doc.fontSize(11).fillColor('#111827');
          write(text.toUpperCase());
          doc.moveDown(0.35);
          doc.fontSize(10).fillColor('#374151');
        };

        doc.fontSize(18).fillColor('#111827');
        write('BuildMyHouse Price Checker Report');
        doc.moveDown(0.2);
        doc.fontSize(9).fillColor('#6b7280');
        write(`Reference: ${dto.reportId}`);
        write(
          `Generated: ${new Date(dto.generatedAt).toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })}`,
        );
        writeLink(`Online report: ${onlineUrl}`, onlineUrl);

        heading('Product');
        const specEntries = dto.product?.specification && typeof dto.product.specification === 'object'
          ? Object.entries(dto.product.specification)
          : [];
        const specText = specEntries.map(([k, v]) => `${k}: ${v}`).join('  ·  ');
        write(`${dto.product?.name ?? 'Product'}${dto.product?.brand ? ` (${dto.product.brand})` : ''}`);
        if (specText) {
          doc.fillColor('#6b7280');
          write(specText);
          doc.fillColor('#374151');
        }

        heading('Location');
        write(dto.location?.requested ?? '—');
        for (const lim of dto.location?.limitations ?? []) {
          doc.fillColor('#6b7280');
          write(`Note: ${lim}`);
          doc.fillColor('#374151');
        }

        if (dto.status === 'insufficient_data' && dto.insufficientData) {
          heading('Result — insufficient reliable data');
          write(dto.insufficientData.explanation);
          heading('What was missing');
          for (const m of dto.insufficientData.missingData ?? []) write(`• ${m}`);
          heading('What you can do next');
          for (const s of dto.insufficientData.nextSteps ?? []) write(`• ${s}`);
        } else if (dto.status === 'single_source') {
          heading('Single-source observed price');
          doc.fontSize(14).fillColor('#111827');
          write(`${naira(dto.pricing.singleSourcePrice)} per ${dto.pricing.normalisedUnit ?? 'unit'}`);
          doc.fontSize(10).fillColor('#374151');
          doc.moveDown(0.3);
          write('This is one observed price from a single independent source. It is not a market range.');
        } else {
          heading('Latest observed range');
          doc.fontSize(14).fillColor('#111827');
          write(
            `${naira(dto.pricing.observedLow)} – ${naira(dto.pricing.observedHigh)} per ${dto.pricing.normalisedUnit ?? 'unit'}`,
          );
          doc.fontSize(10).fillColor('#374151');
          doc.moveDown(0.3);
          write(
            `Typical observed price: ${naira(dto.pricing.typicalPrice)} per ${dto.pricing.normalisedUnit ?? 'unit'} (median of accepted observations)`,
          );
        }

        if (dto.status !== 'insufficient_data') {
          heading('What the price appears to include');
          for (const i of dto.inclusions ?? []) write(`• ${i}`);
          for (const e of dto.exclusions ?? []) write(`• ${e}`);
          for (const u of dto.unknowns ?? []) write(`• ${u}`);
        }

        heading('Sources checked');
        if (!dto.sources?.length) {
          write('No source passed validation for this exact request.');
        }
        for (const s of dto.sources ?? []) {
          doc.fillColor('#111827');
          write(
            `${s.sellerName ?? 'Unnamed seller'} — ${s.currency} ${Number(s.displayedPrice).toLocaleString('en-NG')}${
              s.originalUnit ? ` per ${s.originalUnit}` : ''
            }`,
          );
          doc.fillColor('#6b7280').fontSize(8.5);
          write(
            `${s.sourceTierLabel} · checked ${String(s.dateChecked ?? '').slice(0, 10)}${
              s.listingDate ? ` · listed ${String(s.listingDate).slice(0, 10)}` : ''
            }`,
          );
          writeLink(s.sourceUrl, s.sourceUrl);
          doc.fontSize(10).fillColor('#374151').moveDown(0.35);
        }

        heading('Confidence');
        doc.fillColor('#111827');
        write(
          `${String(dto.confidence?.label ?? 'unknown').replace(/_/g, ' ').toUpperCase()} — ${dto.confidence?.score ?? 0}/100 (policy ${dto.scoringVersion})`,
        );
        doc.fillColor('#374151');
        for (const r of dto.confidence?.positiveReasons ?? []) write(`+ ${r}`);
        for (const r of dto.confidence?.limitingReasons ?? []) write(`− ${r}`);

        heading('Important caution');
        for (const c of dto.cautions ?? []) write(`• ${c}`);

        heading('BuildMyHouse next step');
        write(`${dto.buildMyHouseNextStep?.label ?? 'Continue'}: ${webBase}${dto.buildMyHouseNextStep?.destination ?? ''}`);

        heading('Online report');
        write('This PDF can be regenerated any time. Keep the online report link for your records:');
        writeLink(onlineUrl, onlineUrl);

        doc.moveDown(1);
        doc.fontSize(8).fillColor('#9ca3af');
        write(
          'Disclaimer: this report reflects publicly observed advertised prices at the dates shown. It is a research baseline, ' +
            'not a quotation, valuation or guarantee. Advertised prices are frequently negotiable and can change quickly. ' +
            'BuildMyHouse is not responsible for purchasing decisions made solely on this report.',
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
