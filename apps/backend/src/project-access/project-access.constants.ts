import { ProjectType } from '@prisma/client';

export type ProjectTemplateStage = {
  name: string;
  estimatedCost: number;
  estimatedDuration: string;
};

export const DEFAULT_PROJECT_TEMPLATES: Array<{
  name: string;
  slug: string;
  projectType: ProjectType;
  description: string;
  defaultBudget: number;
  sortOrder: number;
  stages: ProjectTemplateStage[];
}> = [
  {
    name: 'Home Repair (3 stages)',
    slug: 'home-repair-3-stage',
    projectType: 'renovation',
    description: 'Quick repair flow for electrical, plumbing, or appliance fixes.',
    defaultBudget: 20000,
    sortOrder: 1,
    stages: [
      { name: 'Identify Problem', estimatedCost: 7000, estimatedDuration: '1 hour' },
      { name: 'Buy Materials', estimatedCost: 5000, estimatedDuration: '2 hours' },
      { name: 'Complete Repair Work', estimatedCost: 8000, estimatedDuration: '1 hour' },
    ],
  },
  {
    name: 'Appliance Repair (6 stages)',
    slug: 'appliance-repair-6-stage',
    projectType: 'renovation',
    description: 'Structured appliance repair with procurement and testing.',
    defaultBudget: 76000,
    sortOrder: 2,
    stages: [
      { name: 'Machine Inspection & Fault Diagnosis', estimatedCost: 3000, estimatedDuration: '1 day' },
      { name: 'Scope Definition & Part Planning', estimatedCost: 1000, estimatedDuration: '1 day' },
      { name: 'Part Procurement', estimatedCost: 55000, estimatedDuration: '2-3 days' },
      { name: 'Repair Work', estimatedCost: 15000, estimatedDuration: '1-2 days' },
      { name: 'Function Testing & Safety Check', estimatedCost: 1000, estimatedDuration: '1 day' },
      { name: 'Cleanup & Final Handover', estimatedCost: 1000, estimatedDuration: '1 day' },
    ],
  },
  {
    name: 'Renovation (5 stages)',
    slug: 'renovation-5-stage',
    projectType: 'renovation',
    description: 'Room or partial-home renovation with procurement and finishing.',
    defaultBudget: 2500000,
    sortOrder: 3,
    stages: [
      { name: 'Site Assessment & Scope Lock', estimatedCost: 150000, estimatedDuration: '3-5 days' },
      { name: 'Materials Procurement', estimatedCost: 900000, estimatedDuration: '1-2 weeks' },
      { name: 'Construction Works', estimatedCost: 1100000, estimatedDuration: '2-4 weeks' },
      { name: 'Quality Check & Snagging', estimatedCost: 200000, estimatedDuration: '3-5 days' },
      { name: 'Final Handover', estimatedCost: 150000, estimatedDuration: '1-2 days' },
    ],
  },
  {
    name: 'Interior Design (4 stages)',
    slug: 'interior-design-4-stage',
    projectType: 'interior_design',
    description: 'Design-led fit-out with procurement and installation.',
    defaultBudget: 1800000,
    sortOrder: 4,
    stages: [
      { name: 'Design Brief & Moodboard', estimatedCost: 200000, estimatedDuration: '1 week' },
      { name: 'Procurement & Fabrication', estimatedCost: 900000, estimatedDuration: '2-3 weeks' },
      { name: 'Installation', estimatedCost: 550000, estimatedDuration: '1-2 weeks' },
      { name: 'Styling & Handover', estimatedCost: 150000, estimatedDuration: '2-3 days' },
    ],
  },
];

export function getHomeownerAppBaseUrl(): string {
  return (
    process.env.HOMEOWNER_WEB_URL ||
    process.env.EXPO_PUBLIC_WEB_URL ||
    'https://buildmyhouse.app'
  ).replace(/\/+$/, '');
}

export function getGcAppBaseUrl(): string {
  return (process.env.GC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');
}

export function buildAccessUrl(role: 'homeowner' | 'general_contractor', rawToken: string): string {
  const base = role === 'homeowner' ? getHomeownerAppBaseUrl() : getGcAppBaseUrl();
  return `${base}/access/${rawToken}`;
}

export function buildPostAccessRedirect(
  role: 'homeowner' | 'general_contractor',
  projectId: string,
): string {
  if (role === 'general_contractor') {
    return `/contractor/gc-project-detail?id=${projectId}`;
  }
  return `/dashboard?projectId=${projectId}`;
}
