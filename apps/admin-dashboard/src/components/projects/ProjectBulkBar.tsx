'use client';

export function ProjectBulkBar({
  count,
  onExport,
  onArchive,
  onClear,
}: {
  count: number;
  onExport: () => void;
  onArchive: () => void;
  onClear: () => void;
}) {
  if (count < 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-950 px-4 py-3 text-white">
      <p className="text-sm font-medium">{count} selected</p>
      <button type="button" className="min-h-11 rounded-lg border border-white/30 px-3 text-sm" onClick={onExport}>Export CSV</button>
      <button type="button" className="min-h-11 rounded-lg bg-white px-3 text-sm font-medium text-gray-950" onClick={onArchive}>Archive</button>
      <button type="button" className="min-h-11 px-3 text-sm" onClick={onClear}>Clear</button>
    </div>
  );
}
