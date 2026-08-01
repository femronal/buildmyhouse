/**
 * Stage 7 — per line-item unit economics (integer kobo).
 * Never exposed to consumers.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loadPricingConfig } from './pricing.config';

@Injectable()
export class PriceCheckerUnitEconomicsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record economics after a paid line item is fulfilled.
   * researchCostUsdMicros: estimated research cost in USD micros (1e-6 USD).
   */
  async recordForLineItem(args: {
    paymentOrderId: string;
    lineItemId: string;
    reportId: string | null;
    grossRevenueKobo: number;
    researchCostUsdMicros?: number | null;
    refundCostKobo?: number;
  }): Promise<void> {
    const config = loadPricingConfig();
    const researchUsdMicros = args.researchCostUsdMicros ?? null;
    let aiCostKobo = 0;
    if (researchUsdMicros != null && config.usdNgnRate != null) {
      // micros → USD → NGN kobo: (micros / 1e6) * rate * 100
      aiCostKobo = Math.max(0, Math.round((researchUsdMicros / 1_000_000) * config.usdNgnRate * 100));
    }

    const paymentFeeKobo = Math.round(args.grossRevenueKobo * 0.015); // approx Paystack; refined when fee available
    const refundCostKobo = args.refundCostKobo ?? 0;
    const totalVariableCostKobo = paymentFeeKobo + aiCostKobo + refundCostKobo;
    const netRevenueKobo = args.grossRevenueKobo - totalVariableCostKobo;
    const grossMarginKobo = netRevenueKobo;
    const grossMarginBps =
      args.grossRevenueKobo > 0 ? Math.round((grossMarginKobo / args.grossRevenueKobo) * 10_000) : 0;

    await this.prisma.priceCheckUnitEconomics.upsert({
      where: { lineItemId: args.lineItemId },
      create: {
        paymentOrderId: args.paymentOrderId,
        lineItemId: args.lineItemId,
        reportId: args.reportId,
        grossRevenueKobo: args.grossRevenueKobo,
        paymentFeeKobo,
        researchCostUsdMicros: researchUsdMicros,
        aiCostKobo,
        refundCostKobo,
        totalVariableCostKobo,
        netRevenueKobo,
        grossMarginKobo,
        grossMarginBps,
        costDataComplete: researchUsdMicros != null,
      },
      update: {
        reportId: args.reportId,
        grossRevenueKobo: args.grossRevenueKobo,
        paymentFeeKobo,
        researchCostUsdMicros: researchUsdMicros,
        aiCostKobo,
        refundCostKobo,
        totalVariableCostKobo,
        netRevenueKobo,
        grossMarginKobo,
        grossMarginBps,
        costDataComplete: researchUsdMicros != null,
        calculatedAt: new Date(),
      },
    });
  }
}
