/**
 * Stage 7 — payment order initialization, verify, webhook handling.
 * Research is NEVER started here — only mark paid + fulfilment ready.
 */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsageIdentity } from '../consumer/price-checker-usage.service';
import { loadPricingConfig } from './pricing.config';
import { PriceCheckerQuoteService } from './quote.service';
import { PricedQuoteLine } from './quote.math';
import {
  PRICE_CHECKER_PAYMENT_PROVIDER,
  PriceCheckerPaymentProvider,
  PaystackVerifyResult,
} from './paystack.provider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SafeOrderDto {
  paymentOrderId: string;
  quoteId: string;
  status: string;
  fulfilmentStatus: string;
  amountExpectedKobo: number;
  amountPaidKobo: number | null;
  currency: string;
  /** Opaque Paystack reference for display / verify. */
  providerReference: string;
  /** Alias of providerReference for consumer clients. */
  reference: string;
  customerEmailMasked: string;
  chargeableItemCount: number;
  freeItemCount: number;
  /** Alias of freeItemCount for consumer clients. */
  freeItemCountApplied: number;
  entitlementExpiresAt: string | null;
  paidAt: string | null;
  authorizationUrl?: string;
  requestIds?: string[];
  lineItems: Array<{
    id: string;
    clientItemKey: string;
    productLabel: string;
    locationKey: string;
    free: boolean;
    amountKobo: number;
    fulfilmentStatus: string;
    reportId: string | null;
    researchRequestId?: string | null;
  }>;
}

@Injectable()
export class PriceCheckerPaymentService {
  private readonly logger = new Logger(PriceCheckerPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quotes: PriceCheckerQuoteService,
    @Inject(PRICE_CHECKER_PAYMENT_PROVIDER)
    private readonly paystack: PriceCheckerPaymentProvider,
  ) {}

  async initialize(quoteId: string, email: string, identity: UsageIdentity): Promise<SafeOrderDto> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 254) {
      throw new BadRequestException('A valid email is required for payment.');
    }

    const quote = await this.quotes.getActiveQuote(quoteId, identity);
    if (quote.status === 'paid') {
      throw new BadRequestException({ code: 'quote_already_paid', message: 'This quote was already paid.' });
    }
    if (quote.totalKobo <= 0) {
      throw new BadRequestException({
        code: 'payment_not_required',
        message: 'This request is covered by your free allowance.',
      });
    }

    const config = loadPricingConfig();
    if (!config.checkoutEnabled || config.pricePerReportKobo === null) {
      throw new ServiceUnavailableException({
        code: 'checkout_disabled',
        message: config.checkoutDisabledReason,
      });
    }

    // Recalculate authoritative amount from stored immutable quote lines.
    const lines = quote.itemsJson as unknown as PricedQuoteLine[];
    const expectedTotal = lines.reduce((sum, l) => sum + (l.free ? 0 : l.amountKobo), 0);
    if (expectedTotal !== quote.totalKobo || expectedTotal !== quote.chargeableItemCount * quote.unitPriceKobo) {
      throw new BadRequestException({ code: 'quote_invalid', message: 'Quote amount mismatch. Request a new quote.' });
    }
    if (quote.unitPriceKobo !== config.pricePerReportKobo && quote.pricingVersion === config.pricingVersion) {
      // Same pricing version must match current unit price.
      throw new BadRequestException({ code: 'quote_stale', message: 'Pricing changed. Request a new quote.' });
    }

    // Idempotent: reuse existing initialized/pending order for this quote.
    const existing = await this.prisma.priceCheckPaymentOrder.findFirst({
      where: {
        quoteId: quote.id,
        status: { in: ['initialized', 'pending', 'success'] },
      },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.status === 'success') {
      return this.toSafeDto(existing, existing.lineItems);
    }
    if (existing && (existing.status === 'initialized' || existing.status === 'pending')) {
      // Re-initialize with Paystack only if we still have access code path; return existing auth URL via re-init.
      const callbackUrl = this.callbackUrl();
      const init = await this.paystack.initialize({
        email: normalizedEmail,
        amountKobo: existing.amountExpectedKobo,
        currency: 'NGN',
        reference: existing.providerReference,
        callbackUrl,
        metadata: { paymentOrderId: existing.id, quoteId: quote.id },
      });
      await this.prisma.priceCheckPaymentOrder.update({
        where: { id: existing.id },
        data: {
          customerEmail: normalizedEmail,
          providerAccessCode: init.accessCode,
          status: 'pending',
        },
      });
      return {
        ...this.toSafeDto({ ...existing, customerEmail: normalizedEmail, status: 'pending' }, existing.lineItems),
        authorizationUrl: init.authorizationUrl,
      };
    }

    const reference = `pc_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const orderId = randomUUID();
    const callbackUrl = this.callbackUrl();

    const init = await this.paystack.initialize({
      email: normalizedEmail,
      amountKobo: quote.totalKobo,
      currency: 'NGN',
      reference,
      callbackUrl,
      metadata: { paymentOrderId: orderId, quoteId: quote.id },
    });

    const recoveryToken = randomBytes(32).toString('base64url');
    const recoveryTokenHash = this.hashToken(recoveryToken);
    const recoveryExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.priceCheckPaymentOrder.create({
        data: {
          id: orderId,
          quoteId: quote.id,
          sessionId: quote.sessionId,
          anonymousSessionId: quote.anonymousSessionId,
          userId: quote.userId,
          customerEmail: normalizedEmail,
          provider: 'paystack',
          providerReference: reference,
          providerAccessCode: init.accessCode,
          amountExpectedKobo: quote.totalKobo,
          currency: 'NGN',
          status: 'pending',
          fulfilmentStatus: 'not_started',
          recoveryTokenHash,
          recoveryTokenExpiresAt: recoveryExpires,
          metadataSafe: {
            pricingVersion: quote.pricingVersion,
            chargeableItemCount: quote.chargeableItemCount,
            freeItemCountApplied: quote.freeItemCountApplied,
          } as Prisma.InputJsonValue,
          lineItems: {
            create: lines.map((l) => ({
              id: randomUUID(),
              clientItemKey: l.clientItemKey,
              familyKey: l.familyKey,
              kind: l.kind,
              productLabel: l.productLabel,
              locationKey: l.locationKey,
              rawProductName: l.rawProductName,
              answersJson: l.answers as Prisma.InputJsonValue,
              free: l.free,
              amountKobo: l.amountKobo,
              fulfilmentStatus: l.free ? 'ready' : 'pending',
            })),
          },
        },
        include: { lineItems: true },
      });
      await tx.priceCheckPaymentQuote.update({
        where: { id: quote.id },
        data: { status: 'payment_initialized', email: normalizedEmail },
      });
      return created;
    });

    // Store plaintext recovery token only in the response path via email later — not in DTO.
    // Persist token temporarily in metadata for recovery.service (hashed already).
    void recoveryToken;

    return {
      ...this.toSafeDto(order, order.lineItems),
      authorizationUrl: init.authorizationUrl,
    };
  }

  async status(paymentOrderId: string, identity: UsageIdentity): Promise<SafeOrderDto> {
    const order = await this.prisma.priceCheckPaymentOrder.findUnique({
      where: { id: paymentOrderId },
      include: { lineItems: true },
    });
    if (!order) throw new NotFoundException('Payment order not found');
    this.assertOrderOwnership(order, identity);
    return this.toSafeDto(order, order.lineItems);
  }

  async verifyByReference(reference: string, identity: UsageIdentity | null): Promise<SafeOrderDto> {
    if (!reference || typeof reference !== 'string') {
      throw new BadRequestException('reference is required');
    }
    const order = await this.prisma.priceCheckPaymentOrder.findUnique({
      where: { providerReference: reference },
      include: { lineItems: true },
    });
    if (!order) throw new NotFoundException('Payment order not found');
    if (identity) this.assertOrderOwnership(order, identity);

    if (order.status === 'success' && order.fulfilmentStatus !== 'not_started') {
      return this.toSafeDto(order, order.lineItems);
    }

    const verified = await this.paystack.verify(reference);
    await this.applyVerifiedPayment(order.id, verified, {
      source: 'verify',
      fingerprint: `verify:${reference}:${verified.rawStatus}:${verified.amountKobo}`,
    });

    const refreshed = await this.prisma.priceCheckPaymentOrder.findUnique({
      where: { id: order.id },
      include: { lineItems: true },
    });
    return this.toSafeDto(refreshed!, refreshed!.lineItems);
  }

  async handleWebhook(rawBody: string, signatureHeader: string | undefined): Promise<{ ok: true }> {
    const signatureValid = this.paystack.verifyWebhookSignature(rawBody, signatureHeader);
    if (!signatureValid) {
      this.logger.warn('Paystack webhook signature invalid');
      throw new ForbiddenException('Invalid signature');
    }

    let payload: {
      event?: string;
      data?: {
        reference?: string;
        status?: string;
        amount?: number;
        currency?: string;
        id?: number | string;
        paid_at?: string | null;
        gateway_response?: string;
      };
    };
    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      throw new BadRequestException('Invalid JSON body');
    }

    const eventType = payload.event ?? 'unknown';
    const reference = payload.data?.reference;
    const fingerprint = createHash('sha256')
      .update(`${eventType}:${reference ?? ''}:${payload.data?.id ?? ''}:${payload.data?.status ?? ''}`)
      .digest('hex');

    const existingEvent = await this.prisma.priceCheckPaymentEvent.findUnique({
      where: { eventFingerprint: fingerprint },
    });
    if (existingEvent?.processed) {
      return { ok: true };
    }

    const order = reference
      ? await this.prisma.priceCheckPaymentOrder.findUnique({ where: { providerReference: reference } })
      : null;

    await this.prisma.priceCheckPaymentEvent.upsert({
      where: { eventFingerprint: fingerprint },
      create: {
        id: randomUUID(),
        paymentOrderId: order?.id ?? null,
        providerEventType: eventType,
        eventFingerprint: fingerprint,
        signatureValid: true,
        processed: false,
        safePayload: {
          event: eventType,
          reference: reference ?? null,
          status: payload.data?.status ?? null,
          amount: payload.data?.amount ?? null,
          currency: payload.data?.currency ?? null,
        } as Prisma.InputJsonValue,
      },
      update: {},
    });

    if (eventType === 'charge.success' && order && payload.data) {
      const verified: PaystackVerifyResult = {
        status: 'success',
        reference: reference!,
        amountKobo: Math.floor(Number(payload.data.amount) || 0),
        currency: (payload.data.currency || '').toUpperCase(),
        paidAt: payload.data.paid_at ?? null,
        transactionId: payload.data.id != null ? String(payload.data.id) : null,
        gatewayResponse: payload.data.gateway_response ?? null,
        rawStatus: payload.data.status ?? 'success',
      };
      await this.applyVerifiedPayment(order.id, verified, { source: 'webhook', fingerprint });
    }

    await this.prisma.priceCheckPaymentEvent.update({
      where: { eventFingerprint: fingerprint },
      data: { processed: true, processedAt: new Date(), paymentOrderId: order?.id ?? null },
    });

    return { ok: true };
  }

  /**
   * Mark paid + fulfilment ready. Does NOT start research.
   * Amount/currency mismatch blocks fulfilment.
   */
  async applyVerifiedPayment(
    paymentOrderId: string,
    verified: PaystackVerifyResult,
    meta: { source: string; fingerprint: string },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.priceCheckPaymentOrder.findUnique({ where: { id: paymentOrderId } });
      if (!order) return;

      // Idempotent success
      if (order.status === 'success' && order.fulfilmentStatus !== 'not_started') {
        return;
      }

      if (verified.status !== 'success') {
        if (verified.status === 'failed' || verified.status === 'abandoned') {
          await tx.priceCheckPaymentOrder.update({
            where: { id: order.id },
            data: {
              status: verified.status === 'abandoned' ? 'abandoned' : 'failed',
              failedAt: new Date(),
            },
          });
        }
        return;
      }

      if (verified.amountKobo !== order.amountExpectedKobo || verified.currency !== order.currency) {
        this.logger.error(
          `Amount/currency mismatch for order ${order.id}: expected ${order.amountExpectedKobo} ${order.currency}, got ${verified.amountKobo} ${verified.currency}`,
        );
        await tx.priceCheckPaymentOrder.update({
          where: { id: order.id },
          data: {
            status: 'failed',
            failedAt: new Date(),
            amountPaidKobo: verified.amountKobo,
            metadataSafe: {
              ...((order.metadataSafe as object) ?? {}),
              mismatch: {
                expectedKobo: order.amountExpectedKobo,
                paidKobo: verified.amountKobo,
                expectedCurrency: order.currency,
                paidCurrency: verified.currency,
                source: meta.source,
              },
            } as Prisma.InputJsonValue,
          },
        });
        return;
      }

      const config = loadPricingConfig();
      const entitlementExpiresAt = new Date(Date.now() + config.entitlementWindowHours * 60 * 60 * 1000);

      await tx.priceCheckPaymentOrder.update({
        where: { id: order.id },
        data: {
          status: 'success',
          amountPaidKobo: verified.amountKobo,
          providerTransactionId: verified.transactionId,
          paidAt: verified.paidAt ? new Date(verified.paidAt) : new Date(),
          fulfilmentStatus: 'ready',
          entitlementExpiresAt,
        },
      });

      await tx.priceCheckPaymentLineItem.updateMany({
        where: { paymentOrderId: order.id, fulfilmentStatus: 'pending' },
        data: { fulfilmentStatus: 'ready' },
      });

      await tx.priceCheckPaymentQuote.update({
        where: { id: order.quoteId },
        data: { status: 'paid' },
      });
    });
  }

  private callbackUrl(): string {
    const configured = process.env.PAYSTACK_CALLBACK_URL?.trim();
    if (configured) return configured;
    const base = (process.env.PRICE_CHECKER_WEB_BASE_URL ?? process.env.HOMEOWNER_APP_URL ?? 'https://buildmyhouse.app').replace(
      /\/+$/,
      '',
    );
    return `${base}/tools/price-checker/payment/callback`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private assertOrderOwnership(
    order: { anonymousSessionId: string | null; userId: string | null; sessionId: string },
    identity: UsageIdentity,
  ): void {
    if (order.userId && identity.userId === order.userId) return;
    if (order.anonymousSessionId && identity.anonymousSessionId === order.anonymousSessionId) return;
    if (identity.anonymousSessionId && order.sessionId === identity.anonymousSessionId) return;
    throw new ForbiddenException('You do not have access to this payment.');
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.slice(0, 1);
    return `${visible}***@${domain}`;
  }

  toSafeDto(
    order: {
      id: string;
      quoteId: string;
      status: string;
      fulfilmentStatus: string;
      amountExpectedKobo: number;
      amountPaidKobo: number | null;
      currency: string;
      providerReference: string;
      customerEmail: string;
      entitlementExpiresAt: Date | null;
      paidAt: Date | null;
      metadataSafe: unknown;
    },
    lineItems: Array<{
      id: string;
      clientItemKey: string;
      productLabel: string;
      locationKey: string;
      free: boolean;
      amountKobo: number;
      fulfilmentStatus: string;
      reportId: string | null;
      researchRequestId?: string | null;
    }>,
  ): SafeOrderDto {
    const meta = (order.metadataSafe ?? {}) as { chargeableItemCount?: number; freeItemCountApplied?: number };
    const freeCount = meta.freeItemCountApplied ?? lineItems.filter((l) => l.free).length;
    const requestIds = lineItems
      .map((l) => l.researchRequestId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    return {
      paymentOrderId: order.id,
      quoteId: order.quoteId,
      status: order.status,
      fulfilmentStatus: order.fulfilmentStatus,
      amountExpectedKobo: order.amountExpectedKobo,
      amountPaidKobo: order.amountPaidKobo,
      currency: order.currency,
      providerReference: order.providerReference,
      reference: order.providerReference,
      customerEmailMasked: this.maskEmail(order.customerEmail),
      chargeableItemCount: meta.chargeableItemCount ?? lineItems.filter((l) => !l.free).length,
      freeItemCount: freeCount,
      freeItemCountApplied: freeCount,
      entitlementExpiresAt: order.entitlementExpiresAt?.toISOString() ?? null,
      paidAt: order.paidAt?.toISOString() ?? null,
      requestIds,
      lineItems: lineItems.map((l) => ({
        id: l.id,
        clientItemKey: l.clientItemKey,
        productLabel: l.productLabel,
        locationKey: l.locationKey,
        free: l.free,
        amountKobo: l.amountKobo,
        fulfilmentStatus: l.fulfilmentStatus,
        reportId: l.reportId,
        researchRequestId: l.researchRequestId ?? null,
      })),
    };
  }
}
