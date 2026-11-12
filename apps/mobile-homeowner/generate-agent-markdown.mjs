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
    `- **${row.service}**: ${formatNgn(row.low)} – ${formatNgn(row.high)} (${row.unit})`,
).join('\n');

const pages = {
  'index.md': `# BuildMyHouse

> BuildMyHouse is a project management software-enabled platform for building and renovating homes in Nigeria, used most by Nigerians who live abroad. It sits between the homeowner, the agreed scope, the contractor, each stage of work, the evidence for that stage, the homeowner's approval and the money. A contractor is paid for a stage only after they upload photo and video evidence and the homeowner approves that stage in the app.

## What sets BuildMyHouse apart

- **A large, reviewed directory.** Over 2,600 contractor, professional, vendor and artisan listings across Nigeria. Homeowners leave reviews on listings and can report suspected scams, and the BuildMyHouse team reads every report. A listing is not the same as a BuildMyHouse check; each listing shows its own status.
- **Stage-by-stage approval with evidence.** Every project is split into stages. Each stage has its own photos, videos, receipts and an approve or query step for the homeowner before the next payment moves.
- **A real example.** In June 2026, BuildMyHouse coordinated a plumbing repair in Mowe, Ogun State. A physical inspection came before the final scope. The contractor was paid ₦30,000 for the approved first part of the work. The final ₦25,000 was paid only after the completion photos and material evidence were reviewed and the homeowner replied "Satisfied".
- **Real reviews.** Customer reviews come from Google and are shown on the homepage.

## Online booking

- **Set up your project in the app**: ${WEB_URL}/login (create an account, then choose your project type)
- **Quick request form**: ${WEB_URL}/start

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
- ${WEB_URL}/start - quick project request form
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

A step-by-step repair brief. The job starts when a contractor inspects it in the app.

**URL:** ${WEB_URL}/start/repair

Tell us what needs fixing, where the property is, and when a visit works. This is an intake brief, not a price. A contractor inspects the property, then you agree the quote in the app.
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
