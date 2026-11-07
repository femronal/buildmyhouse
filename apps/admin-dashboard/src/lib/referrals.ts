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
  applicationStatus?: 'none' | 'applied' | 'approved' | 'suspended';
  createdAt: string;
  archivedAt: string | null;
};

export type CommissionRow = {
  id: string;
  eligibleContractorAmount: number;
  controllingFeeAmount: number;
  contingencyAmount: number;
  rateBps: number;
  amount: number;
  status: 'awaiting_checks' | 'needs_review' | 'approved' | 'paid' | 'reversed';
  reviewReasons?: string | null;
  calculatedAt: string;
  approvedAt?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  reversalReason?: string | null;
  referrer?: { id: string; name: string; code: string; type: string };
  homeowner?: { id: string; fullName: string; email: string };
  project?: { id: string; name: string; status: string; state?: string | null };
};

export function naira(value?: number | null) {
  return `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export function commissionStatusLabel(status?: string | null) {
  if (status === 'awaiting_checks') return 'Awaiting checks';
  if (status === 'needs_review') return 'Needs review';
  if (status === 'approved') return 'Approved';
  if (status === 'paid') return 'Paid';
  if (status === 'reversed') return 'Reversed';
  return status || '—';
}

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
