const WEB = 'https://buildmyhouse.app';

const organizationNode = {
  '@type': 'Organization',
  '@id': `${WEB}/#organization`,
  name: 'BuildMyHouse',
  url: WEB,
};

/**
 * /diaspora/build-in-nigeria-from-uk — authority hub content.
 * CTA hrefs use app routes (`/projects/new` and `/how-it-works` are not wired).
 */
export const diasporaUkBuildNigeriaPageContent = {
  seo: {
    title: 'Build in Nigeria from the UK | Safe Remote Construction for Diaspora | BuildMyHouse',
    description:
      'Build your house in Nigeria from the UK with more control, clearer contractor workflows, and stage-by-stage visibility. BuildMyHouse helps diaspora Nigerians manage construction, renovation, and interior projects remotely.',
    canonical: `${WEB}/diaspora/build-in-nigeria-from-uk`,
    robots: 'index,follow',
  },

  hero: {
    eyebrow: 'DIASPORA (UK)',
    title: 'Build in Nigeria from the UK — Without Losing Control of Your Project',
    description:
      'If you live in London, Manchester, Birmingham, Leeds, or anywhere else in the UK, BuildMyHouse helps you manage your building project in Nigeria with clearer visibility, milestone tracking, and contractor accountability.',
  },

  quickAnswer: {
    title: 'How to Build in Nigeria from the UK Safely',
    items: [
      'Verify the land and project details before sending serious money',
      'Define your scope, budget direction, and finishing standard clearly',
      'Avoid giving one person total control of the project',
      'Use milestone-based payments instead of blind transfers',
      'Track progress with proper updates and documentation',
      'Treat the build like a real project, not a family favour',
      'Use a system like BuildMyHouse for visibility and accountability',
    ],
  },

  intro: {
    paragraphs: [
      'For many Nigerians in the UK, building in Nigeria is not only a financial goal. It is emotional.',
      'It may be the house you have promised yourself for years. It may be the family home you want to complete. It may be the project that proves your sacrifices abroad are becoming something real back home.',
      'But building from the UK comes with a special kind of stress. You are far away, your time is limited, the pound-to-naira conversation never really ends, and every update from home can either calm you down or make your heart skip.',
      'That is why the real problem is not simply distance. The real problem is trying to run a Nigerian project from the UK without proper structure.',
    ],
  },

  story: {
    title: 'The Story Many Nigerians in the UK Already Know',
    paragraphs: [
      'A man in Birmingham decides it is finally time to start building in Ogun State.',
      'He has done the hard part already. He has worked, saved in pounds, and resisted distractions. The dream is clear: start the project, monitor it from the UK, and come home to visible progress.',
      "At first, everything feels encouraging. The contractor sounds confident. Family members say the site is moving. Pictures arrive. Voice notes say, 'Oga, we are on track.'",
      'Then the pattern changes.',
      'Blocks suddenly cost more. A new issue appears on site. Someone says more iron rods are needed. Another transfer is requested. The update is still positive, but the explanations are no longer clear.',
      "A few months later, he has spent more than expected, progress is slower than promised, and the people on ground keep saying the same thing: 'These things happen in Nigeria.'",
      'That story is exactly why BuildMyHouse matters. Because diaspora building should not depend on pressure, guesswork, and emotional trust alone.',
    ],
  },

  whyItGoesWrong: {
    title: 'Why Building in Nigeria from the UK So Often Goes Wrong',
    paragraphs: [
      'Most diaspora projects do not fail because the owner is in the UK. They fail because the project is being managed through weak systems.',
      'Typical problems include scattered WhatsApp updates, vague contractor promises, inconsistent family supervision, uncontrolled extra costs, and too much reliance on one person who claims to be handling everything.',
      'Once payments move ahead of verified progress, the project starts drifting. And once the project starts drifting, the owner in the UK is left reacting instead of controlling.',
      'That is where money, time, and peace of mind begin to leak.',
    ],
  },

  ukSpecificReality: {
    title: 'What Makes Building from the UK Different',
    items: [
      'The time gap between the UK and Nigeria can slow communication and decision-making',
      'Many diaspora Nigerians in the UK are balancing work, family life, and project supervision at the same time',
      'The stronger value of pounds creates pressure to keep sending money quickly whenever new requests come in',
      'Because you are abroad, people may assume you can always afford more than the agreed budget',
      'You may only visit Nigeria once or twice a year, which makes structure even more important',
    ],
  },

  trustTrap: {
    title: 'Why Trust Alone Is Not a Project System',
    paragraphs: [
      'Many Nigerians in the UK start with trust. A cousin knows somebody. A family friend has built before. A recommended contractor sounds serious. That is how many projects begin.',
      'The issue is not that everyone is dishonest. The issue is that trust without process is weak.',
      'Even honest people can mismanage scope, underestimate costs, approve poor substitutions, or fail to document what is happening properly.',
      'That is why a serious building project should not run on goodwill alone. It should run on structure.',
    ],
  },

  scopeAndBudget: {
    title: 'Start With Clear Scope and Budget Direction',
    paragraphs: [
      'Before construction starts, define what is actually being built, what finishing level you want, what your budget range is, and how the work should move in stages.',
      'If the scope is vague, the contractor controls the meaning of progress. If the budget is vague, every extra request starts sounding reasonable. If the finishing standard is vague, lower-quality choices can be quietly introduced.',
      'A project becomes easier to control when the expectations are clear before the first serious spend.',
    ],
  },

  payments: {
    title: 'Do Not Build From the UK With Blind Payments',
    paragraphs: [
      'This is one of the biggest mistakes diaspora Nigerians make. Money is sent because the update sounds urgent, not because the stage is properly verified.',
      'The safer approach is milestone-based execution. Foundation should mean foundation. Structural work should mean structural work. Roofing should mean roofing. Finishing should mean finishing.',
      'When money follows verified progress, you keep leverage. When money moves ahead of accountability, you lose it.',
    ],
  },

  familySupervision: {
    title: 'Family Support Helps, But Family Alone Is Not Enough',
    paragraphs: [
      'Your brother may live close to the site. Your uncle may know the area. Your parents may be emotionally invested in the project.',
      'That still does not mean the project is under control.',
    ],
    items: [
      'Family members may not understand technical quality',
      'They may avoid conflict with contractors',
      'They may push emotional decisions over disciplined ones',
      'They may not keep proper records of what was done',
      'They may unintentionally approve cost increases without enough scrutiny',
    ],
    closing:
      'This is not about disrespecting family. It is about protecting your money, your relationships, and your project with a better system.',
  },

  whyBuildMyHouse: {
    cardTitle: 'Why Nigerians in the UK Choose BuildMyHouse',
    cardItems: [
      'Built for diaspora homeowners managing projects remotely',
      'Project communication, stage updates, and documentation in one flow',
      'Supports construction, renovation, and interior design projects in Nigeria',
    ],
    sectionTitle: 'Why BuildMyHouse Is Safer for Nigerians Building from the UK',
    paragraphs: [
      'BuildMyHouse gives you a more structured way to run your Nigerian project while living in the UK.',
      'Instead of depending on scattered chats, informal supervision, and unpredictable contractor updates, you get a clearer project setup, milestone-based tracking, better visibility into what is happening, and a more organized workflow around contractors and progress.',
      'The difference is simple. You move from hoping the project is fine to seeing the project more clearly.',
      'That matters when every transfer is coming from your life in the UK and every delay affects your confidence back home.',
    ],
  },

  howItWorks: {
    title: 'How BuildMyHouse helps you build from the UK',
    steps: [
      'Define your project goals, location, and budget direction',
      'Review contractor and project details with more clarity',
      'Track milestones remotely while the project executes',
    ],
  },

  mistakes: {
    title: 'Common mistakes this page helps you avoid',
    items: [
      'Sending money because of pressure instead of verified progress',
      'Letting one person control land, labour, materials, and reporting',
      'Starting with an unclear finishing standard',
      'Relying only on family updates instead of structured tracking',
      'Confusing activity on site with real, measurable progress',
    ],
  },

  emotionalPayoff: {
    title: 'This Project Means More Than Blocks and Cement',
    paragraphs: [
      'For many Nigerians in the UK, building at home is proof that the journey abroad is producing something lasting.',
      "It is about stability. Identity. Legacy. It is about being able to point to something real and say, 'This is ours.'",
      'That is why the process should feel secure, not chaotic. You have worked too hard in the UK to run your Nigeria project casually.',
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        question: 'Can I manage my building project in Nigeria entirely from the UK?',
        answer:
          'Yes, but it works best when the project has proper structure, clear milestones, contractor accountability, and organized updates.',
      },
      {
        question: 'Is BuildMyHouse only for people building from the UK?',
        answer:
          'No. BuildMyHouse supports homeowners in Nigeria and abroad, including people in the UK, US, Canada, UAE, and other diaspora locations.',
      },
      {
        question: 'What types of projects can I manage through BuildMyHouse?',
        answer:
          'BuildMyHouse supports construction, renovation, and interior design projects, with workflows that help homeowners manage progress more clearly.',
      },
      {
        question: 'Why do many diaspora projects go over budget?',
        answer:
          'Usually because scope is unclear, costs are not controlled properly, payments are made too early, and updates are not tied to measurable progress.',
      },
      {
        question: 'Can family still be involved if I use BuildMyHouse?',
        answer:
          'Yes. Family can still support the project, but BuildMyHouse adds more structure and visibility so the project does not depend on family oversight alone.',
      },
    ],
  },

  cta: {
    title: 'Build in Nigeria from the UK With More Confidence',
    description:
      'If you want to run your Nigerian project from the UK without the usual confusion, uncontrolled spending, and weak visibility, use BuildMyHouse to manage it with more structure and more clarity.',
    primary: {
      label: 'Start Your Project',
      href: '/location?mode=explore',
    },
    secondary: {
      label: 'See How It Works',
      href: '/articles/diaspora-guide-build-in-nigeria-from-abroad',
    },
  },

  internalLinks: {
    title: 'Helpful resources',
    links: [
      {
        label: 'Building in Nigeria from abroad',
        href: '/construction/nigeria',
      },
      {
        label: 'Cost of building a house in Nigeria',
        href: '/articles/cost-to-build-house-in-nigeria-2026',
      },
      {
        label: 'How to build in Nigeria from abroad without getting burnt',
        href: '/articles/diaspora-guide-build-in-nigeria-from-abroad',
      },
    ],
  },
} as const;

export function getDiasporaUkBuildNigeriaJsonLd(
  faqs: Array<{ question: string; answer: string }>,
  pageTitle: string,
  pageDescription: string,
) {
  const canonicalUrl = `${WEB}/diaspora/build-in-nigeria-from-uk`;

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
      headline: 'Build in Nigeria from the UK — Remote Construction Guide (2026)',
      description: pageDescription,
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
