/**
 * Stage 7 — immutable server-side payment quotes.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceCheckerUsageService, UsageIdentity } from '../consumer/price-checker-usage.service';
import { loadPricingConfig } from './pricing.config';
import {
  calculateQuoteTotals,
  isFullyCoveredByFreeAllowance,
  QuoteItemInput,
  PricedQuoteLine,
} from './quote.math';

export interface CreateQuoteItemBody {
  familyKey: string;
  kind: 'product' | 'service';
  answers: Record<string, string>;
  locationKey: string;
  rawProductName: string;
  productLabel?: string;
  clientItemKey?: string;
}

export interface QuoteDto {
  /** Alias of quoteId — consumer clients use `id`. */
  id: string;
  quoteId: string;
  sessionId: string;
  currency: 'NGN';
  pricingVersion: string;
  requestedItemCount: number;
  freeItemCountApplied: number;
  chargeableItemCount: number;
  unitPriceKobo: number;
  subtotalKobo: number;
  discountKobo: number;
  totalKobo: number;
  remainingFreeReports: number;
  paymentRequired: boolean;
  checkoutEnabled: boolean;
  checkoutDisabledReason: string | null;
  status: string;
  expiresAt: string;
  lineItems: Array<{
    clientItemKey: string;
    productLabel: string;
    locationLabel?: string;
    locationKey: string;
    familyKey: string;
    kind: string;
    free: boolean;
    amountKobo: number;
  }>;
}

@Injectable()
export class PriceCheckerQuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: PriceCheckerUsageService,
  ) {}

  async createQuote(items: CreateQuoteItemBody[], identity: UsageIdentity): Promise<QuoteDto> {
    const sessionId = identity.anonymousSessionId ?? identity.userId;
    if (!sessionId) throw new BadRequestException('Missing session identifier.');

    const config = loadPricingConfig();
    if (items.length === 0) throw new BadRequestException('At least one item is required.');
    if (items.length > config.maxItemsPerCheckout) {
      throw new BadRequestException(`Maximum ${config.maxItemsPerCheckout} items per checkout.`);
    }

    const normalized = this.normalizeItems(items);
    const usage = await this.usage.usageStatus(identity);
    const remainingFree = usage.remaining;

    // Fully free: still return a quote with total 0 so UI can skip Paystack.
    if (remainingFree >= normalized.length) {
      if (config.pricePerReportKobo === null) {
        // Free path does not need a configured unit price.
        const syntheticUnit = 1; // unused because all free; totals use 0 chargeable
        const totals = calculateQuoteTotals({
          items: normalized,
          remainingFreeReports: remainingFree,
          unitPriceKobo: syntheticUnit,
        });
        // Force zero money even if synthetic unit was used
        return this.persistQuote({
          sessionId,
          identity,
          totals: {
            ...totals,
            unitPriceKobo: 0,
            subtotalKobo: 0,
            totalKobo: 0,
            lines: totals.lines.map((l) => ({ ...l, free: true, amountKobo: 0 })),
            freeItemCountApplied: totals.requestedItemCount,
            chargeableItemCount: 0,
          },
          configPricingVersion: config.pricingVersion,
          quoteTtlMinutes: config.quoteTtlMinutes,
          remainingFreeReports: remainingFree,
          checkoutEnabled: true,
          checkoutDisabledReason: null,
        });
      }
    }

    if (config.pricePerReportKobo === null) {
      throw new ServiceUnavailableException({
        code: 'checkout_disabled',
        message: config.checkoutDisabledReason,
      });
    }

    const totals = calculateQuoteTotals({
      items: normalized,
      remainingFreeReports: remainingFree,
      unitPriceKobo: config.pricePerReportKobo,
    });

    return this.persistQuote({
      sessionId,
      identity,
      totals,
      configPricingVersion: config.pricingVersion,
      quoteTtlMinutes: config.quoteTtlMinutes,
      remainingFreeReports: remainingFree,
      checkoutEnabled: config.checkoutEnabled,
      checkoutDisabledReason: config.checkoutDisabledReason,
    });
  }

  async getActiveQuote(quoteId: string, identity: UsageIdentity) {
    const quote = await this.prisma.priceCheckPaymentQuote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');
    this.assertQuoteOwnership(quote, identity);
    if (quote.status === 'expired' || quote.expiresAt.getTime() <= Date.now()) {
      if (quote.status !== 'expired') {
        await this.prisma.priceCheckPaymentQuote
          .update({ where: { id: quoteId }, data: { status: 'expired' } })
          .catch(() => undefined);
      }
      throw new BadRequestException({ code: 'quote_expired', message: 'Quote expired. Request a new quote.' });
    }
    return quote;
  }

  private normalizeItems(items: CreateQuoteItemBody[]): QuoteItemInput[] {
    return items.map((item, index) => {
      if (!item.familyKey || typeof item.familyKey !== 'string') {
        throw new BadRequestException('familyKey is required on each item');
      }
      if (item.kind !== 'product' && item.kind !== 'service') {
        throw new BadRequestException("kind must be 'product' or 'service'");
      }
      if (!item.locationKey || typeof item.locationKey !== 'string') {
        throw new BadRequestException('locationKey is required on each item');
      }
      if (!item.rawProductName || typeof item.rawProductName !== 'string' || !item.rawProductName.trim()) {
        throw new BadRequestException('rawProductName is required on each item');
      }
      const answers =
        item.answers && typeof item.answers === 'object' && !Array.isArray(item.answers)
          ? Object.fromEntries(
              Object.entries(item.answers)
                .filter(([, v]) => typeof v === 'string')
                .map(([k, v]) => [k.slice(0, 60), (v as string).slice(0, 200)]),
            )
          : {};
      const label = (item.productLabel ?? item.rawProductName).trim().slice(0, 200);
      return {
        clientItemKey: (item.clientItemKey ?? `item_${index}`).slice(0, 80),
        familyKey: item.familyKey.slice(0, 80),
        kind: item.kind,
        answers,
        locationKey: item.locationKey.slice(0, 80),
        rawProductName: item.rawProductName.trim().slice(0, 300),
        productLabel: label || item.rawProductName.trim().slice(0, 200),
      };
    });
  }

  private async persistQuote(args: {
    sessionId: string;
    identity: UsageIdentity;
    totals: ReturnType<typeof calculateQuoteTotals>;
    configPricingVersion: string;
    quoteTtlMinutes: number;
    remainingFreeReports: number;
    checkoutEnabled: boolean;
    checkoutDisabledReason: string | null;
  }): Promise<QuoteDto> {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + args.quoteTtlMinutes * 60_000);
    const lines = args.totals.lines as PricedQuoteLine[];

    await this.prisma.priceCheckPaymentQuote.create({
      data: {
        id,
        sessionId: args.sessionId,
        anonymousSessionId: args.identity.userId ? null : args.identity.anonymousSessionId,
        userId: args.identity.userId,
        requestedItemCount: args.totals.requestedItemCount,
        freeItemCountApplied: args.totals.freeItemCountApplied,
        chargeableItemCount: args.totals.chargeableItemCount,
        unitPriceKobo: args.totals.unitPriceKobo,
        subtotalKobo: args.totals.subtotalKobo,
        discountKobo: args.totals.discountKobo,
        totalKobo: args.totals.totalKobo,
        currency: 'NGN',
        pricingVersion: args.configPricingVersion,
        itemsJson: lines as unknown as Prisma.InputJsonValue,
        status: 'ready',
        expiresAt,
      },
    });

    return {
      id,
      quoteId: id,
      sessionId: args.sessionId,
      currency: 'NGN',
      pricingVersion: args.configPricingVersion,
      requestedItemCount: args.totals.requestedItemCount,
      freeItemCountApplied: args.totals.freeItemCountApplied,
      chargeableItemCount: args.totals.chargeableItemCount,
      unitPriceKobo: args.totals.unitPriceKobo,
      subtotalKobo: args.totals.subtotalKobo,
      discountKobo: args.totals.discountKobo,
      totalKobo: args.totals.totalKobo,
      remainingFreeReports: args.remainingFreeReports,
      paymentRequired: !isFullyCoveredByFreeAllowance(args.totals),
      checkoutEnabled: args.checkoutEnabled,
      checkoutDisabledReason: args.checkoutDisabledReason,
      status: 'ready',
      expiresAt: expiresAt.toISOString(),
      lineItems: lines.map((l) => ({
        clientItemKey: l.clientItemKey,
        productLabel: l.productLabel,
        locationLabel: l.locationKey,
        locationKey: l.locationKey,
        familyKey: l.familyKey,
        kind: l.kind,
        free: l.free,
        amountKobo: l.amountKobo,
      })),
    };
  }

  private assertQuoteOwnership(
    quote: { anonymousSessionId: string | null; userId: string | null; sessionId: string },
    identity: UsageIdentity,
  ): void {
    if (quote.userId && identity.userId === quote.userId) return;
    if (quote.anonymousSessionId && identity.anonymousSessionId === quote.anonymousSessionId) return;
    if (identity.anonymousSessionId && quote.sessionId === identity.anonymousSessionId) return;
    throw new NotFoundException('Quote not found');
  }
}
