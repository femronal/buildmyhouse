export type ReviewReasonBucket = 'low' | 'high';

export type ContractorSpecialtyCategory =
  | 'repairer'
  | 'upgrader'
  | 'renovator'
  | 'general_contractor'
  | 'unknown';

type ReasonSet = {
  low: string[];
  high: string[];
};

const REASON_CATALOG: Record<ContractorSpecialtyCategory, ReasonSet> = {
  repairer: {
    low: [
      'Misdiagnosed the issue',
      'Temporary fix failed quickly',
      'Poor finishing after repair',
      'Unclear repair scope or cost',
      'Slow response for urgent fault',
      'Unsafe repair approach',
      'Other',
    ],
    high: [
      'Accurate issue diagnosis',
      'Permanent fix quality',
      'Fast emergency response',
      'Clear repair explanation',
      'Clean and tidy after repair',
      'Fair and transparent pricing',
      'Other',
    ],
  },
  upgrader: {
    low: [
      'Upgrade did not meet expected quality',
      'Poor material recommendations',
      'Weak workmanship details',
      'Budget overruns without clarity',
      'Timeline delays with little communication',
      'Upgrade choices ignored',
      'Other',
    ],
    high: [
      'Great quality upgrade outcome',
      'Strong design and material suggestions',
      'Excellent finishing details',
      'Good value for upgrade budget',
      'Delivered upgrade on time',
      'Clear guidance through upgrade decisions',
      'Other',
    ],
  },
  renovator: {
    low: [
      'Renovation scope poorly managed',
      'Substandard workmanship',
      'Messy or unsafe site handling',
      'Major delays across renovation stages',
      'Weak communication on change orders',
      'Unexpected costs without justification',
      'Other',
    ],
    high: [
      'Renovation delivered to plan',
      'Excellent workmanship quality',
      'Clean and safe site management',
      'Strong schedule discipline',
      'Clear updates through each stage',
      'Transparent cost management',
      'Other',
    ],
  },
  general_contractor: {
    low: [
      'Poor coordination of workers',
      'Weak project supervision',
      'Missed critical deadlines',
      'Low build quality control',
      'Communication gaps during project',
      'Cost and billing disputes',
      'Other',
    ],
    high: [
      'Strong team coordination',
      'Excellent site supervision',
      'Reliable deadline management',
      'High quality control standards',
      'Clear and proactive communication',
      'Transparent billing and cost control',
      'Other',
    ],
  },
  unknown: {
    low: [
      'Poor communication',
      'Late delivery',
      'Work quality below expectations',
      'Scope was not followed',
      'Cost transparency issues',
      'Other',
    ],
    high: [
      'Excellent communication',
      'Delivered on time',
      'High quality work',
      'Followed agreed scope',
      'Transparent pricing',
      'Other',
    ],
  },
};

const SPECIALTY_LABELS: Record<ContractorSpecialtyCategory, string> = {
  repairer: 'Repairer',
  upgrader: 'Upgrader',
  renovator: 'Renovator',
  general_contractor: 'General Contractor',
  unknown: 'General Contractor',
};

export function normalizeContractorSpecialtyCategory(
  value?: string | null,
): ContractorSpecialtyCategory {
  const category = String(value || '').trim().toLowerCase();
  if (category === 'repairer') return 'repairer';
  if (category === 'upgrader') return 'upgrader';
  if (category === 'renovator') return 'renovator';
  if (category === 'general_contractor') return 'general_contractor';
  return 'unknown';
}

export function getReviewReasonBucket(rating: number): ReviewReasonBucket {
  return rating <= 3 ? 'low' : 'high';
}

export function getContractorReviewReasonOptions(params: {
  category?: string | null;
  rating: number;
}) {
  const category = normalizeContractorSpecialtyCategory(params.category);
  const bucket = getReviewReasonBucket(params.rating);
  const reasons = REASON_CATALOG[category][bucket];

  return {
    category,
    categoryLabel: SPECIALTY_LABELS[category],
    bucket,
    title: bucket === 'low' ? 'Sorry to hear that' : params.rating === 5 ? "That's great!" : 'Good to hear that',
    prompt:
      bucket === 'low'
        ? 'What went wrong?'
        : 'What did your contractor do well?',
    reasons,
  };
}

