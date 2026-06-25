import { buildServicePageCanonicalPath } from './service-page-paths';

export type ServicePageRegion = 'lagos' | 'nigeria';

export type ServicePageImageSet = {
  heroMain: string;
  heroAccent: string;
  strip: string;
  parallaxA: string;
  parallaxB: string;
  workMask: string;
  archive: string[];
};

export type ServicePagePayload = {
  locationLabel: string;
  headline: string;
  heroLead: string;
  heroMeta: string;
  trustWords: string[];
  pillarsHeadline: string;
  archiveTitle: string;
  fieldNotesHeading: string;
  workTitle: string;
  workBody: string;
  engageIntro: string;
  contactPrompt: string;
  engageCards: Array<{
    title: string;
    subtitle: string;
    badge?: string;
    features: string[];
  }>;
  pillars: Array<{ title: string; body: string }>;
  stats: Array<{ value: string; label: string }>;
  processSteps: Array<{ label: string; title: string; body: string }>;
  fieldNotes: Array<{ number: string; title: string; body: string }>;
  reviews: Array<{ quote: string; name: string; detail: string }>;
  faqs: Array<{ question: string; answer: string }>;
  articleLinks: Array<{ label: string; href: string }>;
  images: ServicePageImageSet;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

const WEB_BASE = 'https://buildmyhouse.app';
const STRIP_IMAGE = `${WEB_BASE}/engineer-at-buildmyhouse.png`;

const TEMPLATE_HEADLINES: Record<string, string> = {
  'plumbing-repair': 'Plumbing',
  'electrical-repair': 'Electrical',
  'roof-leak-repair': 'Roof Leak',
  'drainage-repair': 'Drainage',
  'painting-services': 'Painting',
  'property-maintenance': 'Maintenance',
  'window-repair': 'Window Repair',
  'pumping-machine-repair': 'Pumping Machine',
  'fan-repair': 'Fan Repair',
  'rechargeable-fan-repair': 'Rechargeable Fan',
  'bathroom-repair': 'Bathroom',
  'kitchen-renovation': 'Kitchen',
  'home-renovation': 'Home Renovation',
  'general-contractors': 'General Contractors',
};

function defaultImages(): ServicePageImageSet {
  const hero = `${WEB_BASE}/engineer-at-buildmyhouse.png`;
  return {
    heroMain: hero,
    heroAccent: hero,
    strip: STRIP_IMAGE,
    parallaxA: hero,
    parallaxB: hero,
    workMask: hero,
    archive: [hero, hero, hero],
  };
}

export function buildServicePageTemplate(
  templateKind: string,
  region: ServicePageRegion,
  slug: string,
  metaTitle?: string,
  summary?: string,
): { metaTitle: string; summary: string; canonicalPath: string; payload: ServicePagePayload } {
  const headline = TEMPLATE_HEADLINES[templateKind] || 'Repair Service';
  const locationLabel = region === 'lagos' ? 'Lagos, Nigeria' : 'Nigeria';
  const canonicalPath = buildServicePageCanonicalPath(region, slug);
  const serviceLabel = headline.toLowerCase();

  const resolvedMetaTitle =
    metaTitle?.trim() ||
    `${headline} in ${region === 'lagos' ? 'Lagos' : 'Nigeria'} | Verified & Tracked | BuildMyHouse`;
  const resolvedSummary =
    summary?.trim() ||
    `Find verified ${serviceLabel} support in ${locationLabel} with clearer scope, stage tracking, and evidence before payment.`;

  const payload: ServicePagePayload = {
    locationLabel,
    headline,
    heroLead: `${headline} repairs in ${locationLabel} with verified workers, staged updates, and evidence before you approve payment.`,
    heroMeta: `Scoped ${serviceLabel} work with photo checkpoints — not open-ended handyman referrals.`,
    trustWords: ['verify', 'scope', 'track', 'approve'],
    pillarsHeadline: `${headline} repairs with clearer scope, verified workers, and proof before payment.`,
    archiveTitle: `Evidence collected before your ${serviceLabel} repair is signed off.`,
    fieldNotesHeading: `Five rules for ${serviceLabel} repairs you can actually trust.`,
    workTitle: '04 tracked stages',
    workBody: `Every ${serviceLabel} job runs through the same BuildMyHouse loop — scope, match, track, approve.`,
    engageIntro: `Choose how you want to start your ${serviceLabel} job — a focused tracked repair or a verified project.`,
    contactPrompt: `Ready to stop guessing on ${serviceLabel} costs and start with evidence before payment?`,
    engageCards: [
      {
        title: 'Tracked Repair',
        subtitle: 'Best for urgent fixes and single-scope jobs',
        badge: 'Most popular',
        features: [
          'Guided fault intake with photos',
          'Verified worker matching',
          'Stage updates before each payment',
          'Works for local and diaspora owners',
        ],
      },
      {
        title: 'Verified Project',
        subtitle: 'Best when scope spans multiple trades',
        features: [
          'Structured scope and milestones',
          'GC or specialist coordination',
          'Evidence at every checkpoint',
          'Payment tied to verified progress',
        ],
      },
    ],
    pillars: [
      { title: 'Scope first', body: 'Define the fault, access, materials, and timeline before work starts.' },
      { title: 'Verified workers', body: 'Match professionals who fit the repair — not random referrals.' },
      { title: 'Stage evidence', body: 'See photos at diagnosis, materials, repair, and completion checkpoints.' },
      { title: 'Safer payments', body: 'Release funds after verified progress — not on verbal promises alone.' },
    ],
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
    fieldNotes: [
      { number: '01', title: 'Photograph the issue early.', body: 'Clear photos help workers scope faster and quote accurately.' },
      { number: '02', title: 'Separate diagnosis from repair.', body: 'Inspection is its own stage — approve it before major spend begins.' },
      { number: '03', title: 'Track materials explicitly.', body: 'Parts, fittings, and labour should be visible before you pay for them.' },
    ],
    reviews: [
      {
        quote: 'I saw photos before every major payment — that alone changed how I manage repairs.',
        name: 'Homeowner',
        detail: `${headline} repair in Lagos`,
      },
      {
        quote: 'The scope was clear before work started. No surprise costs halfway through the job.',
        name: 'Diaspora client',
        detail: 'Managing from the UK',
      },
    ],
    faqs: [
      {
        question: `How do I start a ${serviceLabel} job on BuildMyHouse?`,
        answer: 'Tap Start a Tracked Repair, describe the issue, and follow the guided intake to match verified workers with staged evidence before payment.',
      },
      {
        question: 'Can I manage the work from abroad?',
        answer: 'Yes. BuildMyHouse sends stage updates and photo evidence so you approve payments after verified progress.',
      },
      {
        question: 'Do I pay everything upfront?',
        answer: 'No. Payment follows approved stages with evidence at each checkpoint.',
      },
    ],
    articleLinks: [
      { label: 'Renovation checklist for homeowners', href: '/articles/renovation-checklist-for-homeowners-nigeria' },
      { label: 'How to choose a contractor in Nigeria', href: '/how-to-choose-a-general-contractor-in-nigeria' },
    ],
    images: defaultImages(),
    primaryCta: { label: 'Start a Tracked Repair', href: '/start-repair' },
    secondaryCta: { label: 'Browse Verified Plans', href: '/location?mode=explore' },
  };

  return {
    metaTitle: resolvedMetaTitle,
    summary: resolvedSummary,
    canonicalPath,
    payload,
  };
}

export function isValidServicePagePayload(value: unknown): value is ServicePagePayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as ServicePagePayload;
  return (
    typeof v.headline === 'string' &&
    Array.isArray(v.pillars) &&
    Array.isArray(v.faqs) &&
    v.images &&
    typeof v.images.heroMain === 'string' &&
    Array.isArray(v.images.archive)
  );
}

export function mergeServicePageResponse(row: {
  id: string;
  slug: string;
  region: ServicePageRegion;
  templateKind: string;
  metaTitle: string;
  summary: string;
  canonicalPath: string;
  payload: unknown;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    payload: row.payload as ServicePagePayload,
  };
}
