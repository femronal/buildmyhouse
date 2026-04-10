import type { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import type { RelatedLinkSection } from '@/components/seo/RelatedLinkSections';
import type { TrustBlock } from '@/components/seo/TrustBlocks';
import type { ProofOfProcessDemoContent } from '@/components/seo/proof-of-process-types';
import { buildSeoJsonLd } from '@/lib/seo-schema';

type PageKind = 'pillar' | 'service' | 'country' | 'tool' | 'guide';
type PageSchemaType = 'Article' | 'Service' | 'HowTo' | 'SoftwareApplication';

type SeoPageArchitecture = {
  path: string;
  kind: PageKind;
  schemaType: PageSchemaType;
  title: string;
  description: string;
  robots: 'index,follow' | 'noindex,nofollow';
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  bullets: string[];
  processSteps: string[];
  faqs: { question: string; answer: string }[];
  trustBlocks: TrustBlock[];
  proofOfProcessDemo: ProofOfProcessDemoContent;
  relatedLinkSections: RelatedLinkSection[];
  internalLinks: InternalLinkItem[];
  ctaLabel?: string;
  ctaHref?: string;
};

const relatedGuides: InternalLinkItem[] = [
  { label: 'Lagos Building Permits & Stage Inspections', href: '/guides/lagos-building-permits-and-stage-inspections' },
  { label: 'How to Choose a General Contractor in Nigeria', href: '/how-to-choose-a-general-contractor-in-nigeria' },
  { label: 'Land Verification in Nigeria Guide', href: '/land-verification-in-nigeria-guide' },
];

const relatedTools: InternalLinkItem[] = [
  { label: 'Milestone Payment Schedule Tool', href: '/tools/milestone-payment-schedule' },
  { label: 'Renovation Budget Planner Tool', href: '/tools/renovation-budget-planner' },
];

const relatedServices: InternalLinkItem[] = [
  { label: 'Construction Services in Nigeria', href: '/construction/nigeria' },
  { label: 'Renovation Services in Nigeria', href: '/renovation/nigeria' },
];

const relatedCountries: InternalLinkItem[] = [
  { label: 'Build in Nigeria from the UK', href: '/diaspora/uk/build-in-nigeria' },
  { label: "Renovate Parents' House from the UK", href: '/diaspora/uk/renovate-parents-house' },
];

const defaultTrustBlocks: TrustBlock[] = [
  {
    key: 'proof_of_process',
    title: 'Proof of process',
    description: 'BuildMyHouse focuses on structured project setup, milestone tracking, and documented progress so diaspora users can monitor projects remotely with less uncertainty.',
  },
  {
    key: 'common_mistakes',
    title: 'Common mistakes to avoid',
    bullets: [
      'Sending large lump-sum transfers before work is verified',
      'Using verbal scope with no clear finish standard',
      'Treating family updates as the only quality control system',
    ],
  },
  {
    key: 'helpful_resources',
    title: 'Helpful resources',
    bullets: [
      'Permits and compliance guidance for Lagos projects',
      'Contractor selection and land verification checklists',
      'Budget and milestone planning tools for safer execution',
    ],
  },
  {
    key: 'cta',
    title: 'Ready to plan your project?',
    description: 'Start with a structured workflow so your build or renovation is executed with clearer accountability from day one.',
  },
];

const relatedLinkSections: RelatedLinkSection[] = [
  { title: 'Related guides', links: relatedGuides },
  { title: 'Related tools', links: relatedTools },
  { title: 'Related service pages', links: relatedServices },
  { title: 'Related country pages', links: relatedCountries },
];

const defaultProofDemo: ProofOfProcessDemoContent = {
  stageEvidenceGallery: [
    {
      id: 'foundation',
      stageLabel: 'Foundation stage',
      date: '12 Mar 2026',
      explanation: 'Footing excavation and reinforcement recorded before concrete pour.',
      imageUrl:
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=60',
    },
    {
      id: 'blockwork',
      stageLabel: 'Blockwork stage',
      date: '26 Mar 2026',
      explanation: 'Ground floor wall alignment captured with day-level material usage notes.',
      imageUrl:
        'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1000&q=60',
    },
    {
      id: 'roof',
      stageLabel: 'Roofing prep',
      date: '08 Apr 2026',
      explanation: 'Roof framing checklist and site photos uploaded before payment release.',
      imageUrl:
        'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1000&q=60',
    },
  ],
  contractorVerification: {
    contractorLabel: 'Demo contractor profile: MetroBuild Projects Ltd',
    checks: [
      { label: 'Business identity verification', status: 'verified', note: 'RC details and ID match completed.' },
      { label: 'Project reference review', status: 'verified', note: 'Recent residential projects reviewed.' },
      { label: 'Scope and timeline readiness', status: 'in_review', note: 'Clarification requested on finishing specs.' },
      { label: 'Final onboarding approval', status: 'pending', note: 'Awaiting homeowner sign-off.' },
    ],
    note: 'This is a public demo of verification transparency, not a live project record.',
  },
  milestonePaymentBreakdown: [
    {
      stageName: 'Foundation',
      completionDefinition: 'Excavation, steel placement, and concrete base complete.',
      requiredEvidence: ['Site photos from multiple angles', 'Material usage log', 'Stage summary note'],
      paymentTrigger: 'Release after evidence review confirms stage completion.',
    },
    {
      stageName: 'Blockwork',
      completionDefinition: 'Perimeter and structural walls completed to approved line.',
      requiredEvidence: ['Progress images', 'Updated stage checklist', 'Deviation notes (if any)'],
      paymentTrigger: 'Partial release once stage checklist is approved.',
    },
  ],
  documentationSamples: [
    {
      title: 'Weekly progress report',
      caption: 'Sample update packet',
      description: 'Includes stage summary, completed tasks, blockers, and planned next actions.',
    },
    {
      title: 'Material delivery record',
      caption: 'Sample document log',
      description: 'Shows date-stamped material receipts and what was used during each stage.',
    },
  ],
  chatTimeline: [
    {
      at: 'Mon 09:12',
      actor: 'contractor',
      message: 'Foundation reinforcement is complete. Uploading full photo set for review.',
      type: 'update',
    },
    {
      at: 'Mon 09:27',
      actor: 'homeowner',
      message: 'Received. Please confirm concrete pour schedule and expected completion window.',
      type: 'question',
    },
    {
      at: 'Mon 10:05',
      actor: 'buildmyhouse',
      message: 'Evidence bundle attached and stage checklist updated for milestone review.',
      type: 'evidence',
    },
    {
      at: 'Mon 11:16',
      actor: 'buildmyhouse',
      message: 'Milestone evidence verified. Stage can proceed to payment trigger.',
      type: 'approval',
    },
  ],
};

const pages: Record<string, SeoPageArchitecture> = {
  diasporaBuildFromAbroad: {
    path: '/diaspora/build-in-nigeria-from-abroad',
    kind: 'pillar',
    schemaType: 'Article',
    title: 'Build in Nigeria from Abroad | Diaspora Authority Guide | BuildMyHouse',
    description: 'Primary diaspora pillar: how to build in Nigeria from abroad with structure, verified contractor workflows, milestone payments, and better visibility.',
    robots: 'index,follow',
    eyebrow: 'Global Diaspora Pillar',
    heroTitle: 'Build in Nigeria from Abroad',
    heroDescription: 'This is the main authority page for diaspora users planning residential building in Nigeria from outside the country.',
    bullets: [
      'Define scope, budget band, and timeline before site spending accelerates',
      'Use milestone-based funding tied to verified progress',
      'Track project stages with structured updates instead of guesswork',
    ],
    processSteps: ['Set scope and location', 'Align contractor workflow', 'Track milestones remotely'],
    faqs: [
      { question: 'Can diaspora homeowners build safely from abroad?', answer: 'Yes, when project execution follows clear scope, milestone payments, and documented tracking.' },
      { question: 'Is BuildMyHouse a contractor company?', answer: 'BuildMyHouse is a platform that helps structure homeowner project workflows and contractor collaboration.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: relatedServices,
    ctaLabel: 'Start your building project',
    ctaHref: '/location?mode=explore',
  },
  diasporaRenovateFromAbroad: {
    path: '/diaspora/renovate-in-nigeria-from-abroad',
    kind: 'pillar',
    schemaType: 'Article',
    title: 'Renovate in Nigeria from Abroad | Diaspora Renovation Authority | BuildMyHouse',
    description: 'Primary diaspora renovation pillar: renovate properties in Nigeria from abroad with structured planning, budget control, and stage-by-stage progress visibility.',
    robots: 'index,follow',
    eyebrow: 'Global Diaspora Pillar',
    heroTitle: 'Renovate in Nigeria from Abroad',
    heroDescription: 'Main authority page for diaspora renovation strategy, risk control, and remote execution best practices.',
    bullets: [
      'Treat renovation like a structured project, not ad-hoc repairs',
      'Document scope and approved material standards early',
      'Keep payment and execution aligned to verified stage completion',
    ],
    processSteps: ['Set renovation scope', 'Validate budget assumptions', 'Track work per stage'],
    faqs: [
      { question: 'Can I renovate my parents’ house from abroad?', answer: 'Yes. Remote renovation works better when scope, progress tracking, and spending controls are clearly structured.' },
      { question: 'Does renovation in Lagos require planning checks?', answer: 'Depending on work type, yes. Verify compliance requirements before major site activity.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: relatedServices,
    ctaLabel: 'Start your renovation project',
    ctaHref: '/location?mode=explore',
  },
  lagosPermitsGuide: {
    path: '/guides/lagos-building-permits-and-stage-inspections',
    kind: 'guide',
    schemaType: 'HowTo',
    title: 'Lagos Building Permits and Stage Inspections | Practical Guide | BuildMyHouse',
    description: 'Practical guide for Lagos permit expectations and stage inspection planning for diaspora homeowners and local project teams.',
    robots: 'index,follow',
    eyebrow: 'Guide',
    heroTitle: 'Lagos Building Permits and Stage Inspections',
    heroDescription: 'Understand where permit/compliance planning intersects with safer project delivery in Lagos.',
    bullets: [
      'Confirm permit obligations before major structural work',
      'Map expected inspection stages to your project timeline',
      'Keep compliance and construction documentation organized',
    ],
    processSteps: ['Review project type', 'Validate compliance path', 'Track construction and inspections'],
    faqs: [
      { question: 'Is this a legal service?', answer: 'No. This is educational guidance. Use qualified professionals for legal/statutory advice.' },
      { question: 'Why include stage inspections in planning?', answer: 'Inspection timing affects scheduling, cost control, and compliance risk.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: relatedServices,
    ctaLabel: 'Plan your project setup',
    ctaHref: '/location?mode=explore',
  },
  constructionNigeriaService: {
    path: '/construction/nigeria',
    kind: 'service',
    schemaType: 'Service',
    title: 'Construction Services in Nigeria for Diaspora Homeowners | BuildMyHouse',
    description: 'Supporting service page for construction execution in Nigeria. Complements the global diaspora pillars with conversion-focused project setup pathways.',
    robots: 'index,follow',
    eyebrow: 'Supporting Service Page',
    heroTitle: 'Construction Services in Nigeria',
    heroDescription: 'Service-focused page designed to convert qualified homeowners after they consume the global diaspora guidance.',
    bullets: [
      'Structured construction project setup',
      'Milestone-oriented workflow for remote owners',
      'Designed to support diaspora project execution clarity',
    ],
    processSteps: ['Create project profile', 'Align contractor workflow', 'Track execution'],
    faqs: [
      { question: 'Is this the main diaspora guide page?', answer: 'No. This page supports conversion and service execution after users read diaspora pillar content.' },
      { question: 'Can local homeowners use this service page too?', answer: 'Yes. The workflow supports homeowners both in Nigeria and abroad.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: [
      { label: 'Global pillar: Build in Nigeria from abroad', href: '/diaspora/build-in-nigeria-from-abroad' },
      { label: 'Global pillar: Renovate in Nigeria from abroad', href: '/diaspora/renovate-in-nigeria-from-abroad' },
    ],
  },
  renovationNigeriaService: {
    path: '/renovation/nigeria',
    kind: 'service',
    schemaType: 'Service',
    title: "Renovation Services in Nigeria for Diaspora Families | BuildMyHouse",
    description: 'Supporting service page for renovation execution in Nigeria. Complements diaspora authority pages without competing for head-term pillar intent.',
    robots: 'index,follow',
    eyebrow: 'Supporting Service Page',
    heroTitle: 'Renovation Services in Nigeria',
    heroDescription: 'Conversion-focused service page for homeowners planning family-home upgrades or full renovation projects.',
    bullets: [
      'Scope-first renovation planning',
      'Budget and stage control for remote supervision',
      'Workflow built for practical execution clarity',
    ],
    processSteps: ['Define renovation scope', 'Validate project budget', 'Execute with structured stage visibility'],
    faqs: [
      { question: 'Should this page rank as the global diaspora pillar?', answer: 'No. It is a supporting service page tied to conversion intent.' },
      { question: 'Can this support parents’ house renovation use cases?', answer: 'Yes. It supports both homeowner and diaspora-family renovation flows.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: [
      { label: 'Global pillar: Renovate in Nigeria from abroad', href: '/diaspora/renovate-in-nigeria-from-abroad' },
      { label: 'Country page: UK renovate parents house', href: '/diaspora/uk/renovate-parents-house' },
    ],
  },
  ukBuildCountry: {
    path: '/diaspora/uk/build-in-nigeria',
    kind: 'country',
    schemaType: 'Article',
    title: 'Build in Nigeria from the UK | Country-Specific Diaspora Page | BuildMyHouse',
    description: 'Country-targeted UK page under the global diaspora build pillar. Focused on remote execution realities for Nigerians in the UK.',
    robots: 'index,follow',
    eyebrow: 'Country Page (UK)',
    heroTitle: 'Build in Nigeria from the UK',
    heroDescription: 'Country page supporting UK-specific audience intent while reinforcing global pillar authority.',
    bullets: [
      'Address UK-to-Nigeria remote execution constraints',
      'Use milestone-based tracking to reduce uncertainty',
      'Keep process visibility clear across distance and time zones',
    ],
    processSteps: ['Set UK-side planning assumptions', 'Align Nigeria-side execution', 'Track milestones'],
    faqs: [
      { question: 'Is this a separate pillar from the global page?', answer: 'No. This is a supporting country page under the global build pillar.' },
      { question: 'Can I start directly from this page?', answer: 'Yes, and you should still reference the global pillar for full strategy context.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: [
      { label: 'Global pillar: Build in Nigeria from abroad', href: '/diaspora/build-in-nigeria-from-abroad' },
    ],
  },
  ukRenovateCountry: {
    path: '/diaspora/uk/renovate-parents-house',
    kind: 'country',
    schemaType: 'Article',
    title: "Renovate Parents' House in Nigeria from the UK | Country Page | BuildMyHouse",
    description: 'UK-targeted diaspora renovation page for families upgrading parents’ homes in Nigeria with structured planning and stage tracking.',
    robots: 'index,follow',
    eyebrow: 'Country Page (UK)',
    heroTitle: "Renovate Parents' House from the UK",
    heroDescription: 'Country page supporting UK audience renovation intent under the global diaspora renovation pillar.',
    bullets: [
      'Reduce renovation chaos with clear scope and progress checks',
      'Keep spending tied to visible outcomes',
      'Support family projects with stronger structure and accountability',
    ],
    processSteps: ['Clarify scope', 'Set budget controls', 'Track renovation stages'],
    faqs: [
      { question: 'Is this page replacing the global renovation pillar?', answer: 'No. It supports country-specific intent under the main pillar page.' },
      { question: 'Can this be used for phased renovation?', answer: 'Yes. Stage-based planning supports phased work execution.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: [
      { label: 'Global pillar: Renovate in Nigeria from abroad', href: '/diaspora/renovate-in-nigeria-from-abroad' },
    ],
  },
  milestoneTool: {
    path: '/tools/milestone-payment-schedule',
    kind: 'tool',
    schemaType: 'SoftwareApplication',
    title: 'Milestone Payment Schedule Tool | BuildMyHouse',
    description: 'Planning tool page for milestone-based construction and renovation payment sequencing in Nigeria projects.',
    robots: 'index,follow',
    eyebrow: 'Tool',
    heroTitle: 'Milestone Payment Schedule Tool',
    heroDescription: 'Supporting tool page that helps users structure safer payment sequencing around project stages.',
    bullets: [
      'Map payments to stage outcomes',
      'Reduce unverified lump-sum spending',
      'Keep budget release and execution aligned',
    ],
    processSteps: ['Set project stages', 'Define release triggers', 'Track payment sequence'],
    faqs: [
      { question: 'Does this page process actual payments?', answer: 'No. It is a planning tool page for educational and workflow guidance.' },
      { question: 'Who should use this?', answer: 'Diaspora and local homeowners planning structured project payments.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: relatedServices,
  },
  renovationTool: {
    path: '/tools/renovation-budget-planner',
    kind: 'tool',
    schemaType: 'SoftwareApplication',
    title: 'Renovation Budget Planner Tool | BuildMyHouse',
    description: 'Planning tool page for renovation budget structure, category visibility, and stage-aware spending control.',
    robots: 'index,follow',
    eyebrow: 'Tool',
    heroTitle: 'Renovation Budget Planner Tool',
    heroDescription: 'Supporting tool page for renovation budgeting clarity before execution starts.',
    bullets: [
      'Break budget into practical renovation categories',
      'Reduce scope creep and hidden substitutions',
      'Align spend expectations with project stages',
    ],
    processSteps: ['Set renovation scope', 'Allocate category budgets', 'Track stage spend'],
    faqs: [
      { question: 'Is this a financial advisory service?', answer: 'No. It is a practical planning page for project budgeting structure.' },
      { question: 'Can this support diaspora family-home upgrades?', answer: 'Yes. It is designed for both diaspora and local renovation scenarios.' },
    ],
    trustBlocks: defaultTrustBlocks,
    proofOfProcessDemo: defaultProofDemo,
    relatedLinkSections,
    internalLinks: relatedServices,
  },
};

export function getArchitecturePage(key: keyof typeof pages) {
  return pages[key];
}

export function getArchitectureJsonLd(page: SeoPageArchitecture) {
  return buildSeoJsonLd({
    path: page.path,
    title: page.title,
    description: page.description,
    schemaType: page.schemaType,
    faqs: page.faqs,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: page.eyebrow, path: page.path.split('/').slice(0, 2).join('/') || '/' },
      { name: page.heroTitle, path: page.path },
    ],
  });
}

