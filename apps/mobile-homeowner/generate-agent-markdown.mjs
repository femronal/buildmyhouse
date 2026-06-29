import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const outputDir = path.resolve(process.cwd(), 'public');

const REPAIR_PRICING = [
  { service: 'Plumbing repair', low: 15000, high: 120000, unit: 'per job' },
  { service: 'Electrical repair', low: 20000, high: 150000, unit: 'per job' },
  { service: 'Roof leak repair', low: 50000, high: 350000, unit: 'per job' },
  { service: 'Drainage repair', low: 25000, high: 180000, unit: 'per job' },
  { service: 'Window repair', low: 20000, high: 120000, unit: 'per job' },
];

const formatNgn = (n) => `₦${n.toLocaleString('en-NG')}`;

const pricingTable = REPAIR_PRICING.map(
  (row) =>
    `- **${row.service}**: ${formatNgn(row.low)} – ${formatNgn(row.high)} (${row.unit}); BuildMyHouse platform fee: ₦0`,
).join('\n');

const pages = {
  'index.md': `# BuildMyHouse

> Find verified repairers, renovators, and contractors in Lagos, Nigeria. Manage repairs with clearer scope, photo evidence, and staged payments.

## Online booking

- **Book a repair**: ${WEB_URL}/book-repair
- Required fields: service, preferred date, time window, name, phone, Lagos area
- Platform service fee for repairs: **₦0 (free for now)** — client pays verified contractor quote only

## Pricing (directional, Lagos)

${pricingTable}

Full guide: ${WEB_URL}/pricing/repairs

## Business hours (WAT)

- Monday–Friday: 08:00–18:00
- Saturday: 09:00–14:00

## Contact

- Phone: +234 813 903 6559
- Address: 7 Ransome Kuti Rd, Akoka, Lagos 100001, Nigeria
- Markdown alternate: ${WEB_URL}/index.md

## Key service pages

- ${WEB_URL}/services/plumbing-repair-nigeria
- ${WEB_URL}/services/electrical-repair-nigeria
- ${WEB_URL}/services/roof-leak-repair-nigeria
- ${WEB_URL}/start-repair — tracked repair intake overview
`,

  'book-repair.md': `# Book a verified repair | BuildMyHouse

Schedule a verified repair in Lagos online.

**URL:** ${WEB_URL}/book-repair

## Platform fee

BuildMyHouse service fee for repair services is **free for now (₦0)**. Homeowners pay the verified contractor quote only, in staged milestones with evidence.

## Booking form (required fields)

| Field | Required | Notes |
| --- | --- | --- |
| service | yes | Plumbing, electrical, roof leak, drainage, window, or other |
| preferredDate | yes | ISO date, today or later |
| timeSlot | yes | 08:00–10:00, 10:00–12:00, 12:00–14:00, 14:00–16:00, or 16:00–18:00 WAT |
| fullName | yes | Contact name |
| phone | yes | WhatsApp-capable phone |
| area | yes | Lagos neighbourhood / property area |
| details | no | Fault description |

## After booking

Continue to tracked repair setup: ${WEB_URL}/start-repair

## Pricing reference

${pricingTable}

Full guide: ${WEB_URL}/pricing/repairs
`,

  'pricing/repairs.md': `# Repair pricing guide | BuildMyHouse

Directional contractor quote ranges in Lagos, Nigeria (NGN).

**URL:** ${WEB_URL}/pricing/repairs

## BuildMyHouse platform fee

**₦0 (free for now)** for all repair coordination. Client pays verified contractor quote only.

## Contractor quote ranges

| Service | Range (NGN) | Unit |
| --- | --- | --- |
${REPAIR_PRICING.map((r) => `| ${r.service} | ${formatNgn(r.low)} – ${formatNgn(r.high)} | ${r.unit} |`).join('\n')}

## Book online

${WEB_URL}/book-repair
`,
};

fs.mkdirSync(path.join(outputDir, 'pricing'), { recursive: true });

for (const [filePath, content] of Object.entries(pages)) {
  const fullPath = path.join(outputDir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

console.log(`[seo] Generated ${Object.keys(pages).length} agent markdown files in public/`);
