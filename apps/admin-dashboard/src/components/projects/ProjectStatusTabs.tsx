'use client';

import { TAB_LABELS, TAB_ORDER, type ProjectTab } from './project-list-rules';

export function ProjectStatusTabs({
  tab,
  counts,
  onChange,
}: {
  tab: ProjectTab;
  counts: Record<ProjectTab, number>;
  onChange: (tab: ProjectTab) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:gap-x-5 md:gap-y-2 md:overflow-visible md:pb-0">
      {TAB_ORDER.map((key) => {
        const selected = tab === key;
        const count = counts[key] || 0;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(key)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm md:rounded-none md:px-0 ${
              selected ? 'bg-gray-950 font-semibold text-white md:bg-transparent md:text-gray-950' : 'border border-gray-200 bg-white text-gray-600 md:border-0 md:bg-transparent'
            }`}
          >
            <span>{TAB_LABELS[key]}</span>
            {key === 'needs_attention' && count > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">{count}</span>
            ) : (
              <span className={selected ? 'text-white md:text-gray-500' : 'text-gray-400'}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
