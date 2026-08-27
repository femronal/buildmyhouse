import type { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import { PROJECT_MONITORING_VIDEO } from '@/lib/project-monitoring-video';
import { buildSeoJsonLd } from '@/lib/seo-schema';

type SimpleSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: InternalLinkItem[];
};

type ServiceCard = {
  title: string;
  points: string[];
};

type PopularSearchCard = {
  title: string;
  href: string;
  description: string;
};

export type ConstructionNigeriaHubContent = {
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryCta: { label: string; href: string };
  heroSecondaryCta: { label: string; href: string };
  coverImage: { src: string; alt: string };
  bestForSection: { title: string; bullets: string[] };
  whatItIsNotSection: { title: string; bullets: string[] };
  whatItGivesYouSection: { title: string; bullets: string[] };
  brandClarity: SimpleSection;
  strongHook: SimpleSection;
  quickAnswer: { title: string; bullets: string[] };
  productLadder: { title: string; intro: string; cards: ServiceCard[]; outro: string };
  diasporaSection: SimpleSection;
  howItWorks: { title: string; steps: string[] };
  trustBlackSection: { title: string; bullets: string[] };
  visibilitySection: SimpleSection;
  monitoringVideoSection: {
    title: string;
    description: string;
    youtubeUrl: string;
    youtubeEmbedUrl: string;
    /** YouTube publish date for VideoObject.uploadDate (ISO 8601 date). */
    youtubeUploadDate: string;
    watchPageHref: string;
  };
  constructionServicesSection: SimpleSection;
  renovationServicesSection: SimpleSection;
  interiorDesignSection: SimpleSection;
  contractorTrustSection: SimpleSection;
  paymentDisciplineSection: {
    title: string;
    paragraphs: string[];
    cta: { label: string; href: string };
  };
  popularSearchesSection: { title: string; cards: PopularSearchCard[] };
  faqs: Array<{ question: string; answer: string }>;
  finalCta: {
    title: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
};

export function getConstructionNigeriaHubContent(): ConstructionNigeriaHubContent {
  return {
    seoTitle:
      'House Building & Construction Services in Nigeria | BuildMyHouse',
    seoDescription:
      'House building in Nigeria for local and diaspora homeowners. BuildMyHouse helps you run house construction, building construction, remodeling and construction projects, repairs, and interior upgrades with stage tracking and milestone payment discipline.',
    canonicalPath: '/construction/nigeria',
    eyebrow: 'BUILDMYHOUSE NIGERIA',
    heroTitle: 'House Building and Construction Services in Nigeria',
    heroDescription:
      'BuildMyHouse is a project management platform for homeowners who need building services in Nigeria — from house building and full house construction to renovation, remodeling work, repairs, and interior upgrades — with clearer scope, stage tracking, proof, and payment discipline.',
    heroPrimaryCta: { label: 'Start Your Project', href: '/location?mode=explore' },
    heroSecondaryCta: { label: 'See How Project Tracking Works', href: '/demo/project-monitoring' },
    coverImage: {
      src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80',
      alt: 'Construction project planning and site coordination in Nigeria',
    },
    bestForSection: {
      title: 'Best for',
      bullets: [
        'Nigerians abroad managing property work in Nigeria',
        'Homeowners planning construction',
        "Families renovating parents' homes",
        'People managing repairs, upgrades, interiors, or full builds',
      ],
    },
    whatItIsNotSection: {
      title: 'What BuildMyHouse Is Not',
      bullets: [
        'not just a contractor directory',
        'not random artisan listing',
        'not a WhatsApp group',
        'not a passive marketplace',
      ],
    },
    whatItGivesYouSection: {
      title: 'What BuildMyHouse Gives You',
      bullets: [
        'project setup',
        'contractor workflow',
        'stages',
        'chat and updates',
        'files/proof',
        'payment discipline',
        'admin oversight',
      ],
    },
    brandClarity: {
      title: 'What Is BuildMyHouse?',
      paragraphs: [
        'BuildMyHouse is a remote property project management platform for Nigerians who want to manage property work in Nigeria with more control.',
        'It is not just a contractor directory. It is not just a construction company. It is not "Uber for artisans."',
        'BuildMyHouse sits between the homeowner, contractor, project scope, stage progress, communication, and payment decisions — so property work can feel more structured and visible.',
        'You can use BuildMyHouse for house building, building construction, renovation and remodeling, repairs, interior design, and diaspora project management — the full range of building services homeowners actually need.',
      ],
    },
    strongHook: {
      title: 'The Problem Is Not Just Finding a Contractor. It Is Controlling the Work.',
      paragraphs: [
        'Most people can find "someone who knows someone." The real wahala starts after that.',
        '"Work is going on" is not the same as "this stage is complete."',
      ],
      bullets: [
        'unclear scope',
        'vague updates',
        'money requests',
        'family pressure',
        'weak documentation',
        'no clear stage completion',
        'no proper visibility from abroad',
      ],
    },
    quickAnswer: {
      title: 'How BuildMyHouse Helps Homeowners in Nigeria',
      bullets: [
        'Create a clearer project request',
        'Define scope before money starts moving',
        'Match the project with relevant contractor workflows',
        'Track project stages',
        'Keep chat and updates tied to the project',
        'Support proof-based payment decisions',
        'Give diaspora homeowners better visibility from abroad',
      ],
    },
    productLadder: {
      title: 'What You Can Use BuildMyHouse For',
      intro:
        'BuildMyHouse Nigeria supports practical project categories that homeowners actually run into.',
      cards: [
        {
          title: 'Repairs',
          points: [
            'plumbing',
            'electrical',
            'roof leaks',
            'drainage',
            'gates',
            'painting',
            'compound works',
          ],
        },
        {
          title: 'Upgrades',
          points: [
            'room refresh',
            'bathroom upgrade',
            'kitchen upgrade',
            'ceiling and surface improvements',
          ],
        },
        {
          title: 'Renovations & remodeling',
          points: [
            'stage-based home renovation and remodeling work',
            "parents' homes",
            'inherited properties',
            'rental prep',
          ],
        },
        {
          title: 'Interior design',
          points: [
            'furnishing',
            'styling',
            'wall panels',
            'curtains',
            'lighting',
            'cosmetic improvements',
          ],
        },
        {
          title: 'Full builds / house building',
          points: [
            'house building and house construction projects with stage-by-stage visibility',
            'building construction from foundation through finishing',
          ],
        },
      ],
      outro:
        'BuildMyHouse earns trust through smaller scoped jobs and can support larger remodeling and construction projects as the relationship grows.',
    },
    diasporaSection: {
      title: 'Built for Nigerians Abroad Managing Property Work in Nigeria',
      paragraphs: [
        'Nigerians in the UK, US, Canada, UAE, Europe, and other countries often send money home for house building in Nigeria, repairs, renovation, or family property upgrades.',
        'The issue is not love for Nigeria. The issue is control from a distance.',
      ],
      bullets: [
        'time zones',
        'family supervision',
        'WhatsApp updates',
        'payment pressure',
        'inability to visit often',
        'need for structured project visibility',
      ],
      links: [
        { label: 'Build in Nigeria from abroad', href: '/diaspora/build-in-nigeria-from-abroad' },
        { label: 'Build in Nigeria from the UK', href: '/diaspora/build-in-nigeria-from-uk' },
        { label: 'Build in Nigeria from the US', href: '/diaspora/build-in-nigeria-from-usa-canada' },
        { label: 'Renovate in Nigeria from abroad', href: '/diaspora/renovate-in-nigeria-from-abroad' },
      ],
    },
    howItWorks: {
      title: 'How BuildMyHouse Works',
      steps: [
        'Tell us what you want to do',
        'Share location, project type, photos, and budget direction',
        'Get your project structured into stages',
        'Work with relevant contractor workflows',
        'Track updates, communication, and progress',
        'Approve next steps with more clarity',
      ],
    },
    trustBlackSection: {
      title: 'Why People Choose BuildMyHouse Nigeria',
      bullets: [
        'Not just contractor discovery — project control',
        'Stage-based project visibility',
        'Verified contractor workflows',
        'Chat, updates, and files tied to the project',
        'Payment thinking based on proof, not pressure',
        'Useful for diaspora homeowners and local homeowners',
        'Admin-side monitoring and operational support',
      ],
    },
    visibilitySection: {
      title: 'What "Visibility" Means on BuildMyHouse',
      paragraphs: [
        'Visibility means the homeowner should be able to understand what stage the project is in and whether the next payment makes sense.',
      ],
      bullets: [
        'photos/videos',
        'material lists',
        'receipts/invoices',
        'stage explanations',
        'chat updates',
        'project files',
        'contractor verification details',
      ],
    },
    monitoringVideoSection: {
      title: PROJECT_MONITORING_VIDEO.title,
      description: PROJECT_MONITORING_VIDEO.description,
      youtubeUrl: PROJECT_MONITORING_VIDEO.youtubeUrl,
      youtubeEmbedUrl: PROJECT_MONITORING_VIDEO.youtubeEmbedUrl,
      youtubeUploadDate: PROJECT_MONITORING_VIDEO.youtubeUploadDate,
      watchPageHref: '/demo/project-monitoring',
    },
    constructionServicesSection: {
      title: 'House Building and Building Construction in Nigeria',
      paragraphs: [
        'BuildMyHouse supports homeowners planning house building and building construction in Nigeria — helping them think through stage-based execution, contractor workflows, project communication, and payment control.',
        'If you want house construction in Nigeria with better structure, or you are comparing house building options from foundation to finishing, this page is your practical starting point for building services that stay visible stage by stage.',
      ],
      links: [
        { label: 'House construction in Lagos', href: '/construction/lagos' },
        {
          label: 'Lagos building permits and stage inspections',
          href: '/guides/lagos-building-permits-and-stage-inspections',
        },
        {
          label: 'Build a milestone payment schedule',
          href: '/tools/milestone-payment-schedule',
        },
      ],
    },
    renovationServicesSection: {
      title: 'Renovation, Remodeling Work, and Home Upgrades',
      paragraphs: [
        'Many Nigerian property projects are not full builds. They are remodeling work and home renovation: parents’ home upgrades, inherited home repairs, rental prep, bathroom renovation, kitchen renovation, roof repair, electrical rewiring, plumbing correction, painting, tiling, ceiling repair, and full house remodeling.',
        'Whether you search for home remodeling or home renovation, the same rule applies: separate repairs from upgrades, track stages, and do not pay because the site only looks busy.',
      ],
      links: [
        { label: 'Home renovation & remodeling in Nigeria', href: '/renovation/nigeria' },
        {
          label: 'Remote renovation scope worksheet',
          href: '/downloads/remote-renovation-scope-worksheet',
        },
        { label: 'Renovation budget planner', href: '/tools/renovation-budget-planner' },
      ],
    },
    interiorDesignSection: {
      title: 'Interior Design and Cosmetic Upgrade Projects',
      paragraphs: [
        'Some users need furnishing, styling, lighting, curtains, wall panels, furniture sourcing, short-let design, parents’ home refresh, or cosmetic renovation. BuildMyHouse can help users turn interior ideas into structured tracked projects alongside other building services.',
      ],
      links: [{ label: 'Interior design in Nigeria', href: '/interior-design/nigeria' }],
    },
    contractorTrustSection: {
      title: 'How BuildMyHouse Thinks About Contractor Trust',
      paragraphs: [
        'BuildMyHouse does not claim every contractor is perfect. The goal is to make contractor trust more structured through onboarding, verification, project workflows, communication, and admin visibility.',
        'Depending on context, documentation may include CAC registration certificate, TIN, tax clearance certificate, government-issued ID, proof of business address, professional license or council registration where applicable, insurance certificate, and director/proprietor ID.',
      ],
      links: [
        {
          label: 'Contractor vetting guide for diaspora homeowners',
          href: '/guides/contractor-vetting-nigeria-diaspora',
        },
      ],
    },
    paymentDisciplineSection: {
      title: 'Do Not Send Money Just Because the Site Looks Busy',
      paragraphs: [
        'A busy site is not always a completed stage. The safest project is one where money follows stage progress, proof, and homeowner satisfaction.',
      ],
      cta: {
        label: 'Build a Milestone Payment Schedule',
        href: '/tools/milestone-payment-schedule',
      },
    },
    popularSearchesSection: {
      title: 'Popular BuildMyHouse Nigeria Searches',
      cards: [
        {
          title: 'House building in Nigeria',
          href: '/construction/nigeria',
          description:
            'House building and building construction for local and diaspora homeowners, with stage tracking.',
        },
        {
          title: 'Build in Nigeria from abroad',
          href: '/diaspora/build-in-nigeria-from-abroad',
          description: 'Practical guide for remote house building and property project control from abroad.',
        },
        {
          title: 'House construction in Lagos',
          href: '/construction/lagos',
          description: 'House construction context for Lagos-based projects and stage planning.',
        },
        {
          title: 'Home remodeling and renovation in Nigeria',
          href: '/renovation/nigeria',
          description: 'Remodeling work and renovation pathways for family homes, rentals, and inherited properties.',
        },
        {
          title: 'Interior design in Nigeria',
          href: '/interior-design/nigeria',
          description: 'Structured interior design and cosmetic upgrade workflow support.',
        },
        {
          title: 'Contractor verification in Nigeria',
          href: '/guides/contractor-vetting-nigeria-diaspora',
          description: 'How BuildMyHouse approaches contractor trust with structured checks.',
        },
        {
          title: 'Milestone payment schedule for construction',
          href: '/tools/milestone-payment-schedule',
          description: 'Plan stage-based disbursement to reduce pressure-led payments.',
        },
        {
          title: 'Lagos building permits and stage inspections',
          href: '/guides/lagos-building-permits-and-stage-inspections',
          description: 'Permit and stage inspection guidance for Lagos projects.',
        },
        {
          title: "Renovate parents' house from the UK",
          href: '/diaspora/uk/renovate-parents-house',
          description: 'Country-specific flow for UK-based diaspora renovation use cases.',
        },
        {
          title: 'Building maintenance in Lagos',
          href: '/services/lagos/property-maintenance',
          description: 'Ongoing building maintenance and property upkeep with tracked visits and evidence.',
        },
      ],
    },
    faqs: [
      {
        question: 'What is BuildMyHouse Nigeria?',
        answer:
          'BuildMyHouse (often searched as buildmyhouse) is a property project management platform that helps homeowners structure house building, construction, renovation, repair, and interior projects with clearer tracking and workflow visibility.',
      },
      {
        question: 'Is BuildMyHouse a construction company?',
        answer:
          'BuildMyHouse is a platform focused on project structure, visibility, and homeowner control for building services. It is not just a traditional construction company website.',
      },
      {
        question: 'Can Nigerians abroad use BuildMyHouse?',
        answer:
          'Yes. The platform is designed for diaspora users who need remote property project management and clearer stage-by-stage updates from Nigeria.',
      },
      {
        question: 'What kinds of projects can I start on BuildMyHouse?',
        answer:
          'You can start repairs, upgrades, renovations and remodeling work, interior design projects, and full house building or house construction in Nigeria.',
      },
      {
        question: 'Can BuildMyHouse help with house building in Nigeria?',
        answer:
          'Yes. House building in Nigeria — from early planning through stage-by-stage construction — is a core use case, especially when you want visibility and milestone payment discipline.',
      },
      {
        question: 'Can BuildMyHouse help with repairs and renovation?',
        answer:
          'Yes. Property repairs, home renovation, and home remodeling in Nigeria are key use cases, especially when the homeowner wants better control over scope and updates.',
      },
      {
        question: 'Do you handle remodeling and construction together?',
        answer:
          'Yes. Many homeowners need remodeling and construction in one workflow — for example upgrading an existing wing while extending another. BuildMyHouse helps keep both lanes scoped, staged, and tracked.',
      },
      {
        question: 'Can BuildMyHouse help with full house construction?',
        answer:
          'Yes. BuildMyHouse can support house construction and building construction in Nigeria with project stage tracking and milestone payment discipline.',
      },
      {
        question: 'How does BuildMyHouse verify contractors?',
        answer:
          'Contractor trust is handled through structured onboarding and verification workflows with documentation checks and project-level visibility.',
      },
      {
        question: 'Can I track my project from abroad?',
        answer:
          'Yes. Construction project tracking in Nigeria is one of the core reasons diaspora homeowners use BuildMyHouse.',
      },
      {
        question: 'Does BuildMyHouse support milestone payments?',
        answer:
          'BuildMyHouse promotes milestone payment construction in Nigeria by tying payment decisions to stage progress and proof.',
      },
      {
        question: 'How do I start a project on BuildMyHouse?',
        answer:
          'Start your project request, share location and project details, then proceed with stage-structured execution.',
      },
      {
        question: 'Is BuildMyHouse available in Lagos?',
        answer:
          'Yes. Lagos is one of the active locations where homeowners use BuildMyHouse workflows.',
      },
      {
        question: 'Can I use BuildMyHouse for interior design?',
        answer:
          'Yes. You can use BuildMyHouse for interior design and cosmetic upgrade projects in Nigeria.',
      },
    ],
    finalCta: {
      title: 'Ready to Manage Property Work in Nigeria With More Control?',
      description:
        'Start your project on BuildMyHouse and move from scattered updates, pressure, and guesswork to a clearer workflow with stages, communication, and better visibility.',
      primaryCta: { label: 'Start Your Project', href: '/location?mode=explore' },
      secondaryCta: { label: 'See How Project Tracking Works', href: '/demo/project-monitoring' },
    },
  };
}

export function getConstructionNigeriaJsonLd(content: ConstructionNigeriaHubContent) {
  return buildSeoJsonLd({
    path: content.canonicalPath,
    title: content.seoTitle,
    description: content.seoDescription,
    schemaType: 'Service',
    faqs: content.faqs,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Construction', path: '/construction/nigeria' },
      { name: 'Construction Services in Nigeria', path: '/construction/nigeria' },
    ],
  });
}
