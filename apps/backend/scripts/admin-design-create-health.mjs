/**
 * Confirms an admin plan create does not take the API down.
 *
 * Requires a local API, an admin bearer token, and a verified contractor user id.
 * Skips cleanly when those are not set, so CI does not call a real database.
 *
 * BASE_URL=http://localhost:3001 ADMIN_TOKEN=... CONTRACTOR_USER_ID=... node scripts/admin-design-create-health.mjs
 */
const baseUrl = (process.env.BASE_URL || '').replace(/\/+$/, '');
const token = process.env.ADMIN_TOKEN || '';
const contractorUserId = process.env.CONTRACTOR_USER_ID || '';

if (!baseUrl || !token || !contractorUserId) {
  console.log('skipped: set BASE_URL, ADMIN_TOKEN, and CONTRACTOR_USER_ID to run the admin create health check');
  process.exit(0);
}

const response = await fetch(`${baseUrl}/api/designs/admin/contractor/${contractorUserId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Health check plan',
    description: 'Temporary plan used to confirm the API stays up after create.',
    estimatedCost: 1,
    estimatedDuration: '1 day',
    images: [],
  }),
});

console.log(`create status ${response.status}`);
await new Promise((resolve) => setTimeout(resolve, 3000));

const health = await fetch(`${baseUrl}/api/health`);
const body = await health.text();
console.log(`health status ${health.status} body ${body}`);
if (health.status !== 200) {
  process.exit(1);
}
