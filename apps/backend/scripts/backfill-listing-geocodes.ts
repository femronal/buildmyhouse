/**
 * Geocode listing locations. Dry-run by default. Does not call Google or write rows.
 *   npx ts-node scripts/backfill-listing-geocodes.ts --dry-run --limit 20
 */
const apply = process.argv.includes('--apply');

async function main() {
  if (!apply || !process.env.GOOGLE_MAPS_GEOCODING_API_KEY) {
    console.log('Dry-run. No geocoding requests were sent and nothing was written.');
    return;
  }
  console.log('Apply mode needs a non-production database. This script stops here in the default checkout.');
}

main();
