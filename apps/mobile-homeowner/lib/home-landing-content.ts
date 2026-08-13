import type { ImageSourcePropType } from 'react-native';

export const LANDING_INK = '#000000';
export const LANDING_MUTED = '#4B5563';
export const LANDING_BORDER = '#E5E7EB';
export const LANDING_SURFACE = '#F5F5F5';
export const LANDING_ACCENT = '#000000';

export const HOMEPAGE_META = {
  title: 'BuildMyHouse | Manage Property Work in Nigeria From Abroad',
  description:
    'Manage repairs, renovations, and property work in Nigeria from abroad with verified workers, clearer scope, stage evidence, and more control over when work and money move forward.',
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
  'From leaking roofs and plumbing faults to room upgrades, renovations, and full builds, BuildMyHouse helps you find verified workers in Nigeria and manage property work with clearer scope, evidence, and progress updates.';

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
  'BuildMyHouse helps general contractors and skilled artisans win clearer briefs, run jobs with documented stages, keep clients updated in one place, and get paid through milestones. You build trust. You do not just chase WhatsApp updates.';

/** Rotating hero phrases for the diaspora audience tab. */
export const DIASPORA_HERO_KEYWORDS = [
  'Track stage updates',
  'Review site evidence',
  'Approve milestone pay',
  'Follow scope changes',
  'Stay in control',
] as const;

export const DIASPORA_HERO_SUBHEADLINE =
  'Whether you are in the UK, US, Canada, UAE, or Europe, BuildMyHouse gives you one workflow for scope, evidence, communication, and payment decisions. Distance does not mean losing visibility on property work in Nigeria.';

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
  /** When set, replaces the rotating-keyword headline entirely. */
  staticHeadline?: string;
  eyebrow?: string;
  subheadline: string;
  searchPlaceholder: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  reassurance?: string;
  tertiaryLink?: { label: string; href: string };
};

export const HERO_AUDIENCE_CONTENT: Record<AudienceTab['key'], HeroAudienceContent> = {
  diaspora: {
    rotatingKeywords: DIASPORA_HERO_KEYWORDS,
    staticHeadline: "You shouldn't have to fly home just to know what's happening to your property.",
    eyebrow: 'For Nigerians abroad managing property work in Nigeria',
    headlineSuffix: 'from abroad.',
    subheadline:
      "Whether you're fixing your parents' home, renovating an investment property, or building from the ground up. BuildMyHouse helps you work with verified professionals, clearer scope, and stage-by-stage evidence before money moves forward.",
    searchPlaceholder: 'What property work are you managing remotely?',
    primaryCta: { label: 'Start a Tracked Project', href: '/book-repair' },
    secondaryCta: { label: 'See How It Works', href: '#how-it-works' },
    reassurance: 'Repairs, upgrades, renovations and full builds. Start as small as one job.',
  },
  'need-worker': {
    rotatingKeywords: HERO_KEYWORDS,
    headlineLead: 'Find verified',
    headlineSuffix: 'in Nigeria.',
    subheadline: HERO_SUBHEADLINE,
    searchPlaceholder: 'What do you need fixed, upgraded, or built?',
    primaryCta: { label: 'Start a Tracked Project', href: '/book-repair' },
    secondaryCta: { label: 'Find a Verified Worker', href: '/location?mode=explore' },
    reassurance: 'Repairs, upgrades, renovations and full builds.',
    tertiaryLink: {
      label: 'Managing from abroad? Stay in control remotely',
      href: '/diaspora/build-in-nigeria-from-abroad',
    },
  },
  'get-hired': {
    rotatingKeywords: CONTRACTOR_HERO_KEYWORDS,
    headlineSuffix: 'and get hired on BuildMyHouse.',
    subheadline: CONTRACTOR_HERO_SUBHEADLINE,
    searchPlaceholder: 'What kind of projects do you take on?',
    primaryCta: { label: 'Get Verified on BuildMyHouse', href: '/for-contractors' },
    secondaryCta: { label: 'See How Verification Works', href: '#how-it-works' },
  },
};

/** Diaspora first: homepage dream buyer. */
export const AUDIENCE_TABS: AudienceTab[] = [
  {
    key: 'diaspora',
    label: 'Managing from abroad',
    title: 'Track scope, stage updates, evidence, communication, and payment decisions from wherever you live.',
    description:
      'Use BuildMyHouse as your control layer so distance does not become loss of visibility.',
    ctaLabel: 'Start a Tracked Project',
    ctaHref: '/book-repair',
  },
  {
    key: 'need-worker',
    label: 'I need work done',
    title: 'Find verified repairers and contractors for property work in Nigeria.',
    description:
      'Start with repairs, then move into upgrades, renovations, interiors, and larger projects with better structure.',
    ctaLabel: 'Find a Verified Worker',
    ctaHref: '/location?mode=explore',
  },
  {
    key: 'get-hired',
    label: 'I want to get hired',
    title: 'Join BuildMyHouse as a verified artisan, repairer, renovator, or general contractor.',
    description:
      'Receive clearer briefs, documented workflow expectations, and project requests from homeowners who value organized execution.',
    ctaLabel: 'Get Verified on BuildMyHouse',
    ctaHref: '/for-contractors',
  },
];

export const NAV_ITEMS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Repairs', href: '#services' },
  { label: 'Renovations', href: '#services' },
  { label: 'Build From Abroad', href: '#diaspora' },
  { label: 'Tools', href: '#tools' },
  { label: 'For Contractors', href: '#contractors' },
] as const;

export const HERO_TRUST_BULLETS = [
  'Verified workers',
  'Clearer scope before work starts',
  'Evidence before approval',
  'Better control from abroad',
] as const;

export const CONTROL_PROMISE = {
  heading: 'The BuildMyHouse Control Promise',
  supporting:
    'Clearer scope before work starts. Evidence as stages progress. You stay involved in the decisions that move your project forward.',
  points: [
    { label: 'Verified Workers', key: 'verified' },
    { label: 'Scope Before Work', key: 'scope' },
    { label: 'Evidence Before Payment', key: 'evidence' },
    { label: 'Dispute Support', key: 'dispute' },
  ],
} as const;

export const COMPARISON_SECTION = {
  heading: 'If managing from abroad feels like trust-and-pray, you are not alone.',
  supporting:
    'WhatsApp is good for conversation. It was never designed to manage scope, evidence, stages and money across continents.',
  oldHeading: 'The Old Way',
  newHeading: 'The BuildMyHouse Way',
} as const;

export const PROMISED_LAND = {
  heading: 'This is what control looks like from abroad.',
  supporting:
    'Open one place and see what is being done, what stage the work is in, what evidence has been submitted, what has been spent, and what needs your attention next. No more chasing anyone for updates.',
  caption: 'Tap around. This is project tracking on BuildMyHouse.',
  intrigue:
    'What if property work in Nigeria felt less like guessing, and more like clarity you can act on?',
} as const;

export const BENEFITS_SECTION = {
  heading: 'What you actually gain',
  supporting:
    'Not another app to check. A calmer way to stay in charge of property work you cannot stand over every day.',
  items: [
    {
      title: 'Fewer unpleasant surprises',
      description: 'Scope is clarified before work drifts, so “small jobs” don’t silently become expensive ones.',
    },
    {
      title: 'Clarity before money moves',
      description: 'See stage context and evidence before you approve the next step, not after the pressure call.',
    },
    {
      title: 'Less load on relatives',
      description: 'Stop asking family to supervise contractors with no structure, no record, and no backup.',
    },
    {
      title: 'Visibility from anywhere',
      description: 'UK, US, Canada, Europe, UAE: same workflow. Distance should not mean blindness.',
    },
    {
      title: 'Organized communication',
      description: 'Project history lives in one place instead of scattered chats, voice notes, and forgotten promises.',
    },
    {
      title: 'A safer way to start small',
      description: 'Begin with a repair. Prove the process. Then grow into renovations or larger builds when you are ready.',
    },
  ],
} as const;

export const CREDENTIALS_SECTION = {
  heading: 'Why trust BuildMyHouse over a random referral?',
  supporting:
    'We cannot promise perfection. We can promise a process that earns trust with verification, documentation, and stage visibility, instead of hope.',
  points: [
    {
      title: 'Workshop-level verification',
      description:
        'Verification starts where workers actually operate. That includes site checks, tools on hand, and a track record of real work, plus ID and business documents where available.',
    },
    {
      title: 'Scope before the work drifts',
      description:
        'We help turn vague requests into clearer briefs so everyone knows what “done” looks like before money and materials start moving.',
    },
    {
      title: 'Evidence tied to stages',
      description:
        'Photos, videos, and updates attach to progress. You review what was completed, not a story about what was completed.',
    },
    {
      title: 'Dispute support with a record',
      description:
        'When something goes wrong, you have project history and evidence in one workflow, not memory versus memory on WhatsApp.',
    },
  ],
} as const;

export const PRODUCT_LADDER_SECTION = {
  heading: 'Start with the job you need done now.',
  supporting:
    "Fix one leaking pipe. Renovate your parents' bathroom. Upgrade a rental. Or manage a complete build. BuildMyHouse is designed to grow with the size of the work.",
  primaryCta: { label: 'Start a Tracked Project', href: '/book-repair' },
  secondaryCta: { label: 'Browse Services', href: '/services/home-renovation-nigeria' },
} as const;

export const OFFER_SECTION = {
  eyebrow: 'First-project offer for new homeowners',
  heading: 'Try BuildMyHouse the low-risk way.',
  supporting:
    'Before you send another payment into confusion, start with a structured first project. It is built to make trying us feel like a no-brainer, not a leap of faith.',
  components: [
    {
      title: '₦0 BuildMyHouse commission on your first project',
      description:
        'For your first project, BuildMyHouse does not charge platform commission. You pay the verified contractor quote through a staged workflow, not an extra platform cut to “try us.”',
    },
    {
      title: 'Free first inspection',
      description:
        'Qualifying first-time projects include a free first inspection / site assessment so the job starts from a clearer diagnosis, not a guess on WhatsApp.',
    },
    {
      title: 'Free access to homeowner tools',
      description:
        'Use Price Checker and other BuildMyHouse tools to question material prices, quotes, and project decisions before money moves.',
    },
    {
      title: 'Start with a simple repair if you want',
      description:
        'Many diaspora owners begin with one urgent repair to test the process. Then they bring larger renovations once they have seen how stages and evidence work.',
    },
  ],
  bonusesHeading: 'Stacked into your first project',
  bonuses: [
    'Structured project setup support',
    'Guided scope clarification before work starts',
    'Stage tracking with evidence visibility',
    'Remote Renovation Scope Worksheet for Nigerians abroad',
  ],
  scarcity:
    'Early-user first-project slots are limited each month while we carefully onboard diaspora owners. Support stays personal, not mass-market chaos.',
  primaryCta: { label: 'Claim Your First-Project Offer', href: '/book-repair' },
  secondaryCta: { label: 'See How It Works', href: '#how-it-works' },
} as const;

export const GUARANTEE_SECTION = {
  heading: 'Our process is built to reduce your risk, not increase it.',
  supporting:
    'We do not ask you to fund an entire job on trust alone. Progression and payments are tied to stages, visibility, and your involvement.',
  points: [
    {
      title: 'Staged money movement',
      description:
        'Work advances in stages. You see context and evidence before the next step continues. Urgency alone is not a reason to send more funds.',
    },
    {
      title: 'Pause before you continue',
      description:
        'If something looks wrong, incomplete, or unclear, you can pause progression and review before more money or work moves forward.',
    },
    {
      title: 'Dispute support with a paper trail',
      description:
        'Disagreements are reviewed against scope, evidence, and project history, not against scattered chats and conflicting stories.',
    },
    {
      title: 'Honest limits',
      description:
        'No platform can erase every risk in Nigerian property work. BuildMyHouse reduces blind spots with structure. We do not invent fake completion guarantees.',
    },
  ],
  footnote:
    'Payment handling uses approved providers and platform policies. Refunds and holds follow the managed stage process and dispute review. They are not automatic blanket promises.',
  primaryCta: { label: 'Start a Tracked Project', href: '/book-repair' },
} as const;

export const WORKSHEET_SECTION = {
  eyebrow: 'Not ready to hire anyone yet?',
  heading: 'Define the renovation before money starts moving.',
  supporting:
    "Download BuildMyHouse's Remote Renovation Scope Worksheet for Nigerians Abroad and clarify repairs, upgrades, rooms, stages and payment checkpoints before work begins.",
  cta: {
    label: 'Get the Free Worksheet',
    href: '/downloads/remote-renovation-scope-worksheet',
  },
} as const;

export const TOOLS_SECTION = {
  eyebrow: 'Property decision tools',
  heading: 'Make better property decisions before sending money.',
  supporting:
    'BuildMyHouse tools are designed to help you question prices, quotes, risks and project decisions before they become expensive mistakes.',
  primaryCta: { label: 'Check a Building Material Price', href: '/tools/price-checker' },
  secondaryCta: { label: 'See All Tools', href: '/tools' },
} as const;

export const TESTIMONIALS_SECTION = {
  kicker: 'Real property work. Real evidence.',
  heading: "Don't take our word for it. See how the work was handled.",
  supporting:
    'For repairs, renovations, and builds in Nigeria, whether you are on site or monitoring from abroad. Verified workers, staged updates, and evidence before you pay.',
} as const;

export const FOOTER_CLOSE = {
  line1: 'Ready to stop guessing?',
  line2: 'Start managing with clarity.',
  supporting:
    'Claim your first-project offer. Get ₦0 BuildMyHouse commission, a free first inspection for qualifying projects, and tools that help you decide before money moves.',
  ctaLabel: 'Start Your First Tracked Project',
  ctaHref: '/book-repair',
} as const;

export type PopularChip = {
  label: string;
  href: string;
};

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

/** Landing gallery cards: service photography for the homepage fan layout. */
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
    title: 'She thought the window needed replacement',
    description:
      'Inspection showed repair was enough. Read the Egbeda case study on scope, materials, and staged payment.',
    href: '/articles/aluminium-window-repair-egbeda-lagos-buildmyhouse-case-study',
    image: require('@/assets/images/man-repairing-window-with-screwdriver-inside-a-hom-2026-03-24-07-43-18-utc.jpg'),
  },
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
    title: 'Tell us what is happening',
    description:
      'Upload photos or videos and describe the property, location, problem and outcome. Clear intake reduces guesswork before anyone starts spending your money.',
  },
  {
    title: 'Get matched with verified supply',
    description:
      'We help coordinate an appropriate verified artisan, repairer or contractor for the scope. You are not relying on a random “my guy” referral alone.',
  },
  {
    title: 'Follow the work remotely',
    description:
      'See stages, updates, photos, videos and project communication without being on site. Relatives are not your only eyes and ears.',
  },
  {
    title: 'Review before progression',
    description:
      'Understand what has been completed and the evidence available before the next stage and more money move forward.',
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
  {
    oldWay: 'Random contractor referrals from relatives',
    platformWay: 'Verified workers matched to the work',
  },
  {
    oldWay: '"Oga, we need more money" without clear stage context',
    platformWay: 'Scope clarified before work progresses',
  },
  {
    oldWay: 'Photos and videos scattered across chats',
    platformWay: 'Photos, videos and documentation attached to progress',
  },
  {
    oldWay: 'Scope changing after work begins',
    platformWay: 'Work broken into visible stages',
  },
  {
    oldWay: 'Money moving because someone sounds urgent',
    platformWay: 'Better visibility before approvals',
  },
  {
    oldWay: 'No reliable record of what was agreed',
    platformWay: 'Project history kept in one workflow',
  },
  {
    oldWay: 'Flying home or calling family just to understand what is happening',
    platformWay: 'Dispute support when something goes wrong',
  },
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
    question: 'Can I use BuildMyHouse if I live abroad?',
    answer:
      'Yes. BuildMyHouse is built for Nigerians in the UK, US, Canada, UAE, Europe and elsewhere who need to manage property work in Nigeria from abroad. You get clearer scope, stage updates, evidence and communication in one workflow.',
  },
  {
    question: 'How can I monitor property work in Nigeria from abroad?',
    answer:
      'You can follow stage updates, media evidence, materials and communication records in one project workflow instead of scattered WhatsApp chats, voice notes and family phone calls.',
  },
  {
    question: 'How are BuildMyHouse workers verified?',
    answer:
      "Verification starts at the contractor's workshop, where they actually work. A BuildMyHouse agent visits to confirm the site, and a follow-up check verifies the tools on hand and that work has been carried out there for at least three years. We also collect CAC registration, a valid government ID, and any relevant professional documents where available.",
  },
  {
    question: 'How does BuildMyHouse handle progress evidence?',
    answer:
      'Work is broken into stages. Photos, videos and documentation can be attached to progress so you can review what has been completed before the project moves forward, instead of paying because someone sounds urgent.',
  },
  {
    question: 'How do payments work?',
    answer:
      'Projects are structured around stages. Homeowners are encouraged to review progress evidence before approving the next stage or releasing the next payment through the platform workflow. BuildMyHouse uses approved payment providers; platform fees may apply on later projects, while first-project platform commission is currently ₦0. Refunds and holds follow process and dispute review. They are not automatic blanket guarantees.',
  },
  {
    question: 'What if I already have someone working on site?',
    answer:
      'You can still bring structure to the next stage of work with clearer scope, evidence expectations, and a tracked workflow, even if some work has already started. Tell us what is in progress and what still needs control.',
  },
  {
    question: 'Can I use BuildMyHouse for small repairs?',
    answer:
      'Yes. You can start with repair-focused jobs like plumbing, electrical issues, roof leaks, drainage, windows, painting and bathroom fixes. Many diaspora projects begin with one urgent repair to test the process before larger renovations.',
  },
  {
    question: 'Can BuildMyHouse manage renovations?',
    answer:
      'Yes. Renovation work can be structured into stages with clearer scope, updates and approvals. This is useful for parents’ homes, inherited houses, rentals and room-by-room upgrades.',
  },
  {
    question: 'Does BuildMyHouse only handle full construction?',
    answer:
      'No. The wedge starts with repairs and upgrades, then expands to renovations, interiors and larger builds. You do not need to start with a full house project.',
  },
  {
    question: 'What happens if I disagree with work completed on a stage?',
    answer:
      'BuildMyHouse provides dispute support and keeps project history, evidence and communication in one place so disagreements can be reviewed against what was agreed and what was submitted, not against memory and scattered chats.',
  },
  {
    question: 'Can I check Nigerian building-material prices online?',
    answer:
      'Yes. Use BuildMyHouse Price Checker to research current market prices for materials such as cement, iron rods, roofing, tiles and finishes, with source-backed ranges and confidence scoring instead of guesswork.',
  },
  {
    question: 'Can people living in Nigeria also use BuildMyHouse?',
    answer:
      'Yes. If you live in Nigeria, you can use the same system to find verified workers and manage repairs, upgrades and renovations with better documentation. It is also useful for busy landlords and property managers who cannot be on every site daily.',
  },
  {
    question: 'Is BuildMyHouse a construction company?',
    answer:
      'No. BuildMyHouse is a software and operations coordination platform designed to improve visibility, accountability and owner control. It is the control layer between homeowner, scope, verified worker, stage, evidence, approval and money.',
  },
  {
    question: 'How do contractors join BuildMyHouse?',
    answer:
      'Contractors and artisans can apply through the contractor onboarding flow, complete verification steps, and become eligible for structured project opportunities. We do not promise guaranteed leads.',
  },
] as const;

export type LandingTestimonial = {
  name: string;
  role: string;
  quote: string;
  tag: string;
  tagDetail: string;
};

/** Process-focused proof points. Avoid inventing user/project counts. */
export const LANDING_TESTIMONIAL_STATS = [
  { value: 'Scope', label: 'Cleared before work starts' },
  { value: 'Evidence', label: 'Attached to each stage' },
  { value: 'Abroad', label: 'Built for remote owners' },
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
  phoneDisplay: '+234 813 903 6559',
  phoneTel: '+2348139036559',
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
    href: 'https://www.instagram.com/buildmyhousetech/',
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

export const TRUSTPILOT_REVIEW = {
  inviteEmail: 'buildmyhouse.app+39f06dae81@invite.trustpilot.com',
  evaluateUrl: 'https://www.trustpilot.com/evaluate/buildmyhouse.app',
  profileUrl: 'https://www.trustpilot.com/review/buildmyhouse.app',
} as const;

export const GOOGLE_BUSINESS_REVIEW = {
  reviewUrl: 'https://g.page/r/CQF16quHjs2XEBM/review',
} as const;

export const SERVICE_SEO_PAGES = {
  'plumbing-repair-nigeria': {
    title: 'Plumber in Nigeria | Verified & Tracked Repairs',
    summary:
      'Find verified plumbing repair support in Nigeria with clearer scope, stage tracking, and homeowner approval checkpoints.',
  },
  'electrical-repair-nigeria': {
    title: 'Electrician in Nigeria | Safe, Verified & Tracked',
    summary:
      'Get verified electrical repair support in Nigeria with documented updates and a safer approval flow.',
  },
  'roof-leak-repair-nigeria': {
    title: 'Leaking Roof Repair in Nigeria | Verified Roofers',
    summary:
      'Handle roof leak diagnosis, materials, and repairs in Nigeria with staged updates and evidence.',
  },
  'drainage-repair-nigeria': {
    title: 'Blocked Drain Repair in Nigeria | Verified',
    summary:
      'Coordinate drainage fixes in Nigeria with clearer scope and progress visibility.',
  },
  'window-repair-nigeria': {
    title: 'Window & Aluminium Repair in Nigeria | Verified',
    summary:
      'Find verified window and aluminum repair support in Nigeria.',
  },
  'pumping-machine-repair-nigeria': {
    title: 'Water Pump Repair in Nigeria | Verified Technicians',
    summary:
      'Find verified pumping machine repair support in Nigeria with clearer scope and progress updates.',
  },
  'fan-repair-nigeria': {
    title: 'Ceiling & Standing Fan Repair in Nigeria',
    summary:
      'Get verified fan repair support in Nigeria for ceiling, standing, and wall fans.',
  },
  'rechargeable-fan-repair-nigeria': {
    title: 'Rechargeable Fan Repair in Nigeria | Verified Artisans',
    summary:
      'Fix rechargeable and inverter fans in Nigeria with verified artisans and documented work.',
  },
  'bathroom-repair-nigeria': {
    title: 'Bathroom Repair in Nigeria | Tracked & Verified',
    summary:
      'Track bathroom repairs and upgrades in Nigeria with stage-based coordination.',
  },
  'painting-services-nigeria': {
    title: 'House Painters in Nigeria | Quality-Checked Work',
    summary:
      'Coordinate painting jobs in Nigeria with better scope definition and quality checkpoints.',
  },
  'kitchen-renovation-nigeria': {
    title: 'Kitchen Renovation in Nigeria | Tracked Stages',
    summary:
      'Plan kitchen upgrades and installation work in Nigeria with structured stage visibility.',
  },
  'home-renovation-nigeria': {
    title: 'Home Renovation in Nigeria | Verified Contractors',
    summary:
      'Manage renovation projects in Nigeria with documented scope, updates, and approvals.',
  },
  'general-contractors-nigeria': {
    title: 'Verified General Contractors in Nigeria',
    summary:
      'Find verified general contractor support in Nigeria and execute with better workflow control.',
  },
} as const;

export type ServiceSeoSlug = keyof typeof SERVICE_SEO_PAGES;
