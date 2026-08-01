/**
 * Stage 7 — admin revenue / unit-economics diagnostics (read-only aggregates).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loadPricingConfig } from './pricing.config';

@Injectable()
export class AdminPricePaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async revenueCards(days = 30) {
    const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.priceCheckPaymentOrder.findMany({
      where: { status: { in: ['success', 'partially_refunded', 'refunded'] }, paidAt: { gte: since } },
      select: {
        amountPaidKobo: true,
        amountExpectedKobo: true,
        refundedAmountKobo: true,
        status: true,
      },
    });
    const grossRevenueKobo = orders.reduce((s, o) => s + (o.amountPaidKobo ?? o.amountExpectedKobo), 0);
    const refundedKobo = orders.reduce((s, o) => s + o.refundedAmountKobo, 0);
    const netRevenueKobo = grossRevenueKobo - refundedKobo;

    const economics = await this.prisma.priceCheckUnitEconomics.findMany({
      where: { calculatedAt: { gte: since } },
    });
    const totalVariableCostKobo = economics.reduce((s, e) => s + e.totalVariableCostKobo, 0);
    const avgMarginBps =
      economics.length > 0
        ? Math.round(economics.reduce((s, e) => s + e.grossMarginBps, 0) / economics.length)
        : null;

    const config = loadPricingConfig();
    return {
      windowDays: days,
      successfulPayments: orders.length,
      grossRevenueKobo,
      refundedKobo,
      netRevenueKobo,
      totalVariableCostKobo,
      estimatedGrossMarginKobo: netRevenueKobo - totalVariableCostKobo,
      averageGrossMarginBps: avgMarginBps,
      targetGrossMarginBps: config.targetGrossMarginBps,
      unitEconomicsRows: economics.length,
      checkoutEnabled: config.checkoutEnabled,
      pricingVersion: config.pricingVersion,
      unitPriceKobo: config.pricePerReportKobo,
    };
  }

  async transactions(take = 50) {
    const rows = await this.prisma.priceCheckPaymentOrder.findMany({
      take: Math.min(200, Math.max(1, take)),
      orderBy: { createdAt: 'desc' },
      include: {
        lineItems: { select: { id: true, productLabel: true, amountKobo: true, fulfilmentStatus: true, free: true } },
      },
    });
    return {
      transactions: rows.map((o) => ({
        paymentOrderId: o.id,
        status: o.status,
        fulfilmentStatus: o.fulfilmentStatus,
        amountExpectedKobo: o.amountExpectedKobo,
        amountPaidKobo: o.amountPaidKobo,
        refundedAmountKobo: o.refundedAmountKobo,
        currency: o.currency,
        providerReference: o.providerReference,
        customerEmailMasked: this.maskEmail(o.customerEmail),
        paidAt: o.paidAt?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
        lineItemCount: o.lineItems.length,
        lineItems: o.lineItems,
      })),
    };
  }

  async unitEconomics(take = 50) {
    const rows = await this.prisma.priceCheckUnitEconomics.findMany({
      take: Math.min(200, Math.max(1, take)),
      orderBy: { calculatedAt: 'desc' },
    });
    return { rows };
  }

  async alerts() {
    const config = loadPricingConfig();
    const alerts: Array<{ code: string; severity: 'info' | 'warning' | 'critical'; message: string }> = [];

    if (!config.checkoutEnabled) {
      alerts.push({
        code: 'checkout_disabled',
        severity: 'critical',
        message: config.checkoutDisabledReason ?? 'Checkout disabled',
      });
    }
    if (!process.env.PAYSTACK_SECRET_KEY?.trim()) {
      alerts.push({
        code: 'paystack_unconfigured',
        severity: 'warning',
        message: 'PAYSTACK_SECRET_KEY is not set',
      });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lowMargin = await this.prisma.priceCheckUnitEconomics.findMany({
      where: {
        calculatedAt: { gte: since },
        grossMarginBps: { lt: config.targetGrossMarginBps },
        costDataComplete: true,
      },
      take: 20,
    });
    if (lowMargin.length > 0) {
      alerts.push({
        code: 'below_target_margin',
        severity: 'warning',
        message: `${lowMargin.length} line item(s) in the last 7 days are below target margin (${config.targetGrossMarginBps} bps)`,
      });
    }

    const highCost = await this.prisma.priceCheckUnitEconomics.count({
      where: {
        calculatedAt: { gte: since },
        aiCostKobo: { gt: config.maxResearchCostPerItemKobo },
      },
    });
    if (highCost > 0) {
      alerts.push({
        code: 'research_cost_ceiling',
        severity: 'warning',
        message: `${highCost} item(s) exceeded max research cost per item (${config.maxResearchCostPerItemKobo} kobo)`,
      });
    }

    const techFails = await this.prisma.priceCheckPaymentLineItem.count({
      where: { fulfilmentStatus: 'technical_failure', createdAt: { gte: since } },
    });
    if (techFails > 0) {
      alerts.push({
        code: 'technical_failures',
        severity: 'warning',
        message: `${techFails} paid line item(s) hit technical failure in the last 7 days`,
      });
    }

    return { alerts };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    return `${local.slice(0, 1)}***@${domain}`;
  }
}
