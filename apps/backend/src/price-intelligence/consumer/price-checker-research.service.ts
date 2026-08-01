/**
 * Stage 6 — consumer research job orchestration.
 *
 * Connects the guided flow to the EXISTING systems:
 *   Stage 2 catalogue answers → deterministic PlanTarget
 *   Stage 4 `researchItem` (unchanged pipeline, optional progress hook)
 *   Stage 5 `toScoringObservations` + `generateReport` (deterministic scoring)
 *   Stage 3 tables (PriceResearchRequest/Run + PriceReport snapshot)
 *
 * Jobs run in-process with an AbortController. There is NO true pause/resume
 * on a live research job: "pause" during research is an honest cancel that
 * preserves answers (the UI says so explicitly). Progress reported to the
 * client contains only real stages and real counters from the pipeline.
 */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  Inject,
  forwardRef,
  Optional,
} from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { loadResearchConfig } from '../research/research.config';
import { loadModelPricing } from '../research/cost';
import { buildSearchProvider, buildPageRetriever, buildExtractor, buildBrowserRetriever } from '../research/providers';
import { researchItem, Planner, PipelineDeps, PipelineProgress, ResearchItemResult } from '../research/pipeline';
import { generateSearchPlan, PlanTarget } from '../research/planner';
import { toScoringObservations } from '../reports/bridge';
import { generateReport, ReportRequest, PriceCheckerReport, REPORT_GENERATOR_VERSION } from '../reports/report';
import { Answers } from '../taxonomy';
import { PriceCheckerCatalogueService } from './price-checker-catalogue.service';
import { PriceCheckerUsageService, UsageIdentity } from './price-checker-usage.service';
import { ResearchStageCode, ResearchStatusDto, ResearchJobStatus } from './price-checker.types';
import { PriceCheckerFulfilmentService } from '../payments/fulfilment.service';
import { ExceptionIntakeService } from '../ops/exception-intake.service';

export interface StartResearchInput {
  familyKey: string;
  kind: 'product' | 'service';
  answers: Answers;
  locationKey: string;
  rawProductName: string;
}

export interface PaidStartContext {
  paymentOrderId: string;
  lineItemId: string;
}

interface JobEntry {
  requestId: string;
  runId: string;
  controller: AbortController;
  ownerUserId: string | null;
  ownerSessionId: string | null;
  status: ResearchJobStatus;
  stage: ResearchStageCode;
  startedAtMs: number;
  finishedAtMs: number | null;
  counters: {
    discoveredSourceCount: number | null;
    retrievedPageCount: number | null;
    acceptedObservationCount: number | null;
    independentSourceCount: number | null;
  };
  reportId: string | null;
  reportAccessToken: string | null;
  errorCategory: 'timeout' | 'sources_unavailable' | 'internal' | null;
  timedOut: boolean;
  paymentLineItemId: string | null;
  paymentOrderId: string | null;
}

function intEnv(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

@Injectable()
export class PriceCheckerResearchService implements OnModuleDestroy {
  private readonly logger = new Logger(PriceCheckerResearchService.name);
  private readonly jobs = new Map<string, JobEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogue: PriceCheckerCatalogueService,
    private readonly usage: PriceCheckerUsageService,
    @Optional()
    @Inject(forwardRef(() => PriceCheckerFulfilmentService))
    private readonly fulfilment: PriceCheckerFulfilmentService | null,
    @Optional()
    private readonly exceptionIntake: ExceptionIntakeService | null = null,
  ) {}

  onModuleDestroy() {
    for (const job of this.jobs.values()) job.controller.abort();
  }

  private buildDeps(onProgress: (p: PipelineProgress) => void): PipelineDeps {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('Price research is temporarily unavailable.');
    const config = loadResearchConfig(process.env);
    const pricing = loadModelPricing(process.env);
    const client = new OpenAI({ apiKey });
    const planner: Planner = {
      plan: (target: PlanTarget, signal?: AbortSignal) => generateSearchPlan(client, config, target, signal),
    };
    return {
      planner,
      searchProvider: buildSearchProvider(client, config),
      pageRetriever: buildPageRetriever(config),
      extractor: buildExtractor(client, config),
      browserRetriever: buildBrowserRetriever(config),
      config,
      pricing,
      onProgress,
    };
  }

  // -------------------------------------------------------------------------
  // Start
  // -------------------------------------------------------------------------

  async start(
    input: StartResearchInput,
    identity: UsageIdentity,
    opts?: { paymentOrderId?: string },
  ): Promise<{ requestId: string }> {
    if (!identity.userId && !identity.anonymousSessionId) {
      throw new BadRequestException('Missing session identifier.');
    }

    // Server-side validation of the full answer set — the client is never trusted.
    const preview = this.catalogue.questionsPreview(input.familyKey, input.kind, input.answers);
    if (preview.contradictions.length > 0) {
      throw new BadRequestException(`Contradictory answers: ${preview.contradictions.join('; ')}`);
    }
    if (preview.missingRequiredIds.length > 0) {
      throw new BadRequestException(`Required questions unanswered: ${preview.missingRequiredIds.join(', ')}`);
    }
    this.catalogue.requireLocation(input.locationKey);
    this.validateAnswerValues(input, preview.questions.map((q) => q.id));

    const usage = await this.usage.usageStatus(identity);
    let paid: PaidStartContext | null = null;

    if (usage.allowed) {
      // Free path — ignore paymentOrderId even if supplied.
    } else if (opts?.paymentOrderId && this.fulfilment) {
      paid = await this.fulfilment.consumeEntitlementForStart(opts.paymentOrderId, input, identity);
    } else {
      // Stage 7: free allowance exhausted → ask for payment (not sign-in).
      throw new ForbiddenException({
        code: 'payment_required',
        remainingFree: 0,
        usage,
      });
    }

    return this.beginResearch(input, identity, paid, usage.allowed ? 'free_daily' : 'paid_report');
  }

  /**
   * Start research for a line item that was already claimed by fulfilment
   * (paid batch start). Skips free-allowance checks.
   */
  async startPaid(
    input: StartResearchInput,
    identity: UsageIdentity,
    paid: PaidStartContext,
  ): Promise<{ requestId: string }> {
    if (!identity.userId && !identity.anonymousSessionId) {
      throw new BadRequestException('Missing session identifier.');
    }
    const preview = this.catalogue.questionsPreview(input.familyKey, input.kind, input.answers);
    if (preview.contradictions.length > 0) {
      throw new BadRequestException(`Contradictory answers: ${preview.contradictions.join('; ')}`);
    }
    if (preview.missingRequiredIds.length > 0) {
      throw new BadRequestException(`Required questions unanswered: ${preview.missingRequiredIds.join(', ')}`);
    }
    this.catalogue.requireLocation(input.locationKey);
    this.validateAnswerValues(input, preview.questions.map((q) => q.id));
    return this.beginResearch(input, identity, paid, 'paid_report');
  }

  private async beginResearch(
    input: StartResearchInput,
    identity: UsageIdentity,
    paid: PaidStartContext | null,
    type: 'free_daily' | 'paid_report',
  ): Promise<{ requestId: string }> {
    const running = [...this.jobs.values()].filter((j) => j.status === 'processing').length;
    if (running >= intEnv('PRICE_CHECKER_MAX_CONCURRENT_JOBS', 3)) {
      throw new ServiceUnavailableException('The price checker is busy right now. Please try again in a minute.');
    }

    const [familyRow, locationRow] = await Promise.all([
      this.prisma.priceProductFamily.findUnique({ where: { key: input.familyKey } }).catch(() => null),
      this.prisma.priceLocation.findUnique({ where: { code: input.locationKey } }).catch(() => null),
    ]);

    const requestId = randomUUID();
    const requestItemId = randomUUID();
    const runId = randomUUID();

    await this.prisma.priceResearchRequest.create({
      data: {
        id: requestId,
        userId: identity.userId,
        anonymousSessionId: identity.userId ? null : identity.anonymousSessionId,
        type,
        status: 'researching',
        requestedLocationId: locationRow?.id ?? null,
        paymentOrderId: paid?.paymentOrderId ?? null,
        paymentReference: null,
        items: {
          create: {
            id: requestItemId,
            familyId: input.kind === 'product' ? (familyRow?.id ?? null) : null,
            rawProductName: input.rawProductName.slice(0, 300),
            specification: this.knownAnswers(input.answers) as Prisma.InputJsonValue,
            status: 'researching',
            countsTowardAllowance: false, // settled truthfully at completion
          },
        },
        runs: {
          create: {
            id: runId,
            requestItemId: undefined,
            status: 'running',
            engineVersion: REPORT_GENERATOR_VERSION,
          },
        },
      },
    });
    await this.prisma.priceResearchRun.update({ where: { id: runId }, data: { requestItemId } });

    if (paid) {
      await this.prisma.priceCheckPaymentLineItem
        .update({
          where: { id: paid.lineItemId },
          data: { researchRequestId: requestId },
        })
        .catch(() => undefined);
    }

    await this.prisma.priceQuery
      .create({
        data: {
          userId: identity.userId,
          rawQuery: input.rawProductName.slice(0, 300),
          normalizedQuery: input.rawProductName.trim().toLowerCase().slice(0, 300),
          matchedFamilyId: familyRow?.id ?? null,
          matchType: 'exact_alias',
          locationId: locationRow?.id ?? null,
          channel: type === 'paid_report' ? 'paid_report' : 'free_daily_check',
        },
      })
      .catch(() => undefined);

    this.usage.recordIpStart(identity.ip);

    const job: JobEntry = {
      requestId,
      runId,
      controller: new AbortController(),
      ownerUserId: identity.userId,
      ownerSessionId: identity.userId ? null : identity.anonymousSessionId,
      status: 'processing',
      stage: 'validating_request',
      startedAtMs: Date.now(),
      finishedAtMs: null,
      counters: {
        discoveredSourceCount: null,
        retrievedPageCount: null,
        acceptedObservationCount: null,
        independentSourceCount: null,
      },
      reportId: null,
      reportAccessToken: null,
      errorCategory: null,
      timedOut: false,
      paymentLineItemId: paid?.lineItemId ?? null,
      paymentOrderId: paid?.paymentOrderId ?? null,
    };
    this.jobs.set(requestId, job);

    void this.runJob(job, input, requestItemId).catch((err) => {
      this.logger.error(`Job ${requestId} crashed: ${err instanceof Error ? err.stack : String(err)}`);
    });

    return { requestId };
  }

  private knownAnswers(answers: Answers): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(answers)) {
      if (typeof v === 'string' && v !== '') out[k.slice(0, 60)] = v.slice(0, 200);
    }
    return out;
  }

  private validateAnswerValues(input: StartResearchInput, validIds: string[]): void {
    const validSet = new Set(validIds);
    for (const [key, value] of Object.entries(input.answers)) {
      if (!validSet.has(key)) throw new BadRequestException(`Unknown question '${key}'`);
      if (value !== undefined && value.length > 200) {
        throw new BadRequestException(`Answer for '${key}' is too long`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Runner
  // -------------------------------------------------------------------------

  private async runJob(job: JobEntry, input: StartResearchInput, requestItemId: string): Promise<void> {
    const setStage = (stage: ResearchStageCode) => {
      if (job.status === 'processing') job.stage = stage;
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const deps = this.buildDeps((p: PipelineProgress) => {
        setStage(p.stage);
        job.counters.discoveredSourceCount = p.discoveredUrlCount;
        job.counters.retrievedPageCount = p.retrievedPageCount;
        job.counters.acceptedObservationCount = p.acceptedObservationCount;
        void this.persistProgress(job).catch(() => undefined);
      });

      timer = setTimeout(() => {
        job.timedOut = true;
        job.controller.abort();
      }, deps.config.researchTimeoutMs);

      const target = this.catalogue.buildPlanTarget({
        requestItemId,
        researchRunId: job.runId,
        familyKey: input.familyKey,
        kind: input.kind,
        answers: input.answers,
        locationKey: input.locationKey,
      });

      const result = await researchItem(target, deps, job.controller.signal);
      if (timer) clearTimeout(timer);
      if ((job.status as ResearchJobStatus) === 'cancelled') return;

      // Stage 5 — deterministic scoring + report generation (fast, real stages).
      setStage('removing_duplicates');
      const scoringObservations = toScoringObservations(result.acceptedObservations, requestItemId);
      setStage('scoring_confidence');

      const requestedCondition = this.requestedCondition(input.answers);
      const reportId = randomUUID();
      const reportRequest: ReportRequest = {
        reportId,
        productName: target.canonicalProductName,
        brand: target.brand ?? null,
        specification: this.knownAnswers(input.answers),
        requestedUnit: target.preferredComparisonUnit,
        requestedLocationLabel: target.locationLabel,
        requestedCondition,
        generatedAtIso: new Date().toISOString(),
      };
      const report = generateReport(reportRequest, scoringObservations);
      job.counters.independentSourceCount = report.pricing.independentSourceCount;
      job.counters.acceptedObservationCount = report.pricing.acceptedObservationCount;

      setStage('preparing_report');
      const accessToken = randomBytes(24).toString('base64url');
      await this.persistReport({ job, requestItemId, report, result, accessToken });

      job.reportId = reportId;
      job.reportAccessToken = accessToken;
      job.status = report.status === 'insufficient_data' ? 'insufficient_data' : 'completed';
      job.finishedAtMs = Date.now();

      if (job.paymentLineItemId && this.fulfilment) {
        const estimatedUsd =
          typeof result.cost?.estimatedUsd === 'number' ? result.cost.estimatedUsd : null;
        await this.fulfilment
          .markLineFulfilled({
            lineItemId: job.paymentLineItemId,
            reportId,
            outcome: report.status === 'insufficient_data' ? 'insufficient_data' : 'priced',
            researchCostUsd: estimatedUsd,
          })
          .catch((e) =>
            this.logger.warn(
              `Fulfilment update failed for ${job.paymentLineItemId}: ${e instanceof Error ? e.message : String(e)}`,
            ),
          );
      }
    } catch (err) {
      if (timer) clearTimeout(timer);
      if ((job.status as ResearchJobStatus) === 'cancelled') return;
      job.status = 'failed';
      job.finishedAtMs = Date.now();
      job.errorCategory = job.timedOut ? 'timeout' : 'internal';
      this.logger.error(
        `Research ${job.requestId} failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`,
      );
      await this.prisma.priceResearchRun
        .update({
          where: { id: job.runId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            errorSummary: (err instanceof Error ? err.message : String(err)).slice(0, 500),
          },
        })
        .catch(() => undefined);
      await this.prisma.priceResearchRequest
        .update({ where: { id: job.requestId }, data: { status: 'failed' } })
        .catch(() => undefined);
      if (job.paymentLineItemId && this.fulfilment) {
        await this.fulfilment
          .markLineFulfilled({
            lineItemId: job.paymentLineItemId,
            reportId: '',
            outcome: 'failed',
          })
          .catch(() => undefined);
      }
    } finally {
      // Keep terminal jobs in memory for a while so status polls resolve fast.
      setTimeout(() => this.jobs.delete(job.requestId), 30 * 60 * 1000).unref?.();
    }
  }

  private requestedCondition(answers: Answers): 'new' | 'used' | 'any' {
    const v = (answers['condition'] ?? '').toLowerCase();
    if (v.includes('used') || v.includes('tokunbo')) return 'used';
    if (v.includes('new')) return 'new';
    return 'any';
  }

  private async persistProgress(job: JobEntry): Promise<void> {
    await this.prisma.priceResearchRun.update({
      where: { id: job.runId },
      data: {
        progressJson: {
          stage: job.stage,
          counters: job.counters,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async persistReport(args: {
    job: JobEntry;
    requestItemId: string;
    report: PriceCheckerReport;
    result: ResearchItemResult;
    accessToken: string;
  }): Promise<void> {
    const { job, requestItemId, report, result, accessToken } = args;
    const priced = report.status !== 'insufficient_data';
    const countsTowardAllowance = priced || this.usage.countInsufficientData;

    const created = await this.prisma.$transaction(async (tx) => {
      const reportRow = await tx.priceReport.create({
        data: {
          id: report.reportId,
          requestId: job.requestId,
          userId: job.ownerUserId,
          anonymousSessionId: job.ownerSessionId,
          accessToken,
          status: 'delivered',
          payload: report as unknown as Prisma.InputJsonValue,
          items: {
            create: {
              requestItemId,
              outcome: priced ? 'priced' : 'insufficient_data',
              rangeLow: report.pricing.observedLow,
              rangeHigh: report.pricing.observedHigh,
              medianPrice: report.pricing.typicalPrice,
              typicalPrice: report.pricing.typicalPrice ?? report.pricing.singleSourcePrice,
              currencyCode: report.pricing.currency ?? 'NGN',
              unitCode: report.pricing.normalisedUnit,
              sourceCount: report.pricing.independentSourceCount,
              confidence: report.confidence.score / 100,
              payload: {
                cost: result.cost,
                searchQueries: result.searchQueries,
                reasons: result.reasons,
              } as Prisma.InputJsonValue,
            },
          },
        },
        include: { items: true },
      });
      await tx.priceResearchRequestItem.update({
        where: { id: requestItemId },
        data: { status: 'completed', countsTowardAllowance },
      });
      await tx.priceResearchRun.update({
        where: { id: job.runId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          costTokens: result.cost.inputTokens + result.cost.outputTokens,
          progressJson: { stage: 'preparing_report', counters: job.counters } as Prisma.InputJsonValue,
        },
      });
      await tx.priceResearchRequest.update({
        where: { id: job.requestId },
        data: { status: 'completed' },
      });
      return reportRow;
    });

    // Stage 8 — exception intake after persist (humans only for exceptions)
    if (this.exceptionIntake) {
      const reportItemId = created.items[0]?.id;
      if (reportItemId) {
        const paidCount = job.paymentOrderId ? 1 : 0;
        await this.exceptionIntake
          .createReviewCasesForReport({
            reportId: created.id,
            reportItemId,
            familyKey: null,
            productLabel: report.product?.name ?? null,
            locationKey: null,
            paidCustomerImpactCount: paidCount,
            report,
          })
          .catch((err) =>
            this.logger.warn(`Exception intake failed for report ${created.id}: ${(err as Error).message}`),
          );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Cancel + status
  // -------------------------------------------------------------------------

  async cancel(requestId: string, identity: UsageIdentity): Promise<{ cancelled: boolean }> {
    const job = this.requireOwnedJob(requestId, identity);
    if (job.status !== 'processing') return { cancelled: false };
    job.status = 'cancelled';
    job.finishedAtMs = Date.now();
    job.controller.abort();
    await this.prisma.priceResearchRun
      .update({ where: { id: job.runId }, data: { status: 'aborted', completedAt: new Date() } })
      .catch(() => undefined);
    await this.prisma.priceResearchRequest
      .update({ where: { id: requestId }, data: { status: 'cancelled' } })
      .catch(() => undefined);
    return { cancelled: true };
  }

  async status(requestId: string, identity: UsageIdentity): Promise<ResearchStatusDto> {
    const job = this.jobs.get(requestId);
    if (job) {
      this.assertOwnership(job.ownerUserId, job.ownerSessionId, identity);
      const end = job.finishedAtMs ?? Date.now();
      return {
        requestId,
        status: job.status,
        stage: job.status === 'processing' ? job.stage : null,
        elapsedSeconds: Math.floor((end - job.startedAtMs) / 1000),
        metrics: { ...job.counters },
        reportId: job.reportId,
        reportAccessToken: job.reportAccessToken,
        errorCategory: job.errorCategory,
      };
    }

    // Refresh resilience: fall back to persisted request/run/report state.
    const request = await this.prisma.priceResearchRequest.findUnique({
      where: { id: requestId },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 1 }, report: true },
    });
    if (!request) throw new NotFoundException('Unknown research request');
    this.assertOwnership(request.userId, request.anonymousSessionId, identity);

    const run = request.runs[0] ?? null;
    const progress = (run?.progressJson ?? null) as { stage?: ResearchStageCode; counters?: JobEntry['counters'] } | null;
    const startedAt = run?.startedAt ?? request.createdAt;
    const endedAt = run?.completedAt ?? (request.status === 'researching' ? new Date() : request.updatedAt);
    const status: ResearchJobStatus =
      request.status === 'completed'
        ? this.reportOutcomeStatus(request.report?.payload)
        : request.status === 'cancelled'
          ? 'cancelled'
          : request.status === 'failed'
            ? 'failed'
            : 'processing';

    return {
      requestId,
      status,
      stage: status === 'processing' ? (progress?.stage ?? 'searching_sources') : null,
      elapsedSeconds: Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)),
      metrics: progress?.counters ?? {
        discoveredSourceCount: null,
        retrievedPageCount: null,
        acceptedObservationCount: null,
        independentSourceCount: null,
      },
      reportId: request.report?.id ?? null,
      reportAccessToken: request.report?.accessToken ?? null,
      errorCategory: status === 'failed' ? 'internal' : null,
    };
  }

  private reportOutcomeStatus(payload: unknown): ResearchJobStatus {
    const status = (payload as { status?: string } | null)?.status;
    return status === 'insufficient_data' ? 'insufficient_data' : 'completed';
  }

  private requireOwnedJob(requestId: string, identity: UsageIdentity): JobEntry {
    const job = this.jobs.get(requestId);
    if (!job) throw new NotFoundException('Unknown or expired research request');
    this.assertOwnership(job.ownerUserId, job.ownerSessionId, identity);
    return job;
  }

  private assertOwnership(ownerUserId: string | null, ownerSessionId: string | null, identity: UsageIdentity): void {
    if (ownerUserId && identity.userId === ownerUserId) return;
    if (ownerSessionId && identity.anonymousSessionId === ownerSessionId) return;
    throw new ForbiddenException('You do not have access to this research request.');
  }
}
