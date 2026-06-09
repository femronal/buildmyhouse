import type { ImageSourcePropType } from 'react-native';

export const LANDING_INK = '#000000';
export const LANDING_MUTED = '#4B5563';
export const LANDING_BORDER = '#E5E7EB';
export const LANDING_SURFACE = '#F5F5F5';
export const LANDING_ACCENT = '#000000';

export const HOMEPAGE_META = {
  title: 'BuildMyHouse | Find Verified Repairers, Renovators & Contractors in Lagos, Nigeria',
  description:
    'Find verified repairers, artisans, renovators, interior specialists, and contractors in Lagos, Nigeria. Manage repairs, upgrades, renovations, and property work with clearer scope, evidence, and progress updates.',
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
  'From leaking roofs and plumbing faults to room upgrades, renovations, and full builds, BuildMyHouse helps you find verified workers in Lagos and manage property work with clearer scope, evidence, and progress updates.';

/** Rotating hero verbs for the contractor / get-hired audience tab. */
export const CONTRACTOR_HERO_KEYWORDS = [
  'Upload your plan',
  'Share your scope',
  'Bring your client in',
  'Submit stage evidence',
  'Get verified',
  'Win project requests',
] as const;

export const CONTRACTOR_HERO_SUBHEADLINE =
  'BuildMyHouse helps general contractors and skilled artisans win clearer briefs, run jobs with documented stages, keep clients updated in one place, and get paid through milestones — so you build trust, not just chase WhatsApp updates.';

/** Rotating hero phrases for the diaspora audience tab. */
export const DIASPORA_HERO_KEYWORDS = [
  'Track stage updates',
  'Review site evidence',
  'Approve milestone pay',
  'Follow scope changes',
  'Stay in control',
] as const;

export const DIASPORA_HERO_SUBHEADLINE =
  'Whether you are in the UK, US, Canada, UAE, or Europe, BuildMyHouse gives you one workflow for scope, evidence, communication, and payment decisions — so distance does not mean losing visibility on property work in Lagos.';

export type AudienceTab = {
  key: 'need-worker' | 'get-hired' | 'diaspora';
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export type HeroAudienceContent = {
  rotatingKeywords: readonly string[];
  /** Shown before the slider on the homeowner tab only. */
  headlineLead?: string;
  headlineSuffix: string;
  subheadline: string;
  searchPlaceholder: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  tertiaryLink?: { label: string; href: string };
};

export const HERO_AUDIENCE_CONTENT: Record<AudienceTab['key'], HeroAudienceContent> = {
  'need-worker': {
    rotatingKeywords: HERO_KEYWORDS,
    headlineLead: 'Find verified',
    headlineSuffix: 'in Lagos, Nigeria.',
    subheadline: HERO_SUBHEADLINE,
    searchPlaceholder: 'What do you need fixed, upgraded, or built?',
    primaryCta: { label: 'Hire a Verified Worker', href: '/location?mode=explore' },
    secondaryCta: { label: 'Get Hired on BuildMyHouse', href: '/for-contractors' },
    tertiaryLink: {
      label: 'Managing from abroad? Start a tracked project',
      href: '/diaspora/build-in-nigeria-from-abroad',
    },
  },
  'get-hired': {
    rotatingKeywords: CONTRACTOR_HERO_KEYWORDS,
    headlineSuffix: 'and get hired on BuildMyHouse.',
    subheadline: CONTRACTOR_HERO_SUBHEADLINE,
    searchPlaceholder: 'What kind of projects do you take on?',
    primaryCta: { label: 'Get Hired on BuildMyHouse', href: '/for-contractors' },
    secondaryCta: { label: 'See How Verification Works', href: '#how-it-works' },
  },
  diaspora: {
    rotatingKeywords: DIASPORA_HERO_KEYWORDS,
    headlineSuffix: 'from abroad.',
    subheadline: DIASPORA_HERO_SUBHEADLINE,
    searchPlaceholder: 'What property work are you managing remotely?',
    primaryCta: { label: 'Start a Tracked Project', href: '/diaspora/build-in-nigeria-from-abroad' },
    secondaryCta: { label: 'Find a Verified Worker', href: '/location?mode=explore' },
  },
};

export const AUDIENCE_TABS: AudienceTab[] = [
  {
    key: 'need-worker',
    label: 'I need a worker',
    title: 'Find verified repairers and contractors for property work in Lagos.',
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
  { label: 'Pumping Machine Repair', href: '/services/pumping-machine-repair-nigeria' },
  { label: 'Fan Repair', href: '/services/fan-repair-nigeria' },
  { label: 'Rechargeable Fan Repair', href: '/services/rechargeable-fan-repair-nigeria' },
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

export type PlatformGalleryItem = PlatformPillar & {
  image: ImageSourcePropType;
  layout: {
    rotate: number;
    translateY: number;
  };
  /** Fine-tunes cover crop so the main subject stays visible in portrait cards. */
  imageFocus?: string;
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

/** Landing gallery cards — service photography for the homepage fan layout. */
export const PLATFORM_LADDER_GALLERY: PlatformGalleryItem[] = [
  {
    title: 'Repairs',
    description:
      'Fix urgent property problems like plumbing, electrical faults, roof leaks, drainage, windows, AC, and bathrooms.',
    href: '/services/plumbing-repair-nigeria',
    image: require('@/assets/images/repair.jpg'),
    layout: { rotate: -8, translateY: 12 },
    imageFocus: '50% 38%',
  },
  {
    title: 'Upgrades',
    description:
      'Improve rooms, kitchens, bathrooms, compounds, gates, and finishes without losing control of scope.',
    href: '/services/kitchen-renovation-nigeria',
    image: require('@/assets/images/upgrade.jpg'),
    layout: { rotate: -3, translateY: 20 },
    imageFocus: '50% 35%',
  },
  {
    title: 'Renovations',
    description:
      'Break bigger work into stages, evidence, approvals, and clearer communication.',
    href: '/services/home-renovation-nigeria',
    image: require('@/assets/images/renovations.jpg'),
    layout: { rotate: 2, translateY: 8 },
    imageFocus: '50% 28%',
  },
  {
    title: 'Interiors',
    description:
      'Manage finish selection, procurement, installation, and reporting.',
    href: '/interior-design/nigeria',
    image: require('@/assets/images/interiorDesign.jpg'),
    layout: { rotate: -2, translateY: 14 },
    imageFocus: '50% 42%',
  },
  {
    title: 'Full Builds',
    description:
      'For bigger projects, work with verified professionals through structured project stages.',
    href: '/construction/nigeria',
    image: require('@/assets/images/fullbuilds.jpg'),
    layout: { rotate: 6, translateY: 18 },
    imageFocus: '50% 40%',
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
    title: 'Build in Lagos from UK / US / Canada / UAE',
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
    title: 'Tell us what you need',
    description:
      'Upload photos, describe the issue, location, urgency, and expected outcome.',
  },
  {
    title: 'Get matched',
    description:
      'BuildMyHouse connects you with suitable verified repairers, artisans, or contractors.',
  },
  {
    title: 'Track the work',
    description:
      'Follow progress through scope, stages, updates, photos, videos, and messages.',
  },
  {
    title: 'Approve with evidence',
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
  { label: 'Plumbing Repair in Lagos, Nigeria', href: '/services/plumbing-repair-nigeria' },
  { label: 'Electrical Repair in Lagos, Nigeria', href: '/services/electrical-repair-nigeria' },
  { label: 'Roof Leak Repair in Lagos, Nigeria', href: '/services/roof-leak-repair-nigeria' },
  { label: 'Drainage Repair in Lagos, Nigeria', href: '/services/drainage-repair-nigeria' },
  { label: 'Window Repair in Lagos, Nigeria', href: '/services/window-repair-nigeria' },
  { label: 'Pumping Machine Repair in Lagos, Nigeria', href: '/services/pumping-machine-repair-nigeria' },
  { label: 'Fan Repair in Lagos, Nigeria', href: '/services/fan-repair-nigeria' },
  { label: 'Rechargeable Fan Repair in Lagos, Nigeria', href: '/services/rechargeable-fan-repair-nigeria' },
  { label: 'Bathroom Repair in Lagos, Nigeria', href: '/services/bathroom-repair-nigeria' },
  { label: 'Kitchen Renovation in Lagos, Nigeria', href: '/services/kitchen-renovation-nigeria' },
  { label: 'Home Renovation in Lagos, Nigeria', href: '/services/home-renovation-nigeria' },
  { label: 'Interior Design in Lagos, Nigeria', href: '/interior-design/nigeria' },
  { label: 'General Contractors in Lagos, Nigeria', href: '/services/general-contractors-nigeria' },
  { label: 'Build from UK to Lagos, Nigeria', href: '/diaspora/build-in-nigeria-from-uk' },
  { label: 'Build from US to Lagos, Nigeria', href: '/diaspora/build-in-nigeria-from-usa-canada' },
  { label: 'Build from Canada to Lagos, Nigeria', href: '/diaspora/build-in-nigeria-from-usa-canada' },
  { label: 'Build from UAE to Lagos, Nigeria', href: '/diaspora/build-in-nigeria-from-uae' },
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
      'BuildMyHouse is a trust-and-workflow platform for property work in Lagos, Nigeria. It helps owners define scope, connect with verified workers, track stages, and make payment decisions with better evidence.',
  },
  {
    question: 'Can I use BuildMyHouse if I live in Lagos?',
    answer:
      'Yes — absolutely. BuildMyHouse was built first for diaspora Nigerians who need to manage Lagos projects remotely, with structured workflows and staged payments between you and your contractor. If you live in Lagos, you can use it to find verified contractors for repairs, upgrades, renovations, or full builds — and you’re free to work with them on or off the app. It’s also a strong fit if you’re busy on the ground: landlords, property managers, estate managers, and companies who want someone else handling the monitoring while they focus on everything else.',
  },
  {
    question: 'Can I use BuildMyHouse if I live abroad?',
    answer:
      'Yes. BuildMyHouse is built to help diaspora users monitor scope, stage updates, communication, and evidence while managing property work in Lagos from abroad.',
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
      'Verification starts at the contractor’s workshop — where they actually work. A BuildMyHouse agent visits to confirm the site, and a follow-up check verifies the tools on hand and that work has been carried out there for at least three years. We also collect CAC registration, a valid government ID, and any relevant professional documents where available.',
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

export type LandingTestimonial = {
  name: string;
  role: string;
  quote: string;
  tag: string;
  tagDetail: string;
};

export const LANDING_TESTIMONIAL_STATS = [
  { value: '3+', label: 'Years verified minimum' },
  { value: '1001+', label: 'Projects completed' },
  { value: 'Lagos', label: 'Primary service area' },
] as const;

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    name: 'Adedamola Mulikah',
    role: 'Homeowner, Agege, Lagos',
    quote:
      'Thank you very much, Build my home for providing one of the best experience with an artisan I have had so far. The regular updates, transparency, meeting timelines can only be professionalism. I am truly glad.',
    tag: 'Washing machine setup',
    tagDetail: 'Agege',
  },
  {
    name: 'Aminat Otaru',
    role: 'Homeowner, Egbeda, Lagos',
    quote: 'Professional artisans. Transparent and easy to use! Amazing service.',
    tag: 'Window repair',
    tagDetail: 'Egbeda',
  },
  {
    name: 'Ngozi E.',
    role: 'Homeowner, Yaba',
    quote:
      'I had a leaking ceiling and the last guy took money and disappeared. Here I saw photos at each stage before releasing payment. No drama.',
    tag: 'Roof leak',
    tagDetail: 'Yaba',
  },
  {
    name: 'James O.',
    role: 'Based in Manchester, UK',
    quote:
      "My mum's house in Surulere needed a full kitchen redo. I could see daily progress from my phone instead of trusting random voice notes.",
    tag: 'Diaspora',
    tagDetail: 'Kitchen renovation',
  },
  {
    name: 'Bisi Adeyemi',
    role: 'Property manager, Victoria Island',
    quote:
      'I manage three flats and cannot be on every site daily. Stage updates and one thread per job beats five different group chats.',
    tag: 'Property management',
    tagDetail: 'Victoria Island',
  },
];

export const FOR_CONTRACTOR_URL = 'https://gc.buildmyhouse.app/';

export const BUILDMYHOUSE_CONTACT = {
  address: '7 Ransome Kuti Rd, Akoka, Lagos 100001, Lagos, Nigeria',
  phoneDisplay: '+234 703 028 2417',
  phoneTel: '+2347030282417',
  mapsQuery: '7 Ransome Kuti Rd, Akoka, Lagos 100001, Lagos, Nigeria',
} as const;

export const BUILDMYHOUSE_SOCIALS = [
  {
    id: 'x',
    label: 'X',
    href: 'https://x.com/buildmyhouseapp',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com/buildmyhouseapp',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/buildmyhouse',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@BuildMyHouse',
  },
  {
    id: 'medium',
    label: 'Medium',
    href: 'https://medium.com/@buildmyhouse',
  },
] as const;

export const SERVICE_SEO_PAGES = {
  'plumbing-repair-nigeria': {
    title: 'Plumbing Repair in Lagos, Nigeria',
    summary:
      'Find verified plumbing repair support in Lagos, Nigeria with clearer scope, stage tracking, and homeowner approval checkpoints.',
  },
  'electrical-repair-nigeria': {
    title: 'Electrical Repair in Lagos, Nigeria',
    summary:
      'Get verified electrical repair support in Lagos, Nigeria with documented updates and a safer approval flow.',
  },
  'roof-leak-repair-nigeria': {
    title: 'Roof Leak Repair in Lagos, Nigeria',
    summary:
      'Handle roof leak diagnosis, materials, and repairs in Lagos, Nigeria with staged updates and evidence.',
  },
  'drainage-repair-nigeria': {
    title: 'Drainage Repair in Lagos, Nigeria',
    summary:
      'Coordinate drainage fixes in Lagos, Nigeria with clearer scope and progress visibility.',
  },
  'window-repair-nigeria': {
    title: 'Window Repair in Lagos, Nigeria',
    summary:
      'Find verified window and aluminum repair support in Lagos, Nigeria.',
  },
  'pumping-machine-repair-nigeria': {
    title: 'Pumping Machine Repair in Lagos, Nigeria',
    summary:
      'Find verified pumping machine repair support in Lagos, Nigeria with clearer scope and progress updates.',
  },
  'fan-repair-nigeria': {
    title: 'Fan Repair in Lagos, Nigeria',
    summary:
      'Get verified fan repair support in Lagos, Nigeria for ceiling, standing, and wall fans.',
  },
  'rechargeable-fan-repair-nigeria': {
    title: 'Rechargeable Fan Repair in Lagos, Nigeria',
    summary:
      'Fix rechargeable and inverter fans in Lagos, Nigeria with verified artisans and documented work.',
  },
  'bathroom-repair-nigeria': {
    title: 'Bathroom Repair in Lagos, Nigeria',
    summary:
      'Track bathroom repairs and upgrades in Lagos, Nigeria with stage-based coordination.',
  },
  'painting-services-nigeria': {
    title: 'Painting Services in Lagos, Nigeria',
    summary:
      'Coordinate painting jobs in Lagos, Nigeria with better scope definition and quality checkpoints.',
  },
  'kitchen-renovation-nigeria': {
    title: 'Kitchen Renovation in Lagos, Nigeria',
    summary:
      'Plan kitchen upgrades and installation work in Lagos, Nigeria with structured stage visibility.',
  },
  'home-renovation-nigeria': {
    title: 'Home Renovation in Lagos, Nigeria',
    summary:
      'Manage renovation projects in Lagos, Nigeria with documented scope, updates, and approvals.',
  },
  'general-contractors-nigeria': {
    title: 'General Contractors in Lagos, Nigeria',
    summary:
      'Find verified general contractor support in Lagos, Nigeria and execute with better workflow control.',
  },
} as const;

export type ServiceSeoSlug = keyof typeof SERVICE_SEO_PAGES;
