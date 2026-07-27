import { buildSeoJsonLd } from '@/lib/seo-schema';

export const AMALA_JOINT_TRACKING_STORY_PATH =
  '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria';

export const AMALA_JOINT_TRACKING_STORY_LEGACY_PATHS = [
  '/from-kitchen-to-building-site',
  '/story',
] as const;

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export const amalaJointTrackingStorySeo = {
  title: 'Track Building Projects in Nigeria from Abroad | BuildMyHouse',
  description:
    'See how BuildMyHouse helps Nigerians abroad monitor repairs, renovations and construction projects in Nigeria through clear stages, verified professionals and progress evidence.',
  canonicalPath: AMALA_JOINT_TRACKING_STORY_PATH,
  ogImage: `${WEB_URL}/engineer-at-buildmyhouse.png`,
  publishedAt: '2026-07-26',
  updatedAt: '2026-07-26',
  authorName: 'Femi Okunola',
  readingMinutes: 11,
} as const;

export const amalaJointTrackingStoryHero = {
  amalaLabel: 'FROM YOUR AMALA JOINT ORDER TRACKER',
  organicLabel: 'A FOUNDER STORY',
  h1: 'What Tracking Your Food Taught Me About Building in Nigeria',
  introduction:
    'If you can see when your meal starts, moves from one stage to another and becomes ready for handoff, why should a building project disappear from view after payment?',
  authorName: 'Femi Okunola',
  authorDescription: 'Founder of Amala Joint and BuildMyHouse',
  supportingLine: 'A founder story about food, construction and what customers deserve after they pay.',
  primaryCta: 'Read the story',
  secondaryCta: 'See how BuildMyHouse works',
} as const;

export const amalaJointTrackingStoryAmalaNote =
  'You came here from your Amala Joint order tracker. Here is why the two products are connected.';

export type TrackingComparisonColumn = {
  title: string;
  steps: readonly string[];
};

export const trackingPrincipleComparison: {
  amala: TrackingComparisonColumn;
  buildMyHouse: TrackingComparisonColumn;
} = {
  amala: {
    title: 'Amala Joint',
    steps: ['Order received', 'Preparation started', 'Items progressing', 'Ready for handoff'],
  },
  buildMyHouse: {
    title: 'BuildMyHouse',
    steps: [
      'Project request',
      'Inspection and scope',
      'Stage execution',
      'Evidence review',
      'Completion',
    ],
  },
};

export const moweCaseStudy = {
  heading: 'A small repair. A complete process.',
  location: 'Mowe, Ogun State',
  problem: 'Faulty tap and defective waste connection',
  initialEstimate: '₦66,000',
  agreedProfessionalCost: '₦55,000',
  clientTotal: '₦60,500',
  evidence: 'Receipts, progress records and before-and-after videos',
  completion: 'Final professional payment followed homeowner confirmation',
  disclaimer:
    'This project is presented as an example of the process. Prices vary by location, materials, scope and site conditions.',
} as const;

export const howBuildMyHouseWorksSteps = [
  {
    title: 'Tell us what is happening',
    body: 'Share the property location, problem, photos, videos or project plans.',
  },
  {
    title: 'Inspect and define the scope',
    body: 'Where necessary, an inspection or professional assessment is arranged before pricing and execution.',
  },
  {
    title: 'Match the right professional',
    body: 'BuildMyHouse considers the project type, location, experience and verification status.',
  },
  {
    title: 'Agree on stages',
    body: 'The work, expectations, payment terms and evidence requirements are documented.',
  },
  {
    title: 'Follow the work',
    body: 'Progress records, photos, videos, receipts and relevant updates are organised around the project.',
  },
  {
    title: 'Review before progression',
    body: 'The homeowner can understand what has been completed before the project moves to the next agreed stage.',
  },
] as const;

export const amalaJointTrackingStoryFaqs = [
  {
    question: 'Can I manage a building project in Nigeria while living abroad?',
    answer:
      'Yes, but distance makes structure, documentation and communication especially important. BuildMyHouse is designed to help homeowners organise inspections, scopes, professionals, project stages and progress evidence without relying only on informal verbal updates.',
  },
  {
    question: 'Does BuildMyHouse build houses itself?',
    answer:
      'BuildMyHouse coordinates property projects through suitable professionals and contractors. Depending on the project, architects, engineers, quantity surveyors, artisans, contractors or other specialists may be required. BuildMyHouse does not replace regulated professionals.',
  },
  {
    question: 'How does BuildMyHouse verify contractors and professionals?',
    answer:
      'The verification process may include identity information, business documents, portfolio and experience evidence, relevant certifications, operating information and a live video interview. Verification reduces uncertainty but does not guarantee that no professional will ever make a mistake.',
  },
  {
    question: 'Can BuildMyHouse handle small repairs?',
    answer:
      'Yes. BuildMyHouse is intended for ordinary property needs such as plumbing, electrical work, drainage problems, roof leaks, windows, property maintenance and other repairs, as well as renovations and larger building projects.',
  },
  {
    question: 'How are payments handled?',
    answer:
      'Payment arrangements depend on the project and the platform’s current terms. Projects are structured around documented stages, and homeowners are encouraged to review progress evidence before approving the next stage or releasing the next payment through the platform workflow. BuildMyHouse is not a bank; payment processing uses approved providers and platform fees may apply.',
  },
  {
    question: 'Where does BuildMyHouse currently operate?',
    answer:
      'BuildMyHouse’s primary service area is Nigeria, with strong focus on Lagos and surrounding markets, while supporting homeowners who manage property work from Nigeria or from abroad.',
  },
] as const;

export const amalaJointTrackingStoryInternalLinks = [
  { label: 'Build in Nigeria from abroad', href: '/diaspora/build-in-nigeria-from-abroad' },
  { label: 'Contractor verification for diaspora homeowners', href: '/guides/contractor-vetting-nigeria-diaspora' },
  { label: 'Plumbing repair in Nigeria', href: '/services/plumbing-repair-nigeria' },
  { label: 'Drainage repair in Nigeria', href: '/services/drainage-repair-nigeria' },
  { label: 'Electrical repair in Nigeria', href: '/services/electrical-repair-nigeria' },
  { label: 'Home renovation in Nigeria', href: '/renovation/nigeria' },
  { label: 'House construction in Nigeria', href: '/construction/nigeria' },
  { label: 'Remote project monitoring demo', href: '/demo/project-monitoring' },
  { label: 'Start a tracked repair', href: '/start-repair' },
] as const;

export const amalaJointTrackingStoryCtas = {
  primaryHref: '/location?mode=explore',
  secondaryHref: '/demo/project-monitoring',
  servicesHref: '/property-projects-nigeria',
  primaryLabel: 'Tell us about the project',
  secondaryLabel: 'See how BuildMyHouse works',
  servicesLabel: 'Explore BuildMyHouse services',
  ctaHeading: 'Do you have property work waiting in Nigeria?',
  ctaBody:
    'Tell BuildMyHouse what needs to be repaired, renovated or built. Start with the property location and any photos or videos you already have. The team will review the request and explain the appropriate next step.',
} as const;

export const amalaJointTrackingStoryFounder = {
  heading: 'About the founder',
  body: 'Femi Okunola is the founder of Amala Joint and BuildMyHouse. Amala Joint serves Nigerian food in Istanbul, while BuildMyHouse is building a more structured way for homeowners to manage property projects in Nigeria. Both companies reflect the same operating principle: customers deserve visibility into what happens after they pay.',
} as const;

/** Article body sections used by the page renderer. */
export type StoryBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; id?: string; text: string }
  | { type: 'h3'; text: string }
  | { type: 'pull'; text: string }
  | { type: 'list'; items: readonly string[] }
  | { type: 'numbered'; items: readonly string[] }
  | { type: 'comparison' }
  | { type: 'case-study' }
  | { type: 'process' };

export const amalaJointTrackingStoryBlocks: readonly StoryBlock[] = [
  {
    type: 'p',
    text: 'This is not a random advertisement placed on your food order.',
  },
  {
    type: 'p',
    text: 'You arrived here because, a few moments ago, you were watching something happen inside a kitchen you could not see.',
  },
  {
    type: 'p',
    text: 'Perhaps your meal had not started. Perhaps it was being prepared. Perhaps every item had become ready for handoff.',
  },
  {
    type: 'p',
    text: 'You were not standing beside the chef. You did not need to call repeatedly. You did not have to enter the kitchen to ask whether anyone had started working.',
  },
  {
    type: 'p',
    text: 'The tracking page gave you a simple answer: this is where your order is right now.',
  },
  {
    type: 'p',
    text: 'That experience is the reason you are reading this.',
  },
  {
    type: 'p',
    text: 'My name is Femi Okunola. I founded Amala Joint in Istanbul, and I also founded BuildMyHouse in Nigeria.',
  },
  {
    type: 'p',
    text: 'The businesses are very different. One prepares Nigerian food. The other helps people structure and monitor property projects.',
  },
  {
    type: 'pull',
    text: 'After a customer pays, the work should not disappear from view.',
  },
  {
    type: 'h2',
    id: 'uncertainty-after-payment',
    text: 'The uncertainty that begins after payment',
  },
  {
    type: 'p',
    text: 'When someone orders food, the amount involved may be relatively small compared with a construction project. But the emotional problem is familiar.',
  },
  {
    type: 'p',
    text: 'The customer has paid. The work is happening somewhere else. The customer cannot see the people doing it. The customer does not know whether the process has started.',
  },
  {
    type: 'p',
    text: 'Without clear information, even a short delay feels longer than it really is.',
  },
  {
    type: 'p',
    text: 'That is why Amala Joint created an order-tracking experience. It does not cook the food faster. It does something equally important: it removes unnecessary uncertainty. It shows what has started, what is in progress and what is ready.',
  },
  {
    type: 'p',
    text: 'Then I began thinking about a much larger version of the same problem. What happens when the customer is not waiting for a plate of food, but for work on a house in Nigeria?',
  },
  {
    type: 'h2',
    id: 'building-back-home',
    text: 'Building back home often means paying before you can see',
  },
  {
    type: 'p',
    text: 'A Nigerian living in Istanbul, London, Toronto, New York, Johannesburg or Dubai may want to repair a leaking roof, fix a drainage problem, renovate a family property, complete an abandoned building, prepare a house before returning home, build rental units, or start a new house from the ground up.',
  },
  {
    type: 'p',
    text: 'The owner may not be physically present. Money is sent. Someone says materials have been purchased. Another person says the workers are on site. A photograph appears in WhatsApp, but it is unclear what stage the picture represents.',
  },
  {
    type: 'p',
    text: 'The scope changes. The price changes. Another payment is requested. The owner is left trying to manage a physical project through calls, promises and scattered messages.',
  },
  {
    type: 'p',
    text: 'The problem is not always that every contractor is dishonest. The deeper problem is that the process itself is often poorly structured.',
  },
  {
    type: 'list',
    items: [
      'No properly documented starting condition',
      'No clear scope',
      'No agreed definition of completion',
      'No understandable stages',
      'No organised evidence',
      'No central project history',
      'No clear separation between what was planned, what changed and what was actually completed',
    ],
  },
  {
    type: 'p',
    text: 'Distance makes all of this harder. But even homeowners living in Lagos can experience the same uncertainty while working, travelling or managing several responsibilities.',
  },
  {
    type: 'h2',
    id: 'question-that-became-buildmyhouse',
    text: 'The question that became BuildMyHouse',
  },
  {
    type: 'pull',
    text: 'Why should someone be able to track a meal more clearly than a property project worth millions of naira?',
  },
  {
    type: 'p',
    text: 'That question became part of the thinking behind BuildMyHouse.',
  },
  {
    type: 'p',
    text: 'BuildMyHouse is designed to help property owners bring more structure and visibility to repairs, renovations and construction projects in Nigeria. It is not simply a place where someone selects a contractor from a list. The objective is to create a clearer process around the work itself.',
  },
  {
    type: 'p',
    text: 'Depending on the project, that process can include:',
  },
  {
    type: 'numbered',
    items: [
      'Understanding the homeowner’s request',
      'Reviewing photos, videos and location information',
      'Arranging an inspection or diagnosis',
      'Documenting the scope of work',
      'Preparing or reviewing the quotation',
      'Assigning an appropriate verified professional',
      'Dividing work into understandable stages',
      'Collecting photos, videos, receipts and progress evidence',
      'Allowing the homeowner to understand what has happened',
      'Progressing according to the agreed project and payment terms',
    ],
  },
  {
    type: 'p',
    text: 'The construction work still happens in the physical world. BuildMyHouse does not replace the workers, architects, engineers, quantity surveyors or other professionals a project may require. It creates a digital operating layer around the work so the homeowner is not completely dependent on verbal updates.',
  },
  {
    type: 'h2',
    id: 'kitchen-to-building-stages',
    text: 'From kitchen stages to building stages',
  },
  {
    type: 'p',
    text: 'The comparison is not perfect, because construction is much more complicated than food preparation. But the principle is similar.',
  },
  { type: 'comparison' },
  {
    type: 'p',
    text: 'The value is not merely seeing a progress bar. The value is understanding what that stage means and what evidence supports it.',
  },
  {
    type: 'h2',
    id: 'mowe-case-study',
    text: 'A small repair that explains the larger idea',
  },
  {
    type: 'p',
    text: 'One of the earliest BuildMyHouse projects involved a homeowner in Mowe, Ogun State.',
  },
  {
    type: 'p',
    text: 'The reported problems included a faulty backyard tap and a defective waste connection affecting two areas of the property.',
  },
  {
    type: 'p',
    text: 'The initial estimate was ₦66,000. After inspection and discussion, the professional’s price was negotiated to ₦55,000. The total amount paid by the client was ₦60,500, including BuildMyHouse’s coordination fee for that project.',
  },
  {
    type: 'p',
    text: 'The work did not begin as one unexplained lump-sum request. The first stage covered inspection, materials and transportation. Receipts and project evidence were collected. Before-and-after videos were provided. The homeowner reviewed the result and confirmed satisfaction before the final professional payment was completed.',
  },
  { type: 'case-study' },
  {
    type: 'p',
    text: 'This was not a mansion. It was not a glamorous luxury development. It was a normal property problem that needed to be solved properly. That is precisely why the project matters.',
  },
  {
    type: 'p',
    text: 'Trust in construction is not built only through large projects. It is built by creating a process people can understand, even for a leaking pipe, broken window, blocked drainage system or faulty electrical connection.',
  },
  {
    type: 'p',
    text: 'Note: This case study describes one completed project. Its pricing should not be treated as a quotation for another property or service.',
  },
  {
    type: 'h2',
    id: 'what-verified-means',
    text: 'What “verified” means—and what it does not mean',
  },
  {
    type: 'p',
    text: 'BuildMyHouse requires professionals to pass a verification process before they are treated as verified professionals on the platform.',
  },
  {
    type: 'p',
    text: 'Depending on the professional category, verification may include identity information, business documents, experience and portfolio evidence, professional certifications where applicable, address or operating information, a live video interview, and administrative review.',
  },
  {
    type: 'p',
    text: 'Verification is not magic. It cannot promise that no professional will ever make a mistake. It does not remove the need for proper scopes, inspections, documentation and professional supervision.',
  },
  {
    type: 'p',
    text: 'Its purpose is to reduce uncertainty and help BuildMyHouse understand who is being considered for a homeowner’s project. The stronger protection comes from combining professional verification with a structured project process.',
  },
  {
    type: 'h2',
    id: 'not-promising-perfection',
    text: 'BuildMyHouse is not promising perfection',
  },
  {
    type: 'p',
    text: 'Construction is complicated. Unexpected site conditions can appear. Material prices can change. A wall can reveal a hidden problem. An inspection can show that the original diagnosis was incomplete. A homeowner can request additional work.',
  },
  {
    type: 'p',
    text: 'BuildMyHouse should not pretend these realities do not exist. The purpose is to make them visible.',
  },
  {
    type: 'p',
    text: 'When something changes, the homeowner should be able to understand what changed, why it changed, what it may cost, who recommended it, what evidence exists, and whether it should become part of the agreed scope.',
  },
  {
    type: 'pull',
    text: 'Transparency does not mean nothing will go wrong. It means problems should not remain hidden until the money is gone.',
  },
  {
    type: 'h2',
    id: 'who-buildmyhouse-is-for',
    text: 'Who BuildMyHouse is for',
  },
  {
    type: 'p',
    text: 'BuildMyHouse may be relevant to you if:',
  },
  {
    type: 'list',
    items: [
      'You live outside Nigeria and need property work completed back home',
      'You own a rental or family property',
      'You are preparing to return to Nigeria',
      'You inherited a property that needs attention',
      'You are renovating or upgrading a house',
      'You need a small repair but do not know whom to trust',
      'You are beginning a full building project',
      'You are busy and cannot remain physically present on site',
      'You want a more structured record of what is happening',
    ],
  },
  {
    type: 'p',
    text: 'You do not need to be building a mansion. You may simply need someone to inspect a problem properly before money starts moving.',
  },
  {
    type: 'h2',
    id: 'why-amala-joint-introduced-you',
    text: 'Why Amala Joint introduced you to BuildMyHouse',
  },
  {
    type: 'p',
    text: 'Amala Joint is not turning your food-tracking page into an advertising board. The connection exists because you were already using the idea.',
  },
  {
    type: 'p',
    text: 'You paid for work happening somewhere you could not see. Instead of leaving you to guess, the product showed you the current stage.',
  },
  {
    type: 'p',
    text: 'BuildMyHouse is an attempt to apply that same customer principle to a much more difficult industry. The amounts are larger. The timelines are longer. The work is more complex. The consequences of poor communication are much more serious.',
  },
  {
    type: 'pull',
    text: 'After a customer pays, they deserve more than silence.',
  },
  {
    type: 'h2',
    id: 'how-buildmyhouse-works',
    text: 'How BuildMyHouse brings structure to property work',
  },
  { type: 'process' },
  {
    type: 'h2',
    id: 'next-time-property-work',
    text: 'The next time you think about property work in Nigeria',
  },
  {
    type: 'p',
    text: 'You may not need BuildMyHouse today. Your meal may be the only thing you are waiting for.',
  },
  {
    type: 'p',
    text: 'But perhaps in six months, you will need to repair a parent’s home. Perhaps next year, you will begin a renovation. Perhaps you are already sending money towards a project and wondering whether there is a clearer way to manage it.',
  },
  {
    type: 'p',
    text: 'When that moment comes, remember the experience that brought you here: you did not need to enter the kitchen to know what was happening. You should not need to live permanently on a construction site to understand what is happening there either.',
  },
];

export function buildAmalaJointTrackingStoryJsonLd() {
  const path = AMALA_JOINT_TRACKING_STORY_PATH;
  const graph = buildSeoJsonLd({
    path,
    title: amalaJointTrackingStoryHero.h1,
    description: amalaJointTrackingStorySeo.description,
    schemaType: 'Article',
    faqs: [...amalaJointTrackingStoryFaqs],
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: amalaJointTrackingStoryHero.h1, path },
    ],
    image: amalaJointTrackingStorySeo.ogImage,
  });

  return graph.map((node) => {
    if (node['@type'] !== 'Article') return node;
    return {
      ...node,
      '@type': 'BlogPosting',
      headline: amalaJointTrackingStoryHero.h1,
      datePublished: amalaJointTrackingStorySeo.publishedAt,
      dateModified: amalaJointTrackingStorySeo.updatedAt,
      author: {
        '@type': 'Person',
        name: amalaJointTrackingStorySeo.authorName,
      },
      articleSection: 'Founder story',
    };
  });
}

export type AmalaUtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

export function parseAmalaUtmParams(search: string): AmalaUtmParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    content: params.get('utm_content') || undefined,
  };
}

export function isAmalaJointVisitor(utm: AmalaUtmParams) {
  return String(utm.source || '').toLowerCase() === 'amala_joint';
}

/** Append safe UTM params onto an internal path for attribution continuity. */
export function withPreservedCampaignParams(href: string, utm: AmalaUtmParams) {
  if (!isAmalaJointVisitor(utm)) return href;
  const [pathAndQuery, hash = ''] = href.split('#');
  const [path, existingQuery = ''] = pathAndQuery.split('?');
  const params = new URLSearchParams(existingQuery);
  params.set('utm_source', utm.source || 'amala_joint');
  if (utm.medium) params.set('utm_medium', utm.medium);
  if (utm.campaign) params.set('utm_campaign', utm.campaign);
  if (utm.content) params.set('utm_content', utm.content);
  const query = params.toString();
  return `${path}?${query}${hash ? `#${hash}` : ''}`;
}
