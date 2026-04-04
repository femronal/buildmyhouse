import type { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import type { SeoContentSection } from '@/lib/seo-pages';

const WEB = 'https://buildmyhouse.app';

const organizationNode = {
  '@type': 'Organization',
  '@id': `${WEB}/#organization`,
  name: 'BuildMyHouse',
  url: WEB,
};

/**
 * JSON-LD @graph nodes for /construction/nigeria (Article + WebPage + FAQPage + Organization).
 */
export function getConstructionNigeriaJsonLd(
  faqs: Array<{ question: string; answer: string }>,
  pageTitle: string,
  pageDescription: string,
) {
  const canonicalUrl = `${WEB}/construction/nigeria`;

  return [
    organizationNode,
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: pageTitle,
      description: pageDescription,
      isPartOf: { '@id': `${WEB}/#organization` },
      about: { '@id': `${canonicalUrl}#article` },
    },
    {
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      headline: 'Building in Nigeria from Abroad (2026 Guide)',
      description:
        'Learn how to build your house in Nigeria from the UK, US, or Canada without getting scammed or overpaying.',
      author: { '@type': 'Organization', name: 'BuildMyHouse' },
      publisher: {
        '@type': 'Organization',
        name: 'BuildMyHouse',
        logo: {
          '@type': 'ImageObject',
          url: `${WEB}/assets/images/icon.png`,
        },
      },
      mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
      url: canonicalUrl,
    },
    {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: faqs.map((item) => ({
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

/** Hub → spoke cluster (authority links) */
export const constructionNigeriaHubClusterLinks: InternalLinkItem[] = [
  {
    label: 'Cost of Building a House in Nigeria (2026)',
    href: '/articles/cost-to-build-house-in-nigeria-2026',
  },
  {
    label: 'Common Mistakes Diaspora Nigerians Make When Building',
    href: '/mistakes-nigerians-in-diaspora-make-when-building',
  },
  {
    label: 'How to Choose a General Contractor in Nigeria',
    href: '/how-to-choose-a-general-contractor-in-nigeria',
  },
  {
    label: 'Land Verification in Nigeria — Guide',
    href: '/land-verification-in-nigeria-guide',
  },
  {
    label: 'Building Permit in Lagos, Nigeria — Guide',
    href: '/building-permit-in-lagos-nigeria-guide',
  },
];

export type ConstructionNigeriaHubContent = {
  title: string;
  description: string;
  canonicalPath: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  /** Quick answer (featured snippet) */
  quickAnswer: SeoContentSection;
  /** Problem / context */
  problemGuide: SeoContentSection;
  /** Numbered steps */
  stepByStep: { heading: string; steps: string[] };
  whyFail: SeoContentSection;
  costSection: SeoContentSection;
  lagosSection: SeoContentSection;
  ukRemoteSection: SeoContentSection;
  whySectionTitle: string;
  whyBullets: string[];
  whatMakesDifferent: SeoContentSection;
  processTitle: string;
  processSteps: string[];
  trustSection: SeoContentSection;
  conversionSection: {
    heading: string;
    intro: string;
    lead: string;
    bullets: string[];
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  faqs: Array<{ question: string; answer: string }>;
  internalLinks: InternalLinkItem[];
};

export function getConstructionNigeriaHubContent(): ConstructionNigeriaHubContent {
  return {
    title: 'Building in Nigeria from Abroad | Verified Contractors & Tracking | BuildMyHouse',
    description:
      'Authoritative guide: building in Nigeria from abroad with structure, verified contractors, permits in Lagos, costs, and milestone-based project control — without getting burnt.',
    canonicalPath: '/construction/nigeria',
    eyebrow: 'Construction in Nigeria',
    heroTitle: 'Build Your House in Nigeria from Abroad — Without Getting Burnt',
    heroDescription:
      'Building in Nigeria from abroad works when you combine trustworthy guidance, Nigeria-specific knowledge, and a structured system. Build confidently from the UK, US, Canada, or anywhere with verified contractors, milestone-based payments, and full visibility into your construction.',
    quickAnswer: {
      heading: 'How to Build in Nigeria from Abroad Safely',
      variant: 'snippet',
      bullets: [
        'Verify your land and title properly',
        'Avoid giving one person total control',
        'Define your building plan clearly',
        'Use milestone-based payments',
        'Track progress with structured updates',
        'Get proper permits (especially in Lagos)',
        'Use a system like BuildMyHouse',
      ],
    },
    problemGuide: {
      heading: 'Building in Nigeria from Abroad (2026 Guide)',
      paragraphs: [
        "If you're living abroad and planning to build in Nigeria, you're not alone.",
        'Thousands of Nigerians in the UK, US, Canada, and Europe are trying to build homes back home — but many run into the same problems:',
      ],
      bullets: [
        'Money disappears without clear results',
        'Projects take years longer than expected',
        'Contractors keep requesting “extra funds”',
        'Family supervision fails due to lack of structure',
      ],
      paragraphsAfterBullets: [
        'The truth is simple:',
        'Building in Nigeria from abroad is not the problem.',
        'Lack of structure is the problem.',
      ],
    },
    stepByStep: {
      heading: 'Step-by-step: plan your build from abroad',
      steps: [
        'Verify land, title, and encumbrances before you fund major work',
        'Define scope, budget, and timeline in writing — not WhatsApp voice notes',
        'Avoid lump-sum payments to a single informal “fixer”',
        'Use milestone-based payments tied to documented progress',
        'Track materials, stages, and approvals with structured updates',
        'Secure planning and construction permits early (especially in Lagos)',
      ],
    },
    whyFail: {
      heading: 'Why Most Diaspora Building Projects Fail',
      paragraphs: ['Most projects fail because they rely on:'],
      bullets: [
        'One person handling everything',
        'Informal agreements',
        'Lump-sum payments',
        'No stage tracking',
        'No accountability',
      ],
      paragraphsAfterBullets: [
        'This creates confusion, delays, and uncontrolled spending.',
      ],
    },
    costSection: {
      heading: 'Cost of Building in Nigeria (Quick Context)',
      paragraphs: ['Building costs vary, but generally:'],
      bullets: [
        '2-bedroom bungalow: ₦18M – ₦28M',
        '3-bedroom bungalow: ₦25M – ₦40M',
        'Duplex: ₦55M+',
      ],
      paragraphsAfterBullets: ['Costs depend on location, finishing, and management.'],
    },
    lagosSection: {
      heading: 'Permits and Legal Requirements in Nigeria (Especially Lagos)',
      paragraphs: [
        "If you're building in Lagos, you typically need planning permit approval, approval to commence construction, stage inspections, and completion certification.",
        'Skipping this can lead to fines, project shutdown, or demolition risk.',
      ],
    },
    ukRemoteSection: {
      heading: 'Building in Nigeria from the UK, US, or Canada: What You Must Know',
      paragraphs: ['Building remotely comes with unique challenges:'],
      bullets: [
        'Time zone differences',
        'Limited physical supervision',
        'Higher risk of miscommunication',
        'Increased financial risk',
      ],
      paragraphsAfterBullets: [
        "That's why successful diaspora projects are built on structure, visibility, and accountability.",
      ],
    },
    whySectionTitle: 'Why Diaspora Nigerians Choose BuildMyHouse',
    whyBullets: [
      'Verified general contractors with accountability',
      'Milestone-based construction (no blind payments)',
      'Real-time stage tracking (materials, progress, documentation)',
      'Designed for Nigerians building from UK, US, Canada, and abroad',
      'Dispute resolution and structured project control',
    ],
    whatMakesDifferent: {
      heading: 'What Makes BuildMyHouse Different',
      paragraphs: ['Instead of relying on:'],
      bullets: ['WhatsApp updates', 'Verbal agreements', 'Family supervision'],
      paragraphsAfterBullets: ['BuildMyHouse gives you:'],
      secondaryBullets: [
        'Structured project setup',
        'Verified contractor matching',
        'Stage-by-stage tracking',
        'Payment tied to actual progress',
        'Clear communication and documentation',
      ],
      closingParagraph: "You don't guess what's happening — you see it.",
    },
    processTitle: 'How BuildMyHouse helps',
    processSteps: [
      'Share your project location, budget, and design',
      'Get matched with verified contractors',
      'Track your project stage-by-stage with full transparency',
    ],
    trustSection: {
      heading: 'Trust, authority, and real project control',
      paragraphs: [
        'BuildMyHouse is built for E‑E‑A‑T: experience from real Nigerian construction workflows, expertise in contractor verification, authoritativeness as a platform (not a random blog), and trust through documentation and stage visibility.',
        'You reduce scam risk, loss of control, and “extra billing” chaos by replacing informal systems with structured delivery.',
      ],
      bullets: [
        'Clear accountability instead of one opaque contact',
        'Visibility into stages — not vague updates',
        'Documentation-friendly flow for diaspora homeowners',
      ],
    },
    conversionSection: {
      heading: 'Start Your Building Project in Nigeria Today',
      intro: 'Instead of guessing or relying on informal systems:',
      lead: 'Use BuildMyHouse to:',
      bullets: [
        'Plan your project',
        'Get matched with verified contractors',
        'Track every stage',
        'Control your spending',
        'Build from anywhere in the world',
      ],
      primaryCtaLabel: 'Start your project',
      primaryCtaHref: '/location?mode=explore',
      secondaryCtaLabel: 'Explore verified contractors',
      secondaryCtaHref: '/explore',
    },
    faqs: [
      {
        question: 'Can I build a house in Nigeria while living abroad?',
        answer:
          'Yes, but only if you use proper structure, verified contractors, and stage-based project tracking.',
      },
      {
        question: 'How do I avoid getting scammed when building in Nigeria?',
        answer:
          'Avoid lump-sum payments, verify land properly, and use structured platforms like BuildMyHouse that track progress and payments.',
      },
      {
        question: 'Is Lagos more expensive to build in?',
        answer:
          'Yes. Labour, materials, and logistics are more expensive in Lagos than most other states.',
      },
      {
        question: 'Can my family supervise my building project?',
        answer:
          'They can help, but should not be your only system due to lack of technical control.',
      },
    ],
    internalLinks: [
      { label: 'Construction in Nigeria', href: '/construction/nigeria' },
      { label: 'Renovation Services', href: '/renovation/nigeria' },
      { label: 'Interior Design Services', href: '/interior-design/nigeria' },
      { label: 'Homes for Rent', href: '/homes-for-rent/nigeria' },
      { label: 'Houses for Sale', href: '/houses-for-sale/nigeria' },
      { label: 'Land for Sale', href: '/land-for-sale/nigeria' },
      { label: 'Construction in Lagos', href: '/construction/lagos' },
      { label: 'Construction in Abuja', href: '/construction/abuja' },
    ],
  };
}
