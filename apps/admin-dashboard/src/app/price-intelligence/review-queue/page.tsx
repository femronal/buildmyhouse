'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import PriorityBadge from '@/components/price-intelligence/PriorityBadge';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import { usePiReviewQueue } from '@/hooks/usePriceIntelligence';
import type { ReviewQueueParams } from '@/lib/price-intelligence-api';

const PAGE_SIZE = 25;

const STATUSES = [
  '',
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
];

const PRIORITIES = ['', 'critical', 'high', 'medium', 'low'];
const CASE_TYPES = [
  '',
  'low_confidence',
  'insufficient_data',
  'outlier',
  'source_failure',
  'manual_entry',
  'merchant_submission',
  'customer_dispute',
  'catalogue',
];

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [priority, setPriority] = useState(searchParams.get('priority') ?? '');
  const [caseType, setCaseType] = useState(searchParams.get('caseType') ?? '');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [overdueOnly, setOverdueOnly] = useState(
    searchParams.get('overdueOnly') === 'true',
  );
  const [sort, setSort] = useState<ReviewQueueParams['sort']>(
    (searchParams.get('sort') as ReviewQueueParams['sort']) || 'priority',
  );
  const [page, setPage] = useState(0);

  const params: ReviewQueueParams = useMemo(
    () => ({
      status: status || undefined,
      priority: priority || undefined,
      caseType: caseType || undefined,
      q: q.trim() || undefined,
      overdueOnly: overdueOnly || undefined,
      sort,
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    [status, priority, caseType, q, overdueOnly, sort, page],
  );

  const { data, isLoading, isError, error } = usePiReviewQueue(params);
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <PiPageHeader
        title="Review Queue"
        description="Flagged outliers, low-confidence results, and intake cases awaiting human review."
      />

      <div className="sticky top-0 z-10 space-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:top-0">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs text-gray-500">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                placeholder="Product, family, case id…"
                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s || 'all'} value={s}>
                  {s ? s.replace(/_/g, ' ') : 'All'}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Priority
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p || 'all'} value={p}>
                  {p || 'All'}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Case type
            <select
              value={caseType}
              onChange={(e) => {
                setCaseType(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {CASE_TYPES.map((t) => (
                <option key={t || 'all'} value={t}>
                  {t ? t.replace(/_/g, ' ') : 'All'}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ReviewQueueParams['sort'])}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              <option value="priority">Priority</option>
              <option value="dueAt">Due date</option>
              <option value="openedAt">Opened</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked);
                setPage(0);
              }}
              className="rounded border-gray-300 text-blue-600"
            />
            Overdue only
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading queue…</p>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load queue'}
          </p>
        ) : !data?.items.length ? (
          <PiEmptyState
            title="No cases match these filters"
            description="Adjust filters or clear overdue-only to see more of the queue."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Confidence</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Assigned</th>
                  <th className="px-3 py-2 font-medium">Due</th>
                  <th className="px-3 py-2 font-medium">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((row) => {
                  const overdue =
                    row.dueAt &&
                    new Date(row.dueAt) < new Date() &&
                    !['closed', 'resolved'].includes(row.status);
                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        router.push(`/price-intelligence/review-queue/${row.id}`)
                      }
                      className="cursor-pointer hover:bg-blue-50/50"
                    >
                      <td className="px-3 py-2">
                        <PriorityBadge priority={row.priority} />
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {row.caseType.replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">
                          {row.productLabel || '—'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {row.productFamilyKey || ''}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.locationKey || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-gray-700">
                          {row.confidenceLabel || '—'}
                          {row.confidenceScore != null
                            ? ` (${Math.round(row.confidenceScore)})`
                            : ''}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {row.assignedReviewer?.fullName || 'Unassigned'}
                      </td>
                      <td
                        className={`px-3 py-2 text-xs ${
                          overdue ? 'font-semibold text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {formatDate(row.dueAt)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {formatDate(row.openedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
          <span className="text-gray-500">
            {total} case{total === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
