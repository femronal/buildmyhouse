import { InternalLinkItem } from '@/components/seo/InternalLinksBlock';

export type SeoPageContent = {
  title: string;
  description: string;
  canonicalPath: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  bullets: string[];
  processSteps: string[];
  faqs: Array<{ question: string; answer: string }>;
  internalLinks: InternalLinkItem[];
  schema: Record<string, any>[];
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BuildMyHouse',
  url: 'https://buildmyhouse.app',
};

function pageSchemas(name: string, description: string, canonicalPath: string, faq: Array<{ question: string; answer: string }>) {
  return [
    organizationSchema,
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name,
      description,
      url: `https://buildmyhouse.app${canonicalPath}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];
}

const crossLinks: InternalLinkItem[] = [
  { label: 'Construction in Nigeria', href: '/construction/nigeria' },
  { label: 'Renovation Services', href: '/renovation/nigeria' },
  { label: 'Interior Design Services', href: '/interior-design/nigeria' },
  { label: 'Homes for Rent', href: '/homes-for-rent/nigeria' },
  { label: 'Houses for Sale', href: '/houses-for-sale/nigeria' },
  { label: 'Land for Sale', href: '/land-for-sale/nigeria' },
];

export function getSeoPageContent(pageKey: string): SeoPageContent {
  const pageMap: Record<string, Omit<SeoPageContent, 'schema'>> = {
    constructionNigeria: {
      title: 'House Construction in Nigeria | BuildMyHouse',
      description:
        'Plan and execute house construction in Nigeria with BuildMyHouse. Work with verified general contractors and track project milestones end-to-end.',
      canonicalPath: '/construction/nigeria',
      eyebrow: 'Construction in Nigeria',
      heroTitle: 'House Construction in Nigeria',
      heroDescription:
        'Build your dream home in Nigeria with clear timelines, transparent budgets, and contractor verification designed for local and diaspora homeowners.',
      bullets: [
        'Verified general contractors and milestone-based project flow',
        'Real-time stage tracking for materials, team, and documentation',
        'Support for homeowners building from Nigeria, UK, US/Canada, and UAE',
      ],
      processSteps: [
        'Share your project location, budget, and design direction',
        'Get matched with relevant general contractors',
        'Review proposal details and start with tracked stage execution',
      ],
      faqs: [
        {
          question: 'Can I build a home in Nigeria while living abroad?',
          answer: 'Yes. BuildMyHouse is designed to support diaspora homeowners managing projects remotely.',
        },
        {
          question: 'How do I know a contractor is credible?',
          answer: 'BuildMyHouse uses verification and admin review workflows before contractors are marked verified.',
        },
      ],
      internalLinks: [
        ...crossLinks,
        { label: 'Construction in Lagos', href: '/construction/lagos' },
        { label: 'Construction in Abuja', href: '/construction/abuja' },
      ],
    },
    constructionLagos: {
      title: 'House Construction in Lagos | BuildMyHouse',
      description:
        'Looking for house construction support in Lagos? BuildMyHouse helps homeowners manage projects with verified contractors and structured timelines.',
      canonicalPath: '/construction/lagos',
      eyebrow: 'Lagos',
      heroTitle: 'House Construction in Lagos',
      heroDescription:
        'From Ikoyi to Lekki and mainland growth corridors, BuildMyHouse helps homeowners execute projects with visibility and control.',
      bullets: [
        'Lagos-focused construction support for homeowners and diaspora clients',
        'Clear project updates on stage status, budget, and delivery',
        'In-app collaboration with your contractor and admin checks',
      ],
      processSteps: [
        'Define your project location and expected budget',
        'Review contractor fit and project scope details',
        'Start execution with stage-level visibility',
      ],
      faqs: [
        {
          question: 'Does BuildMyHouse work for projects in Lagos Island and mainland?',
          answer: 'Yes. You can submit location-specific project details and receive relevant contractor matches.',
        },
        {
          question: 'Can I request renovation in Lagos instead of a full build?',
          answer: 'Yes. You can submit renovation and interior-focused requests as well.',
        },
      ],
      internalLinks: [
        ...crossLinks,
        { label: 'Construction in Port Harcourt', href: '/construction/port-harcourt' },
      ],
    },
    constructionAbuja: {
      title: 'House Construction in Abuja | BuildMyHouse',
      description:
        'Build in Abuja with verified contractor matching, budget visibility, and project tracking across each stage.',
      canonicalPath: '/construction/abuja',
      eyebrow: 'Abuja',
      heroTitle: 'House Construction in Abuja',
      heroDescription:
        'BuildMyHouse helps homeowners in Abuja run safer and more transparent building projects with trusted workflows.',
      bullets: [
        'Structured project flow from planning to completion',
        'Contractor verification and admin oversight',
        'Useful for local and diaspora homeowners building in Abuja',
      ],
      processSteps: [
        'Submit project details and desired timeline',
        'Review contractor response and project expectations',
        'Track progress and delivery per stage',
      ],
      faqs: [
        {
          question: 'Can I monitor progress remotely?',
          answer: 'Yes. BuildMyHouse gives you stage updates and project documentation in one place.',
        },
        {
          question: 'Can I use my own design inspiration?',
          answer: 'Yes. You can submit project information for matching and planning.',
        },
      ],
      internalLinks: crossLinks,
    },
    constructionPortHarcourt: {
      title: 'House Construction in Port Harcourt | BuildMyHouse',
      description:
        'Execute residential building projects in Port Harcourt with project tracking, verified GC workflows, and payment transparency.',
      canonicalPath: '/construction/port-harcourt',
      eyebrow: 'Port Harcourt',
      heroTitle: 'House Construction in Port Harcourt',
      heroDescription:
        'BuildMyHouse supports homeowners in Port Harcourt with structured project management and contractor collaboration.',
      bullets: [
        'Project milestone visibility and stage-level accountability',
        'Contractor matching designed for Nigerian housing projects',
        'Useful for homeowners managing projects from abroad',
      ],
      processSteps: [
        'Create your project profile and budget expectations',
        'Review contractor fit and plan summary',
        'Monitor project execution and updates',
      ],
      faqs: [
        {
          question: 'Can I use BuildMyHouse for a phased build?',
          answer: 'Yes. Stage-based planning and tracking can support phased execution.',
        },
        {
          question: 'Does BuildMyHouse support interior project needs too?',
          answer: 'Yes. Renovation and interior design services are also supported.',
        },
      ],
      internalLinks: crossLinks,
    },
    renovationNigeria: {
      title: 'Home Renovation in Nigeria | BuildMyHouse',
      description:
        'Get renovation support in Nigeria with vetted professionals, milestone tracking, and better project communication.',
      canonicalPath: '/renovation/nigeria',
      eyebrow: 'Renovation',
      heroTitle: 'Home Renovation in Nigeria',
      heroDescription:
        'Whether you are upgrading one room or revamping an entire home, BuildMyHouse helps you manage renovation projects with confidence.',
      bullets: [
        'Renovation-focused project setup and contractor matching',
        'Track materials, team, and progress in each stage',
        'Suitable for homeowners in Nigeria and diaspora clients',
      ],
      processSteps: [
        'Describe renovation goals and property location',
        'Review contractor match and proposed scope',
        'Track project updates until completion',
      ],
      faqs: [
        {
          question: 'Can I renovate without rebuilding everything?',
          answer: 'Yes. You can scope specific renovation goals from light upgrades to full remodels.',
        },
        {
          question: 'Can I handle renovation remotely?',
          answer: 'Yes. BuildMyHouse supports remote project oversight and communication.',
        },
      ],
      internalLinks: crossLinks,
    },
    interiorNigeria: {
      title: 'Interior Design in Nigeria | BuildMyHouse',
      description:
        'Plan and execute interior design projects in Nigeria with trusted professionals and transparent project progress tracking.',
      canonicalPath: '/interior-design/nigeria',
      eyebrow: 'Interior Design',
      heroTitle: 'Interior Design in Nigeria',
      heroDescription:
        'BuildMyHouse helps you run interior design projects with better structure, communication, and visibility.',
      bullets: [
        'Interior-focused planning and contractor collaboration',
        'Track supplier details, materials, and milestones',
        'Built for homeowners, including those in diaspora',
      ],
      processSteps: [
        'Submit your interior goals and budget',
        'Review relevant professionals and project direction',
        'Track execution updates through the app',
      ],
      faqs: [
        {
          question: 'Can I request full-home interior redesign?',
          answer: 'Yes. BuildMyHouse supports full and partial interior project needs.',
        },
        {
          question: 'Do I get timeline visibility?',
          answer: 'Yes. Project and stage progress visibility is part of the workflow.',
        },
      ],
      internalLinks: crossLinks,
    },
    homesForRentNigeria: {
      title: 'Homes for Rent in Nigeria | BuildMyHouse',
      description:
        'Browse owner-listed homes for rent in Nigeria with transparent agency fee communication and streamlined inspection requests.',
      canonicalPath: '/homes-for-rent/nigeria',
      eyebrow: 'Real Estate',
      heroTitle: 'Homes for Rent in Nigeria',
      heroDescription:
        'Find rental listings and request inspections while avoiding unnecessary middleman confusion.',
      bullets: [
        'Owner-listed rental options with clear rental details',
        'Simple viewing and inspection request flow',
        'Coverage designed for major Nigerian markets',
      ],
      processSteps: [
        'Search listings by location and requirements',
        'Review property details and terms',
        'Request inspection and proceed with confidence',
      ],
      faqs: [
        {
          question: 'Can I find rentals in Lagos and Abuja?',
          answer: 'Yes. BuildMyHouse rental experiences are built for major Nigerian cities.',
        },
        {
          question: 'How is BuildMyHouse involved in rental transactions?',
          answer: 'BuildMyHouse provides a structured and transparent marketplace experience.',
        },
      ],
      internalLinks: crossLinks,
    },
    housesForSaleNigeria: {
      title: 'Houses for Sale in Nigeria | BuildMyHouse',
      description:
        'Discover houses for sale in Nigeria with clear property details and a modern buyer flow.',
      canonicalPath: '/houses-for-sale/nigeria',
      eyebrow: 'Real Estate',
      heroTitle: 'Houses for Sale in Nigeria',
      heroDescription:
        'Explore verified house opportunities and streamline your purchase journey.',
      bullets: [
        'Discover homes by city, budget, and lifestyle fit',
        'View key property details before making inquiries',
        'Built for Nigerian buyers and diaspora purchasers',
      ],
      processSteps: [
        'Browse available properties',
        'Review listing information and media',
        'Move forward through structured inquiry flow',
      ],
      faqs: [
        {
          question: 'Can diaspora buyers use BuildMyHouse for house purchase in Nigeria?',
          answer: 'Yes. The platform supports remote browsing and inquiry workflows.',
        },
        {
          question: 'Can I compare multiple homes?',
          answer: 'Yes. You can explore and review multiple options before deciding.',
        },
      ],
      internalLinks: crossLinks,
    },
    landForSaleNigeria: {
      title: 'Land for Sale in Nigeria | BuildMyHouse',
      description:
        'Find land opportunities in Nigeria and prepare for your next construction or investment move with BuildMyHouse.',
      canonicalPath: '/land-for-sale/nigeria',
      eyebrow: 'Real Estate',
      heroTitle: 'Land for Sale in Nigeria',
      heroDescription:
        'Explore land options in key Nigerian markets and move from acquisition to development planning.',
      bullets: [
        'Land discovery for future homebuilding or investment',
        'Transparent listing information and viewing requests',
        'Connects naturally with BuildMyHouse construction workflows',
      ],
      processSteps: [
        'Browse land listings in your target location',
        'Review listing details and suitability',
        'Proceed to viewing or project planning steps',
      ],
      faqs: [
        {
          question: 'Can I buy land and build through BuildMyHouse?',
          answer: 'Yes. You can move from land discovery to construction planning using the same ecosystem.',
        },
        {
          question: 'Does this support diaspora users?',
          answer: 'Yes. Diaspora users can discover and plan remotely.',
        },
      ],
      internalLinks: crossLinks,
    },
    diasporaUk: {
      title: 'Build in Nigeria from the UK | BuildMyHouse',
      description:
        'UK-based diaspora homeowners can manage Nigerian construction, renovation, and interior projects remotely with BuildMyHouse.',
      canonicalPath: '/diaspora/build-in-nigeria-from-uk',
      eyebrow: 'Diaspora (UK)',
      heroTitle: 'Build in Nigeria from the UK',
      heroDescription:
        'Run Nigerian projects remotely with stronger visibility, contractor workflows, and milestone tracking.',
      bullets: [
        'Designed for diaspora homeowners managing projects remotely',
        'Project communication and stage updates in one place',
        'Supports construction, renovation, and interior design',
      ],
      processSteps: [
        'Define your project goals and property location',
        'Review contractor and project details',
        'Track milestones remotely while the project executes',
      ],
      faqs: [
        {
          question: 'Can I manage my project entirely from the UK?',
          answer: 'Yes. BuildMyHouse is designed to support remote project visibility and collaboration.',
        },
        {
          question: 'What project types are supported?',
          answer: 'Construction, renovation, interior design, and related property workflows.',
        },
      ],
      internalLinks: crossLinks,
    },
    diasporaUsCanada: {
      title: 'Build in Nigeria from USA/Canada | BuildMyHouse',
      description:
        'Manage Nigerian home construction and renovation projects from the USA or Canada with BuildMyHouse.',
      canonicalPath: '/diaspora/build-in-nigeria-from-usa-canada',
      eyebrow: 'Diaspora (USA/Canada)',
      heroTitle: 'Build in Nigeria from USA or Canada',
      heroDescription:
        'Stay in control of your Nigerian project while abroad using milestone visibility and contractor collaboration tools.',
      bullets: [
        'Remote-first project oversight for diaspora homeowners',
        'Construction, renovation, and interior workflows',
        'Improved visibility from planning to active execution',
      ],
      processSteps: [
        'Start with project scope and budget',
        'Review contractor fit and plan details',
        'Track milestones and project updates',
      ],
      faqs: [
        {
          question: 'Can I track progress from abroad in real time?',
          answer: 'Yes. BuildMyHouse provides project-level and stage-level visibility.',
        },
        {
          question: 'Does this work for both new builds and renovations?',
          answer: 'Yes. Both are supported.',
        },
      ],
      internalLinks: crossLinks,
    },
    diasporaUae: {
      title: 'Build in Nigeria from UAE/Middle East | BuildMyHouse',
      description:
        'Build or renovate in Nigeria while living in UAE or the Middle East, with better project visibility using BuildMyHouse.',
      canonicalPath: '/diaspora/build-in-nigeria-from-uae',
      eyebrow: 'Diaspora (UAE/Middle East)',
      heroTitle: 'Build in Nigeria from UAE or the Middle East',
      heroDescription:
        'Use BuildMyHouse to coordinate your Nigerian project with stronger planning, communication, and milestone tracking.',
      bullets: [
        'Built for diaspora homeowners managing projects remotely',
        'Clear workflow from project request to execution',
        'Covers construction, renovation, and interior work',
      ],
      processSteps: [
        'Submit your project intent and location',
        'Select the right contractor workflow',
        'Monitor project delivery across stages',
      ],
      faqs: [
        {
          question: 'Is BuildMyHouse suitable for remote-only homeowners?',
          answer: 'Yes. It is built to support remote monitoring and coordination.',
        },
        {
          question: 'Can I begin with interior work before full construction?',
          answer: 'Yes. You can start with the project type that matches your current goal.',
        },
      ],
      internalLinks: crossLinks,
    },
  };

  const selected = pageMap[pageKey];
  if (!selected) {
    throw new Error(`Unknown SEO page key: ${pageKey}`);
  }

  return {
    ...selected,
    schema: pageSchemas(selected.heroTitle, selected.description, selected.canonicalPath, selected.faqs),
  };
}

