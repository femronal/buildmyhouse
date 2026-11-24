/**
 * Visual catalogue for the Growth overview shell.
 * These modules are still coming soon. Live tools are linked from the Growth page.
 */
export type GrowthModuleStatus = 'coming-soon';

export type GrowthModuleIcon =
  | 'partnerships'
  | 'referrals'
  | 'affiliates'
  | 'leads'
  | 'campaigns'
  | 'dashboard';

export type GrowthModule = {
  id: string;
  title: string;
  description: string;
  futureHint: string;
  status: GrowthModuleStatus;
  icon: GrowthModuleIcon;
};

export const GROWTH_STATUS_LABEL = 'Coming Soon';

export const GROWTH_MODULES: readonly GrowthModule[] = [
  {
    id: 'leads',
    title: 'Leads',
    description:
      'The future home for homeowner, business and institutional opportunities that require follow-up.',
    futureHint: 'Qualification, ownership, status and conversion.',
    status: 'coming-soon',
    icon: 'leads',
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    description:
      'Track growth initiatives across content, outreach, partnerships, events and paid acquisition.',
    futureHint: 'Campaign source, performance and conversion.',
    status: 'coming-soon',
    icon: 'campaigns',
  },
  {
    id: 'dashboard',
    title: 'Growth Dashboard',
    description:
      'A future view of how BuildMyHouse acquires customers and which channels create meaningful business outcomes.',
    futureHint: 'Performance data will appear when Growth modules go live.',
    status: 'coming-soon',
    icon: 'dashboard',
  },
] as const;
