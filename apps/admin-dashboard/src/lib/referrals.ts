export type ReferrerType = 'referrer' | 'affiliate';

export type ReferrerMetrics = {
  listingsCount: number;
  artisanListingsCount: number;
  professionalListingsCount: number;
  jobsCount: number;
  leadsCount: number;
  paidJobsCount: number;
  completedJobsCount: number;
  firstReferralAt: string | null;
  lastReferralAt: string | null;
};

export type ReferrerListItem = ReferrerMetrics & {
  id: string;
  type: ReferrerType;
  name: string;
  code: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  userId: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type ReferralSummary = {
  listingsCount: number;
  jobsCount: number;
  paidJobsCount: number;
  completedJobsCount: number;
  projectsWithoutReferrer: number;
  listingsWithoutReferrer: number;
  countsWhen?: string;
};

export type ReferralProgramSettings = {
  allowHomeownerTypedCode: boolean;
  linkValidityDays: number;
  attributionRule: 'first_touch' | 'latest_code';
  trackVendors: boolean;
  countsWhen: 'undecided' | 'listing' | 'job_created' | 'job_paid' | 'job_completed';
  payoutRules: string | null;
};

export function formatLagosDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  }).format(new Date(value));
}
