import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loadResearchConfig } from './research.config';
import { SOURCE_POLICIES } from './source-registry';
import { ACTIVE_CONFIDENCE_POLICY } from '../reports/confidence-policy';
import { REPORT_GENERATOR_VERSION } from '../reports/report';

/**
 * Read-only Stage 4 diagnostics for admins (deliverable 16). Surfaces the
 * active research configuration, provider status and per-request research
 * runs + observations from the Stage 3 append-only tables. No mutation.
 */
@Injectable()
export class ResearchDiagnosticsService {
  constructor(private readonly prisma: PrismaService) {}

  getConfig() {
    const config = loadResearchConfig();
    return {
      architecture: 'openai_first',
      primaryModel: config.extractionModel,
      searchProvider: config.searchProvider,
      pageRetriever: config.pageRetriever,
      browserFallbackEnabled: config.browserFallbackEnabled,
      limits: {
        maxSearchQueries: config.maxSearchQueries,
        maxSourcesPerItem: config.maxSourcesPerItem,
        researchTimeoutMs: config.researchTimeoutMs,
        sourceCacheTtlHours: config.sourceCacheTtlHours,
      },
      externalProvidersRequired: false,
      scoringPolicyVersion: ACTIVE_CONFIDENCE_POLICY.version,
      reportGeneratorVersion: REPORT_GENERATOR_VERSION,
      sourcePolicies: SOURCE_POLICIES.map((p) => ({
        name: p.name,
        domain: p.domain,
        tier: p.confidenceTier,
        discovery: p.searchDiscoveryEligible,
        directFetch: p.directFetchEligible,
        browserFallback: p.browserFallbackEligible,
        enabled: p.enabled,
        termsReviewStatus: p.termsReviewStatus,
      })),
    };
  }

  async getRunsForRequest(requestId: string) {
    const runs = await this.prisma.priceResearchRun.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
    const items = await this.prisma.priceResearchRequestItem.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
    return { requestId, items, runs };
  }

  /**
   * Full report audit (Stage 5 deliverable 21): the persisted snapshot payload
   * carries the confidence components, reasons, hard-gate failures, included/
   * excluded observations, policy versions and input hash for every item.
   */
  async getReportAudit(reportId: string) {
    const report = await this.prisma.priceReport.findUnique({
      where: { id: reportId },
      include: { items: true },
    });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);
    return {
      reportId: report.id,
      status: report.status,
      generatedAt: report.generatedAt,
      payload: report.payload,
      items: report.items.map((item) => ({
        id: item.id,
        requestItemId: item.requestItemId,
        outcome: item.outcome,
        rangeLow: item.rangeLow,
        rangeHigh: item.rangeHigh,
        typicalPrice: item.typicalPrice,
        currencyCode: item.currencyCode,
        unitCode: item.unitCode,
        sourceCount: item.sourceCount,
        confidence: item.confidence,
        locationMatchLevel: item.locationMatchLevel,
        /** Full Stage 5 snapshot: components, reasons, gates, exclusions, hash. */
        payload: item.payload,
      })),
    };
  }

  /** Observations for a family, newest first — proves source URL + check date retained. */
  async getObservations(familyId: string, take = 50) {
    return this.prisma.priceObservation.findMany({
      where: { familyId },
      orderBy: { checkedDate: 'desc' },
      take,
      select: {
        id: true,
        status: true,
        sourceId: true,
        originalWording: true,
        originalPrice: true,
        currencyCode: true,
        originalUnitCode: true,
        normalizedPrice: true,
        normalizedUnitCode: true,
        conversionFactorSource: true,
        checkedDate: true,
        listingDate: true,
        confidence: true,
        duplicateFingerprint: true,
      },
    });
  }
}
