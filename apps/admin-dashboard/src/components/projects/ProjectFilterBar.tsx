'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { PAYMENT_LABELS, type ProjectFilters, type ProjectTab } from './project-list-rules';

const SORTS = [
  ['needs_first', 'Needs you first'],
  ['updated', 'Last update'],
  ['stalest', 'Stalest'],
  ['progress', 'Progress'],
  ['budget', 'Budget'],
  ['name', 'Name'],
];

const SHOW = [
  ['', 'Show'],
  ['extra', 'Extra monitoring'],
  ['approval', 'Homeowner approval due'],
  ['managed', 'Managed by admin'],
];

export function ProjectFilterBar({
  tab,
  filters,
  sortBy,
  gcNames,
  onChange,
  onSort,
  onClear,
  onLeaveDraftsHidden,
}: {
  tab: ProjectTab;
  filters: ProjectFilters;
  sortBy: string;
  gcNames: string[];
  onChange: (patch: Partial<ProjectFilters>) => void;
  onSort: (sort: string) => void;
  onClear: () => void;
  onLeaveDraftsHidden: () => void;
}) {
  const [sheet, setSheet] = useState(false);
  const showHideChip = tab === 'needs_attention' || tab === 'active' || tab === 'paused' || tab === 'completed';
  const chips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (filters.q) chips.push({ key: 'q', label: filters.q, clear: () => onChange({ q: '' }) });
  if (filters.risk) chips.push({ key: 'risk', label: filters.risk, clear: () => onChange({ risk: '' }) });
  if (filters.gc) chips.push({ key: 'gc', label: filters.gc === '__unmatched__' ? 'Not matched' : filters.gc, clear: () => onChange({ gc: '' }) });
  if (filters.pay) chips.push({ key: 'pay', label: PAYMENT_LABELS[filters.pay] || filters.pay, clear: () => onChange({ pay: '' }) });
  if (filters.show) chips.push({ key: 'show', label: SHOW.find((item) => item[0] === filters.show)?.[1] || filters.show, clear: () => onChange({ show: '' }) });

  const controls = (
    <>
      <select aria-label="Risk" value={filters.risk} onChange={(event) => onChange({ risk: event.target.value })} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm">
        <option value="">Risk</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select aria-label="GC" value={filters.gc} onChange={(event) => onChange({ gc: event.target.value })} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm">
        <option value="">GC</option>
        <option value="__unmatched__">Not matched</option>
        {gcNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <select aria-label="Payment" value={filters.pay} onChange={(event) => onChange({ pay: event.target.value })} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm">
        <option value="">Payment</option>
        {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select aria-label="Show" value={filters.show} onChange={(event) => onChange({ show: event.target.value })} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm">
        {SHOW.map(([value, label]) => (
          <option key={value || 'all'} value={value}>{label}</option>
        ))}
      </select>
      <select aria-label="Sort" value={sortBy || 'needs_first'} onChange={(event) => onSort(event.target.value)} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm">
        {SORTS.map(([value, label]) => (
          <option key={value} value={value}>{value === 'needs_first' ? 'Sort: Needs you first' : label}</option>
        ))}
      </select>
    </>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filters.q}
            onChange={(event) => onChange({ q: event.target.value })}
            placeholder="Search project, homeowner, GC, BMH id"
            className="min-h-11 w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm md:hidden" onClick={() => setSheet(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        <div className="hidden flex-wrap gap-2 md:flex">{controls}</div>
      </div>
      {showHideChip || chips.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {showHideChip ? (
            <button type="button" onClick={onLeaveDraftsHidden} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-gray-100 px-3 text-xs text-gray-700">
              Hide drafts and tests
              <X className="h-3 w-3" />
            </button>
          ) : null}
          {chips.map((chip) => (
            <button key={chip.key} type="button" onClick={chip.clear} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-gray-100 px-3 text-xs text-gray-700">
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          {chips.length ? (
            <button type="button" onClick={onClear} className="text-xs font-medium text-gray-700 underline">Clear all</button>
          ) : null}
        </div>
      ) : null}
      {sheet ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close filters" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 space-y-3 rounded-t-2xl bg-white p-4 pb-8">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">Filters</p>
              <button type="button" aria-label="Close" className="flex h-11 w-11 items-center justify-center" onClick={() => setSheet(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-2">{controls}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
