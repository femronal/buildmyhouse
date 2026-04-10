import type { ProofOfProcessDemoContent } from '@/components/seo/proof-of-process-types';

export type ProjectOverview = {
  projectName: string;
  location: string;
  type: string;
  currentStage: string;
  completion: number;
  lastUpdate: string;
  budgetBand: string;
};

export type StageTrackerItem = {
  stage: string;
  status: 'completed' | 'in_progress' | 'up_next';
  note: string;
};

export type ProjectMonitoringDemoContent = {
  title: string;
  description: string;
  eyebrow: string;
  overview: ProjectOverview;
  stages: StageTrackerItem[];
  trustMessage: string;
  ctaLabel: string;
  ctaHref: string;
  proofDemo: ProofOfProcessDemoContent;
};

export const projectMonitoringDemoContent: ProjectMonitoringDemoContent = {
  title: 'Remote Project Monitoring Demo | BuildMyHouse',
  description:
    'Interactive trust demo showing how diaspora homeowners can monitor construction progress, milestone evidence, payments, and communication before signup.',
  eyebrow: 'Interactive Demo',
  overview: {
    projectName: '3-Bedroom Duplex Build (Demo)',
    location: 'Ajah, Lagos',
    type: 'New Construction',
    currentStage: 'Blockwork',
    completion: 36,
    lastUpdate: 'Updated 2 hours ago',
    budgetBand: 'Planned budget band: NGN 42M - 48M',
  },
  stages: [
    {
      stage: 'Site prep and foundation',
      status: 'completed',
      note: 'Completed with stage evidence and checklist sign-off.',
    },
    {
      stage: 'Blockwork and structural walls',
      status: 'in_progress',
      note: 'Current stage. Evidence is being uploaded with daily progress notes.',
    },
    {
      stage: 'Roofing and waterproofing',
      status: 'up_next',
      note: 'Prepared after blockwork QA and milestone review.',
    },
    {
      stage: 'MEP and interior finishing',
      status: 'up_next',
      note: 'Planned after structure and roofing milestones are approved.',
    },
  ],
  trustMessage:
    'This is a safe public preview with demo data. It shows the workflow style, not a live client dashboard.',
  ctaLabel: 'Start a tracked project',
  ctaHref: '/location?mode=explore',
  proofDemo: {
    stageEvidenceGallery: [
      {
        id: 'foundation',
        stageLabel: 'Foundation stage',
        date: '14 Apr 2026',
        explanation: 'Footing, rebar layout, and pour prep captured for review before payment trigger.',
        imageUrl:
          'https://images.unsplash.com/photo-1504307651254-35680f356df?auto=format&fit=crop&w=1000&q=60',
      },
      {
        id: 'blockwork',
        stageLabel: 'Blockwork stage',
        date: '29 Apr 2026',
        explanation: 'Wall lines and level checks documented to reduce rework and disputes.',
        imageUrl:
          'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1000&q=60',
      },
      {
        id: 'site-progress',
        stageLabel: 'Site progress',
        date: '03 May 2026',
        explanation: 'Daily update photos show actual progress against planned stage outcomes.',
        imageUrl:
          'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1000&q=60',
      },
    ],
    contractorVerification: {
      contractorLabel: 'Demo contractor: PrimeNest Projects',
      checks: [
        { label: 'Business registration match', status: 'verified', note: 'Registration details reviewed.' },
        { label: 'Director identity verification', status: 'verified', note: 'Identity and role checks passed.' },
        { label: 'Project reference validation', status: 'in_review', note: 'Recent references under review.' },
        { label: 'Final scope alignment', status: 'pending', note: 'Waiting for homeowner confirmation.' },
      ],
      note: 'Verification statuses shown here are demo-only for public preview.',
    },
    milestonePaymentBreakdown: [
      {
        stageName: 'Foundation',
        completionDefinition: 'Excavation, rebar, and concrete pour complete.',
        requiredEvidence: ['Stage photos', 'Checklist completion', 'Material usage summary'],
        paymentTrigger: 'Release when milestone evidence is approved.',
      },
      {
        stageName: 'Blockwork',
        completionDefinition: 'Load-bearing walls complete to approved layout.',
        requiredEvidence: ['Progress images', 'Supervisor notes', 'Deviation report if needed'],
        paymentTrigger: 'Release when stage completion criteria are met.',
      },
    ],
    documentationSamples: [
      {
        title: 'Weekly stage report',
        caption: 'Sample report card',
        description: 'Summarizes completed work, blockers, and plan for next 7 days.',
      },
      {
        title: 'Material receipt log',
        caption: 'Sample document pack',
        description: 'Date-stamped records for key material deliveries tied to stage progress.',
      },
    ],
    chatTimeline: [
      {
        at: 'Mon 08:46',
        actor: 'contractor',
        message: 'Blockwork reached lintel level. Uploading photo set and quantity summary.',
        type: 'update',
      },
      {
        at: 'Mon 09:02',
        actor: 'homeowner',
        message: 'Thanks. Please confirm if staircase formwork starts this week.',
        type: 'question',
      },
      {
        at: 'Mon 09:35',
        actor: 'buildmyhouse',
        message: 'Evidence packet added to milestone review queue.',
        type: 'evidence',
      },
      {
        at: 'Mon 10:12',
        actor: 'buildmyhouse',
        message: 'Milestone condition satisfied. Payment trigger can proceed.',
        type: 'approval',
      },
    ],
  },
};

