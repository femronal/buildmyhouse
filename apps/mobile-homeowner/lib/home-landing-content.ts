import type { ImageSourcePropType } from 'react-native';

export const LANDING_INK = '#0A0A0A';
export const LANDING_MUTED = '#4B5563';
export const LANDING_BORDER = '#E5E7EB';
export const LANDING_SURFACE = '#F8FAFC';
export const LANDING_ACCENT = '#111827';

export const HOMEPAGE_META = {
  title: 'BuildMyHouse | Find Verified Repairers, Renovators & Contractors in Nigeria',
  description:
    'Find verified repairers, artisans, renovators, interior specialists, and contractors in Nigeria. Manage repairs, upgrades, renovations, and property work with clearer scope, evidence, and progress updates.',
  canonicalPath: '/',
} as const;

export const HERO_KEYWORDS = [
  'repairers',
  'renovators',
  'artisans',
  'interior experts',
  'general contractors',
] as const;

export const HERO_SUBHEADLINE =
  'From leaking roofs and plumbing faults to room upgrades, renovations, and full builds, BuildMyHouse helps you find verified workers and manage property work with clearer scope, evidence, and progress updates.';

export type AudienceTab = {
  key: 'need-worker' | 'get-hired' | 'diaspora';
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export const AUDIENCE_TABS: AudienceTab[] = [
  {
    key: 'need-worker',
    label: 'I need a worker',
    title: 'Find verified repairers and contractors for property work in Nigeria.',
    description:
      'Start with repairs, then move into upgrades, renovations, interiors, and larger projects with better structure.',
    ctaLabel: 'Hire a Verified Worker',
    ctaHref: '/location?mode=explore',
  },
  {
    key: 'get-hired',
    label: 'I want to get hired',
    title: 'Join BuildMyHouse as a verified artisan, repairer, renovator, or general contractor.',
    description:
      'Receive clearer briefs, documented workflow expectations, and project requests from homeowners who value organized execution.',
    ctaLabel: 'Get Hired on BuildMyHouse',
    ctaHref: '/for-contractors',
  },
  {
    key: 'diaspora',
    label: 'Managing from abroad',
    title: 'Track scope, stage updates, evidence, communication, and payment decisions from wherever you live.',
    description:
      'Use BuildMyHouse as your control layer so distance does not become loss of visibility.',
    ctaLabel: 'Manage a Project From Abroad',
    ctaHref: '/diaspora/build-in-nigeria-from-abroad',
  },
];

export const NAV_ITEMS = [
  { label: 'Find Workers', href: '/location?mode=explore' },
  { label: 'Repairs', href: '#services' },
  { label: 'Renovations', href: '#services' },
  { label: 'Build From Abroad', href: '#diaspora' },
  { label: 'For Contractors', href: '#contractors' },
  { label: 'How It Works', href: '#how-it-works' },
] as const;

export type PopularChip = {
  label: string;
  href: string;
};

export const POPULAR_CHIPS: PopularChip[] = [
  { label: 'Plumbing Fix', href: '/services/plumbing-repair-nigeria' },
  { label: 'Electrical Fix', href: '/services/electrical-repair-nigeria' },
  { label: 'Roof Leak Repair', href: '/services/roof-leak-repair-nigeria' },
  { label: 'Drainage Fix', href: '/services/drainage-repair-nigeria' },
  { label: 'Window Repair', href: '/services/window-repair-nigeria' },
  { label: 'Bathroom Upgrade', href: '/services/bathroom-repair-nigeria' },
  { label: 'Painting', href: '/services/painting-services-nigeria' },
  { label: 'Kitchen Upgrade', href: '/services/kitchen-renovation-nigeria' },
  { label: 'Renovation', href: '/services/home-renovation-nigeria' },
  { label: 'Full Build', href: '/services/general-contractors-nigeria' },
];

export type PlatformPillar = {
  title: string;
  description: string;
  href: string;
};

export const PLATFORM_LADDER: PlatformPillar[] = [
  {
    title: 'Repairs',
    description:
      'Fix urgent property problems like plumbing, electrical faults, roof leaks, drainage, windows, AC, and bathrooms.',
    href: '/services/plumbing-repair-nigeria',
  },
  {
    title: 'Upgrades',
    description:
      'Improve rooms, kitchens, bathrooms, compounds, gates, and finishes without losing control of scope.',
    href: '/services/kitchen-renovation-nigeria',
  },
  {
    title: 'Renovations',
    description:
      'Break bigger work into stages, evidence, approvals, and clearer communication.',
    href: '/services/home-renovation-nigeria',
  },
  {
    title: 'Interiors',
    description:
      'Manage finish selection, procurement, installation, and reporting.',
    href: '/interior-design/nigeria',
  },
  {
    title: 'Full Builds',
    description:
      'For bigger projects, work with verified professionals through structured project stages.',
    href: '/construction/nigeria',
  },
];

export type PlatformCard = {
  title: string;
  description: string;
  href: string;
  image: ImageSourcePropType;
};

export const PLATFORM_CARDS: PlatformCard[] = [
  {
    title: 'Roof leak repair with stage approvals',
    description:
      'See inspection updates, material evidence, and homeowner approvals before payment release.',
    href: '/services/roof-leak-repair-nigeria',
    image: require('@/assets/images/lagos-building-permits-image.png'),
  },
  {
    title: 'Diaspora renovation workflow',
    description:
      'Define scope clearly and track progress updates from abroad in one organized thread.',
    href: '/diaspora/renovate-in-nigeria-from-abroad',
    image: require('@/assets/images/renovate-in-nigeria-from-abroad.png'),
  },
  {
    title: 'Milestone payment planning',
    description:
      'Structure payment decisions around completed stages and proof of work.',
    href: '/tools/milestone-payment-schedule',
    image: require('@/assets/images/worksheet-renovation-cover-image.png'),
  },
  {
    title: 'Contractor vetting guidance',
    description:
      'Understand verification checks and ask better questions before work starts.',
    href: '/guides/contractor-vetting-nigeria-diaspora',
    image: require('@/assets/images/cover-image-for-blog-1.png'),
  },
  {
    title: 'Room-by-room interior upgrades',
    description:
      'Coordinate interiors with clearer reporting and decision checkpoints.',
    href: '/interior-design/nigeria',
    image: require('@/assets/images/blog-3.png'),
  },
  {
    title: 'Build in Nigeria from UK / US / Canada / UAE',
    description:
      'Use structured remote workflows for construction planning and execution.',
    href: '/diaspora/build-in-nigeria-from-abroad',
    image: require('@/assets/images/blog-2.png'),
  },
];

export type HowStep = {
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowStep[] = [
  {
    title: 'Step 1: Tell us what you need',
    description:
      'Upload photos, describe the issue, location, urgency, and expected outcome.',
  },
  {
    title: 'Step 2: Get matched with verified supply',
    description:
      'BuildMyHouse connects you with suitable verified repairers, artisans, renovators, or contractors.',
  },
  {
    title: 'Step 3: Track the work',
    description:
      'Follow progress through scope, stages, updates, photos, videos, and messages.',
  },
  {
    title: 'Step 4: Approve with evidence',
    description:
      'Move forward when the stage is clear, not because someone is pressuring you.',
  },
];

export const TRUST_POINTS = [
  'Verified workers',
  'Scope before work starts',
  'Stage-based progress',
  'Evidence before payment',
  'Admin oversight',
  'Chat and notifications',
  'Dispute support',
  'Project history',
] as const;

export const COMPARISON_ROWS = [
  { oldWay: 'Random referrals from neighbors', platformWay: 'Verified supply of artisans and contractors' },
  { oldWay: 'Vague updates and "I am on it sir"', platformWay: 'Clearer scope defined before work starts' },
  { oldWay: 'Pressure to send money without progress', platformWay: 'Work broken down into trackable stages' },
  { oldWay: 'No clear record of what was agreed', platformWay: 'Evidence required before approval' },
  { oldWay: 'Photos sent without context', platformWay: 'Better visibility for owners at home or abroad' },
] as const;

export const POPULAR_SERVICE_LINKS = [
  { label: 'Plumbing Repair in Nigeria', href: '/services/plumbing-repair-nigeria' },
  { label: 'Electrical Repair in Nigeria', href: '/services/electrical-repair-nigeria' },
  { label: 'Roof Leak Repair in Nigeria', href: '/services/roof-leak-repair-nigeria' },
  { label: 'Drainage Repair in Nigeria', href: '/services/drainage-repair-nigeria' },
  { label: 'Window Repair in Nigeria', href: '/services/window-repair-nigeria' },
  { label: 'Bathroom Repair in Nigeria', href: '/services/bathroom-repair-nigeria' },
  { label: 'Kitchen Renovation in Nigeria', href: '/services/kitchen-renovation-nigeria' },
  { label: 'Home Renovation in Nigeria', href: '/services/home-renovation-nigeria' },
  { label: 'Interior Design in Nigeria', href: '/interior-design/nigeria' },
  { label: 'General Contractors in Nigeria', href: '/services/general-contractors-nigeria' },
  { label: 'Build from UK to Nigeria', href: '/diaspora/build-in-nigeria-from-uk' },
  { label: 'Build from US to Nigeria', href: '/diaspora/build-in-nigeria-from-usa-canada' },
  { label: 'Build from Canada to Nigeria', href: '/diaspora/build-in-nigeria-from-usa-canada' },
  { label: 'Build from UAE to Nigeria', href: '/diaspora/build-in-nigeria-from-uae' },
] as const;

export const WORKER_CATEGORIES = [
  'Plumbers',
  'Electricians',
  'Roofers',
  'Painters',
  'Tilers',
  'Carpenters',
  'Aluminum/window experts',
  'AC technicians',
  'Renovation teams',
  'Interior specialists',
  'General contractors',
  'Excavators',
] as const;

export const DIASPORA_USE_CASES = [
  'Parents’ home repairs',
  'Inherited property renovation',
  'Rental property preparation',
  'Room-by-room upgrades',
  'Full construction planning',
] as const;

export const FAQ_ITEMS = [
  {
    question: 'What is BuildMyHouse?',
    answer:
      'BuildMyHouse is a trust-and-workflow platform for property work in Nigeria. It helps owners define scope, connect with verified workers, track stages, and make payment decisions with better evidence.',
  },
  {
    question: 'Can I use BuildMyHouse if I live in Nigeria?',
    answer:
      'Yes. BuildMyHouse supports Nigerians in Nigeria who need reliable repairers, artisans, renovators, interior specialists, or contractors with clearer structure.',
  },
  {
    question: 'Can I use BuildMyHouse if I live abroad?',
    answer:
      'Yes. BuildMyHouse is built to help diaspora users monitor scope, stage updates, communication, and evidence while managing property work from abroad.',
  },
  {
    question: 'Does BuildMyHouse only handle full construction?',
    answer:
      'No. The wedge starts with repairs and upgrades, then expands to renovations, interiors, and larger builds.',
  },
  {
    question: 'Can I find repairers on BuildMyHouse?',
    answer:
      'Yes. You can start with repair-focused jobs like plumbing, electrical issues, roof leaks, drainage, painting, and bathroom fixes.',
  },
  {
    question: 'How are workers verified?',
    answer:
      'BuildMyHouse verification may include identity checks, business information, references, portfolio review, and platform behavior review based on the available records.',
  },
  {
    question: 'Can I monitor a project from abroad?',
    answer:
      'Yes. You can follow stage updates, media evidence, and communication records in one workflow instead of scattered chats.',
  },
  {
    question: 'Can I use BuildMyHouse for renovations?',
    answer:
      'Yes. Renovation work can be structured into stages with clearer scope, updates, and approvals.',
  },
  {
    question: 'Is BuildMyHouse a construction company?',
    answer:
      'No. BuildMyHouse is a software and operations coordination platform designed to improve visibility, accountability, and owner control.',
  },
  {
    question: 'How do contractors join BuildMyHouse?',
    answer:
      'Contractors and artisans can apply through the contractor onboarding flow, complete verification steps, and start receiving project opportunities.',
  },
] as const;

export const FOR_CONTRACTOR_URL = 'https://gc.buildmyhouse.app/';

export const BUILDMYHOUSE_CONTACT = {
  address: '7 Ransome Kuti Rd, Akoka, Lagos 100001, Lagos, Nigeria',
  phoneDisplay: '+234 703 028 2417',
  phoneTel: '+2347030282417',
  mapsQuery: '7 Ransome Kuti Rd, Akoka, Lagos 100001, Lagos, Nigeria',
} as const;

export const SERVICE_SEO_PAGES = {
  'plumbing-repair-nigeria': {
    title: 'Plumbing Repair in Nigeria',
    summary:
      'Find verified plumbing repair support in Nigeria with clearer scope, stage tracking, and homeowner approval checkpoints.',
  },
  'electrical-repair-nigeria': {
    title: 'Electrical Repair in Nigeria',
    summary:
      'Get verified electrical repair support with documented updates and safer approval flow.',
  },
  'roof-leak-repair-nigeria': {
    title: 'Roof Leak Repair in Nigeria',
    summary:
      'Handle roof leak diagnosis, materials, and repairs with staged updates and evidence.',
  },
  'drainage-repair-nigeria': {
    title: 'Drainage Repair in Nigeria',
    summary:
      'Coordinate drainage fixes with clearer scope and progress visibility.',
  },
  'window-repair-nigeria': {
    title: 'Window Repair in Nigeria',
    summary:
      'Find verified support for window and aluminum-related repairs.',
  },
  'bathroom-repair-nigeria': {
    title: 'Bathroom Repair in Nigeria',
    summary:
      'Track bathroom repairs and upgrades with stage-based coordination.',
  },
  'painting-services-nigeria': {
    title: 'Painting Services in Nigeria',
    summary:
      'Coordinate painting jobs with better scope definition and quality checkpoints.',
  },
  'kitchen-renovation-nigeria': {
    title: 'Kitchen Renovation in Nigeria',
    summary:
      'Plan kitchen upgrades and installation work with structured stage visibility.',
  },
  'home-renovation-nigeria': {
    title: 'Home Renovation in Nigeria',
    summary:
      'Manage renovation projects with documented scope, updates, and approvals.',
  },
  'general-contractors-nigeria': {
    title: 'General Contractors in Nigeria',
    summary:
      'Find verified general contractor support and execute with better workflow control.',
  },
} as const;

export type ServiceSeoSlug = keyof typeof SERVICE_SEO_PAGES;
