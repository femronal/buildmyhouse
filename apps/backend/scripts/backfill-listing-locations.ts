/**
 * Fill stateSlug / lgaSlug / areaSlug from the stored location text.
 * Dry-run by default. Does not delete anything.
 *
 *   npx ts-node scripts/backfill-listing-locations.ts --dry-run --limit 20
 *   npx ts-node scripts/backfill-listing-locations.ts --apply --limit 20
 */
import { PrismaClient } from '@prisma/client';
import { locationSlugsFromText } from '../src/listings/location-slugs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const limitArg = args.find((arg) => arg.startsWith('--limit'));
const limit = limitArg ? Number(limitArg.split('=')[1] || args[args.indexOf('--limit') + 1]) : 20;

async function main() {
  if (!apply) {
    const samples = [
      'Tipper Bus Stop, Bluestone Garden City, Mowe, Ogun State',
      'Bode Thomas, Surulere, Lagos',
      'Lagos/Ogun state',
    ];
    for (const sample of samples) {
      console.log(sample, '->', locationSlugsFromText(sample));
    }
    console.log('Dry-run did not connect to the database and did not write anything. Pass --apply on a non-production database to update rows.');
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL. Nothing was written.');
    return;
  }
  const prisma = new PrismaClient();
  const models = [
    { name: 'rental', rows: await prisma.rentalListing.findMany({ take: limit, select: { id: true, location: true, stateSlug: true } }) },
    { name: 'house', rows: await prisma.houseForSale.findMany({ take: limit, select: { id: true, location: true, stateSlug: true } }) },
    { name: 'land', rows: await prisma.landForSale.findMany({ take: limit, select: { id: true, location: true, stateSlug: true } }) },
  ];
  const unmatched: { model: string; id: string; location: string }[] = [];
  for (const model of models) {
    for (const row of model.rows) {
      const slugs = locationSlugsFromText(row.location);
      if (!slugs.stateSlug) unmatched.push({ model: model.name, id: row.id, location: row.location });
      console.log(`${apply ? 'update' : 'dry-run'} ${model.name} ${row.id} ${row.location} -> ${JSON.stringify(slugs)}`);
      if (apply && slugs.stateSlug && !row.stateSlug) {
        const data = slugs;
        if (model.name === 'rental') await prisma.rentalListing.update({ where: { id: row.id }, data });
        if (model.name === 'house') await prisma.houseForSale.update({ where: { id: row.id }, data });
        if (model.name === 'land') await prisma.landForSale.update({ where: { id: row.id }, data });
      }
    }
  }
  console.log('Unmatched', unmatched);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
