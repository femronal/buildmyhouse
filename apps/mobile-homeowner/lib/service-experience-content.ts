import { LAGOS_REPAIR_SERVICES, type LagosRepairSlug } from '@/lib/lagos-repair-services';
import { SERVICE_SEO_PAGES, type ServiceSeoSlug } from '@/lib/home-landing-content';

export type ServiceExperienceReview = {
  quote: string;
  name: string;
  detail: string;
};

export type ServiceExperienceEngageCard = {
  title: string;
  subtitle: string;
  badge?: string;
  features: readonly string[];
};

export type ServiceExperienceContent = {
  canonicalPath: string;
  metaTitle: string;
  summary: string;
  locationLabel: string;
  headline: string;
  heroLead: string;
  heroMeta: string;
  trustWords: readonly string[];
  pillarsHeadline: string;
  archiveTitle: string;
  fieldNotesHeading: string;
  workTitle: string;
  workBody: string;
  engageIntro: string;
  contactPrompt: string;
  engageCards: readonly ServiceExperienceEngageCard[];
  pillars: readonly { title: string; body: string }[];
  stats: readonly { value: string; label: string }[];
  processSteps: readonly { label: string; title: string; body: string }[];
  fieldNotes: readonly { number: string; title: string; body: string }[];
  reviews: readonly ServiceExperienceReview[];
  faqs: readonly { question: string; answer: string }[];
  articleLinks: readonly { label: string; href: string }[];
  images: {
    heroMain: string;
    heroAccent: string;
    strip: string;
    parallaxA: string;
    parallaxB: string;
    /** Photo clipped inside the large "04" in the Systems section — swap per service in IMAGE_SETS. */
    workMask: string;
    archive: readonly string[];
  };
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

type ServiceKind =
  | 'plumbing-repair'
  | 'electrical-repair'
  | 'roof-leak-repair'
  | 'drainage-repair'
  | 'painting-services'
  | 'property-maintenance'
  | 'window-repair'
  | 'pumping-machine-repair'
  | 'fan-repair'
  | 'rechargeable-fan-repair'
  | 'bathroom-repair'
  | 'kitchen-renovation'
  | 'home-renovation'
  | 'general-contractors';

const SHARED_ARTICLES = [
  { label: 'Renovation checklist for homeowners', href: '/articles/renovation-checklist-for-homeowners-nigeria' },
  { label: 'How to choose a contractor in Nigeria', href: '/how-to-choose-a-general-contractor-in-nigeria' },
] as const;

/**
 * Service page images — edit IMAGE_SETS below to swap placeholders.
 * The 7th argument in each imageSet() call is workMask (photo inside the "04" typography).
 * Replace Unsplash photo IDs with your own assets when ready.
 */
function unsplash(photoId: string, w = 1600) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&q=80`;
}

const webBase = () => (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

/** Bundled hero for plumbing service pages — source: assets/images/worried-woman-dealing-with-a-plumbing-emergency-2026-03-25-08-24-07-utc.jpg */
const PLUMBING_HERO_MAIN = `${webBase()}/plumbing-service-hero.jpg`;

function imageSet(
  hero: string,
  accent: string,
  strip: string,
  parallaxA: string,
  parallaxB: string,
  archive: [string, string, string],
  workMask: string,
): ServiceExperienceContent['images'] {
  return {
    heroMain: unsplash(hero),
    heroAccent: unsplash(accent),
    strip: unsplash(strip),
    parallaxA: unsplash(parallaxA),
    parallaxB: unsplash(parallaxB),
    workMask: unsplash(workMask, 2400),
    archive: archive.map((id) => unsplash(id)),
  };
}

const IMAGE_SETS: Record<ServiceKind, ServiceExperienceContent['images']> = {
  'plumbing-repair': {
    ...imageSet(
      '1607472586893-edb1543ab523',
      '1581578731548-c64695cc8212',
      '1607472586893-edb1543ab523',
      '1558618666-fcd25c85cd64',
      '1504307651254-4da29b8c3e05',
      ['1607472586893-edb1543ab523', '1581578731548-c64695cc8212', '1558618666-fcd25c85cd64'],
      '1607472586893-edb1543ab523',
    ),
    heroMain: PLUMBING_HERO_MAIN,
  },
  'electrical-repair': imageSet(
    '1621905251189-4798adcf397d',
    '1473341303090-f831f5eb9320',
    '1621905251189-4798adcf397d',
    '1503387769248-ac8983c8e028',
    '1558618666-fcd25c85cd64',
    ['1621905251189-4798adcf397d', '1473341303090-f831f5eb9320', '1503387769248-ac8983c8e028'],
    '1621905251189-4798adcf397d',
  ),
  'roof-leak-repair': imageSet(
    '1632779140123-0c47d1932cbb',
    '1503387769248-ac8983c8e028',
    '1632779140123-0c47d1932cbb',
    '1503387769248-ac8983c8e028',
    '1600607687939-ce8a6c25118c',
    ['1632779140123-0c47d1932cbb', '1503387769248-ac8983c8e028', '1503387769248-ac8983c8e028'],
    '1632779140123-0c47d1932cbb',
  ),
  'drainage-repair': imageSet(
    '1581578731548-c64695cc8212',
    '1558618666-fcd25c85cd64',
    '1581578731548-c64695cc8212',
    '1607472586893-edb1543ab523',
    '1504307651254-4da29b8c3e05',
    ['1581578731548-c64695cc8212', '1558618666-fcd25c85cd64', '1607472586893-edb1543ab523'],
    '1581578731548-c64695cc8212',
  ),
  'painting-services': imageSet(
    '1562259949-bd68673abe65',
    '1589939705384-51851334a518',
    '1562259949-bd68673abe65',
    '1503387769248-ac8983c8e028',
    '1589939705384-51851334a518',
    ['1562259949-bd68673abe65', '1589939705384-51851334a518', '1503387769248-ac8983c8e028'],
    '1562259949-bd68673abe65',
  ),
  'property-maintenance': imageSet(
    '1504307651254-4da29b8c3e05',
    '1581578731548-c64695cc8212',
    '1504307651254-4da29b8c3e05',
    '1503387769248-ac8983c8e028',
    '1558618666-fcd25c85cd64',
    ['1504307651254-4da29b8c3e05', '1581578731548-c64695cc8212', '1503387769248-ac8983c8e028'],
    '1504307651254-4da29b8c3e05',
  ),
  'window-repair': imageSet(
    '1600607687939-ce8a6c25118c',
    '1600607687939-ce8a6c25118c',
    '1600607687939-ce8a6c25118c',
    '1503387769248-ac8983c8e028',
    '1562259949-bd68673abe65',
    ['1600607687939-ce8a6c25118c', '1600607687939-ce8a6c25118c', '1503387769248-ac8983c8e028'],
    '1600607687939-ce8a6c25118c',
  ),
  'pumping-machine-repair': imageSet(
    '1558618666-fcd25c85cd64',
    '1607472586893-edb1543ab523',
    '1558618666-fcd25c85cd64',
    '1581578731548-c64695cc8212',
    '1504307651254-4da29b8c3e05',
    ['1558618666-fcd25c85cd64', '1607472586893-edb1543ab523', '1581578731548-c64695cc8212'],
    '1558618666-fcd25c85cd64',
  ),
  'fan-repair': imageSet(
    '1585779034826-d38f3753070e',
    '1558618666-fcd25c85cd64',
    '1585779034826-d38f3753070e',
    '1621905251189-4798adcf397d',
    '1504307651254-4da29b8c3e05',
    ['1585779034826-d38f3753070e', '1558618666-fcd25c85cd64', '1621905251189-4798adcf397d'],
    '1585779034826-d38f3753070e',
  ),
  'rechargeable-fan-repair': imageSet(
    '1585779034826-d38f3753070e',
    '1473341303090-f831f5eb9320',
    '1585779034826-d38f3753070e',
    '1621905251189-4798adcf397d',
    '1504307651254-4da29b8c3e05',
    ['1585779034826-d38f3753070e', '1473341303090-f831f5eb9320', '1621905251189-4798adcf397d'],
    '1585779034826-d38f3753070e',
  ),
  'bathroom-repair': imageSet(
    '1552321554-5f848e4830a4',
    '1600607687939-ce8a6c25118c',
    '1552321554-5f848e4830a4',
    '1607472586893-edb1543ab523',
    '1562259949-bd68673abe65',
    ['1552321554-5f848e4830a4', '1600607687939-ce8a6c25118c', '1607472586893-edb1543ab523'],
    '1552321554-5f848e4830a4',
  ),
  'kitchen-renovation': imageSet(
    '1556912170-ef71bcc7e0f7',
    '1600607687939-ce8a6c25118c',
    '1556912170-ef71bcc7e0f7',
    '1562259949-bd68673abe65',
    '1503387769248-ac8983c8e028',
    ['1556912170-ef71bcc7e0f7', '1600607687939-ce8a6c25118c', '1562259949-bd68673abe65'],
    '1556912170-ef71bcc7e0f7',
  ),
  'home-renovation': imageSet(
    '1503387769248-ac8983c8e028',
    '1600607687939-ce8a6c25118c',
    '1503387769248-ac8983c8e028',
    '1562259949-bd68673abe65',
    '1556912170-ef71bcc7e0f7',
    ['1503387769248-ac8983c8e028', '1600607687939-ce8a6c25118c', '1562259949-bd68673abe65'],
    '1503387769248-ac8983c8e028',
  ),
  'general-contractors': imageSet(
    '1503387769248-ac8983c8e028',
    '1504307651254-4da29b8c3e05',
    '1503387769248-ac8983c8e028',
    '1503387769248-ac8983c8e028',
    '1558618666-fcd25c85cd64',
    ['1503387769248-ac8983c8e028', '1504307651254-4da29b8c3e05', '1503387769248-ac8983c8e028'],
    '1503387769248-ac8983c8e028',
  ),
};

const SERVICE_KIND_COPY: Record<
  ServiceKind,
  {
    headline: string;
    heroLead: string;
    heroMeta: string;
    pillars: ServiceExperienceContent['pillars'];
    fieldNotes: ServiceExperienceContent['fieldNotes'];
    reviewDetail: string;
  }
> = {
  'plumbing-repair': {
    headline: 'Plumbing',
    heroLead:
      'Stop leaks, blockages, and fixture failures in Lagos with verified plumbers, staged updates, and evidence before you approve payment.',
    heroMeta: 'Burst pipes, blocked drains, bathroom leaks, and fixture replacements — scoped before work starts.',
    pillars: [
      { title: 'Scope first', body: 'Define the fault, access, materials, and timeline before anyone starts work.' },
      { title: 'Verified plumbers', body: 'Match workers who fit the repair — not random handyman referrals.' },
      { title: 'Stage evidence', body: 'See photos at diagnosis, materials, repair, and completion checkpoints.' },
      { title: 'Safer payments', body: 'Release funds after verified progress — not on verbal promises alone.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Photograph the leak early.', body: 'Ceiling stains and damp spots help plumbers scope faster and quote accurately.' },
      { number: '02', title: 'Separate diagnosis from repair.', body: 'Inspection is its own stage — approve it before major spend begins.' },
      { number: '03', title: 'Track materials explicitly.', body: 'Pipes, fittings, and labour should be visible before you pay for them.' },
    ],
    reviewDetail: 'Plumbing repair in Lekki',
  },
  'electrical-repair': {
    headline: 'Electrical',
    heroLead:
      'Fix tripping breakers, partial power loss, and wiring faults in Lagos with verified electricians and documented repair stages.',
    heroMeta: 'Fault finding, rewiring, panel issues, and lighting repairs — with evidence at every stage.',
    pillars: [
      { title: 'Diagnose safely', body: 'Document the fault and repair plan before major electrical work proceeds.' },
      { title: 'Verified electricians', body: 'Work with vetted professionals — not informal referrals under pressure.' },
      { title: 'Photo checkpoints', body: 'Review panel work, wiring routes, and finish quality before paying.' },
      { title: 'Remote visibility', body: 'Owners abroad still approve stages with evidence — not WhatsApp guesswork.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Never skip the fault report.', body: 'A clear diagnosis stage prevents open-ended rewiring bills.' },
      { number: '02', title: 'Approve materials separately.', body: 'Cables, breakers, and fixtures should be listed before purchase.' },
      { number: '03', title: 'Test before final payment.', body: 'Completion evidence should show power restored safely.' },
    ],
    reviewDetail: 'Electrical fault repair in Ikeja',
  },
  'roof-leak-repair': {
    headline: 'Roof Leak',
    heroLead:
      'Stop roof leaks in Lagos before water damage spreads — with staged diagnosis, materials approval, and verified roofers.',
    heroMeta: 'Leak tracing, membrane fixes, flashing repairs, and post-repair inspection — tracked end to end.',
    pillars: [
      { title: 'Inspect first', body: 'Locate the source before tearing open the roof or ceiling.' },
      { title: 'Materials approval', body: 'See specs and quantities before major roofing spend.' },
      { title: 'Stage the repair', body: 'Diagnosis, materials, repair, and final approval — each with evidence.' },
      { title: 'Protect the property', body: 'Urgent leaks still need scope clarity — not rushed blind payments.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Capture rain-day evidence.', body: 'Active leak photos help roofers prioritize the right fix.' },
      { number: '02', title: 'Separate temporary from permanent fixes.', body: 'Tarping and permanent repair should not blur into one vague bill.' },
      { number: '03', title: 'Inspect after the rain.', body: 'Final approval should confirm the leak is actually resolved.' },
    ],
    reviewDetail: 'Roof leak repair in Victoria Island',
  },
  'drainage-repair': {
    headline: 'Drainage',
    heroLead:
      'Fix blocked drains, flooded compounds, and failed soakaways in Lagos with clearer scope and stage-by-stage visibility.',
    heroMeta: 'Blockages, channel reconstruction, and compound flooding — scoped before excavation begins.',
    pillars: [
      { title: 'Map the problem', body: 'Define whether the issue is blockage, slope, soakaway, or channel failure.' },
      { title: 'Verified specialists', body: 'Match drainage work to workers who understand Lagos soil and rainfall patterns.' },
      { title: 'Progress photos', body: 'See excavation, pipe runs, and finish before releasing major payments.' },
      { title: 'Repair-first workflow', body: 'Fix drainage without turning every job into an open-ended renovation.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Show the flooding pattern.', body: 'Photos after rain reveal whether the issue is local or systemic.' },
      { number: '02', title: 'Scope excavation clearly.', body: 'Depth, length, and disposal should be agreed before digging.' },
      { number: '03', title: 'Test with water before sign-off.', body: 'Completion should prove flow — not just a cleaned surface.' },
    ],
    reviewDetail: 'Drainage repair in Surulere',
  },
  'painting-services': {
    headline: 'Painting',
    heroLead:
      'Coordinate interior and exterior painting in Lagos with defined prep, finish standards, and evidence before payment.',
    heroMeta: 'Surface prep, primer, coats, and quality checkpoints — room by room or full property.',
    pillars: [
      { title: 'Prep matters', body: 'Scraping, filling, and primer stages are tracked — not skipped silently.' },
      { title: 'Finish standards', body: 'Define rooms, colours, and coat count before painters start.' },
      { title: 'Quality checkpoints', body: 'Review edges, coverage, and finish with photos at each phase.' },
      { title: 'Remote supervision', body: 'Diaspora owners approve paint stages without daily site visits.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Approve colours in writing.', body: 'Brand codes and finish types prevent expensive rework.' },
      { number: '02', title: 'Track prep separately.', body: 'Good paint jobs fail when surface prep is invisible.' },
      { number: '03', title: 'Inspect in daylight.', body: 'Final approval should capture true colour and coverage.' },
    ],
    reviewDetail: 'Interior repainting in Ajah',
  },
  'property-maintenance': {
    headline: 'Maintenance',
    heroLead:
      'Keep Lagos properties maintained with verified workers, recurring repair tracking, and evidence-based approvals.',
    heroMeta: 'Plumbing checks, electrical fixes, touch-ups, and preventive repairs — one tracked workflow.',
    pillars: [
      { title: 'One workflow', body: 'Repairs, touch-ups, and preventive visits share the same accountability model.' },
      { title: 'Verified workers', body: 'Plumbing, electrical, roofing, and more — matched to each task.' },
      { title: 'Visit evidence', body: 'Every maintenance visit can produce photos and approval checkpoints.' },
      { title: 'Landlord-ready', body: 'Works for family homes, rentals, and diaspora-managed properties.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Log recurring issues.', body: 'Repeat faults deserve tracked history — not one-off handyman visits.' },
      { number: '02', title: 'Separate urgent from planned.', body: 'Emergency fixes and scheduled upkeep should stay clearly scoped.' },
      { number: '03', title: 'Keep approvals per task.', body: 'Maintenance stays controlled when each visit has its own evidence trail.' },
    ],
    reviewDetail: 'Property maintenance in Lagos',
  },
  'window-repair': {
    headline: 'Windows',
    heroLead:
      'Repair aluminium windows, glass panels, and sliding fittings in Lagos with verified specialists and staged approvals.',
    heroMeta: 'Hinges, locks, glass replacement, and frame alignment — scoped before work begins.',
    pillars: [
      { title: 'Measure twice', body: 'Dimensions and hardware specs are agreed before fabrication or replacement.' },
      { title: 'Verified installers', body: 'Match aluminium and glazing work to the right specialists.' },
      { title: 'Stage the fix', body: 'Removal, replacement, and finishing each produce evidence.' },
      { title: 'Safer spend', body: 'Approve materials and labour separately when needed.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Photograph the full frame.', body: 'Warped tracks and broken locks need context for accurate quotes.' },
      { number: '02', title: 'Confirm glass specs.', body: 'Thickness and tint should be approved before ordering.' },
      { number: '03', title: 'Test movement at completion.', body: 'Sliding, locking, and sealing should be verified on site.' },
    ],
    reviewDetail: 'Window repair in Yaba',
  },
  'pumping-machine-repair': {
    headline: 'Pumping',
    heroLead:
      'Fix pumping machines, pressure issues, and water supply faults in Lagos with verified technicians and tracked stages.',
    heroMeta: 'Motor faults, pressure switches, and borehole pump repairs — with evidence before payment.',
    pillars: [
      { title: 'Diagnose first', body: 'Separate electrical fault, mechanical wear, and piping issues clearly.' },
      { title: 'Verified technicians', body: 'Match pump repairs to workers who understand Lagos water systems.' },
      { title: 'Parts visibility', body: 'Motors, switches, and fittings are documented before purchase.' },
      { title: 'Test at completion', body: 'Pressure and flow evidence before final approval.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Record the failure mode.', body: 'No pressure, tripping, or noise each point to different fixes.' },
      { number: '02', title: 'Approve parts explicitly.', body: 'Pump components are expensive — list them before buying.' },
      { number: '03', title: 'Verify water flow.', body: 'Completion should show restored supply, not just a running motor.' },
    ],
    reviewDetail: 'Pump repair in Magodo',
  },
  'fan-repair': {
    headline: 'Fan Repair',
    heroLead:
      'Repair ceiling, standing, and wall fans in Lagos with verified artisans and documented work stages.',
    heroMeta: 'Motor replacement, wiring faults, and mounting issues — scoped and tracked clearly.',
    pillars: [
      { title: 'Quick scope', body: 'Define fan type, fault, and access before the visit.' },
      { title: 'Verified artisans', body: 'Match the right worker for ceiling vs standing fan repairs.' },
      { title: 'Photo evidence', body: 'See wiring, parts, and finish before paying.' },
      { title: 'Simple stages', body: 'Even small repairs benefit from evidence-based approvals.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Specify fan type.', body: 'Ceiling fans need different access and parts than standing units.' },
      { number: '02', title: 'Approve replacement parts.', body: 'Motors and capacitors should be listed before purchase.' },
      { number: '03', title: 'Test all speeds.', body: 'Completion should confirm smooth operation at every setting.' },
    ],
    reviewDetail: 'Ceiling fan repair in Gbagada',
  },
  'rechargeable-fan-repair': {
    headline: 'Rechargeable',
    heroLead:
      'Fix rechargeable and inverter fans in Lagos with verified technicians and evidence before payment.',
    heroMeta: 'Battery packs, charging circuits, and blade motors — tracked repair workflow.',
    pillars: [
      { title: 'Fault clarity', body: 'Separate charging issues from motor or battery failures.' },
      { title: 'Verified repairers', body: 'Match inverter and rechargeable fan work to capable technicians.' },
      { title: 'Parts tracking', body: 'Batteries and boards are approved before replacement.' },
      { title: 'Charge test', body: 'Completion includes charging and runtime evidence.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Note charging behaviour.', body: 'Does it fail on battery, AC, or both? Scope depends on it.' },
      { number: '02', title: 'Approve battery swaps.', body: 'Replacement packs should be specified before purchase.' },
      { number: '03', title: 'Verify runtime.', body: 'Final approval should confirm usable backup time.' },
    ],
    reviewDetail: 'Rechargeable fan repair in Lagos',
  },
  'bathroom-repair': {
    headline: 'Bathroom',
    heroLead:
      'Track bathroom repairs and upgrades in Lagos with stage-based coordination and evidence before payment.',
    heroMeta: 'Leaks, tiles, fixtures, waterproofing, and fittings — scoped room by room.',
    pillars: [
      { title: 'Room scope', body: 'Define which bathroom elements are repair vs replacement.' },
      { title: 'Waterproofing first', body: 'Leak sources must be found before cosmetic fixes.' },
      { title: 'Stage photos', body: 'See demolition, plumbing, tiling, and fixtures separately.' },
      { title: 'Controlled upgrades', body: 'Improve the bathroom without losing budget discipline.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Find the water path.', body: 'Stains on walls often trace back to hidden plumbing faults.' },
      { number: '02', title: 'Approve tiles and fixtures.', body: 'Finishes should be chosen before installation begins.' },
      { number: '03', title: 'Test all outlets.', body: 'Taps, drains, and seals should be verified before sign-off.' },
    ],
    reviewDetail: 'Bathroom repair in Ikoyi',
  },
  'kitchen-renovation': {
    headline: 'Kitchen',
    heroLead:
      'Plan kitchen upgrades in Lagos with structured stage visibility, verified workers, and evidence-based payments.',
    heroMeta: 'Cabinetry, countertops, plumbing, and fittings — phased with clear approvals.',
    pillars: [
      { title: 'Phased scope', body: 'Demolition, services, cabinetry, and finishes are separate stages.' },
      { title: 'Verified teams', body: 'Match kitchen work to capable GCs and specialists.' },
      { title: 'Material approval', body: 'Countertops, cabinets, and appliances documented before purchase.' },
      { title: 'Progress evidence', body: 'Remote owners see each phase before releasing funds.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Lock the layout early.', body: 'Plumbing and electrical moves get expensive when scope drifts.' },
      { number: '02', title: 'Approve finishes in writing.', body: 'Countertop and cabinet specs prevent costly changes mid-build.' },
      { number: '03', title: 'Inspect services before closing.', body: 'Water, gas, and power should be tested before final payment.' },
    ],
    reviewDetail: 'Kitchen upgrade in Lekki',
  },
  'home-renovation': {
    headline: 'Renovation',
    heroLead:
      'Manage home renovation in Lagos with documented scope, verified contractors, and stage-by-stage payment discipline.',
    heroMeta: 'Room-by-room or whole-home renovation — tracked with evidence at every milestone.',
    pillars: [
      { title: 'Written scope', body: 'Define rooms, finishes, and exclusions before work starts.' },
      { title: 'Verified GCs', body: 'Match renovation scale to contractors with proven workflows.' },
      { title: 'Milestone evidence', body: 'Photos at each stage — not verbal progress updates alone.' },
      { title: 'Payment discipline', body: 'Release funds after verified completion, not ahead of it.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Separate repair from renovation.', body: 'Know when a job is a fix vs a full scope change.' },
      { number: '02', title: 'Stage by room or system.', body: 'Phasing keeps large renovations understandable.' },
      { number: '03', title: 'Hold retainers for snagging.', body: 'Final payment follows a documented snag list.' },
    ],
    reviewDetail: 'Home renovation in Lagos',
  },
  'general-contractors': {
    headline: 'Contractors',
    heroLead:
      'Find verified general contractors in Lagos and execute property work with clearer scope, stages, and approvals.',
    heroMeta: 'Repairs, upgrades, renovations, and builds — coordinated through one accountable workflow.',
    pillars: [
      { title: 'Verified GCs', body: 'Work with contractors vetted for accountability — not just availability.' },
      { title: 'Structured scope', body: 'Translate project goals into staged, measurable work packages.' },
      { title: 'Evidence trail', body: 'Photos and updates at every milestone before payment.' },
      { title: 'Owner control', body: 'On-site and diaspora owners stay in control of spend and progress.' },
    ],
    fieldNotes: [
      { number: '01', title: 'Start with scope clarity.', body: 'The GC relationship works when expectations are written first.' },
      { number: '02', title: 'Use staged contracts.', body: 'Break large projects into inspectable milestones.' },
      { number: '03', title: 'Pay against proof.', body: 'Progress payments follow evidence — not pressure.' },
    ],
    reviewDetail: 'GC-led project in Lagos',
  },
};

function slugToKind(slug: string): ServiceKind | null {
  const normalized = slug.replace(/^lagos\//, '').replace(/-nigeria$/, '');
  if (normalized in SERVICE_KIND_COPY) return normalized as ServiceKind;
  return null;
}

function buildReviews(detail: string): ServiceExperienceReview[] {
  return [
    {
      quote: 'I saw photos before every major payment — that alone changed how I manage repairs.',
      name: 'Homeowner',
      detail,
    },
    {
      quote: 'The scope was clear before work started. No surprise costs halfway through the job.',
      name: 'Diaspora client',
      detail: 'Managing from the UK',
    },
    {
      quote: 'Verified workers and stage tracking made a stressful repair feel controlled.',
      name: 'Landlord',
      detail: 'Lagos mainland',
    },
  ];
}

function buildContent(kind: ServiceKind, region: 'lagos' | 'nigeria', canonicalPath: string, title: string, summary: string, metaTitle: string): ServiceExperienceContent {
  const copy = SERVICE_KIND_COPY[kind];
  const locationLabel = region === 'lagos' ? 'Lagos, Nigeria' : 'Nigeria';

  const serviceLabel = copy.headline.toLowerCase();

  return {
    canonicalPath,
    metaTitle,
    summary,
    locationLabel,
    headline: copy.headline,
    heroLead: copy.heroLead,
    heroMeta: copy.heroMeta,
    trustWords: ['verify', 'scope', 'track', 'approve'],
    pillarsHeadline: `${copy.headline} repairs with clearer scope, verified workers, and proof before payment.`,
    archiveTitle: `Evidence collected before your ${serviceLabel} repair is signed off.`,
    fieldNotesHeading: `Five rules for ${serviceLabel} repairs you can actually trust.`,
    workTitle: '04 tracked stages',
    workBody: `Every ${serviceLabel} job runs through the same BuildMyHouse loop — scope, match, track, approve — so you stay in control from first message to final payment.`,
    engageIntro: `Choose how you want to start your ${serviceLabel} job — a focused tracked repair or a verified project with a general contractor.`,
    contactPrompt: `Ready to stop guessing on ${serviceLabel} costs and start with evidence before payment?`,
    engageCards: [
      {
        title: 'Tracked Repair',
        subtitle: 'Best for urgent fixes and single-scope jobs',
        badge: 'Most popular',
        features: ['Guided fault intake with photos', 'Verified worker matching', 'Stage updates before each payment', 'Works for local and diaspora owners'],
      },
      {
        title: 'Verified Project',
        subtitle: 'Best when scope spans multiple trades',
        features: ['Structured scope and milestones', 'GC or specialist coordination', 'Evidence at every checkpoint', 'Payment tied to verified progress'],
      },
    ],
    pillars: copy.pillars,
    stats: [
      { value: '04', label: 'tracked stages' },
      { value: '100', label: 'evidence-first' },
      { value: '24h', label: 'scope clarity' },
      { value: '1', label: 'workflow app' },
    ],
    processSteps: [
      { label: 'Read', title: 'Define the repair', body: 'Describe the fault, share photos, and set urgency before matching begins.' },
      { label: 'Match', title: 'Assign verified workers', body: 'Choose from verified plans and workers suited to your scope.' },
      { label: 'Track', title: 'Follow staged updates', body: 'Receive photos and progress at each milestone — local or from abroad.' },
      { label: 'Approve', title: 'Pay after evidence', body: 'Release payment only after verified stage completion.' },
    ],
    fieldNotes: copy.fieldNotes,
    reviews: buildReviews(copy.reviewDetail),
    faqs: [
      {
        question: `How do I start a ${copy.headline.toLowerCase()} job on BuildMyHouse?`,
        answer: 'Tap Start a Tracked Repair, describe the issue, and follow the guided intake to match verified workers with staged evidence before payment.',
      },
      {
        question: 'Can I manage the work from abroad?',
        answer: 'Yes. BuildMyHouse sends stage updates and photo evidence so you approve payments after verified progress — not on verbal updates alone.',
      },
      {
        question: 'Do I pay everything upfront?',
        answer: 'No. Payment follows approved stages with evidence at each checkpoint.',
      },
    ],
    articleLinks: [...SHARED_ARTICLES],
    images: IMAGE_SETS[kind],
    primaryCta: { label: 'Start a Tracked Repair', href: '/start-repair' },
    secondaryCta: { label: 'Browse Verified Plans', href: '/location?mode=explore' },
  };
}

const REGISTRY = new Map<string, ServiceExperienceContent>();

function register(path: string, content: ServiceExperienceContent) {
  REGISTRY.set(path, content);
}

for (const slug of Object.keys(SERVICE_SEO_PAGES) as ServiceSeoSlug[]) {
  const kind = slugToKind(slug);
  if (!kind) continue;
  const page = SERVICE_SEO_PAGES[slug];
  register(
    `/services/${slug}`,
    buildContent(kind, 'nigeria', `/services/${slug}`, page.title, page.summary, `${page.title} | BuildMyHouse`),
  );
}

for (const slug of Object.keys(LAGOS_REPAIR_SERVICES) as LagosRepairSlug[]) {
  const page = LAGOS_REPAIR_SERVICES[slug];
  register(
    `/services/lagos/${slug}`,
    {
      ...buildContent(
        slug as ServiceKind,
        'lagos',
        `/services/lagos/${slug}`,
        page.title,
        page.summary,
        `${page.metaTitle} | BuildMyHouse`,
      ),
      faqs: [...page.faqs],
    },
  );
}

export function getServiceExperienceContent(canonicalPath: string): ServiceExperienceContent | null {
  return REGISTRY.get(canonicalPath) ?? null;
}

export function getAllServiceExperiencePaths(): string[] {
  return Array.from(REGISTRY.keys()).sort();
}

export function getServiceExperienceContentBySlug(slug: string, region: 'lagos' | 'nigeria' = 'nigeria'): ServiceExperienceContent | null {
  const path = region === 'lagos' ? `/services/lagos/${slug}` : `/services/${slug}`;
  return getServiceExperienceContent(path);
}
