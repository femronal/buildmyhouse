import { Prisma } from '@prisma/client';

/**
 * A selected repair matches an artisan who was tagged with that problem,
 * or an artisan in the trade that owns the problem when no problems were tagged.
 * Hidden catalog problems do not match.
 */
export function artisanProblemWhere(problemKey: string): Prisma.ArtisanListingWhereInput {
  return {
    OR: [
      { capabilities: { some: { capability: { kind: 'problem', key: problemKey, isActive: true } } } },
      {
        AND: [
          { capabilities: { none: { capability: { kind: 'problem', isActive: true } } } },
          { primaryTrade: { capabilities: { some: { kind: 'problem', key: problemKey, isActive: true } } } },
        ],
      },
    ],
  };
}
