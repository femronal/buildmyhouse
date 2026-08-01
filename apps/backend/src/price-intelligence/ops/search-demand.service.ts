import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchDemandService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate unmatched / insufficient-data demand from PriceQuery,
   * insufficient_data report items, and custom product requests.
   */
  async getDemand(take = 50) {
    const limit = Math.min(Math.max(take, 1), 200);

    const [unmatchedQueries, insufficientItems, customRequests, unmatchedTerms] =
      await Promise.all([
        this.prisma.priceQuery.groupBy({
          by: ['normalizedQuery'],
          where: {
            OR: [{ matchType: 'none' }, { matchType: null, matchedFamilyId: null }],
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: limit,
        }),
        this.prisma.priceReportItem.findMany({
          where: { outcome: 'insufficient_data' },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            requestItem: {
              select: {
                rawProductName: true,
                familyId: true,
                family: { select: { key: true, name: true } },
              },
            },
            report: { select: { id: true, generatedAt: true } },
          },
        }),
        this.prisma.priceCustomProductRequest.findMany({
          orderBy: [{ requestCount: 'desc' }, { lastSeenAt: 'desc' }],
          take: limit,
        }),
        this.prisma.priceUnmatchedTerm.findMany({
          where: { status: 'open' },
          orderBy: [{ requestCount: 'desc' }, { lastSeenAt: 'desc' }],
          take: limit,
        }),
      ]);

    // Aggregate insufficient-data by product label
    const insuffMap = new Map<
      string,
      { label: string; familyKey: string | null; count: number; lastSeenAt: string }
    >();
    for (const item of insufficientItems) {
      const label = item.requestItem.rawProductName;
      const familyKey = item.requestItem.family?.key ?? null;
      const key = `${familyKey ?? 'none'}::${label.toLowerCase()}`;
      const prev = insuffMap.get(key);
      if (prev) {
        prev.count += 1;
        if (item.createdAt.toISOString() > prev.lastSeenAt) {
          prev.lastSeenAt = item.createdAt.toISOString();
        }
      } else {
        insuffMap.set(key, {
          label,
          familyKey,
          count: 1,
          lastSeenAt: item.createdAt.toISOString(),
        });
      }
    }

    return {
      unmatchedQueries: unmatchedQueries.map((q) => ({
        normalizedQuery: q.normalizedQuery,
        count: q._count.id,
      })),
      insufficientDataDemand: [...insuffMap.values()].sort((a, b) => b.count - a.count),
      customRequests: customRequests.map((c) => ({
        id: c.id,
        rawQuery: c.rawQuery,
        normalizedQuery: c.normalizedQuery,
        requestCount: c.requestCount,
        paidIntentCount: c.paidIntentCount,
        status: c.status,
        lastSeenAt: c.lastSeenAt,
      })),
      unmatchedTerms,
      generatedAt: new Date().toISOString(),
    };
  }

  async recordUnmatchedTerm(rawQuery: string, paidIntent = false) {
    const normalized = rawQuery.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normalized) return null;
    return this.prisma.priceUnmatchedTerm.upsert({
      where: { normalizedTerm: normalized },
      create: {
        normalizedTerm: normalized,
        sampleRawQuery: rawQuery.trim(),
        requestCount: 1,
        paidIntentCount: paidIntent ? 1 : 0,
      },
      update: {
        requestCount: { increment: 1 },
        paidIntentCount: paidIntent ? { increment: 1 } : undefined,
        lastSeenAt: new Date(),
      },
    });
  }

  async updateUnmatchedTerm(
    id: string,
    data: { status?: string; suggestedFamilyKey?: string | null },
  ) {
    const update: Prisma.PriceUnmatchedTermUpdateInput = {};
    if (data.status !== undefined) update.status = data.status;
    if (data.suggestedFamilyKey !== undefined) update.suggestedFamilyKey = data.suggestedFamilyKey;
    return this.prisma.priceUnmatchedTerm.update({ where: { id }, data: update });
  }
}
