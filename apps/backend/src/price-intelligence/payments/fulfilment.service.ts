/**
 * Stage 7 — one-time fulfilment entitlement after verified payment.
 * Starts research only when entitlement is ready. Idempotent per line item.
 * Does not create a reusable wallet.
 */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsageIdentity } from '../consumer/price-checker-usage.service';
import { PriceCheckerResearchService, StartResearchInput } from '../consumer/price-checker-research.service';
import { PriceCheckerUnitEconomicsService } from './unit-economics.service';
import { PriceCheckerPaymentService } from './payment.service';
import { loadPricingConfig } from './pricing.config';

@Injectable()
export class PriceCheckerFulfilmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PriceCheckerPaymentService,
    @Inject(forwardRef(() => PriceCheckerResearchService))
    private readonly research: PriceCheckerResearchService,
    private readonly economics: PriceCheckerUnitEconomicsService,
  ) {}

  /**
   * Consume one ready paid line item for this session matching the research input.
   */
  async consumeEntitlementForStart(
    paymentOrderId: string,
    input: StartResearchInput,
    identity: UsageIdentity,
  ): Promise<{ lineItemId: string; paymentOrderId: string }> {
    const order = await this.prisma.priceCheckPaymentOrder.findUnique({
      where: { id: paymentOrderId },
      include: { lineItems: true },
    });
    if (!order) throw new NotFoundException('Payment order not found');
    this.assertOwnership(order, identity);

    if (order.status !== 'success') {
      throw new ForbiddenException({
        code: 'payment_required',
        remainingFree: 0,
        message: 'Payment not completed.',
      });
    }
    if (!['ready', 'processing', 'partially_complete'].includes(order.fulfilmentStatus)) {
      throw new ForbiddenException({
        code: 'entitlement_unavailable',
        message: 'This payment cannot start research.',
      });
    }

    const config = loadPricingConfig();
    if (order.entitlementExpiresAt && order.entitlementExpiresAt.getTime() < Date.now()) {
      const anyStarted = order.lineItems.some(
        (l) => l.fulfilmentStatus === 'processing' || l.fulfilmentStatus === 'fulfilled',
      );
      if (!anyStarted) {
        await this.prisma.priceCheckPaymentOrder.update({
          where: { id: order.id },
          data: {
            entitlementExpiresAt: new Date(Date.now() + config.entitlementWindowHours * 60 * 60 * 1000),
          },
        });
      } else {
        throw new ForbiddenException({
          code: 'entitlement_expired',
          message: 'Paid research window expired. Contact support.',
        });
      }
    }

    const match = order.lineItems.find(
      (l) =>
        l.fulfilmentStatus === 'ready' &&
        l.familyKey === input.familyKey &&
        l.kind === input.kind &&
        l.locationKey === input.locationKey &&
        l.rawProductName === input.rawProductName.slice(0, 300),
    );
    const fallback = order.lineItems.find((l) => l.fulfilmentStatus === 'ready');
    const line = match ?? fallback;
    if (!line) {
      throw new ForbiddenException({
        code: 'entitlement_exhausted',
        message: 'No remaining reports on this payment.',
      });
    }

    const updated = await this.prisma.priceCheckPaymentLineItem.updateMany({
      where: { id: line.id, fulfilmentStatus: 'ready' },
      data: { fulfilmentStatus: 'processing' },
    });
    if (updated.count === 0) {
      throw new ForbiddenException({
        code: 'entitlement_exhausted',
        message: 'Line item already consumed.',
      });
    }

    await this.prisma.priceCheckPaymentOrder.update({
      where: { id: order.id },
      data: { fulfilmentStatus: 'processing' },
    });

    return { lineItemId: line.id, paymentOrderId: order.id };
  }

  async startPaidBatch(paymentOrderId: string, identity: UsageIdentity) {
    const order = await this.prisma.priceCheckPaymentOrder.findUnique({
      where: { id: paymentOrderId },
      include: { lineItems: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Payment order not found');
    this.assertOwnership(order, identity);

    if (order.status !== 'success') {
      throw new BadRequestException({
        code: 'payment_not_confirmed',
        message: 'Payment must be confirmed before research starts.',
      });
    }

    const config = loadPricingConfig();
    if (order.entitlementExpiresAt && order.entitlementExpiresAt.getTime() < Date.now()) {
      if (order.fulfilmentStatus === 'ready' || order.fulfilmentStatus === 'not_started') {
        await this.prisma.priceCheckPaymentOrder.update({
          where: { id: order.id },
          data: {
            entitlementExpiresAt: new Date(Date.now() + config.entitlementWindowHours * 60 * 60 * 1000),
          },
        });
      } else {
        throw new BadRequestException({
          code: 'entitlement_expired',
          message: 'This payment entitlement has expired. Contact support with your payment reference.',
        });
      }
    }

    if (order.fulfilmentStatus === 'complete') {
      return this.withRequestIds(await this.payments.status(paymentOrderId, identity));
    }

    await this.prisma.priceCheckPaymentOrder.update({
      where: { id: order.id },
      data: { fulfilmentStatus: 'processing' },
    });

    for (const line of order.lineItems) {
      if (line.fulfilmentStatus === 'fulfilled' || line.reportId) continue;
      if (line.fulfilmentStatus === 'processing' && line.researchRequestId) continue;
      if (line.fulfilmentStatus !== 'ready' && line.fulfilmentStatus !== 'pending') continue;

      const answers = (line.answersJson ?? {}) as Record<string, string>;
      const input: StartResearchInput = {
        familyKey: line.familyKey,
        kind: line.kind === 'service' ? 'service' : 'product',
        answers,
        locationKey: line.locationKey,
        rawProductName: line.rawProductName,
      };

      const claimed = await this.prisma.priceCheckPaymentLineItem.updateMany({
        where: { id: line.id, fulfilmentStatus: { in: ['ready', 'pending'] } },
        data: { fulfilmentStatus: 'processing' },
      });
      if (claimed.count === 0) continue;

      try {
        const { requestId } = await this.research.startPaid(input, identity, {
          paymentOrderId: order.id,
          lineItemId: line.id,
        });
        await this.prisma.priceCheckPaymentLineItem.update({
          where: { id: line.id },
          data: { researchRequestId: requestId },
        });
      } catch (err) {
        await this.prisma.priceCheckPaymentLineItem.update({
          where: { id: line.id },
          data: {
            fulfilmentStatus: 'technical_failure',
            technicalFailureReason: err instanceof Error ? err.message.slice(0, 300) : 'start_failed',
          },
        });
      }
    }

    return this.withRequestIds(await this.payments.status(paymentOrderId, identity));
  }

  async getPaidBatch(paymentOrderId: string, identity: UsageIdentity) {
    return this.withRequestIds(await this.payments.status(paymentOrderId, identity));
  }

  private withRequestIds<T extends { requestIds?: string[] }>(status: T) {
    const requestIds = status.requestIds ?? [];
    return { ...status, requestId: requestIds[0], requestIds };
  }

  /** Called by research service when a paid line item's report is persisted. */
  async markLineFulfilled(args: {
    lineItemId: string;
    reportId: string;
    outcome: 'priced' | 'insufficient_data' | 'failed';
    researchCostUsd?: number | null;
  }): Promise<void> {
    const line = await this.prisma.priceCheckPaymentLineItem.findUnique({
      where: { id: args.lineItemId },
    });
    if (!line) return;

    // Idempotent
    if (line.fulfilmentStatus === 'fulfilled' && line.reportId) return;

    if (args.outcome === 'failed') {
      await this.prisma.priceCheckPaymentLineItem.update({
        where: { id: line.id },
        data: {
          fulfilmentStatus: 'technical_failure',
          technicalFailureReason: 'research_failed',
        },
      });
    } else {
      await this.prisma.priceCheckPaymentLineItem.update({
        where: { id: line.id },
        data: {
          fulfilmentStatus: 'fulfilled',
          reportId: args.reportId || null,
          fulfilledAt: new Date(),
        },
      });
      if (!line.free && line.amountKobo > 0) {
        const micros =
          args.researchCostUsd != null && Number.isFinite(args.researchCostUsd)
            ? Math.round(args.researchCostUsd * 1_000_000)
            : null;
        await this.economics.recordForLineItem({
          paymentOrderId: line.paymentOrderId,
          lineItemId: line.id,
          reportId: args.reportId || null,
          grossRevenueKobo: line.amountKobo,
          researchCostUsdMicros: micros,
        });
      }
    }

    await this.refreshOrderFulfilment(line.paymentOrderId);
  }

  private async refreshOrderFulfilment(paymentOrderId: string): Promise<void> {
    const lines = await this.prisma.priceCheckPaymentLineItem.findMany({
      where: { paymentOrderId },
    });
    const allDone = lines.every((l) =>
      ['fulfilled', 'technical_failure', 'refunded'].includes(l.fulfilmentStatus),
    );
    const anyFail = lines.some((l) => l.fulfilmentStatus === 'technical_failure');
    const anyOk = lines.some((l) => l.fulfilmentStatus === 'fulfilled');

    let fulfilmentStatus = 'processing';
    if (allDone && anyFail && anyOk) fulfilmentStatus = 'partially_complete';
    else if (allDone && anyFail && !anyOk) fulfilmentStatus = 'technical_failure';
    else if (allDone) fulfilmentStatus = 'complete';

    await this.prisma.priceCheckPaymentOrder.update({
      where: { id: paymentOrderId },
      data: { fulfilmentStatus },
    });
  }

  private assertOwnership(
    order: { anonymousSessionId: string | null; userId: string | null; sessionId: string },
    identity: UsageIdentity,
  ): void {
    if (order.userId && identity.userId === order.userId) return;
    if (order.anonymousSessionId && identity.anonymousSessionId === order.anonymousSessionId) return;
    if (identity.anonymousSessionId && order.sessionId === identity.anonymousSessionId) return;
    throw new ForbiddenException('You do not have access to this payment.');
  }
}
