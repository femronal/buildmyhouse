/**
 * Stage 7 — refunds for technical failures (full / partial).
 * Auto-refund to Paystack is gated by PRICE_CHECKER_AUTO_REFUND=true.
 */
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PRICE_CHECKER_PAYMENT_PROVIDER,
  PriceCheckerPaymentProvider,
} from './paystack.provider';

@Injectable()
export class PriceCheckerRefundService {
  private readonly logger = new Logger(PriceCheckerRefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRICE_CHECKER_PAYMENT_PROVIDER)
    private readonly paystack: PriceCheckerPaymentProvider,
  ) {}

  /**
   * Initiate a refund for a technically failed line item (partial) or the whole order.
   * Does not auto-call Paystack unless PRICE_CHECKER_AUTO_REFUND=true.
   */
  async refundTechnicalFailure(args: {
    paymentOrderId: string;
    lineItemId?: string;
    reasonCode?: string;
  }): Promise<{ refundId: string; status: string; amountKobo: number; providerSubmitted: boolean }> {
    const order = await this.prisma.priceCheckPaymentOrder.findUnique({
      where: { id: args.paymentOrderId },
      include: { lineItems: true, refunds: true },
    });
    if (!order) throw new NotFoundException('Payment order not found');
    if (order.status !== 'success' && order.status !== 'partially_refunded') {
      throw new BadRequestException('Only successful payments can be refunded.');
    }

    let amountKobo: number;
    let lineItemId: string | null = args.lineItemId ?? null;

    if (lineItemId) {
      const line = order.lineItems.find((l) => l.id === lineItemId);
      if (!line) throw new NotFoundException('Line item not found');
      if (line.free || line.amountKobo <= 0) {
        throw new BadRequestException('Free line items have no refundable amount.');
      }
      if (line.fulfilmentStatus === 'refunded') {
        const existing = order.refunds.find((r) => r.lineItemId === lineItemId && r.status !== 'failed');
        if (existing) {
          return {
            refundId: existing.id,
            status: existing.status,
            amountKobo: existing.amountKobo,
            providerSubmitted: Boolean(existing.providerRefundId),
          };
        }
      }
      amountKobo = line.amountKobo;
    } else {
      amountKobo = Math.max(0, order.amountPaidKobo ?? order.amountExpectedKobo) - order.refundedAmountKobo;
      if (amountKobo <= 0) throw new BadRequestException('Nothing left to refund.');
    }

    const refundId = randomUUID();
    const reasonCode = args.reasonCode ?? 'technical_failure';
    const auto = (process.env.PRICE_CHECKER_AUTO_REFUND ?? 'false').toLowerCase() === 'true';

    await this.prisma.priceCheckRefund.create({
      data: {
        id: refundId,
        paymentOrderId: order.id,
        lineItemId,
        amountKobo,
        reasonCode,
        status: 'pending',
      },
    });

    let providerRefundId: string | null = null;
    let status = 'pending';
    let providerSubmitted = false;

    if (auto) {
      try {
        const result = await this.paystack.refund({
          reference: order.providerReference,
          amountKobo: lineItemId ? amountKobo : undefined,
        });
        providerRefundId = result.providerRefundId;
        status = 'processing';
        providerSubmitted = true;
        await this.prisma.priceCheckRefund.update({
          where: { id: refundId },
          data: { status, providerRefundId },
        });
      } catch (err) {
        this.logger.error(`Paystack refund failed for order ${order.id}: ${err instanceof Error ? err.message : String(err)}`);
        await this.prisma.priceCheckRefund.update({
          where: { id: refundId },
          data: { status: 'failed' },
        });
        status = 'failed';
      }
    }

    if (status === 'processing' || (!auto && status === 'pending')) {
      // Soft-complete local accounting when auto-refund is off (ops will settle).
      if (!auto) {
        await this.markLocalRefundComplete(refundId, order.id, lineItemId, amountKobo, false);
        status = 'pending'; // awaiting ops
      } else if (providerSubmitted) {
        await this.markLocalRefundComplete(refundId, order.id, lineItemId, amountKobo, true);
        status = 'completed';
      }
    }

    return { refundId, status, amountKobo, providerSubmitted };
  }

  async markLocalRefundComplete(
    refundId: string,
    paymentOrderId: string,
    lineItemId: string | null,
    amountKobo: number,
    completed: boolean,
  ): Promise<void> {
    if (completed) {
      await this.prisma.priceCheckRefund.update({
        where: { id: refundId },
        data: { status: 'completed', completedAt: new Date() },
      });
    }

    if (lineItemId) {
      await this.prisma.priceCheckPaymentLineItem.update({
        where: { id: lineItemId },
        data: { fulfilmentStatus: 'refunded' },
      });
    }

    const order = await this.prisma.priceCheckPaymentOrder.findUnique({ where: { id: paymentOrderId } });
    if (!order) return;
    const refundedAmountKobo = order.refundedAmountKobo + amountKobo;
    const paid = order.amountPaidKobo ?? order.amountExpectedKobo;
    const status = refundedAmountKobo >= paid ? 'refunded' : 'partially_refunded';
    await this.prisma.priceCheckPaymentOrder.update({
      where: { id: paymentOrderId },
      data: {
        refundedAmountKobo,
        status,
        fulfilmentStatus: status === 'refunded' ? 'refunded' : order.fulfilmentStatus,
      },
    });
  }
}
