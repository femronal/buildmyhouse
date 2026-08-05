const STATUS_STYLES: Record<string, string> = {
  invited: 'bg-amber-50 text-amber-800',
  active: 'bg-green-50 text-green-700',
  suspended: 'bg-orange-50 text-orange-800',
  revoked: 'bg-red-50 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

export function StatusBadge({ status }: { status?: string | null }) {
  const key = String(status || 'unknown');
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[key] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {key}
    </span>
  );
}

export function RoleBadge({ name, isSuper }: { name: string; isSuper?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isSuper ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
      }`}
    >
      {name}
    </span>
  );
}

export function CriticalBadge() {
  return (
    <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
      Critical
    </span>
  );
}
