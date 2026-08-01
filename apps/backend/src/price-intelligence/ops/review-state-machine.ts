/**
 * Stage 8 — review case status transitions.
 * Rejects invalid transitions deterministically.
 */

export const REVIEW_STATUSES = [
  'open',
  'assigned',
  'in_review',
  'awaiting_information',
  'corrected',
  'approved',
  'rejected',
  'escalated',
  'resolved',
  'closed',
  'reopened',
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const TERMINAL: ReadonlySet<ReviewStatus> = new Set(['closed']);

/** Allowed edges: from → to[] */
const TRANSITIONS: Readonly<Record<ReviewStatus, readonly ReviewStatus[]>> = {
  open: ['assigned', 'in_review', 'escalated', 'closed', 'rejected'],
  assigned: ['in_review', 'awaiting_information', 'escalated', 'open', 'closed'],
  in_review: [
    'awaiting_information',
    'corrected',
    'approved',
    'rejected',
    'escalated',
    'resolved',
    'assigned',
  ],
  awaiting_information: ['in_review', 'assigned', 'escalated', 'closed'],
  corrected: ['resolved', 'closed', 'in_review', 'reopened'],
  approved: ['resolved', 'closed', 'reopened'],
  rejected: ['resolved', 'closed', 'reopened', 'in_review'],
  escalated: ['assigned', 'in_review', 'resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['assigned', 'in_review', 'open', 'escalated'],
};

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: ReviewStatus, to: ReviewStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: string, to: string): { from: ReviewStatus; to: ReviewStatus } {
  if (!isReviewStatus(from)) throw new Error(`Invalid review status: ${from}`);
  if (!isReviewStatus(to)) throw new Error(`Invalid review status: ${to}`);
  if (!canTransition(from, to)) {
    throw new Error(`Invalid review transition: ${from} → ${to}`);
  }
  return { from, to };
}

export function isTerminal(status: ReviewStatus): boolean {
  return TERMINAL.has(status);
}

export function allowedTransitions(from: ReviewStatus): readonly ReviewStatus[] {
  return TRANSITIONS[from];
}
