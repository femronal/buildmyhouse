const HOMEOWNER_WEB = (process.env.EXPO_PUBLIC_HOMEOWNER_WEB_URL || 'https://buildmyhouse.app').replace(
  /\/+$/,
  '',
);
const GC_WEB = (process.env.EXPO_PUBLIC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');

export const GC_PILLAR_SLUG = 'buildmyhouse-for-general-contractors-nigeria';
export const GC_PILLAR_PATH = `/articles/${GC_PILLAR_SLUG}`;
export const GC_PILLAR_COVER_PATH = '/gc-pillar-contractor-nigeria.jpg';
export const GC_PILLAR_COVER_ALT =
  'A Nigerian construction worker on a blockwork site wearing a yellow safety vest and holding a blue hard hat';

export function getGcPillarCoverUri() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${GC_PILLAR_COVER_PATH}`;
  }
  return `${GC_WEB}${GC_PILLAR_COVER_PATH}`;
}

export type GcPillarBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; id: string; text: string }
  | { type: 'h3'; text: string }
  | { type: 'pull'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: readonly string[] }
  | { type: 'stack'; items: readonly string[] }
  | { type: 'tool'; title: string; when: string; body: string; href: string; label: string }
  | { type: 'step'; n: number; title: string; body: string };

export type GcClusterArticle = {
  slug: string;
  title: string;
  description: string;
  status: 'coming-soon';
};

export const gcPillarSeo = {
  title: 'BuildMyHouse for General Contractors in Nigeria | Win Diaspora Projects',
  description:
    'How Nigerian general contractors can win serious diaspora construction projects with clearer scope, stage mobilisation, independent evidence and homeowner approval — without financing the job.',
  canonicalPath: GC_PILLAR_PATH,
  ogImage: `${GC_WEB}${GC_PILLAR_COVER_PATH}`,
  publishedAt: '2026-09-14',
  updatedAt: '2026-09-14',
  readingMinutes: 18,
  authorName: 'BuildMyHouse Editorial',
} as const;

export const gcPillarHero = {
  eyebrow: 'Start here · For general contractors',
  h1: 'BuildMyHouse for General Contractors in Nigeria: How to Win Serious Diaspora Construction Projects',
  introduction:
    'The hardest part of diaspora construction is sometimes not building the house. It is getting a serious client to trust you enough to start.',
} as const;

export const GC_ARTICLES_INDEX_SEO = {
  title: 'Articles for General Contractors in Nigeria | BuildMyHouse',
  description:
    'Practical resources for Nigerian general contractors: how to win diaspora clients, structure mobilisation, document stages, and operate inside a clearer project-and-payment workflow.',
  canonicalPath: '/articles',
} as const;

export const gcPillarTakeaways = [
  'BuildMyHouse is a project-control layer between the homeowner, the scope, the stages, the evidence and the money — not a contractor listing site.',
  'You review the project before you accept it. Agreement comes first, not assumption.',
  'Approved stages can include mobilisation. Contractors should not be expected to finance the homeowner’s project.',
  'Registration, verification and onboarding are currently free. BuildMyHouse does not deduct a percentage commission from your agreed project amount.',
  'You can use the same tools to close your own diaspora prospects — not only to wait for platform jobs.',
] as const;

export function getGcPillarToc() {
  return gcPillarBlocks
    .filter((block): block is Extract<GcPillarBlock, { type: 'h2' }> => block.type === 'h2')
    .map((block) => ({ id: block.id, title: block.text }));
}

export const gcPillarCluster: readonly GcClusterArticle[] = [
  {
    slug: 'how-to-win-nigerian-diaspora-construction-clients',
    title: 'How to Win Nigerian Diaspora Construction Clients',
    description: 'How to turn a frightened overseas enquiry into a scoped conversation instead of another WhatsApp estimate that disappears.',
    status: 'coming-soon',
  },
  {
    slug: 'how-to-structure-a-construction-mobilisation-payment',
    title: 'How to Structure a Construction Mobilisation Payment Without Scaring the Client',
    description: 'How to explain stage mobilisation as funding for agreed work, not a request for blind trust.',
    status: 'coming-soon',
  },
  {
    slug: 'what-a-diaspora-homeowner-expects-from-a-general-contractor',
    title: 'What a Diaspora Homeowner Expects From a General Contractor',
    description: 'The evidence, communication and payment clarity remote homeowners usually need before they release money.',
    status: 'coming-soon',
  },
  {
    slug: 'how-to-document-a-construction-stage-for-faster-payment',
    title: 'How to Document a Construction Stage So the Client Approves Payment Faster',
    description: 'What to photograph, report and attach so a completed stage can be reviewed without another family argument.',
    status: 'coming-soon',
  },
  {
    slug: 'how-to-price-variations-without-fighting-the-homeowner',
    title: 'How to Price Variations Without Starting a Fight With the Homeowner',
    description: 'How to record extra work, extra time and extra cost before they become an argument about the original contract sum.',
    status: 'coming-soon',
  },
] as const;

export const gcPillarWorkflow = [
  { title: 'Create your contractor account', href: '/email-login', label: 'Start at gc.buildmyhouse.app' },
  { title: 'Complete verification', href: '/contractor/verification', label: 'Open verification' },
  { title: 'Review project requests', href: '/contractor/gc-requests', label: 'See incoming requests' },
  { title: 'Run stages and upload evidence', href: '/contractor/gc-dashboard', label: 'Open contractor workspace' },
  { title: 'Track earnings after approval', href: '/contractor/gc-earnings', label: 'Open earnings' },
] as const;

export const gcPillarFaqs = [
  {
    question: 'Does BuildMyHouse charge general contractors to register?',
    answer: 'No. Contractor registration, verification and onboarding are currently free.',
  },
  {
    question: 'Is there a contractor subscription?',
    answer: 'There is currently no mandatory subscription simply to join BuildMyHouse.',
  },
  {
    question: 'Does BuildMyHouse take commission from my contract?',
    answer:
      'Under the current contractor model, BuildMyHouse does not deduct a percentage platform commission or transaction fee from the contractor’s agreed project amount.',
  },
  {
    question: 'Do I have to finance the homeowner’s construction project?',
    answer:
      'No. Approved project stages can include mobilisation for materials, labour, logistics and other agreed commencement requirements.',
  },
  {
    question: 'How much mobilisation does a contractor receive?',
    answer:
      'There is no single amount for every construction stage. Under the current model, roughly 30–40% may be released as stage mobilisation depending on that stage’s requirements, with the remaining amount tied to completion, required verification and homeowner approval.',
  },
  {
    question: 'Can I reject a BuildMyHouse project?',
    answer: 'Yes. Nothing should become your contractor obligation merely because an opportunity was shown to you.',
  },
  {
    question: 'Can I negotiate the proposed scope or budget?',
    answer:
      'Yes. Contractors can review the proposed scope, budget, methodology and milestones and propose changes before agreeing to the project.',
  },
  {
    question: 'Does BuildMyHouse guarantee projects?',
    answer:
      'No. Project availability depends on homeowner demand, location, contractor suitability and current pipeline.',
  },
  {
    question: 'Are Abuja contractors accepted?',
    answer: 'Yes. BuildMyHouse onboards contractors across Nigeria, including Abuja/FCT.',
  },
  {
    question: 'How quickly is the stage balance released?',
    answer:
      'After the stage has satisfied the agreed verification requirements and the homeowner approves it, the outstanding payment is released subject to ordinary banking/payment processing.',
  },
  {
    question: 'Who determines whether my work is complete?',
    answer:
      'This depends on the stage. Contractor evidence may be reviewed, and technical stages may require independent professional inspection or testing before the homeowner approves progression.',
  },
  {
    question: 'Does BuildMyHouse replace the general contractor?',
    answer:
      'No. You execute the construction. BuildMyHouse helps manage the structure around the homeowner, project stages, evidence, communication and payment progression.',
  },
] as const;

export const gcPillarBlocks: readonly GcPillarBlock[] = [
  { type: 'p', text: 'A Nigerian living in London contacts your construction company.' },
  { type: 'p', text: 'They want to build a duplex in Abuja.' },
  { type: 'p', text: 'The drawings exist. They have the money. You send your company profile. You show previous projects. You explain your experience.' },
  { type: 'p', text: 'Then the questions begin.' },
  {
    type: 'list',
    items: [
      'How do I know those are really your projects?',
      'What happens if I send mobilisation and nothing happens?',
      'Who will confirm the foundation is correct?',
      'Why should I send 40% before you start?',
      'Can my brother supervise you?',
      'Can I pay after every block has been laid?',
    ],
  },
  { type: 'p', text: 'Two weeks later, nobody has signed anything.' },
  {
    type: 'p',
    text: 'For many good Nigerian contractors, this is one of the hidden costs of working with Nigerians abroad. The contractor may be capable of doing the work. The homeowner may genuinely have the money. But trust has not been converted into a system both sides can accept.',
  },
  { type: 'pull', text: 'That is one of the problems BuildMyHouse is designed to solve.' },

  { type: 'h2', id: 'serious-contractor-questions', text: 'One Nigerian contractor understood the idea immediately' },
  {
    type: 'p',
    text: 'Recently, the director of an Abuja construction company contacted BuildMyHouse after discovering the platform. He was interested in joining because he saw something useful in the model: access to Nigerians abroad who were trying to execute projects in Nigeria, with a structured system between the homeowner and the construction company.',
  },
  { type: 'p', text: 'Before registering, he asked the questions any serious contractor should ask:' },
  {
    type: 'list',
    items: [
      'Is contractor verification free?',
      'Does BuildMyHouse take commission from my contract?',
      'Are projects available outside Lagos?',
      'When will I receive mobilisation?',
      'Who releases my balance?',
      'Can I see the project scope before accepting?',
      'Am I expected to use my own money to finance materials?',
      'Can I negotiate a proposed budget?',
      'How are completed stages verified?',
    ],
  },
  {
    type: 'p',
    text: 'Those are not troublesome questions. They are the questions of a contractor who wants to know the rules before committing labour, materials, equipment and reputation to a project.',
  },
  { type: 'pull', text: 'Know the commercial structure before accepting the project — not after work has started.' },

  { type: 'h2', id: 'what-is-buildmyhouse', text: 'What exactly is BuildMyHouse?' },
  { type: 'p', text: 'BuildMyHouse is not simply another website listing contractors. It is not a construction company trying to take over your work. And it is not trying to turn qualified general contractors into employees.' },
  { type: 'p', text: 'BuildMyHouse acts as the project-management and control layer between:' },
  {
    type: 'stack',
    items: ['the homeowner', 'the project scope', 'the contractor', 'the project stages', 'the evidence', 'the money'],
  },
  { type: 'p', text: 'For homeowners abroad, the problem is usually not finding somebody in Nigeria who claims they can build. There are thousands. The problem is how to confidently release serious money to somebody thousands of kilometres away.' },
  { type: 'quote', text: 'How do I confidently release serious money to somebody thousands of kilometres away?' },
  { type: 'p', text: 'For a good contractor, that fear creates friction. BuildMyHouse is designed to absorb much of that friction.' },

  { type: 'h2', id: 'filter-real-projects', text: '1. It helps filter people who are actually preparing to build' },
  { type: 'p', text: 'Every Nigerian contractor knows the difference between an enquiry and a project. Someone can spend three weeks asking “How much for five-bedroom duplex?” without land documents, drawings, a realistic budget, location information, a timeline, quantities or financing readiness.' },
  { type: 'p', text: 'You prepare estimates. You make calls. You explain materials. You send portfolios. Then the prospect disappears.' },
  {
    type: 'p',
    text: 'BuildMyHouse is trying to push homeowners through more preparation before execution. Homeowner content, project intake and planning tools are designed to make people answer what they want to build, where they are building, what the budget looks like, what the scope includes, what documents exist, what stage structure makes sense, and how payments should move.',
  },
  { type: 'p', text: 'That gives the contractor a better chance of discussing an actual project instead of answering another vague WhatsApp enquiry.' },

  { type: 'h2', id: 'see-project-before-accepting', text: '2. You see the project before you accept it' },
  { type: 'p', text: 'A BuildMyHouse project should not work like “We have one job for you. Start Monday.”' },
  { type: 'p', text: 'Before accepting a project, the contractor can review the available project scope, proposed budget, project requirements, payment stages, location and relevant project information.' },
  { type: 'h3', text: 'You do not have to agree with the proposed scope simply because BuildMyHouse prepared it.' },
  { type: 'p', text: 'You are the construction professional. If your technical assessment shows that quantities are wrong, the proposed method is unsuitable, the programme is unrealistic, a material specification needs changing, an important activity is missing, or the budget cannot achieve the proposed standard, you should say so.' },
  { type: 'pull', text: 'A serious project should begin with agreement, not assumption.' },

  { type: 'h2', id: 'no-contractor-financing', text: '3. BuildMyHouse does not expect you to finance the homeowner’s project' },
  { type: 'quote', text: 'Start first. Once I see progress, I will pay.' },
  { type: 'p', text: 'That sounds safe for the homeowner. But it transfers the homeowner’s financial risk directly to the contractor. Now you are expected to finance cement, reinforcement, labour, transportation, plant, scaffolding, subcontractors, accommodation and logistics with your own money.' },
  { type: 'h3', text: 'Contractors should not be expected to finance a homeowner’s project.' },
  {
    type: 'p',
    text: 'For an approved stage, mobilisation can be released before execution to cover the approved commencement requirements. The exact amount depends on the stage, but the present contractor model typically considers approximately 30–40% stage mobilisation, depending on the requirements of that particular stage. The remaining portion follows successful execution and approval.',
  },
  { type: 'p', text: 'The homeowner does not have to release 100% of a stage before seeing the work. The contractor does not have to become the project’s bank.' },

  { type: 'h2', id: 'no-automatic-commission', text: '4. Your money is not automatically reduced by a platform commission' },
  { type: 'p', text: 'At the time of writing: registration is free. Contractor verification is free. Onboarding is free. There is no mandatory subscription required simply to join BuildMyHouse.' },
  {
    type: 'p',
    text: 'BuildMyHouse does not currently deduct a percentage platform commission or transaction fee from the contractor’s agreed project amount. If your agreed contractor amount for an approved scope is ₦X, BuildMyHouse is not positioning itself as “Give us 10% of whatever the contractor earns.”',
  },
  {
    type: 'p',
    text: 'BuildMyHouse’s own commercial structure sits around its project-management and control model rather than automatically shaving a percentage off your agreed fee. Project-specific contingency and commercial provisions should always be disclosed as part of the relevant project structure before acceptance. Do not assume every project will use an identical contingency percentage or structure.',
  },

  { type: 'h2', id: 'explain-mobilisation', text: '5. BuildMyHouse helps explain mobilisation to a suspicious client' },
  { type: 'p', text: 'Many Nigerians abroad have heard horror stories. Someone sent ₦15,000,000 and nothing happened. Someone paid a relative and the house stopped at lintel. Someone paid a contractor and the contractor disappeared.' },
  { type: 'p', text: 'So when a legitimate contractor asks for mobilisation, the homeowner sometimes hears “Give me money and trust me.” BuildMyHouse changes that conversation.' },
  {
    type: 'list',
    items: [
      'This is the stage.',
      'This is what the stage contains.',
      'This is the approved stage value.',
      'This is what the mobilisation is funding.',
      'These are the materials required.',
      'This is what completion should look like.',
      'This is what evidence will be reviewed.',
      'This is what releases the stage balance.',
    ],
  },
  { type: 'p', text: 'The contractor is no longer asking the homeowner for blind trust. The contractor is asking the homeowner to fund an agreed stage under an agreed process.' },

  { type: 'h2', id: 'verification-process', text: '6. Convert “How do I know you actually did it?” into a verification process' },
  { type: 'p', text: 'Suppose your company finishes a foundation stage and you send photographs. To you, the work is obvious. To a homeowner sitting in Manchester, the photograph may mean very little. They may not know whether reinforcement followed the drawing, whether dimensions are correct, whether concrete achieved the required specification, whether drainage has been handled, or whether the photographs show every important part of the stage.' },
  {
    type: 'p',
    text: 'Where technical verification is required, BuildMyHouse can arrange for an independent inspector, engineer or appropriate testing professional to review the completed work against the relevant drawings, approved scope, specifications, standards and stage requirements. The homeowner can then review the evidence and make a more informed decision.',
  },
  { type: 'h3', text: 'That protects the homeowner. It also protects you.' },
  { type: 'p', text: 'If you have genuinely executed according to the agreed requirements, independent documentation is stronger than “Trust me, we finished it.” It creates a record.' },

  { type: 'h2', id: 'payment-trigger', text: '7. Homeowner approval creates a clear payment trigger' },
  { type: 'p', text: 'The purpose of documentation is not to make contractors wait endlessly for payment. The opposite. A good project needs a clear definition of what earns the next payment.' },
  {
    type: 'stack',
    items: [
      'Mobilisation',
      'Execution',
      'Evidence',
      'Technical verification where required',
      'Homeowner review and approval',
      'Balance release',
    ],
  },
  {
    type: 'p',
    text: 'For the current model, once the approved stage passes the required verification and the homeowner approves it, the outstanding stage balance is released, subject to ordinary payment and banking processing. That is healthier than “Let me call my uncle” or “I will pay you when I travel to Nigeria in December.”',
  },

  { type: 'h2', id: 'reduce-scope-arguments', text: '8. BuildMyHouse can reduce scope arguments' },
  { type: 'p', text: 'One of the fastest ways to destroy contractor profit is uncontrolled scope. “Since you are already there, just do this other part small.” Then the wall is extended, the tiles change, the sockets move. By the end of the project you have completed significantly more work than was priced, but everybody still remembers the original contract amount.' },
  {
    type: 'p',
    text: 'A structured project creates somewhere to record original scope, stage requirements, changes, additional amount, additional duration, the reason for a variation, supporting evidence and approval. BuildMyHouse already has project-stage and change-request workflows designed around this discipline.',
  },
  { type: 'p', text: 'A contractor should not be punished for legitimate changes. But the changes should be visible before they become arguments.' },

  { type: 'h2', id: 'help-you-sell', text: 'The bigger opportunity: BuildMyHouse can help you sell' },
  { type: 'p', text: 'Many contractors will misunderstand the platform if they only think “Will BuildMyHouse send me jobs?” That is only one potential benefit. A smarter contractor can also use BuildMyHouse tools and educational resources to close their own diaspora prospects.' },
  { type: 'p', text: 'Imagine someone contacts your company from Canada. They found you through Instagram. Instead of spending three hours trying to convince them that you are trustworthy, you can introduce structured tools into the conversation.' },

  {
    type: 'tool',
    title: 'Milestone Payment Schedule Builder',
    when: 'Use it when the client says: “I don’t want to pay contractors upfront.”',
    body: 'Do not argue against the fear. The tool helps structure stages, amounts, contingency, evidence expectations and payment sequencing. The conversation changes from “Do you trust me?” to “How should we structure the payments?”',
    href: `${HOMEOWNER_WEB}/tools/milestone-payment-schedule`,
    label: 'Open the milestone payment tool',
  },
  {
    type: 'tool',
    title: 'Renovation Budget Planner',
    when: 'Use it when the prospect says: “I have ₦10 million. Can you renovate everything?”',
    body: 'Before you quote blindly, ask the homeowner to think about property type, size, areas, location, finish level, contingency and budget direction. This reduces an expensive scope attached to an unrealistic budget.',
    href: `${HOMEOWNER_WEB}/tools/renovation-budget-planner`,
    label: 'Open the renovation budget planner',
  },
  {
    type: 'tool',
    title: 'Remote Renovation Scope Worksheet',
    when: 'Use it when somebody says: “I just want to modernise my parents’ house.”',
    body: 'That is not yet a scope. The worksheet helps separate essential repairs from optional upgrades and think room by room about kitchen, bathrooms, bedrooms, roof, plumbing, electrical, windows, doors and exterior works.',
    href: `${HOMEOWNER_WEB}/downloads/remote-renovation-scope-worksheet`,
    label: 'Open the remote renovation worksheet',
  },
  {
    type: 'tool',
    title: 'Contractor Verification Guide',
    when: 'Use it when a serious client needs to distinguish you from everybody else.',
    body: 'A good contractor should want the buyer to know how to verify them. If your company has proper registration, identifiable directors, a business location, project history, professional documentation and genuine references, verification becomes a competitive advantage — not a threat.',
    href: `${HOMEOWNER_WEB}/guides/contractor-vetting-nigeria-diaspora`,
    label: 'Open the contractor vetting guide',
  },
  {
    type: 'tool',
    title: 'Weekly Site Update Standard',
    when: 'Use it when diaspora clients ask for random updates every day.',
    body: 'A reporting standard can reduce chaos. Align updates around current stage, work completed, work remaining, materials, photographs or videos, issues, decisions needed and the next activity.',
    href: `${HOMEOWNER_WEB}/guides/weekly-site-updates-standard`,
    label: 'Open the weekly site-update standard',
  },
  {
    type: 'tool',
    title: 'Building and renovation guides for Nigerians abroad',
    when: 'Use them when the client is worried about land, budget, permits or paying from abroad.',
    body: 'If they are worried about land, send the land-verification guide. If they do not understand the budget, send the budget planner. If they fear paying upfront, send the milestone tool. If they live abroad, send the build-from-abroad or renovate-from-abroad guides. You stop looking like another contractor asking for money and start looking like the contractor helping them decide.',
    href: `${HOMEOWNER_WEB}/diaspora/build-in-nigeria-from-abroad`,
    label: 'Open the build-from-abroad guide',
  },

  { type: 'h2', id: 'sales-playbook', text: 'The contractor sales playbook' },
  { type: 'quote', text: 'I want to renovate my parents’ house, but I’ve heard too many stories about contractors.' },
  { type: 'p', text: 'Your response should not begin “Sir, we are trustworthy.” Every contractor says that.' },
  {
    type: 'step',
    n: 1,
    title: 'Understand the project',
    body: 'Ask for property location, pictures or videos, existing drawings where relevant, the main problem, the desired outcome, a rough budget and a timeline.',
  },
  {
    type: 'step',
    n: 2,
    title: 'Give them a BuildMyHouse planning resource',
    body: 'If the project is vague, send the scope worksheet. If the budget is unclear, send the budget planner.',
  },
  {
    type: 'step',
    n: 3,
    title: 'Let them verify you',
    body: 'Do not become defensive. Explain that you are willing to operate through BuildMyHouse’s contractor-verification process.',
  },
  {
    type: 'step',
    n: 4,
    title: 'Structure the project into stages',
    body: 'Use the milestone-payment tool so mobilisation is attached to an agreed stage, not a lump-sum leap of faith.',
  },
  {
    type: 'step',
    n: 5,
    title: 'Define evidence before work begins',
    body: 'Do not wait until completion to discover that the homeowner expected daily videos, every material receipt, independent inspection, drone footage or their uncle’s approval. Agree the evidence standard first.',
  },
  {
    type: 'step',
    n: 6,
    title: 'Execute inside the agreed process',
    body: 'Then do what good contractors do: build properly. At that point, BuildMyHouse is not competing with you. It is helping make your work understandable to the person funding it from thousands of kilometres away.',
  },

  { type: 'h2', id: 'what-we-expect', text: 'What BuildMyHouse expects from general contractors' },
  { type: 'p', text: 'The model only works if the contractors inside it are willing to operate differently from the informal market.' },
  {
    type: 'list',
    items: [
      'Clear scope — know what you agreed to do.',
      'Proper quotations — explain materials, labour, logistics, equipment and other costs clearly enough for the project to be understood.',
      'Stage discipline — do not silently move money or activity between stages.',
      'Evidence — document materials and progress properly.',
      'Honest change requests — if the site reveals something genuinely different, explain it.',
      'Inspection — where independent verification is required, cooperate with it.',
      'Communication — tell the project team early when something changes.',
      'Professional disagreement — if BuildMyHouse proposes something technically wrong, say so and explain why.',
    ],
  },
  { type: 'p', text: 'We do not want contractors who simply say yes to every proposed scope. We want contractors who can defend a professional position.' },

  { type: 'h2', id: 'not-only-small-repairs', text: 'Does BuildMyHouse only have small repair jobs?' },
  { type: 'p', text: 'No. The project model runs from repairs to upgrades, renovations, interiors and full construction. But contractors should understand the pipeline honestly.' },
  {
    type: 'p',
    text: 'Project availability depends on what homeowners are requesting in a particular location and period. BuildMyHouse does not guarantee a fixed number of projects, a minimum contract value, continuous work, ₦25 million projects, Abuja projects every month, or Lagos projects every week.',
  },
  {
    type: 'p',
    text: 'The objective is to build a network capable of executing suitable projects as demand grows. For substantial general contractors, that can include future opportunities involving major renovations, residential construction, structural works, civil works, drainage, refurbishment, building services and full builds when appropriate projects are available.',
  },

  { type: 'h2', id: 'not-only-lagos', text: 'Is BuildMyHouse only for Lagos contractors?' },
  { type: 'p', text: 'No. BuildMyHouse operates as a Nigeria-focused platform. The contractor who prompted many of the questions behind this article was based in Abuja. Contractors can join from Abuja/FCT and other states. Actual opportunities depend on active homeowner projects, contractor capability and project location.' },

  { type: 'h2', id: 'how-to-join', text: 'So how does a general contractor join?' },
  { type: 'p', text: 'The process begins at gc.buildmyhouse.app. Create your contractor account. Complete the required profile information. Submit the requested verification documents. BuildMyHouse’s team reviews the application.' },
  {
    type: 'p',
    text: 'If additional evidence is needed — such as company profile information, references, relevant work history or project documentation — the team may request it separately. There is currently no registration, onboarding or verification fee simply to join.',
  },

  { type: 'h2', id: 'real-opportunity', text: 'The real opportunity for Nigerian contractors' },
  { type: 'p', text: 'A capable general contractor should not be afraid of a more structured construction market. They should want it. Because when everything depends only on trust, the dishonest contractor and the good contractor initially look the same. Both can say they have experience. Both can post project photographs. Both can promise quality. Both can ask for mobilisation.' },
  { type: 'p', text: 'A structured process gives the good contractor a way to prove the difference.' },
  {
    type: 'stack',
    items: [
      'We agreed the scope',
      'We priced it',
      'We received mobilisation',
      'We executed it',
      'We documented it',
      'The stage was checked',
      'The client approved it',
      'We got paid',
    ],
  },
  { type: 'p', text: 'That performance becomes part of your history. That is much more powerful than another Instagram caption saying “Your trusted construction partner.”' },

  { type: 'h2', id: 'contractor-stays-in-construction', text: 'BuildMyHouse does not want to take the contractor out of construction' },
  { type: 'p', text: 'We want the opposite. We want good contractors to spend more of their time designing, planning, procuring, coordinating and building — and less time trying to convince frightened clients that Nigerian contractors can be trusted.' },
  { type: 'p', text: 'The homeowner abroad needs somebody controlling the process. The contractor on the ground needs a homeowner who understands the process. BuildMyHouse sits between those two problems.' },
  { type: 'p', text: 'If that system works properly, everybody wins: the homeowner sees what their money is doing, the contractor does not have to finance the job, changes are documented, completed stages have clear payment triggers, and good execution becomes proof that helps the contractor win the next serious client.' },
];

export function buildGcPillarJsonLd() {
  return [
    {
      '@type': 'Article',
      headline: gcPillarHero.h1,
      description: gcPillarSeo.description,
      datePublished: gcPillarSeo.publishedAt,
      dateModified: gcPillarSeo.updatedAt,
      author: { '@type': 'Organization', name: gcPillarSeo.authorName },
      publisher: { '@type': 'Organization', name: 'BuildMyHouse Technologies', url: GC_WEB },
      mainEntityOfPage: `${GC_WEB}${GC_PILLAR_PATH}`,
      image: gcPillarSeo.ogImage,
      articleSection: 'General contractors',
    },
    {
      '@type': 'FAQPage',
      mainEntity: gcPillarFaqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];
}

export function getLocalGcPillarListing() {
  return {
    slug: GC_PILLAR_SLUG,
    title: gcPillarHero.h1,
    description: gcPillarSeo.description,
    excerpt: gcPillarHero.introduction,
    coverImageUrl: getGcPillarCoverUri(),
    coverImageAlt: GC_PILLAR_COVER_ALT,
    publishedAt: gcPillarSeo.publishedAt,
    updatedAt: gcPillarSeo.updatedAt,
    readingMinutes: gcPillarSeo.readingMinutes,
    tags: ['general contractors', 'diaspora clients', 'mobilisation'],
    canonicalPath: GC_PILLAR_PATH,
    authorName: gcPillarSeo.authorName,
    isPillar: true,
  };
}
