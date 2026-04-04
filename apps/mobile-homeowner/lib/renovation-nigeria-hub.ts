const WEB = 'https://buildmyhouse.app';

const organizationNode = {
  '@type': 'Organization',
  '@id': `${WEB}/#organization`,
  name: 'BuildMyHouse',
  url: WEB,
};

/**
 * Full page content for /renovation/nigeria (authority hub).
 * CTA `href`s use routes that exist in the app; `/projects/new` and `/how-it-works` are not wired yet.
 */
export const renovationNigeriaPageContent = {
  seo: {
    title: "Renovate Your Parents' House in Nigeria From Abroad | BuildMyHouse",
    description:
      "Safely renovate your parents' house in Nigeria from the UK, US, Canada, or abroad. Track renovation stages, control costs, and work with verified contractors through BuildMyHouse.",
    canonical: `${WEB}/renovation/nigeria`,
    robots: 'index,follow',
  },

  hero: {
    eyebrow: 'RENOVATION IN NIGERIA',
    title: "Renovate Your Parents' House in Nigeria From Abroad — Without Losing Control",
    description:
      "If your parents' house in Nigeria needs a facelift, repairs, or a full upgrade, BuildMyHouse helps you manage it safely from the UK, US, Canada, or anywhere abroad with structured tracking, contractor accountability, and clearer visibility into every stage.",
    primaryCta: {
      label: 'Start Your Renovation Project',
      href: '/location?mode=explore',
    },
    secondaryCta: {
      label: 'See How Renovation Tracking Works',
      href: '/articles/renovation-checklist-for-homeowners-nigeria',
    },
  },

  quickAnswer: {
    title: 'How to Renovate a House in Nigeria From Abroad Safely',
    items: [
      'Verify the property and current condition properly',
      'Define the renovation scope clearly before work starts',
      'Avoid handing everything to one person',
      'Use milestone-based payments instead of blind transfers',
      'Track progress with structured updates and documentation',
      'Handle approvals properly where required, especially in Lagos',
      'Use a system like BuildMyHouse to keep control from start to finish',
    ],
  },

  intro: {
    paragraphs: [
      "For many Nigerians abroad, renovating your parents' home is not just another property project. It is personal.",
      'It is about comfort. Dignity. Safety. It is about making sure the people who raised you can live better.',
      "But the hard part is this: once you are not physically on ground, even a simple renovation can become stressful. A repaint turns into a full rebuild. A kitchen upgrade becomes endless requests for extra funds. A contractor says the work is almost done, but when you finally visit Nigeria, the quality is nowhere near what you paid for.",
      'That is why the biggest renovation problem is not distance. It is lack of structure.',
    ],
  },

  story: {
    title: 'The Story Too Many Nigerians Abroad Already Know',
    paragraphs: [
      'A woman in Manchester decides to renovate her parents’ house in Ibadan.',
      'The plan sounds simple: fix the roof, repaint the house, modernize the kitchen, and redo the bathrooms.',
      "She sends money to someone recommended by family. At first, everything looks good. Pictures come in. Voice notes sound confident. Everyone says, 'Don’t worry, we’re on it.'",
      'Then things begin to shift.',
      'The roof needs more work than expected. The plumber discovers another issue. The tiles she paid for are suddenly out of stock. Her father says the workers only came twice this week. Her mother says the bathroom still floods. Another transfer is requested.',
      'By the end, far more money has gone out than planned, the quality is uneven, and nobody can clearly explain what exactly was completed.',
      'That story is not rare. It is common. And that is exactly the kind of renovation chaos BuildMyHouse is built to reduce.',
    ],
  },

  whyItGoesWrong: {
    title: 'Why Renovating Your Parents’ Home From Abroad So Often Goes Wrong',
    paragraphs: [
      'Most remote renovation projects in Nigeria do not fail because the homeowner is abroad.',
      'They fail because the renovation is being run through scattered WhatsApp chats, emotional family trust, vague contractor promises, weak cost control, and no proper stage-by-stage tracking.',
      'When you are renovating a family home, emotions make things worse. Because it is your parents’ house, you are more likely to rush, approve extra spending, or avoid hard questions just to keep things moving.',
      'That is how budget leaks happen.',
    ],
  },

  reality2026: {
    title: 'The Nigerian Renovation Reality in 2026',
    items: [
      'Renovation in Nigeria is no longer a simple paint-and-patch job',
      'Material prices can shift quickly and affect even small upgrades',
      'Some renovation projects in Lagos may involve permit or compliance considerations',
      'Family-managed projects often suffer from weak supervision and poor documentation',
      'The wrong renovation process can become expensive very quickly when you are abroad',
    ],
  },

  scope: {
    title: 'Start With Scope, Not Sentiment',
    paragraphs: [
      'One of the biggest mistakes people make when renovating their parents’ house is emotional planning.',
      "They say things like: 'Let’s just make the place nice,' 'Let’s quickly touch the kitchen,' or 'We’ll know what else to do once work starts.'",
      'That approach creates budget confusion.',
      'A safer renovation starts with a clear scope: what exactly is being changed, what is being repaired versus replaced, what quality level is expected, what materials are approved, and what happens in each stage.',
      'If the scope is not clear, the contractor controls the interpretation. And once that happens, your budget stops being your budget.',
    ],
  },

  permits: {
    title: 'Permits and Compliance Matter More Than People Think',
    paragraphs: [
      'If the property is in Lagos, renovation can involve official approval requirements depending on the nature of the work.',
      'Many people abroad assume renovation is informal. But some renovation works can trigger compliance issues, delays, fines, or preventable complications when nobody checks the legal side early.',
      'The safer approach is to verify compliance expectations before work begins, especially for structural or significant upgrade work.',
    ],
  },

  familySupervision: {
    title: 'Why Family Supervision Alone Is Not Enough',
    paragraphs: [
      'This is sensitive, but true.',
      'Your parents may live in the house. Your sibling may live nearby. Your cousin may know somebody.',
      'That still does not mean the renovation is under control.',
    ],
    items: [
      'Family members may avoid confrontation with the contractor',
      'They may lack technical understanding',
      'They may accept poor-quality substitutions',
      'They may push sentimental decisions instead of smart ones',
      'They may struggle to document progress properly',
    ],
    closing:
      'Even where everyone is honest, the process can still fail. Structure is what protects relationships.',
  },

  whyBuildMyHouse: {
    cardTitle: 'Why Diaspora Families Choose BuildMyHouse',
    cardItems: [
      'Renovation-focused project setup with clearer contractor accountability',
      'Track materials, work stages, and documentation in one flow',
      'Designed for Nigerians renovating family homes from the UK, US, Canada, UAE, and beyond',
    ],
    sectionTitle: 'Why BuildMyHouse Is Safer for Renovating Your Parents’ House From Abroad',
    paragraphs: [
      'BuildMyHouse gives you a more structured way to renovate family property in Nigeria without reducing everything to trust, guesswork, and voice notes.',
      'With BuildMyHouse, you can position the renovation as a real project with verified contractor workflows, clearer project setup, stage-based progress tracking, better visibility into materials, team activity, and documentation, communication in one place, and a more organized path to resolving issues if things go wrong.',
      "Instead of asking, 'Hope they are doing the work,' you move closer to, 'This is the current stage, this is what has been done, and this is what comes next.'",
      'That difference is huge when the house belongs to your parents.',
    ],
  },

  howItWorks: {
    title: 'How BuildMyHouse helps you renovate from abroad',
    steps: [
      'Describe the home, the renovation goals, and the location',
      'Review the proposed renovation scope and contractor match',
      'Track progress stage by stage until completion',
    ],
  },

  trustBlock: {
    title: 'Common renovation mistakes this page helps you avoid',
    items: [
      'Repainting and patchwork that hide deeper structural problems',
      'Paying for premium materials and getting lower-grade replacements',
      'Letting the scope expand without budget control',
      'Relying on family updates instead of structured progress tracking',
      'Missing permit or compliance issues in Lagos',
    ],
  },

  emotionalPayoff: {
    title: 'This Is Bigger Than Renovation',
    paragraphs: [
      'When you renovate your parents’ home well, you are not only upgrading a building.',
      'You are improving their comfort, safety, daily dignity, and your own peace of mind.',
      'That is why the process should feel controlled, not chaotic.',
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        question: 'Can I renovate my parents’ house in Nigeria while living abroad?',
        answer:
          'Yes. But it works best when the renovation has a clear scope, proper tracking, payment control, and contractor accountability.',
      },
      {
        question: 'Is it safe to let family manage the renovation alone?',
        answer:
          'Family can support the project, but relying on family alone often creates weak supervision and poor documentation.',
      },
      {
        question: 'Do I need approval to renovate in Lagos?',
        answer:
          'Depending on the work, yes. It is safer to verify compliance expectations early, especially for structural or significant renovation work.',
      },
      {
        question: 'Why do renovation budgets in Nigeria go out of control?',
        answer:
          'Usually because the project starts without a clear scope, spending is reactive, materials change, and payments are made before progress is properly verified.',
      },
      {
        question: 'How does BuildMyHouse help with renovation?',
        answer:
          'BuildMyHouse helps structure the renovation process with contractor workflows, stage tracking, communication, and better visibility for homeowners in Nigeria and abroad.',
      },
    ],
  },

  cta: {
    title: 'Renovate Your Parents’ House With More Confidence',
    description:
      'If you are abroad and want to upgrade your parents’ house in Nigeria without the usual stress, confusion, and uncontrolled spending, use BuildMyHouse to manage the renovation more safely and more clearly.',
    primary: {
      label: 'Start Your Renovation Project',
      href: '/location?mode=explore',
    },
    secondary: {
      label: 'See How Renovation Tracking Works',
      href: '/articles/renovation-checklist-for-homeowners-nigeria',
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

export function getRenovationNigeriaJsonLd(
  faqs: Array<{ question: string; answer: string }>,
  pageTitle: string,
  pageDescription: string,
) {
  const canonicalUrl = `${WEB}/renovation/nigeria`;

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
      headline: "Renovate Your Parents' House in Nigeria From Abroad (2026 Guide)",
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
