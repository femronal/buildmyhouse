/**
 * Read-only report. Does not update or delete anything.
 *
 * Lists claimed vendors whose cement offering was created by an owner save
 * soon after claim, while primaryFamilyKey is still empty.
 *
 * Run from apps/backend:
 *   npx ts-node scripts/report-accidental-cement-offerings.ts
 */
import { PrismaClient } from '@prisma/client';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const prisma = new PrismaClient();

async function main() {
  const offerings = await prisma.vendorOffering.findMany({
    where: {
      familyKey: 'cement',
      vendorProfile: {
        claimStatus: 'claimed',
        claimedAt: { not: null },
        primaryFamilyKey: null,
        deletedAt: null,
      },
    },
    include: {
      vendorProfile: {
        select: {
          slug: true,
          tradingName: true,
          claimedAt: true,
          description: true,
          primaryFamilyKey: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const hits = offerings.filter((offering) => {
    const claimedAt = offering.vendorProfile.claimedAt;
    if (!claimedAt) return false;
    const delta = offering.createdAt.getTime() - claimedAt.getTime();
    return delta >= 0 && delta <= SEVEN_DAYS_MS;
  });

  const report = hits.map((offering) => ({
    slug: offering.vendorProfile.slug,
    tradingName: offering.vendorProfile.tradingName,
    claimedAt: offering.vendorProfile.claimedAt?.toISOString() ?? null,
    offeringCreatedAt: offering.createdAt.toISOString(),
    brands: offering.brands,
    description: offering.vendorProfile.description,
    offeringId: offering.id,
    primaryFamilyKey: offering.vendorProfile.primaryFamilyKey,
  }));

  console.log(JSON.stringify({ count: report.length, vendors: report }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
