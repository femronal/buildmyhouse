/**
 * Stage 6 — consumer Price Checker API.
 *
 * Anonymous use is allowed (free tier); login is only required to save report
 * history. The anonymous session id is a client-generated UUID sent in the
 * `x-price-session` header — it scopes usage limits and ownership of in-flight
 * research, while report links stay protected by secure random access tokens.
 */
import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import { Answers } from '../taxonomy';
import { PriceCheckerCatalogueService } from './price-checker-catalogue.service';
import { PriceCheckerUsageService, UsageIdentity } from './price-checker-usage.service';
import { PriceCheckerResearchService } from './price-checker-research.service';
import { PriceCheckerReportService } from './price-checker-report.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AuthedRequest {
  user?: { sub: string };
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}

function identityFrom(req: AuthedRequest): UsageIdentity {
  const raw = req.headers['x-price-session'];
  const sessionHeader = Array.isArray(raw) ? raw[0] : raw;
  const anonymousSessionId = sessionHeader && UUID_RE.test(sessionHeader) ? sessionHeader.toLowerCase() : null;
  return {
    userId: req.user?.sub ?? null,
    anonymousSessionId,
    ip: req.ip ?? null,
  };
}

interface QuestionsPreviewBody {
  familyKey: string;
  kind: 'product' | 'service';
  answers: Record<string, string>;
}

interface StartResearchBody extends QuestionsPreviewBody {
  locationKey: string;
  rawProductName: string;
  /** Stage 7 — when free allowance is exhausted, pass a paid+ready order id. */
  paymentOrderId?: string;
}

@Controller('price-checker')
@UseGuards(OptionalJwtAuthGuard)
export class PriceCheckerController {
  constructor(
    private readonly catalogue: PriceCheckerCatalogueService,
    private readonly usage: PriceCheckerUsageService,
    private readonly research: PriceCheckerResearchService,
    private readonly reports: PriceCheckerReportService,
  ) {}

  @Get('catalogue/search')
  async search(@Query('q') q: string) {
    return { results: await this.catalogue.search(q ?? '') };
  }

  @Get('locations')
  locations() {
    return { locations: this.catalogue.locations() };
  }

  @Post('questions/preview')
  questionsPreview(@Body() body: QuestionsPreviewBody) {
    this.validatePreviewBody(body);
    return this.catalogue.questionsPreview(body.familyKey, body.kind, (body.answers ?? {}) as Answers);
  }

  @Get('usage')
  usageStatus(@Req() req: AuthedRequest) {
    return this.usage.usageStatus(identityFrom(req));
  }

  @Post('research')
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  startResearch(@Req() req: AuthedRequest, @Body() body: StartResearchBody) {
    this.validatePreviewBody(body);
    if (typeof body.locationKey !== 'string' || !body.locationKey) {
      throw new BadRequestException('locationKey is required');
    }
    if (typeof body.rawProductName !== 'string' || !body.rawProductName.trim()) {
      throw new BadRequestException('rawProductName is required');
    }
    return this.research.start(
      {
        familyKey: body.familyKey,
        kind: body.kind,
        answers: (body.answers ?? {}) as Answers,
        locationKey: body.locationKey,
        rawProductName: body.rawProductName.trim(),
      },
      identityFrom(req),
      { paymentOrderId: typeof body.paymentOrderId === 'string' ? body.paymentOrderId : undefined },
    );
  }

  @Get('research/:requestId/status')
  status(@Req() req: AuthedRequest, @Param('requestId') requestId: string) {
    return this.research.status(requestId, identityFrom(req));
  }

  @Post('research/:requestId/cancel')
  cancel(@Req() req: AuthedRequest, @Param('requestId') requestId: string) {
    return this.research.cancel(requestId, identityFrom(req));
  }

  @Get('reports/mine')
  @UseGuards(JwtAuthGuard)
  async myReports(@Req() req: AuthedRequest) {
    return { reports: await this.reports.listMyReports(req.user!.sub) };
  }

  @Get('reports/:reportId')
  getReport(@Req() req: AuthedRequest, @Param('reportId') reportId: string, @Query('token') token?: string) {
    return this.reports.getConsumerReport(reportId, identityFrom(req), token ?? null);
  }

  @Post('reports/:reportId/save')
  @UseGuards(JwtAuthGuard)
  saveReport(@Req() req: AuthedRequest, @Param('reportId') reportId: string, @Query('token') token?: string) {
    return this.reports.saveToAccount(reportId, identityFrom(req), token ?? null);
  }

  @Get('reports/:reportId/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Req() req: AuthedRequest,
    @Res() res: Response,
    @Param('reportId') reportId: string,
    @Query('token') token?: string,
  ) {
    const pdf = await this.reports.generatePdf(reportId, identityFrom(req), token ?? null);
    res.setHeader('Content-Disposition', `attachment; filename="BuildMyHouse-Price-Report-${reportId.slice(0, 8)}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(pdf);
  }

  private validatePreviewBody(body: QuestionsPreviewBody): void {
    if (!body || typeof body.familyKey !== 'string' || !body.familyKey) {
      throw new BadRequestException('familyKey is required');
    }
    if (body.kind !== 'product' && body.kind !== 'service') {
      throw new BadRequestException("kind must be 'product' or 'service'");
    }
    if (body.answers !== undefined && (typeof body.answers !== 'object' || Array.isArray(body.answers))) {
      throw new BadRequestException('answers must be an object');
    }
    const entries = Object.entries(body.answers ?? {});
    if (entries.length > 40) throw new BadRequestException('Too many answers');
    for (const [, v] of entries) {
      if (v !== undefined && typeof v !== 'string') throw new BadRequestException('Answers must be strings');
    }
  }
}
