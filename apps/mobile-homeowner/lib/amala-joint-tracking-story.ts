import { buildSeoJsonLd } from '@/lib/seo-schema';

export const AMALA_JOINT_TRACKING_STORY_PATH =
  '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria';

export const AMALA_JOINT_TRACKING_STORY_LEGACY_PATHS = [
  '/from-kitchen-to-building-site',
  '/story',
] as const;

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export const amalaJointTrackingStorySeo = {
  title: 'Why I Built BuildMyHouse | Femi Okunola Founder Story',
  description:
    'Okunola Femi shares why he built BuildMyHouse: from a cold night in Istanbul to Amala Joint, and a system for Nigerians abroad to manage property work in Nigeria with evidence, stages and control.',
  canonicalPath: AMALA_JOINT_TRACKING_STORY_PATH,
  ogImage: `${WEB_URL}/engineer-at-buildmyhouse.png`,
  publishedAt: '2026-07-26',
  updatedAt: '2026-08-14',
  authorName: 'Femi Okunola',
  readingMinutes: 14,
} as const;

export const amalaJointTrackingStoryHero = {
  amalaLabel: 'A FOUNDER STORY',
  organicLabel: 'A FOUNDER STORY',
  h1: 'Why I Built BuildMyHouse',
  introduction:
    'A cold night in Istanbul. A decision about trust and evidence. And the long road that led to BuildMyHouse.',
  authorName: 'Femi Okunola',
  authorDescription: 'Founder of Amala Joint and BuildMyHouse',
  supportingLine: 'Read the full story. Then decide whether the system deserves your trust.',
  primaryCta: 'Keep reading',
  secondaryCta: 'Explore BuildMyHouse',
} as const;

/** Soft note for Amala Joint visitors. Kept product-light on purpose. */
export const amalaJointTrackingStoryAmalaNote =
  'You came from Amala Joint. This is the founder’s story.';

/** Kept for legacy components; not rendered on the rewritten story page. */
export const trackingPrincipleComparison = {
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
} as const;

/** Kept for legacy components; not rendered on the rewritten story page. */
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

export const amalaJointTrackingStoryCtas = {
  ctaHeading: 'Curious what BuildMyHouse looks like in practice?',
  ctaBody:
    'Start with a small repair or renovation request. See the process for yourself before you commit to anything larger.',
  primaryLabel: 'Start a Tracked Project',
  primaryHref: '/book-repair',
  secondaryLabel: 'See How It Works',
  secondaryHref: '/demo/project-monitoring',
  servicesLabel: 'Browse repair and renovation services',
  servicesHref: '/services',
} as const;

export const amalaJointTrackingStoryInternalLinks = [
  { label: 'BuildMyHouse homepage', href: '/' },
  { label: 'Start a tracked project', href: '/book-repair' },
  { label: 'Build in Nigeria from abroad', href: '/diaspora/build-in-nigeria-from-abroad' },
] as const;

export const amalaJointTrackingStoryFounder = {
  heading: 'About the founder',
  body: 'Femi Okunola is the founder of Amala Joint and BuildMyHouse. Amala Joint serves Nigerian food in Istanbul. BuildMyHouse helps homeowners manage property work in Nigeria with clearer scope, stages and evidence.',
} as const;

export const amalaJointTrackingStoryFaqs = [
  {
    question: 'Can I manage a building project in Nigeria while living abroad?',
    answer:
      'Yes. Distance makes structure, documentation and communication especially important. BuildMyHouse is designed to help homeowners organise scopes, professionals, project stages and progress evidence without relying only on informal verbal updates.',
  },
  {
    question: 'Does BuildMyHouse build houses itself?',
    answer:
      'BuildMyHouse coordinates property projects through suitable professionals and contractors. It does not replace regulated professionals. The goal is visibility and control around the work.',
  },
  {
    question: 'Should I trust BuildMyHouse blindly?',
    answer:
      'No. Examine how contractors are verified, how work is documented, what evidence you receive, and how disputes are handled. Then decide whether the system deserves your trust.',
  },
] as const;

/** Article body sections used by the page renderer. */
export type StoryBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; id?: string; text: string }
  | { type: 'h3'; text: string }
  | { type: 'pull'; text: string }
  | { type: 'list'; items: readonly string[] }
  | { type: 'numbered'; items: readonly string[] }
  | {
      type: 'closing';
      before: string;
      linkText: string;
      href: string;
    };

export const amalaJointTrackingStoryBlocks: readonly StoryBlock[] = [
  {
    type: 'p',
    text: "There was a night in Istanbul when I had nowhere to sleep.",
  },
  {
    type: 'p',
    text: "I had just lost my job.",
  },
  {
    type: 'p',
    text: "The Turkish man I worked for had fired me after an altercation with another worker who had been racist toward me. The accommodation connected to the job disappeared with the job.",
  },
  {
    type: 'p',
    text: "So there I was.",
  },
  {
    type: 'p',
    text: "Outside. Cold. Angry. Uncertain about what would happen next.",
  },
  {
    type: 'p',
    text: "And that night, I made a decision that would eventually lead to BuildMyHouse.",
  },
  {
    type: 'p',
    text: "I told myself:",
  },
  {
    type: 'pull',
    text: "Femi, you have spent too much of your life putting your future in other people's hands.",
  },
  {
    type: 'p',
    text: "From now on, trust people. But never trust blindly.",
  },
  {
    type: 'p',
    text: "Ask for evidence.",
  },
  {
    type: 'p',
    text: "And whenever something is important enough to determine your future, build a system around it.",
  },
  {
    type: 'p',
    text: "That idea sounds simple today.",
  },
  {
    type: 'p',
    text: "At the time, it changed the direction of my life.",
  },
  {
    type: 'h2',
    id: 'it-didnt-begin-in-istanbul',
    text: "It didn't begin in Istanbul",
  },
  {
    type: 'p',
    text: "My name is Okunola Femi. I am the founder and CEO of BuildMyHouse Technologies.",
  },
  {
    type: 'p',
    text: "But to understand why I built BuildMyHouse, you have to go further back.",
  },
  {
    type: 'p',
    text: "When I was about thirteen or fourteen, I was a student at International School, University of Lagos.",
  },
  {
    type: 'p',
    text: "Secondary school was difficult for me.",
  },
  {
    type: 'p',
    text: "I regularly got into trouble with older students, teachers and classmates. I was unhappy enough that eventually I had to leave.",
  },
  {
    type: 'p',
    text: "Football was the thing I loved.",
  },
  {
    type: 'p',
    text: "I found a football school online and convinced my mother to take me there. I imagined that moving schools would put me closer to the life I wanted.",
  },
  {
    type: 'p',
    text: "Things did not work out exactly as I had imagined.",
  },
  {
    type: 'p',
    text: "That would become a recurring lesson.",
  },
  {
    type: 'p',
    text: "Later, I entered the University of Lagos to study English.",
  },
  {
    type: 'p',
    text: "But my mind was somewhere else.",
  },
  {
    type: 'p',
    text: "I wanted to become a professional footballer, and university felt painfully slow. Strikes interrupted academic calendars. A course that was supposed to have a predictable timeline could suddenly stretch much longer.",
  },
  {
    type: 'p',
    text: "I remember feeling as though my future was constantly being controlled by circumstances I could not control.",
  },
  {
    type: 'p',
    text: "Then an opportunity appeared.",
  },
  {
    type: 'p',
    text: "I won a place in an Erasmus exchange programme that allowed me to travel to Turkey.",
  },
  {
    type: 'p',
    text: "For me, it felt enormous.",
  },
  {
    type: 'p',
    text: "I was young, ambitious and convinced that leaving Nigeria might finally give me the room to chase the future I had imagined for myself.",
  },
  {
    type: 'p',
    text: "I arrived in Turkey with hope.",
  },
  {
    type: 'p',
    text: "Reality was considerably harder.",
  },
  {
    type: 'p',
    text: "I struggled.",
  },
  {
    type: 'p',
    text: "I worked.",
  },
  {
    type: 'p',
    text: "I experienced moments of racism and exploitation.",
  },
  {
    type: 'p',
    text: "And eventually came that night outside in the cold.",
  },
  {
    type: 'p',
    text: "That night forced me to confront something.",
  },
  {
    type: 'p',
    text: "For years, I had expected institutions, people or circumstances to behave according to my expectations.",
  },
  {
    type: 'p',
    text: "A school.",
  },
  {
    type: 'p',
    text: "A university calendar.",
  },
  {
    type: 'p',
    text: "An employer.",
  },
  {
    type: 'p',
    text: "A person promising to help.",
  },
  {
    type: 'p',
    text: "Again and again, reality reminded me that another human being could change their mind. An institution could fail. Circumstances could change.",
  },
  {
    type: 'p',
    text: "I couldn't build my future on hope alone.",
  },
  {
    type: 'p',
    text: "I needed systems.",
  },
  {
    type: 'h2',
    id: 'trust-but-demand-evidence',
    text: "Trust, but demand evidence",
  },
  {
    type: 'p',
    text: "I didn't walk away from that night suddenly successful.",
  },
  {
    type: 'p',
    text: "Life doesn't work like that.",
  },
  {
    type: 'p',
    text: "What changed was the way I thought.",
  },
  {
    type: 'p',
    text: "I began asking a different question whenever I wanted to accomplish something:",
  },
  {
    type: 'pull',
    text: "How can I create a system that still works when one person disappoints me?",
  },
  {
    type: 'p',
    text: "That principle became extremely important when I started my first serious business in Istanbul.",
  },
  {
    type: 'p',
    text: "I began selling Nigerian food.",
  },
  {
    type: 'p',
    text: "At first, it was simple. Cook food. Find customers. Deliver it.",
  },
  {
    type: 'p',
    text: "That business became Amala Joint.",
  },
  {
    type: 'p',
    text: "Demand grew.",
  },
  {
    type: 'p',
    text: "Eventually, Amala Joint expanded into multiple locations.",
  },
  {
    type: 'p',
    text: "And one of the reasons I believe we were able to grow was that I refused to design the business around one indispensable person.",
  },
  {
    type: 'p',
    text: "Processes mattered.",
  },
  {
    type: 'p',
    text: "Roles mattered.",
  },
  {
    type: 'p',
    text: "Checks mattered.",
  },
  {
    type: 'p',
    text: "Systems mattered.",
  },
  {
    type: 'p',
    text: "The business gave me something else too: a measure of independence.",
  },
  {
    type: 'p',
    text: "I was no longer entirely dependent on a Turkish employer to decide whether I could earn an income.",
  },
  {
    type: 'p',
    text: "That felt like freedom.",
  },
  {
    type: 'p',
    text: "But then another question started bothering me:",
  },
  {
    type: 'pull',
    text: "Was I actually free?",
  },
  {
    type: 'h2',
    id: 'the-diaspora-paradox',
    text: "The diaspora paradox",
  },
  {
    type: 'p',
    text: "At one point, an issue with my residence status forced me to confront how fragile life abroad can become.",
  },
  {
    type: 'p',
    text: "And I began thinking about the wider Nigerian diaspora.",
  },
  {
    type: 'p',
    text: "You can live in London.",
  },
  {
    type: 'p',
    text: "New York.",
  },
  {
    type: 'p',
    text: "Toronto.",
  },
  {
    type: 'p',
    text: "Johannesburg.",
  },
  {
    type: 'p',
    text: "Dubai.",
  },
  {
    type: 'p',
    text: "Istanbul.",
  },
  {
    type: 'p',
    text: "You can have a great career.",
  },
  {
    type: 'p',
    text: "You can even own a successful business.",
  },
  {
    type: 'p',
    text: "But you are still living inside another country's system.",
  },
  {
    type: 'p',
    text: "Governments change.",
  },
  {
    type: 'p',
    text: "Immigration rules change.",
  },
  {
    type: 'p',
    text: "Economic conditions change.",
  },
  {
    type: 'p',
    text: "Policies change.",
  },
  {
    type: 'p',
    text: "And foreigners rarely have the same security as citizens.",
  },
  {
    type: 'p',
    text: "That doesn't mean living abroad is bad.",
  },
  {
    type: 'p',
    text: "It means something else:",
  },
  {
    type: 'pull',
    text: "True independence requires options.",
  },
  {
    type: 'p',
    text: "I began to believe that one of the strongest options a Nigerian abroad could create was something valuable back home.",
  },
  {
    type: 'p',
    text: "A property.",
  },
  {
    type: 'p',
    text: "A business.",
  },
  {
    type: 'p',
    text: "Infrastructure.",
  },
  {
    type: 'p',
    text: "An income-producing asset.",
  },
  {
    type: 'p',
    text: "Something that exists independently of your visa, your foreign employer or another country's immigration policy.",
  },
  {
    type: 'p',
    text: "I asked myself:",
  },
  {
    type: 'p',
    text: "If I could build a business in Istanbul, a country where I had arrived as a foreigner, why couldn't I gradually build something substantial in the country I understood best?",
  },
  {
    type: 'p',
    text: "Nigeria.",
  },
  {
    type: 'p',
    text: "Then came the obvious problem.",
  },
  {
    type: 'pull',
    text: "With whom?",
  },
  {
    type: 'p',
    text: "That question changed everything.",
  },
  {
    type: 'h2',
    id: 'who-can-i-trust-back-home',
    text: "Who can I trust back home?",
  },
  {
    type: 'p',
    text: "Many Nigerians abroad know this question.",
  },
  {
    type: 'p',
    text: "You want to repair your parents' house.",
  },
  {
    type: 'p',
    text: "Someone recommends a plumber.",
  },
  {
    type: 'p',
    text: "You want to renovate a property.",
  },
  {
    type: 'p',
    text: "A relative says they know somebody.",
  },
  {
    type: 'p',
    text: "You want to start building.",
  },
  {
    type: 'p',
    text: "Suddenly, five people have opinions about the contractor, materials and price.",
  },
  {
    type: 'p',
    text: "Money begins moving.",
  },
  {
    type: 'p',
    text: "Pictures begin arriving on WhatsApp.",
  },
  {
    type: 'p',
    text: "Then another request comes.",
  },
  {
    type: 'p',
    text: "\"We need another ₦300,000.\"",
  },
  {
    type: 'p',
    text: "\"For what?\"",
  },
  {
    type: 'p',
    text: "\"Materials have increased.\"",
  },
  {
    type: 'p',
    text: "\"Show me what the previous money completed.\"",
  },
  {
    type: 'p',
    text: "Silence.",
  },
  {
    type: 'p',
    text: "Or more pictures.",
  },
  {
    type: 'p',
    text: "Or more explanations.",
  },
  {
    type: 'p',
    text: "And because you are thousands of kilometres away, eventually the entire project depends on one dangerous ingredient:",
  },
  {
    type: 'pull',
    text: "trust.",
  },
  {
    type: 'p',
    text: "I understood that problem personally because of the lesson I had learned years earlier.",
  },
  {
    type: 'p',
    text: "People are not necessarily evil.",
  },
  {
    type: 'p',
    text: "But human beings make mistakes.",
  },
  {
    type: 'p',
    text: "People exaggerate.",
  },
  {
    type: 'p',
    text: "People forget.",
  },
  {
    type: 'p',
    text: "People have incentives.",
  },
  {
    type: 'p',
    text: "People become desperate.",
  },
  {
    type: 'p',
    text: "People misunderstand instructions.",
  },
  {
    type: 'p',
    text: "People can also deceive you.",
  },
  {
    type: 'p',
    text: "So the solution cannot simply be:",
  },
  {
    type: 'pull',
    text: "Find a trustworthy person.",
  },
  {
    type: 'p',
    text: "My experience had taught me something different:",
  },
  {
    type: 'pull',
    text: "Build a trustworthy system.",
  },
  {
    type: 'h2',
    id: 'i-searched-for-one',
    text: "I searched for one",
  },
  {
    type: 'p',
    text: "Before deciding to build anything myself, I searched online.",
  },
  {
    type: 'p',
    text: "Surely somebody had already solved this.",
  },
  {
    type: 'p',
    text: "I found a few companies and platforms making promises that sounded similar.",
  },
  {
    type: 'p',
    text: "I contacted one.",
  },
  {
    type: 'p',
    text: "No meaningful response came.",
  },
  {
    type: 'p',
    text: "Months passed.",
  },
  {
    type: 'p',
    text: "And I kept returning to the same thought:",
  },
  {
    type: 'p',
    text: "There must be millions of Nigerians abroad who want to build, repair, renovate or invest back home but hesitate for the same reason.",
  },
  {
    type: 'p',
    text: "They cannot see what is happening.",
  },
  {
    type: 'p',
    text: "They cannot independently verify every claim.",
  },
  {
    type: 'p',
    text: "And they don't want their life savings controlled by WhatsApp messages and goodwill.",
  },
  {
    type: 'p',
    text: "That's when the idea behind BuildMyHouse became serious.",
  },
  {
    type: 'h2',
    id: 'buildmyhouse-is-not-really-about-houses',
    text: "BuildMyHouse is not really about houses",
  },
  {
    type: 'p',
    text: "The name is BuildMyHouse.",
  },
  {
    type: 'p',
    text: "But the deeper idea is not construction.",
  },
  {
    type: 'p',
    text: "It is control.",
  },
  {
    type: 'p',
    text: "BuildMyHouse is being designed to give a homeowner visibility over property work in Nigeria even when that homeowner cannot physically stand on the site.",
  },
  {
    type: 'p',
    text: "The principle is simple:",
  },
  {
    type: 'p',
    text: "Don't merely tell the homeowner that something happened.",
  },
  {
    type: 'pull',
    text: "Show evidence.",
  },
  {
    type: 'p',
    text: "Don't allow a project to exist as one confusing stream of activity.",
  },
  {
    type: 'pull',
    text: "Break it into stages.",
  },
  {
    type: 'p',
    text: "Don't let money move simply because somebody says the next payment is urgent.",
  },
  {
    type: 'pull',
    text: "Connect progression to evidence and approval.",
  },
  {
    type: 'p',
    text: "Don't make a homeowner depend entirely on one contractor's version of events.",
  },
  {
    type: 'pull',
    text: "Create a documented system around the contractor, project, communication and work.",
  },
  {
    type: 'p',
    text: "That does not mean people stop mattering.",
  },
  {
    type: 'p',
    text: "Contractors matter enormously.",
  },
  {
    type: 'p',
    text: "Engineers matter.",
  },
  {
    type: 'p',
    text: "Artisans matter.",
  },
  {
    type: 'p',
    text: "Homeowners matter.",
  },
  {
    type: 'p',
    text: "What changes is that nobody should have to rely completely on somebody else's word.",
  },
  {
    type: 'p',
    text: "The system should preserve evidence.",
  },
  {
    type: 'h2',
    id: 'but-the-vision-became-much-bigger',
    text: "But the vision became much bigger",
  },
  {
    type: 'p',
    text: "As I thought about the problem, I realised something else.",
  },
  {
    type: 'p',
    text: "This was not only about protecting one Nigerian in London from losing money on a renovation in Lagos.",
  },
  {
    type: 'p',
    text: "Nigeria has an enormous diaspora.",
  },
  {
    type: 'p',
    text: "These are Nigerians working as doctors, nurses, engineers, entrepreneurs, drivers, bankers, developers and professionals around the world.",
  },
  {
    type: 'p',
    text: "They earn capital outside Nigeria.",
  },
  {
    type: 'p',
    text: "Many want to invest some of it back home.",
  },
  {
    type: 'p',
    text: "But distrust creates friction.",
  },
  {
    type: 'p',
    text: "And when people don't trust the process, capital stays away.",
  },
  {
    type: 'p',
    text: "A Nigerian abroad may want to build apartments.",
  },
  {
    type: 'p',
    text: "A school.",
  },
  {
    type: 'p',
    text: "A small factory.",
  },
  {
    type: 'p',
    text: "A restaurant.",
  },
  {
    type: 'p',
    text: "A farm.",
  },
  {
    type: 'p',
    text: "A clinic.",
  },
  {
    type: 'p',
    text: "A warehouse.",
  },
  {
    type: 'p',
    text: "Or simply renovate their parents' house.",
  },
  {
    type: 'p',
    text: "Every one of those projects creates economic activity.",
  },
  {
    type: 'p',
    text: "Someone supplies the blocks.",
  },
  {
    type: 'p',
    text: "Someone installs the electrical system.",
  },
  {
    type: 'p',
    text: "Someone drives the materials.",
  },
  {
    type: 'p',
    text: "Someone paints.",
  },
  {
    type: 'p',
    text: "Someone welds.",
  },
  {
    type: 'p',
    text: "Someone manages the site.",
  },
  {
    type: 'p',
    text: "Someone eventually works inside the finished building.",
  },
  {
    type: 'p',
    text: "That is when BuildMyHouse stopped looking to me like merely a construction platform.",
  },
  {
    type: 'p',
    text: "I began seeing trust infrastructure.",
  },
  {
    type: 'p',
    text: "If Nigerians abroad can invest back home with greater visibility and control, more people may be willing to build.",
  },
  {
    type: 'p',
    text: "If more people build, more infrastructure exists.",
  },
  {
    type: 'p',
    text: "More businesses can exist.",
  },
  {
    type: 'p',
    text: "More jobs can exist.",
  },
  {
    type: 'p',
    text: "More wealth can circulate.",
  },
  {
    type: 'p',
    text: "I believe the Nigerian diaspora can become one of the most powerful forces in Nigeria's development.",
  },
  {
    type: 'p',
    text: "But before people commit their savings, they need to believe that distance does not automatically mean helplessness.",
  },
  {
    type: 'h2',
    id: 'start-very-small',
    text: "Start very small",
  },
  {
    type: 'p',
    text: "That is the grand vision.",
  },
  {
    type: 'p',
    text: "But grand visions are dangerous when founders try to build them all at once.",
  },
  {
    type: 'p',
    text: "So BuildMyHouse is starting small.",
  },
  {
    type: 'p',
    text: "Very small.",
  },
  {
    type: 'p',
    text: "A leaking pipe.",
  },
  {
    type: 'p',
    text: "A damaged window.",
  },
  {
    type: 'p',
    text: "Electrical work.",
  },
  {
    type: 'p',
    text: "A roof problem.",
  },
  {
    type: 'p',
    text: "A bathroom repair.",
  },
  {
    type: 'p',
    text: "A small renovation.",
  },
  {
    type: 'p',
    text: "Because if we cannot create accountability around a small repair, we have no business asking somebody to trust the same system with a multimillion-naira construction project.",
  },
  {
    type: 'p',
    text: "We have to earn that right.",
  },
  {
    type: 'p',
    text: "One project at a time.",
  },
  {
    type: 'p',
    text: "One contractor at a time.",
  },
  {
    type: 'p',
    text: "One stage at a time.",
  },
  {
    type: 'p',
    text: "One piece of evidence at a time.",
  },
  {
    type: 'p',
    text: "Eventually, a person who trusted BuildMyHouse to repair their mother's window might trust us with their bathroom.",
  },
  {
    type: 'p',
    text: "Then their renovation.",
  },
  {
    type: 'p',
    text: "Then perhaps their house.",
  },
  {
    type: 'p',
    text: "And eventually something much bigger.",
  },
  {
    type: 'p',
    text: "That is how I believe trust should grow.",
  },
  {
    type: 'p',
    text: "Not through promises.",
  },
  {
    type: 'p',
    text: "Through evidence.",
  },
  {
    type: 'h2',
    id: 'dont-trust-buildmyhouse-blindly-either',
    text: "Don't trust BuildMyHouse blindly either",
  },
  {
    type: 'p',
    text: "This is perhaps the most important thing I can tell you.",
  },
  {
    type: 'p',
    text: "I am not asking you to trust BuildMyHouse because I am Femi.",
  },
  {
    type: 'p',
    text: "I am not asking you to trust us because our website looks good.",
  },
  {
    type: 'p',
    text: "And I am certainly not asking you to trust us because we say the word \"transparent.\"",
  },
  {
    type: 'p',
    text: "That would contradict the very reason I built the company.",
  },
  {
    type: 'pull',
    text: "Don't trust us blindly.",
  },
  {
    type: 'p',
    text: "Examine the system.",
  },
  {
    type: 'p',
    text: "Ask how contractors are verified.",
  },
  {
    type: 'p',
    text: "Ask how work is documented.",
  },
  {
    type: 'p',
    text: "Ask what happens before a stage progresses.",
  },
  {
    type: 'p',
    text: "Ask what evidence you receive.",
  },
  {
    type: 'p',
    text: "Ask how disputes are handled.",
  },
  {
    type: 'p',
    text: "Ask what happens when something goes wrong.",
  },
  {
    type: 'p',
    text: "Then decide whether the system deserves your trust.",
  },
  {
    type: 'p',
    text: "That is what that younger version of me learned outside in the cold in Istanbul.",
  },
  {
    type: 'p',
    text: "Trust is too important to be based entirely on promises.",
  },
  {
    type: 'p',
    text: "People need systems.",
  },
  {
    type: 'p',
    text: "People need evidence.",
  },
  {
    type: 'p',
    text: "And when money, property and years of someone's life are involved, they deserve visibility.",
  },
  {
    type: 'p',
    text: "That principle eventually became BuildMyHouse.",
  },
  {
    type: 'p',
    text: "And although today we may be starting with a leaking pipe or a broken window, the ambition behind it is much larger.",
  },
  {
    type: 'p',
    text: "I want Nigerians anywhere in the world to be able to look back home and say:",
  },
  {
    type: 'pull',
    text: "I can build there.",
  },
  {
    type: 'pull',
    text: "I can invest there.",
  },
  {
    type: 'pull',
    text: "I can see what is happening.",
  },
  {
    type: 'pull',
    text: "I can verify before I proceed.",
  },
  {
    type: 'p',
    text: "And ultimately:",
  },
  {
    type: 'pull',
    text: "Distance does not mean I have to lose control.",
  },
  {
    type: 'closing',
    before: "That is why I built ",
    linkText: "BuildMyHouse",
    href: "/",
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
