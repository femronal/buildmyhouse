/**
 * Public project-monitoring demo: mock payloads only. Image URLs point at the
 * deployed marketing site so the demo matches production asset hosting.
 */
const demoWebBase = () => (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export const demoMarketingImage = (fileName: string) => `${demoWebBase()}/assets/images/${fileName}`;

export type DemoStageUiStatus = 'completed' | 'in_progress' | 'not_started';

export type DemoMaterial = {
  name: string;
  supplier: string;
  quantity: string;
  unit: string;
  brand: string;
  totalPrice: number;
  photoUrl: string;
};

export type DemoTeamMember = {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  compensationLabel?: string;
};

export type DemoStageFile = {
  id: string;
  name: string;
  fileType: 'image' | 'video' | 'pdf';
  dateLabel: string;
};

export type DemoChatMessage = {
  id: string;
  sender: 'homeowner' | 'gc';
  message: string;
  dateLabel: string;
  read?: boolean;
};

export type DemoStage = {
  id: string;
  order: number;
  /** Full name for timeline / dashboard lists */
  name: string;
  /** Short header title on stage detail (screenshots) */
  shortTitle: string;
  uiStatus: DemoStageUiStatus;
  estimatedDuration: string;
  estimatedCost: number;
  materials: DemoMaterial[];
  team: DemoTeamMember[];
  files: DemoStageFile[];
};

export const projectMonitoringDemoData = {
  project: {
    name: 'Daddy Obinna Redesign',
    address:
      'University of Lagos Cricket Oval, Ransome Kuti Road, Shomolu, Lagos State, 104233, Nigeria',
    coverImageUrl: demoMarketingImage('cover-image-for-blog-1.png'),
    /** Shown on the home project card progress row (screenshot 1) */
    listProgressStageLabel: 'Site Preparation & Foundation',
    progressPercent: 17,
    totalBudget: 2_240_000,
    spent: 330_000,
    startDateLabel: '4/5/2026',
    gcName: 'Godswill Oluwafemi Okunola',
    gcAvatarUrl: demoMarketingImage('icon.png'),
    aiAnalysis: {
      bedrooms: 4,
      bathrooms: 3,
      squareFootage: 2500,
      description: '',
      summary:
        'This is going to be fun. But there might be inflation along the way since things are getting expensive now.',
    },
  },

  /** Dispute options shown in the demo modal (matches product screenshots). */
  disputeReasons: [
    {
      id: 'materials-mismatch',
      label: 'Material uploads look incorrect (wrong item, quantity, quality, or price).',
    },
    {
      id: 'team-mismatch',
      label: 'Assigned team members uploaded for this stage do not match work on site.',
    },
    {
      id: 'file-proof-mismatch',
      label: 'Uploaded receipts/invoices/files do not match this stage progress.',
    },
    {
      id: 'media-mismatch',
      label: 'Photos/videos uploaded do not reflect the actual site condition.',
    },
    {
      id: 'delay-or-scope',
      label: 'Work delivered does not match the agreed scope for this stage.',
    },
  ],

  stages: [
    {
      id: 'demo-stage-1',
      order: 1,
      name: 'Site Preparation & Foundation',
      shortTitle: 'Site Preparation',
      uiStatus: 'completed',
      estimatedDuration: '2 months',
      estimatedCost: 330_000,
      materials: [
        {
          name: 'Cement',
          supplier: 'Mr Adewale Cements Store',
          quantity: '50',
          unit: 'bags',
          brand: 'Dangote',
          totalPrice: 500_000,
          photoUrl: demoMarketingImage('lagos-building-permits-image.png'),
        },
        {
          name: 'Transportation',
          supplier: 'Mr Stevens of GiG',
          quantity: '5',
          unit: 'pieces',
          brand: 'God Is Good Trucks',
          totalPrice: 150_000,
          photoUrl: demoMarketingImage('renovate-in-nigeria-from-abroad.png'),
        },
      ],
      team: [
        {
          name: 'Adesanya Emmanuel',
          role: 'DPC Expert',
          email: 'okunolafemi8@gmail.com',
          phone: '+2348000000000',
          photoUrl: demoMarketingImage('adaptive-icon.png'),
          compensationLabel: '₦300,000/fixed',
        },
      ],
      files: [
        {
          id: 'demo-file-1',
          name: 'Foundation in Progress',
          fileType: 'image',
          dateLabel: '4/12/2026',
        },
        {
          id: 'demo-file-2',
          name: 'Foundation Progress',
          fileType: 'video',
          dateLabel: '4/12/2026',
        },
      ],
    },
    {
      id: 'demo-stage-2',
      order: 2,
      name: 'Framing & Structural',
      shortTitle: 'Framing',
      uiStatus: 'in_progress',
      estimatedDuration: '6-8 weeks',
      estimatedCost: 440_000,
      materials: [],
      team: [],
      files: [],
    },
    {
      id: 'demo-stage-3',
      order: 3,
      name: 'Rough-in (MEP)',
      shortTitle: 'Rough-in (MEP)',
      uiStatus: 'not_started',
      estimatedDuration: '4-5 weeks',
      estimatedCost: 400_000,
      materials: [],
      team: [],
      files: [],
    },
    {
      id: 'demo-stage-4',
      order: 4,
      name: 'Insulation & Drywall',
      shortTitle: 'Insulation & Drywall',
      uiStatus: 'not_started',
      estimatedDuration: '3-4 weeks',
      estimatedCost: 300_000,
      materials: [],
      team: [],
      files: [],
    },
    {
      id: 'demo-stage-5',
      order: 5,
      name: 'Interior Finishes',
      shortTitle: 'Interior Finishes',
      uiStatus: 'not_started',
      estimatedDuration: '6-8 weeks',
      estimatedCost: 550_000,
      materials: [],
      team: [],
      files: [],
    },
    {
      id: 'demo-stage-6',
      order: 6,
      name: 'Exterior & Landscaping',
      shortTitle: 'Exterior & Landscaping',
      uiStatus: 'not_started',
      estimatedDuration: '3-4 weeks',
      estimatedCost: 220_000,
      materials: [],
      team: [],
      files: [],
    },
  ] satisfies DemoStage[],

  chatThread: {
    stageLabel: 'Framing & Structural Stage',
    messages: [
      {
        id: 'm1',
        sender: 'homeowner',
        message: 'Hello, when are we starting?',
        dateLabel: 'Apr 5',
        read: true,
      },
      {
        id: 'm2',
        sender: 'gc',
        message: 'We have started already by getting the necessary permits from',
        dateLabel: 'Apr 5',
      },
      {
        id: 'm3',
        sender: 'gc',
        message: 'the local government.',
        dateLabel: 'Apr 5',
      },
      {
        id: 'm4',
        sender: 'homeowner',
        message: 'Okay',
        dateLabel: 'Apr 5',
        read: true,
      },
    ] satisfies DemoChatMessage[],
  },

  trustPoints: [
    'Each stage is visible and ordered clearly',
    'The GC adds items and updates inside the active stage',
    'The homeowner receives notifications when something changes',
    'Chat is tied to the project workflow',
    'The homeowner influences payment progression through satisfaction confirmation',
  ],
} as const;

export function getDemoStageById(id: string): DemoStage | undefined {
  return projectMonitoringDemoData.stages.find((s) => s.id === id);
}

export function getDemoCurrentStageForDashboard(): DemoStage {
  const inProgress = projectMonitoringDemoData.stages.find((s) => s.uiStatus === 'in_progress');
  return inProgress ?? projectMonitoringDemoData.stages[0];
}

/** SEO / marketing preview components (separate from the interactive phone demo). */
export type StageTrackerItem = {
  stage: string;
  status: 'completed' | 'in_progress' | 'up_next';
  note: string;
};

export type ProjectOverview = {
  projectName: string;
  location: string;
  type: string;
  currentStage: string;
  completion: number;
  budgetBand: string;
  lastUpdate: string;
};
