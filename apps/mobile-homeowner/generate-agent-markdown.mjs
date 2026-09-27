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

- **Start a project**: ${WEB_URL}/start
- One question per page. The only required typing is a name and a WhatsApp number.
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
- ${WEB_URL}/start — step-by-step project request that ends on WhatsApp
`,

  'start.md': `# Start a project | BuildMyHouse

A step-by-step request that ends on WhatsApp. One question per page. A BuildMyHouse agent replies to plan the next step.

**URL:** ${WEB_URL}/start

## Paths

- Repair: ${WEB_URL}/start/repair
- Upgrade or renovation: ${WEB_URL}/start/upgrade
- Full build: ${WEB_URL}/start/build
- Interior design: ${WEB_URL}/start/interiors
`,

  'start/repair.md': `# Start a repair | BuildMyHouse

A step-by-step repair request that ends on WhatsApp.

**URL:** ${WEB_URL}/start/repair

Tell us what needs fixing, where the property is, and when a visit works. A BuildMyHouse agent plans the repair with you on WhatsApp.

Platform service fee for repairs: **₦0 (free for now)**.
`,

  'start/upgrade.md': `# Start an upgrade or renovation | BuildMyHouse

A step-by-step upgrade request that ends on WhatsApp.

**URL:** ${WEB_URL}/start/upgrade

Tell us which part of the house you want to improve, where it is, and a rough budget.
`,

  'start/build.md': `# Start a full build | BuildMyHouse

A step-by-step full-build request that ends on WhatsApp.

**URL:** ${WEB_URL}/start/build

Tell us about the land, whether you have plans, and what you want to build.
`,

  'start/interiors.md': `# Start an interior project | BuildMyHouse

A step-by-step interior request that ends on WhatsApp.

**URL:** ${WEB_URL}/start/interiors

Tell us which space you want furnished or redesigned, where it is, and a rough budget.
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

## Start a repair

${WEB_URL}/start/repair
`,
};

fs.mkdirSync(path.join(outputDir, 'pricing'), { recursive: true });

for (const [filePath, content] of Object.entries(pages)) {
  const fullPath = path.join(outputDir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

console.log(`[seo] Generated ${Object.keys(pages).length} agent markdown files in public/`);
