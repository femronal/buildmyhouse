/**
 * Prisma-backed lookup of approved merchant/admin observations for consumer research.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ACTIVE_CONFIDENCE_POLICY } from '../reports/confidence-policy';
import {
  INTERNAL_COLLECTION_METHODS,
  InternalLookupResult,
  MerchantLink,
  StoredObservationRow,
  assessInternalSufficiency,
  filterByBrandHint,
  toInternalScoringObservation,
} from './internal-observations';

@Injectable()
export class InternalObservationService {
  constructor(private readonly prisma: PrismaService) {}

  async lookupForResearch(input: {
    familyKey: string;
    brand?: string | null;
    /** When true, always continue to live research even if internal evidence is enough. */
    forceLiveResearch?: boolean;
    take?: number;
  }): Promise<InternalLookupResult> {
    const family = await this.prisma.priceProductFamily.findUnique({
      where: { key: input.familyKey },
      select: { id: true },
    });
    if (!family) {
      return assessInternalSufficiency([], { forceLiveResearch: input.forceLiveResearch });
    }

    const maxAgeDays = ACTIVE_CONFIDENCE_POLICY.maxObservationAgeDays;
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const take = Math.min(input.take ?? 40, 80);

    const rows = (await this.prisma.priceObservation.findMany({
      where: {
        familyId: family.id,
        status: 'active',
        collectionMethod: { in: [...INTERNAL_COLLECTION_METHODS] },
        checkedDate: { gte: cutoff },
        supersededByObservationId: null,
      },
      include: {
        source: { select: { id: true, code: true, tier: true, name: true } },
      },
      orderBy: { checkedDate: 'desc' },
      take,
    })) as unknown as StoredObservationRow[];

    const filtered = filterByBrandHint(rows, input.brand);
    const ids = filtered.map((r) => r.id);

    const merchantLinks = ids.length
      ? await this.prisma.merchantPriceSubmissionItem.findMany({
          where: { observationId: { in: ids }, status: 'approved' },
          select: {
            observationId: true,
            submission: {
              select: {
                merchantId: true,
                merchant: { select: { businessName: true, sourceTier: true } },
              },
            },
          },
        })
      : [];

    const linkByObs = new Map<string, MerchantLink>();
    for (const link of merchantLinks) {
      if (!link.observationId) continue;
      linkByObs.set(link.observationId, {
        observationId: link.observationId,
        merchantId: link.submission.merchantId,
        businessName: link.submission.merchant?.businessName ?? null,
        sourceTier: link.submission.merchant?.sourceTier ?? null,
      });
    }

    const observations = filtered.map((row) =>
      toInternalScoringObservation(row, linkByObs.get(row.id)),
    );

    const forceLive =
      input.forceLiveResearch === true ||
      process.env.PRICE_CHECKER_FORCE_LIVE_RESEARCH === 'true';

    return assessInternalSufficiency(observations, { forceLiveResearch: forceLive });
  }
}
