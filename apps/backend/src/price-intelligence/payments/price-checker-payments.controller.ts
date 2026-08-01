/**
 * Stage 7 — guest Paystack payment endpoints for Price Checker.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import { UsageIdentity } from '../consumer/price-checker-usage.service';
import { PriceCheckerQuoteService, CreateQuoteItemBody } from './quote.service';
import { PriceCheckerPaymentService } from './payment.service';
import { PriceCheckerFulfilmentService } from './fulfilment.service';
import { PriceCheckerRecoveryService } from './recovery.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AuthedRequest {
  user?: { sub: string };
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  rawBody?: string;
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

@Controller()
export class PriceCheckerPaymentsController {
  constructor(
    private readonly quotes: PriceCheckerQuoteService,
    private readonly payments: PriceCheckerPaymentService,
    private readonly fulfilment: PriceCheckerFulfilmentService,
    private readonly recovery: PriceCheckerRecoveryService,
  ) {}

  @Post('price-checker/payment-quotes')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 20, ttl: 60_000 } })
  createQuote(@Req() req: AuthedRequest, @Body() body: { items?: CreateQuoteItemBody[] }) {
    if (!body?.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items array is required');
    }
    return this.quotes.createQuote(body.items, identityFrom(req));
  }

  @Post('price-checker/payments/initialize')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  initialize(@Req() req: AuthedRequest, @Body() body: { quoteId?: string; email?: string }) {
    if (!body?.quoteId || typeof body.quoteId !== 'string') {
      throw new BadRequestException('quoteId is required');
    }
    if (!body?.email || typeof body.email !== 'string') {
      throw new BadRequestException('email is required');
    }
    return this.payments.initialize(body.quoteId, body.email, identityFrom(req));
  }

  @Get('price-checker/payments/:paymentOrderId/status')
  @UseGuards(OptionalJwtAuthGuard)
  status(@Req() req: AuthedRequest, @Param('paymentOrderId') paymentOrderId: string) {
    return this.payments.status(paymentOrderId, identityFrom(req));
  }

  @Post('price-checker/payments/verify')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 20, ttl: 60_000 } })
  verify(@Req() req: AuthedRequest, @Body() body: { reference?: string }) {
    if (!body?.reference || typeof body.reference !== 'string') {
      throw new BadRequestException('reference is required');
    }
    return this.payments.verifyByReference(body.reference, identityFrom(req));
  }

  @Post('price-checker/paid-batches/:id/start')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  startBatch(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.fulfilment.startPaidBatch(id, identityFrom(req));
  }

  @Get('price-checker/paid-batches/:id')
  @UseGuards(OptionalJwtAuthGuard)
  getBatch(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.fulfilment.getPaidBatch(id, identityFrom(req));
  }

  @Post('price-checker/payments/:id/recovery-email')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  recoveryEmail(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.recovery.sendRecoveryEmail(id, identityFrom(req));
  }

  @Post('payments/paystack/webhook')
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request> & AuthedRequest,
    @Headers('x-paystack-signature') signature: string | undefined,
  ) {
    const rawFromReq = (req as AuthedRequest).rawBody;
    const bodyUnknown: unknown = (req as { body?: unknown }).body;
    let rawBody: string;
    if (typeof rawFromReq === 'string' && rawFromReq.length > 0) {
      rawBody = rawFromReq;
    } else if (typeof bodyUnknown === 'string') {
      rawBody = bodyUnknown;
    } else {
      rawBody = JSON.stringify(bodyUnknown ?? {});
    }
    return this.payments.handleWebhook(rawBody, signature);
  }
}
