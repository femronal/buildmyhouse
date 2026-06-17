export type LagosRepairSlug =
  | 'plumbing-repair'
  | 'electrical-repair'
  | 'roof-leak-repair'
  | 'drainage-repair'
  | 'painting-services'
  | 'property-maintenance';

export type LagosRepairService = {
  slug: LagosRepairSlug;
  title: string;
  metaTitle: string;
  summary: string;
  intro: string;
  bullets: readonly string[];
  faqs: readonly { question: string; answer: string }[];
  contractorDirectorySlug?: string;
  marketplaceQuery: string;
  relatedNigeriaSlug?: string;
};

export const LAGOS_REPAIR_SERVICES: Record<LagosRepairSlug, LagosRepairService> = {
  'plumbing-repair': {
    slug: 'plumbing-repair',
    title: 'Plumbing Repair in Lagos',
    metaTitle: 'Plumbing Repair in Lagos | Verified Workers & Tracked Repairs',
    summary:
      'Fix burst pipes, blocked drains, and leaking fixtures in Lagos with verified plumbers, staged updates, and evidence before payment.',
    intro:
      'Lagos plumbing faults often start small and escalate fast — from ceiling stains to full bathroom flooding. BuildMyHouse helps you define the repair scope, match verified plumbers, and track each stage with photo evidence before you approve payment.',
    bullets: [
      'Verified plumbers for leaks, blockages, and fixture replacements',
      'Scope clarity before work starts — materials, access, and timeline',
      'Stage updates with photos so you see progress before paying',
      'Works for on-site owners and diaspora clients managing remotely',
    ],
    faqs: [
      {
        question: 'How do I start a plumbing repair in Lagos on BuildMyHouse?',
        answer:
          'Use Start a Tracked Repair to describe the issue, then follow the guided intake. You can assign a verified plumber and approve each stage with evidence before payment.',
      },
      {
        question: 'Can I manage a Lagos plumbing repair from abroad?',
        answer:
          'Yes. BuildMyHouse is built for remote visibility — you receive stage updates, photos, and approval checkpoints instead of relying on verbal updates alone.',
      },
      {
        question: 'Do I pay before the plumber finishes?',
        answer:
          'Payment follows your approved stages. Evidence is required at checkpoints so you can verify work before releasing major payments.',
      },
    ],
    contractorDirectorySlug: 'plumbing-repair',
    marketplaceQuery: 'plumbing',
    relatedNigeriaSlug: 'plumbing-repair-nigeria',
  },
  'electrical-repair': {
    slug: 'electrical-repair',
    title: 'Electrical Repair in Lagos',
    metaTitle: 'Electrical Repair in Lagos | Verified Electricians & Safe Approvals',
    summary:
      'Resolve tripping breakers, faulty wiring, and power faults in Lagos with verified electricians and documented repair stages.',
    intro:
      'Electrical faults in Lagos need fast response and safe execution. BuildMyHouse connects you with verified electricians, documents the fault and fix plan, and tracks progress with evidence before you approve payment.',
    bullets: [
      'Verified electricians for faults, rewiring, and panel issues',
      'Documented diagnosis and repair plan before major work',
      'Photo evidence at each stage for on-site and remote owners',
      'Safer payment flow tied to completed, verified stages',
    ],
    faqs: [
      {
        question: 'What electrical issues can I track on BuildMyHouse?',
        answer:
          'Common requests include tripping breakers, partial power loss, faulty sockets, lighting faults, and targeted rewiring — scoped and staged before work proceeds.',
      },
      {
        question: 'Are electricians on BuildMyHouse verified?',
        answer:
          'Listings in the contractor directory show verified professionals. Project workflows add stage tracking and evidence requirements on top of verification.',
      },
      {
        question: 'How is payment protected?',
        answer:
          'You approve stages after reviewing evidence. BuildMyHouse is designed so major payments follow verified progress, not upfront handoffs.',
      },
    ],
    contractorDirectorySlug: 'electrical-repair',
    marketplaceQuery: 'electrical',
    relatedNigeriaSlug: 'electrical-repair-nigeria',
  },
  'roof-leak-repair': {
    slug: 'roof-leak-repair',
    title: 'Roof Leak Repair in Lagos',
    metaTitle: 'Roof Leak Repair in Lagos | Diagnosis, Materials & Tracked Fixes',
    summary:
      'Stop roof leaks in Lagos with staged diagnosis, material approval, and verified roofers — with evidence before payment.',
    intro:
      'Roof leaks in Lagos punish delay — water damage spreads through ceilings, wiring, and finishes. BuildMyHouse structures leak repairs into clear stages: inspection, materials, repair, and final approval with photo evidence.',
    bullets: [
      'Verified roofers for leak diagnosis and lasting fixes',
      'Separate stages for inspection, materials, and repair work',
      'Photo evidence before you approve each payment milestone',
      'Ideal for urgent local repairs and diaspora-managed homes',
    ],
    faqs: [
      {
        question: 'How quickly can I start a roof leak repair in Lagos?',
        answer:
          'Start a Tracked Repair with photos of the leak and affected areas. That helps match the right verified roofer and scope an inspection stage quickly.',
      },
      {
        question: 'Will I see materials before they are purchased?',
        answer:
          'Yes — material stages can be documented with specs, quantities, and evidence so you approve before major spend.',
      },
      {
        question: 'Can I browse verified roofers in Lagos first?',
        answer:
          'Yes. Visit the Lagos roof leak contractor directory, then start a tracked repair when you are ready to assign work.',
      },
    ],
    contractorDirectorySlug: 'roof-leak-repair',
    marketplaceQuery: 'roof',
    relatedNigeriaSlug: 'roof-leak-repair-nigeria',
  },
  'drainage-repair': {
    slug: 'drainage-repair',
    title: 'Drainage Repair in Lagos',
    metaTitle: 'Drainage Repair in Lagos | Blockages, Flooding & Channel Fixes',
    summary:
      'Fix blocked drains and flooding risks in Lagos with verified specialists, clearer scope, and stage-by-stage visibility.',
    intro:
      'Poor drainage in Lagos leads to compound flooding, foundation stress, and recurring blockages. BuildMyHouse helps you scope drainage repairs clearly — from clearing and relining to channel reconstruction — with tracked stages and evidence.',
    bullets: [
      'Verified specialists for blockages, soakaways, and channel work',
      'Scope breakdown so you know excavation, materials, and finish',
      'Progress photos at each stage for local and remote owners',
      'Payment approvals tied to completed, documented work',
    ],
    faqs: [
      {
        question: 'What drainage problems are common in Lagos?',
        answer:
          'Homeowners often report blocked pipes, flooded compounds after rain, failed soakaways, and broken drainage channels — all suitable for scoped, staged repairs.',
      },
      {
        question: 'Do I need a full renovation for drainage issues?',
        answer:
          'Not always. BuildMyHouse supports repair-first workflows so you can fix drainage problems without turning every job into an open-ended project.',
      },
      {
        question: 'How do I start?',
        answer:
          'Use Start a Tracked Repair, share photos of the affected area, and follow the intake to match verified workers.',
      },
    ],
    marketplaceQuery: 'drainage',
    relatedNigeriaSlug: 'drainage-repair-nigeria',
  },
  'painting-services': {
    slug: 'painting-services',
    title: 'Painting Services in Lagos',
    metaTitle: 'Painting Services in Lagos | Interior & Exterior with Quality Checkpoints',
    summary:
      'Coordinate interior and exterior painting in Lagos with defined scope, surface prep stages, and evidence before payment.',
    intro:
      'Good painting in Lagos depends on prep, product choice, and supervision — not just rolling paint. BuildMyHouse helps you define rooms, finishes, and quality checkpoints, then track verified painters stage by stage.',
    bullets: [
      'Verified painters for interior, exterior, and touch-up work',
      'Scope covers prep, primer, coats, and finish standards',
      'Stage photos so colour, coverage, and edges are verified',
      'Safer approvals for diaspora owners who cannot visit daily',
    ],
    faqs: [
      {
        question: 'Can I specify rooms and paint types?',
        answer:
          'Yes. The intake captures areas, finishes, and expectations so painters quote and execute against a clear brief.',
      },
      {
        question: 'How do you prevent poor finish quality?',
        answer:
          'Stages include prep and finish checkpoints with photo evidence before you approve payment for the next phase.',
      },
      {
        question: 'Is this only for full house repaints?',
        answer:
          'No. BuildMyHouse supports single-room touch-ups through full property repaints — scoped to what you actually need.',
      },
    ],
    marketplaceQuery: 'painting',
    relatedNigeriaSlug: 'painting-services-nigeria',
  },
  'property-maintenance': {
    slug: 'property-maintenance',
    title: 'Property Maintenance in Lagos',
    metaTitle: 'Property Maintenance in Lagos | Recurring Repairs & Tracked Upkeep',
    summary:
      'Keep Lagos properties maintained with verified workers, recurring repair tracking, and evidence-based approvals.',
    intro:
      'Property maintenance in Lagos spans plumbing checks, electrical fixes, painting touch-ups, and preventive repairs. BuildMyHouse gives owners one workflow for verified workers, tracked tasks, and evidence before payment — whether you live on site or abroad.',
    bullets: [
      'One platform for repairs, touch-ups, and preventive maintenance',
      'Verified workers across plumbing, electrical, roofing, and more',
      'Stage tracking with photos for every maintenance visit',
      'Built for landlords, family homes, and diaspora-managed properties',
    ],
    faqs: [
      {
        question: 'Is BuildMyHouse only for one-off repairs?',
        answer:
          'No. Many owners use it for ongoing maintenance — each task can be scoped and tracked with the same evidence-before-payment discipline.',
      },
      {
        question: 'Can I manage multiple properties in Lagos?',
        answer:
          'Yes. Start separate tracked repairs or projects per property so scope, workers, and approvals stay organized.',
      },
      {
        question: 'How is this different from hiring an informal handyman?',
        answer:
          'You get verified workers, documented scope, stage evidence, and approval checkpoints — reducing surprise costs and blind payments.',
      },
    ],
    marketplaceQuery: 'maintenance',
  },
};

export const LAGOS_REPAIR_SLUGS = Object.keys(LAGOS_REPAIR_SERVICES) as LagosRepairSlug[];

export function isLagosRepairSlug(value: string): value is LagosRepairSlug {
  return value in LAGOS_REPAIR_SERVICES;
}

export function lagosServicePath(slug: LagosRepairSlug) {
  return `/services/lagos/${slug}`;
}
