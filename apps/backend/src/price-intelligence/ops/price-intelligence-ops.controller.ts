import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/rbac.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { adminId, AdminRequestUser, requirePiPermission } from './pi-auth';
import { hasAnyPermission } from './permissions';
import { PriorityLabel } from './priority';
import { PriceIntelligenceOverviewService } from './overview.service';
import { ReviewQueueService } from './review-queue.service';
import { ReviewCaseService } from './review-case.service';
import { ManualEntryService } from './manual-entry.service';
import { MerchantSubmissionService } from './merchant-submission.service';
import { SourceHealthService } from './source-health.service';
import { CatalogueWriteService } from './catalogue-write.service';
import { SearchDemandService } from './search-demand.service';
import { PriceIntelligenceSettingsService } from './settings.service';
import { PriceIntelligenceReviewerService } from './reviewer.service';
import { ReportCorrectionService } from './report-correction.service';
import { PriceIntelligenceAuditService } from './audit.service';

type AuthedRequest = { user?: AdminRequestUser };

@Controller('admin/price-intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PriceIntelligenceOpsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly overview: PriceIntelligenceOverviewService,
    private readonly queue: ReviewQueueService,
    private readonly cases: ReviewCaseService,
    private readonly manualEntries: ManualEntryService,
    private readonly merchants: MerchantSubmissionService,
    private readonly sources: SourceHealthService,
    private readonly catalogue: CatalogueWriteService,
    private readonly demand: SearchDemandService,
    private readonly settings: PriceIntelligenceSettingsService,
    private readonly reviewers: PriceIntelligenceReviewerService,
    private readonly reportCorrections: ReportCorrectionService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  private async perms(req: AuthedRequest): Promise<string[]> {
    const id = adminId(req.user);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { priceIntelligencePermissions: true },
    });
    return user?.priceIntelligencePermissions ?? [];
  }

  // ── Overview ────────────────────────────────────────────────────────────

  @Get('overview')
  async getOverview(@Req() req: AuthedRequest) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.overview.getOverview();
  }

  // ── Review queue ────────────────────────────────────────────────────────

  @Get('review-queue')
  async reviewQueue(
    @Req() req: AuthedRequest,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('caseType') caseType?: string,
    @Query('assignedReviewerId') assignedReviewerId?: string,
    @Query('productFamilyKey') productFamilyKey?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: 'priority' | 'dueAt' | 'openedAt',
    @Query('order') order?: 'asc' | 'desc',
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('overdueOnly') overdueOnly?: string,
  ) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.queue.list({
      status,
      priority,
      caseType,
      assignedReviewerId,
      productFamilyKey,
      q,
      sort,
      order,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
      overdueOnly: overdueOnly === 'true' || overdueOnly === '1',
    });
  }

  @Get('review-cases/:id')
  async getCase(@Req() req: AuthedRequest, @Param('id') id: string) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.cases.getWorkspace(id);
  }

  @Post('review-cases/:id/assign')
  async assignCase(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { reviewerAdminId?: string },
  ) {
    const perms = await this.perms(req);
    requirePiPermission(perms, 'REVIEW');
    const actor = adminId(req.user);
    return this.cases.assign(id, body.reviewerAdminId || actor, actor);
  }

  @Post('review-cases/:id/transition')
  async transitionCase(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { toStatus: string; note?: string },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.cases.transition(id, body.toStatus, adminId(req.user), body.note);
  }

  @Post('review-cases/:id/notes')
  async addNote(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { note: string },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.cases.addNote(id, adminId(req.user), body.note);
  }

  @Post('review-cases/:id/priority')
  async overridePriority(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { label: PriorityLabel; reason: string },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.cases.overridePriority(id, body.label, body.reason, adminId(req.user));
  }

  @Post('review-cases/:id/approve')
  async approveCase(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.cases.approve(id, adminId(req.user), body?.note);
  }

  @Post('review-cases/:id/reject')
  async rejectCase(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { note: string },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.cases.reject(id, adminId(req.user), body.note);
  }

  @Post('review-cases/:id/correct-observation')
  async correctObservation(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      originalObservationId: string;
      correctedFields: {
        originalPrice?: number;
        originalUnitCode?: string;
        originalWording?: string;
        currencyCode?: string;
      };
      reason: string;
      correctionType?: string;
    },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.cases.correctObservation(id, adminId(req.user), body);
  }

  @Post('review-cases/:id/correct-structured')
  async correctStructured(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      familyKey: string;
      originalWording: string;
      originalPrice: number;
      originalUnitCode: string;
      currencyCode?: string;
      reason: string;
      approvedPrices?: number[];
    },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.cases.correctStructuredFields(id, adminId(req.user), body);
  }

  @Post('review-cases/:id/apply-report-correction')
  async applyReportCorrection(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      reportId: string;
      reason: string;
      approvedPrices?: number[];
      pricingOverride?: {
        typicalPrice?: number | null;
        rangeLow?: number | null;
        rangeHigh?: number | null;
        confidenceLabel?: string;
        confidenceScore?: number;
        status?: 'complete' | 'single_source' | 'insufficient_data';
      };
      customerNotice?: string;
    },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.reportCorrections.applyCorrection({
      reportId: body.reportId,
      reviewCaseId: id,
      actorAdminId: adminId(req.user),
      reason: body.reason,
      approvedPrices: body.approvedPrices,
      pricingOverride: body.pricingOverride,
      customerNotice: body.customerNotice,
    });
  }

  // ── Manual entries ──────────────────────────────────────────────────────

  @Get('manual-entries')
  async listManualEntries(
    @Req() req: AuthedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: string,
  ) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.manualEntries.list(
      take ? Number(take) : 50,
      skip ? Number(skip) : 0,
      status,
    );
  }

  @Get('manual-entries/:id')
  async getManualEntry(@Req() req: AuthedRequest, @Param('id') id: string) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.manualEntries.get(id);
  }

  @Post('manual-entries')
  async createManualEntry(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      title: string;
      notes?: string;
      evidenceFileRef?: string;
      evidenceDocumentId?: string;
      locationKey?: string;
      items: Array<{
        familyKey?: string;
        productLabel: string;
        brandName?: string;
        originalWording: string;
        originalPrice: number;
        currencyCode?: string;
        originalUnitCode: string;
        locationKey?: string;
        specification?: Record<string, unknown>;
      }>;
    },
  ) {
    requirePiPermission(await this.perms(req), 'ENTRY');
    return this.manualEntries.create({
      ...body,
      createdByAdminId: adminId(req.user),
    });
  }

  @Post('manual-entries/:id/submit')
  async submitManualEntry(@Req() req: AuthedRequest, @Param('id') id: string) {
    requirePiPermission(await this.perms(req), 'ENTRY');
    return this.manualEntries.submit(id, adminId(req.user));
  }

  @Post('manual-entries/:id/review')
  async reviewManualEntry(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      decision: 'approve' | 'reject';
      reviewNote?: string;
      itemDecisions?: Array<{ itemId: string; decision: 'approve' | 'reject'; reason?: string }>;
    },
  ) {
    const perms = await this.perms(req);
    requirePiPermission(perms, 'REVIEW');
    return this.manualEntries.review({
      entryId: id,
      reviewerAdminId: adminId(req.user),
      reviewerPermissions: perms,
      decision: body.decision,
      reviewNote: body.reviewNote,
      itemDecisions: body.itemDecisions,
    });
  }

  // ── Merchants / submissions ─────────────────────────────────────────────

  @Get('merchants')
  async listMerchants(
    @Req() req: AuthedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.merchants.listMerchants(take ? Number(take) : 50, skip ? Number(skip) : 0);
  }

  @Post('merchants')
  async createMerchant(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      businessName: string;
      tradingName?: string;
      sellerType?: string;
      city?: string;
      state?: string;
      sourceTier?: number;
      riskNotes?: string;
      contactPhone?: string;
      contactEmail?: string;
    },
  ) {
    requirePiPermission(await this.perms(req), 'ENTRY');
    return this.merchants.createMerchant({ ...body, actorAdminId: adminId(req.user) });
  }

  @Get('merchant-submissions')
  async listMerchantSubmissions(
    @Req() req: AuthedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: string,
  ) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.merchants.listSubmissions(
      take ? Number(take) : 50,
      skip ? Number(skip) : 0,
      status,
    );
  }

  @Get('merchant-submissions/:id')
  async getMerchantSubmission(@Req() req: AuthedRequest, @Param('id') id: string) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.merchants.getSubmission(id);
  }

  @Post('merchant-submissions')
  async createMerchantSubmission(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      merchantId?: string;
      title: string;
      notes?: string;
      channel?: string;
      evidenceFileRef?: string;
      evidenceDocumentId?: string;
      submit?: boolean;
      items: Array<{
        familyKey?: string;
        productLabel: string;
        brandName?: string;
        originalWording: string;
        originalPrice: number;
        currencyCode?: string;
        originalUnitCode: string;
        locationKey?: string;
        specification?: Record<string, unknown>;
      }>;
    },
  ) {
    requirePiPermission(await this.perms(req), 'ENTRY');
    return this.merchants.createSubmission({
      ...body,
      createdByAdminId: adminId(req.user),
    });
  }

  @Post('merchant-submissions/:id/submit')
  async submitMerchantSubmission(@Req() req: AuthedRequest, @Param('id') id: string) {
    requirePiPermission(await this.perms(req), 'ENTRY');
    return this.merchants.submit(id, adminId(req.user));
  }

  @Post('merchant-submissions/:id/items/:itemId/review')
  async reviewMerchantItem(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { decision: 'approve' | 'reject'; reason?: string },
  ) {
    requirePiPermission(await this.perms(req), 'REVIEW');
    return this.merchants.reviewItem({
      submissionId: id,
      itemId,
      decision: body.decision,
      reason: body.reason,
      reviewerAdminId: adminId(req.user),
    });
  }

  // ── Source health ───────────────────────────────────────────────────────

  @Get('sources')
  async listSources(@Req() req: AuthedRequest) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.sources.list();
  }

  @Get('sources/:id')
  async getSource(@Req() req: AuthedRequest, @Param('id') id: string) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.sources.get(id);
  }

  @Post('sources/:id/disable')
  async disableSource(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    requirePiPermission(await this.perms(req), 'SOURCE_ADMIN');
    return this.sources.disable(id, adminId(req.user), body.reason);
  }

  @Post('sources/:id/enable')
  async enableSource(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    requirePiPermission(await this.perms(req), 'SOURCE_ADMIN');
    return this.sources.enable(id, adminId(req.user), body?.note);
  }

  @Post('sources/:id/recheck')
  async recheckSource(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body()
    body?: {
      healthStatus?: string;
      successRate?: number;
      parseSuccessRate?: number;
      avgLatencyMs?: number;
      note?: string;
    },
  ) {
    requirePiPermission(await this.perms(req), 'SOURCE_ADMIN');
    return this.sources.recheck(id, adminId(req.user), body);
  }

  // ── Catalogue writes ────────────────────────────────────────────────────

  @Post('catalogue/aliases')
  async createAlias(
    @Req() req: AuthedRequest,
    @Body() body: { familyKey: string; productKey?: string; alias: string },
  ) {
    requirePiPermission(await this.perms(req), 'CATALOGUE');
    return this.catalogue.createAlias({ ...body, actorAdminId: adminId(req.user) });
  }

  @Post('catalogue/aliases/:id/deactivate')
  async deactivateAlias(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    requirePiPermission(await this.perms(req), 'CATALOGUE');
    return this.catalogue.deactivateAlias(id, adminId(req.user), body.reason);
  }

  @Post('catalogue/brands')
  async createBrand(
    @Req() req: AuthedRequest,
    @Body() body: { name: string; verified?: boolean },
  ) {
    requirePiPermission(await this.perms(req), 'CATALOGUE');
    return this.catalogue.createBrand({ ...body, actorAdminId: adminId(req.user) });
  }

  @Post('catalogue/products/deactivate')
  async deactivateProduct(
    @Req() req: AuthedRequest,
    @Body() body: { familyKey: string; productKey: string; reason: string },
  ) {
    requirePiPermission(await this.perms(req), 'CATALOGUE');
    return this.catalogue.deactivateProduct({ ...body, actorAdminId: adminId(req.user) });
  }

  // ── Reports / observations directories ─────────────────────────────────────

  @Get('reports')
  async listReports(
    @Req() req: AuthedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('outcome') outcome?: string,
  ) {
    requirePiPermission(await this.perms(req), 'VIEW');
    const takeN = Math.min(take ? Number(take) : 50, 200);
    const skipN = skip ? Number(skip) : 0;
    const itemWhere = outcome ? { items: { some: { outcome } } } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.priceReport.findMany({
        where: itemWhere,
        orderBy: { createdAt: 'desc' },
        take: takeN,
        skip: skipN,
        select: {
          id: true,
          status: true,
          currentVersion: true,
          customerUpdateNotice: true,
          generatedAt: true,
          createdAt: true,
          request: {
            select: {
              id: true,
              type: true,
              paymentOrderId: true,
              requestedLocation: { select: { code: true, name: true } },
            },
          },
          items: {
            select: {
              id: true,
              outcome: true,
              typicalPrice: true,
              rangeLow: true,
              rangeHigh: true,
              confidence: true,
              sourceCount: true,
              unitCode: true,
              requestItem: { select: { rawProductName: true, family: { select: { key: true } } } },
            },
          },
        },
      }),
      this.prisma.priceReport.count({ where: itemWhere }),
    ]);
    return { items, total, take: takeN, skip: skipN };
  }

  @Get('observations')
  async listObservations(
    @Req() req: AuthedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: string,
    @Query('reviewStatus') reviewStatus?: string,
  ) {
    requirePiPermission(await this.perms(req), 'VIEW');
    const takeN = Math.min(take ? Number(take) : 50, 200);
    const skipN = skip ? Number(skip) : 0;
    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (reviewStatus) where.reviewStatus = reviewStatus;
    const [items, total] = await Promise.all([
      this.prisma.priceObservation.findMany({
        where,
        orderBy: { checkedDate: 'desc' },
        take: takeN,
        skip: skipN,
        select: {
          id: true,
          originalWording: true,
          originalPrice: true,
          currencyCode: true,
          originalUnitCode: true,
          normalizedPrice: true,
          normalizedUnitCode: true,
          status: true,
          reviewStatus: true,
          collectionMethod: true,
          evidenceClass: true,
          confidence: true,
          checkedDate: true,
          listingDate: true,
          family: { select: { key: true, definition: true } },
          source: { select: { id: true, code: true, name: true, tier: true, healthStatus: true } },
          seller: { select: { id: true, name: true } },
        },
      }),
      this.prisma.priceObservation.count({ where }),
    ]);
    return { items, total, take: takeN, skip: skipN };
  }

  // ── Search demand ───────────────────────────────────────────────────────

  @Get('search-demand')
  async searchDemand(@Req() req: AuthedRequest, @Query('take') take?: string) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.demand.getDemand(take ? Number(take) : 50);
  }

  @Patch('unmatched-terms/:id')
  async updateUnmatchedTerm(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { status?: string; suggestedFamilyKey?: string | null },
  ) {
    requirePiPermission(await this.perms(req), 'CATALOGUE');
    return this.demand.updateUnmatchedTerm(id, body);
  }

  // ── Settings / reviewers / audit ────────────────────────────────────────

  @Get('settings')
  async getSettings(@Req() req: AuthedRequest) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.settings.getAll();
  }

  @Post('settings')
  async upsertSetting(
    @Req() req: AuthedRequest,
    @Body() body: { key: string; valueJson: unknown },
  ) {
    requirePiPermission(await this.perms(req), 'SETTINGS');
    return this.settings.upsert(body.key, body.valueJson, adminId(req.user));
  }

  @Get('reviewers')
  async listReviewers(@Req() req: AuthedRequest) {
    requirePiPermission(await this.perms(req), 'VIEW');
    return this.reviewers.list();
  }

  @Post('reviewers')
  async upsertReviewer(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      adminUserId: string;
      active?: boolean;
      categoryScope?: string[] | null;
      availabilityNotes?: string | null;
      maximumOpenCases?: number;
    },
  ) {
    requirePiPermission(await this.perms(req), 'SETTINGS');
    return this.reviewers.upsert({ ...body, actorAdminId: adminId(req.user) });
  }

  @Post('reviewers/:adminUserId/active')
  async setReviewerActive(
    @Req() req: AuthedRequest,
    @Param('adminUserId') adminUserId: string,
    @Body() body: { active: boolean },
  ) {
    requirePiPermission(await this.perms(req), 'SETTINGS');
    return this.reviewers.setActive(adminUserId, body.active, adminId(req.user));
  }

  @Get('audit-log')
  async auditLog(
    @Req() req: AuthedRequest,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const perms = await this.perms(req);
    if (!hasAnyPermission(perms, ['VIEW', 'AUDIT_EXPORT'])) {
      throw new ForbiddenException('Missing Price Intelligence permission: VIEW or AUDIT_EXPORT');
    }
    return this.audit.list({
      entityType,
      entityId,
      action,
      take: take ? Number(take) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }
}
