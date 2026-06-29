export const GC_BG = '#0A1628';
export const GC_SURFACE = '#1E3A5F';
export const GC_PRIMARY = '#3B82F6';
export const GC_PRIMARY_CTA = '#2563EB';
export const GC_BORDER = 'rgba(59, 130, 246, 0.22)';
export const GC_TEXT = '#FFFFFF';
export const GC_MUTED = '#9CA3AF';

export const HOMEOWNER_APP_URL = 'https://buildmyhouse.app/';

const webBase = () => (process.env.EXPO_PUBLIC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');
const homeownerBase = () => (process.env.EXPO_PUBLIC_HOMEOWNER_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export const GC_HOMEPAGE_META = {
  title: 'BuildMyHouse for General Contractors | Verified Projects, Stage Evidence & Milestone Pay',
  description:
    'Join BuildMyHouse as a verified general contractor or skilled trade professional in Lagos, Nigeria. Receive clearer briefs, document stage evidence, keep clients updated, and get paid through milestones — not scattered WhatsApp promises.',
  canonicalPath: '/',
} as const;

export type GcAudienceTab = {
  key: 'general-contractor' | 'specialist' | 'renovation-team';
  label: string;
};

export const GC_AUDIENCE_TABS: GcAudienceTab[] = [
  { key: 'general-contractor', label: 'General contractor' },
  { key: 'specialist', label: 'Specialist trade' },
  { key: 'renovation-team', label: 'Renovation team' },
];

export type GcHeroContent = {
  rotatingKeywords: readonly string[];
  headlineLead?: string;
  headlineSuffix: string;
  subheadline: string;
  searchPlaceholder: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export const GC_HERO_CONTENT: Record<GcAudienceTab['key'], GcHeroContent> = {
  'general-contractor': {
    rotatingKeywords: [
      'Win clearer briefs',
      'Run staged projects',
      'Upload site evidence',
      'Coordinate trades',
      'Build client trust',
      'Get milestone pay',
    ],
    headlineLead: 'General contractors:',
    headlineSuffix: 'on BuildMyHouse.',
    subheadline:
      'Stop chasing vague referrals. BuildMyHouse sends you scoped project requests from homeowners who expect documented stages, photo evidence, and milestone-based payments — so you look professional, not like another WhatsApp contact.',
    searchPlaceholder: 'What projects do you take on — repairs, renovations, or full builds?',
    primaryCta: { label: 'Create Contractor Account', href: '/email-login' },
    secondaryCta: { label: 'See How Verification Works', href: '#verification' },
  },
  specialist: {
    rotatingKeywords: [
      'Get repair requests',
      'Show your workshop',
      'Prove your craft',
      'Submit stage photos',
      'Win repeat clients',
      'Grow verified work',
    ],
    headlineSuffix: 'and get hired for specialist jobs.',
    subheadline:
      'Plumbers, electricians, roofers, painters, AC techs, and other trades — BuildMyHouse helps you receive clearer repair briefs, document your work at each stage, and build a verified reputation homeowners can trust.',
    searchPlaceholder: 'What trade do you specialize in?',
    primaryCta: { label: 'Join as a Verified Trade Pro', href: '/email-login' },
    secondaryCta: { label: 'See Project Types', href: '#projects' },
  },
  'renovation-team': {
    rotatingKeywords: [
      'Scope room upgrades',
      'Track finish stages',
      'Share progress photos',
      'Manage diaspora clients',
      'Approve milestones',
      'Deliver with proof',
    ],
    headlineSuffix: 'for renovation teams.',
    subheadline:
      'Kitchen, bathroom, compound, and full-home renovation teams use BuildMyHouse to break work into visible stages, keep local and diaspora clients aligned, and reduce payment disputes with evidence before each release.',
    searchPlaceholder: 'What kind of renovation work does your team handle?',
    primaryCta: { label: 'Start Verification', href: '/email-login' },
    secondaryCta: { label: 'How It Works', href: '#how-it-works' },
  },
};

export const GC_NAV_ITEMS = [
  { label: 'Project Types', href: '#projects' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Verification', href: '#verification' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Homeowner App', href: HOMEOWNER_APP_URL },
] as const;

export const GC_TRUST_PILLS = [
  'Verified contractor profiles',
  'Scoped project requests',
  'Stage evidence uploads',
  'Milestone-based payouts',
  'In-app client chat',
  'Dispute support',
] as const;

export type GcProjectCard = {
  title: string;
  description: string;
  image: string;
  rotate: number;
  translateY: number;
};

export const GC_PROJECT_CARDS: GcProjectCard[] = [
  {
    title: 'Tracked repairs',
    description: 'Plumbing, electrical, roof leaks, drainage, windows, pumps, and urgent fixes with clear scope.',
    image: `${homeownerBase()}/plumbing-service-hero.jpg`,
    rotate: -7,
    translateY: 14,
  },
  {
    title: 'Room upgrades',
    description: 'Kitchens, bathrooms, painting, tiling, and compound improvements with staged approvals.',
    image: `${homeownerBase()}/engineer-at-buildmyhouse.png`,
    rotate: -2,
    translateY: 22,
  },
  {
    title: 'Renovations',
    description: 'Multi-room and whole-home renovation jobs with evidence at every milestone.',
    image: `${homeownerBase()}/electrical-service-hero.jpg`,
    rotate: 3,
    translateY: 10,
  },
  {
    title: 'Diaspora projects',
    description: 'Clients abroad who need structured updates, photos, and payment checkpoints you can deliver on.',
    image: `${homeownerBase()}/roof-leak-service-hero.png`,
    rotate: -3,
    translateY: 18,
  },
  {
    title: 'Full builds',
    description: 'Larger construction scopes with GC coordination, subcontractor visibility, and stage tracking.',
    image: `${homeownerBase()}/drainage-service-hero.jpg`,
    rotate: 6,
    translateY: 16,
  },
];

export const GC_COMPARISON_ROWS = [
  { oldWay: 'Clients send vague voice notes and blurry photos', platformWay: 'Structured briefs with scope, photos, and urgency upfront' },
  { oldWay: '"Send balance" before work is visible', platformWay: 'Milestone payments tied to submitted stage evidence' },
  { oldWay: 'Updates scattered across WhatsApp groups', platformWay: 'One project thread with stage history and media' },
  { oldWay: 'No proof when disputes happen', platformWay: 'Timestamped evidence trail for every approved stage' },
  { oldWay: 'Referrals only from people who already know you', platformWay: 'Verified profile visible to homeowners searching for GCs' },
] as const;

export const GC_HOW_IT_WORKS = [
  {
    title: 'Get verified',
    description:
      'Complete workshop verification, identity checks, and profile setup so homeowners know you are a real professional — not a random referral.',
  },
  {
    title: 'Receive scoped requests',
    description:
      'Homeowners submit projects with photos, location, urgency, and expected outcomes — so you quote and plan from clarity, not guesswork.',
  },
  {
    title: 'Document every stage',
    description:
      'Upload diagnosis, materials, progress, and completion evidence at each milestone. Clients see your work before they approve payment.',
  },
  {
    title: 'Get paid on proof',
    description:
      'Release funds stage by stage after verified progress — reducing chase-ups, disputes, and awkward WhatsApp payment pressure.',
  },
] as const;

export const GC_VERIFICATION_STEPS = [
  {
    title: 'Workshop visit',
    body: 'A BuildMyHouse agent confirms your workshop or active work site — where you actually operate.',
  },
  {
    title: 'Tools & track record',
    body: 'We verify tools on hand and that meaningful work has been carried out at the site for at least three years.',
  },
  {
    title: 'Identity & registration',
    body: 'CAC registration, valid government ID, and relevant professional documents where available.',
  },
  {
    title: 'Profile & portfolio',
    body: 'Add your trades, service areas, project photos, and the kinds of jobs you want to receive.',
  },
] as const;

export const GC_TESTIMONIALS = [
  {
    quote:
      'Clients stopped arguing about what was agreed because every stage had photos. I spend less time defending myself and more time delivering.',
    name: 'Verified GC',
    detail: 'Lagos mainland · Renovation projects',
  },
  {
    quote:
      'Diaspora clients finally trust the process. They approve milestones when they see evidence — not when I send another voice note.',
    name: 'Electrical contractor',
    detail: 'Ikeja · Repairs & upgrades',
  },
  {
    quote:
      'The briefs are clearer than referrals from neighbors. I know the scope before I visit site, so my quotes are sharper.',
    name: 'Plumbing specialist',
    detail: 'Lekki · Tracked repairs',
  },
] as const;

export const GC_FAQ_ITEMS = [
  {
    question: 'Who can join BuildMyHouse as a contractor?',
    answer:
      'General contractors, renovation teams, and skilled trades — plumbers, electricians, roofers, painters, tilers, carpenters, AC technicians, and related professionals operating in Lagos, Nigeria.',
  },
  {
    question: 'Is BuildMyHouse only for large construction companies?',
    answer:
      'No. The platform starts with repairs and upgrades, then scales to renovations and full builds. Solo specialists and small teams are welcome if they can document work professionally.',
  },
  {
    question: 'How does verification work?',
    answer:
      'We visit your workshop or active work site, confirm tools and operating history, and collect identity and business registration documents. Verified contractors get a badge homeowners can trust.',
  },
  {
    question: 'Do I pay to join?',
    answer:
      'Create your account and start verification at no upfront platform fee. BuildMyHouse earns when structured projects move through the platform successfully.',
  },
  {
    question: 'How do I get project requests?',
    answer:
      'Homeowners submit jobs through buildmyhouse.app. Verified contractors receive requests matched to their trade, location, and profile — with scope and photos attached.',
  },
  {
    question: 'Can I work with diaspora clients?',
    answer:
      'Yes. Many BuildMyHouse homeowners manage property from abroad. Stage evidence and in-app updates are built for remote approval workflows.',
  },
  {
    question: 'What if a client disputes a stage?',
    answer:
      'BuildMyHouse maintains a evidence trail — scope, photos, messages, and approvals — so disputes are resolved from documented facts, not memory.',
  },
  {
    question: 'Can I still use WhatsApp with clients?',
    answer:
      'You can, but project scope, evidence, milestones, and payment approvals should live on BuildMyHouse so both sides stay aligned.',
  },
] as const;

export const GC_WORKER_CATEGORIES = [
  'General contractors',
  'Plumbers',
  'Electricians',
  'Roofers',
  'Painters',
  'Tilers',
  'Carpenters',
  'AC technicians',
  'Renovation teams',
  'Aluminium/window experts',
] as const;

export const GC_CONTACT = {
  address: '7 Ransome Kuti Rd, Akoka, Lagos 100001, Lagos, Nigeria',
  phoneDisplay: '+234 813 903 6559',
  phoneTel: '+2348139036559',
  mapsQuery: '7 Ransome Kuti Rd, Akoka, Lagos 100001, Lagos, Nigeria',
  email: 'hello@buildmyhouse.app',
} as const;

export const GC_SOCIALS = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/buildmyhousetech/' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/company/buildmyhouse' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@BuildMyHouse' },
  { id: 'x', label: 'X', href: 'https://x.com/buildmyhouseapp' },
] as const;

export const GC_OG_IMAGE = `${webBase()}/engineer-at-buildmyhouse.png`;
