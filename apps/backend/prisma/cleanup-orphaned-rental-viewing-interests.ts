import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type OrphanedInterestRow = {
  id: string;
  rentalListingId: string | null;
  homeownerId: string;
  outcomeStatus: string;
  createdAt: Date;
};

const args = new Set(process.argv.slice(2));
const shouldApply = args.has('--apply');
const includeSetNull = args.has('--include-set-null');

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function cleanupOrphanedRentalViewingInterests() {
  console.log('🧹 Scanning rental viewing interests for orphaned rows...');
  console.log(`Mode: ${shouldApply ? 'APPLY (deletes rows)' : 'DRY RUN (no deletions)'}`);
  if (includeSetNull) {
    console.log('Including rows with NULL rentalListingId due to --include-set-null');
  }

  const extraWhere = includeSetNull ? ' OR rvi.rental_listing_id IS NULL' : '';

  const rows = (await prisma.$queryRawUnsafe(`
    SELECT
      rvi.id,
      rvi.rental_listing_id AS "rentalListingId",
      rvi.homeowner_id AS "homeownerId",
      rvi.outcome_status AS "outcomeStatus",
      rvi.created_at AS "createdAt"
    FROM rental_viewing_interests rvi
    LEFT JOIN rental_listings rl ON rl.id = rvi.rental_listing_id
    LEFT JOIN users u ON u.id = rvi.homeowner_id
    WHERE
      u.id IS NULL
      OR (rvi.rental_listing_id IS NOT NULL AND rl.id IS NULL)
      ${extraWhere}
    ORDER BY rvi.created_at DESC
  `)) as OrphanedInterestRow[];

  console.log(`Found ${rows.length} orphaned rental viewing interest row(s).`);

  if (rows.length === 0) {
    console.log('✅ Nothing to clean.');
    return;
  }

  console.log('Sample rows (up to 20):');
  rows.slice(0, 20).forEach((row, index) => {
    console.log(
      `${index + 1}. id=${row.id} rentalListingId=${row.rentalListingId ?? 'NULL'} homeownerId=${row.homeownerId} outcome=${row.outcomeStatus} createdAt=${new Date(row.createdAt).toISOString()}`,
    );
  });

  if (!shouldApply) {
    console.log('\nDry run complete. Re-run with --apply to permanently delete these rows.');
    return;
  }

  const ids = rows.map((row) => row.id);
  let deletedCount = 0;

  for (const idsChunk of chunk(ids, 500)) {
    const result = await prisma.rentalViewingInterest.deleteMany({
      where: { id: { in: idsChunk } },
    });
    deletedCount += result.count;
  }

  console.log('\n🎉 Cleanup complete!');
  console.log(`Deleted ${deletedCount} orphaned rental viewing interest row(s).`);
}

cleanupOrphanedRentalViewingInterests()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
