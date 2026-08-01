'use client';

const GREEN = new Set([
  'approved',
  'resolved',
  'closed',
  'healthy',
  'active',
  'verified',
  'mapped',
  'complete',
]);
const AMBER = new Set([
  'open',
  'assigned',
  'in_review',
  'awaiting_information',
  'submitted',
  'pending',
  'draft',
  'degraded',
  'unknown',
  'corrected',
  'reopened',
  'partially_approved',
  'single_source',
  'escalated',
]);
const RED = new Set([
  'rejected',
  'failing',
  'disabled',
  'insufficient_data',
  'critical',
  'ignored',
]);

function toneFor(status: string): string {
  const key = status.toLowerCase();
  if (GREEN.has(key)) return 'bg-green-100 text-green-800';
  if (RED.has(key)) return 'bg-red-100 text-red-800';
  if (AMBER.has(key)) return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}

type StatusBadgeProps = {
  status?: string | null;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${toneFor(status)}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
