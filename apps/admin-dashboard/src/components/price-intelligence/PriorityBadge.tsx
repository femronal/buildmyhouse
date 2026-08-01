'use client';

const STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-amber-100 text-amber-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-700',
};

type PriorityBadgeProps = {
  priority?: string | null;
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return <span className="text-xs text-gray-400">—</span>;
  const key = priority.toLowerCase();
  const style = STYLES[key] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${style}`}>
      {priority.replace(/_/g, ' ')}
    </span>
  );
}
