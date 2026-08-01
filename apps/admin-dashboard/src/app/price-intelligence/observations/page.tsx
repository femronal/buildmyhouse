'use client';

import { useState } from 'react';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import { usePiObservations } from '@/hooks/usePriceIntelligence';

const PAGE_SIZE = 25;

function formatMoney(value: unknown) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `₦${n.toLocaleString()}`;
}

export default function PiObservationsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const { data, isLoading, isError, error } = usePiObservations({
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
    status: status || undefined,
    reviewStatus: reviewStatus || undefined,
  });

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <PiPageHeader
        title="Observations"
        description="Append-only price observations powering research and reports."
      />

      <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border px-2 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="active">active</option>
            <option value="superseded">superseded</option>
            <option value="rejected">rejected</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Review status
          <select
            value={reviewStatus}
            onChange={(e) => {
              setReviewStatus(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border px-2 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading observations…</p>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        ) : !data?.items.length ? (
          <PiEmptyState title="No observations" description="Try clearing filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Wording</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Family</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Review</th>
                  <th className="px-3 py-2">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((obs) => (
                  <tr key={obs.id} className="hover:bg-gray-50">
                    <td className="max-w-[220px] px-3 py-2">
                      <p className="truncate font-medium text-gray-900">
                        {obs.originalWording}
                      </p>
                      <p className="text-xs text-gray-400">{obs.seller?.name || ''}</p>
                    </td>
                    <td className="px-3 py-2">{formatMoney(obs.originalPrice)}</td>
                    <td className="px-3 py-2 text-xs">{obs.originalUnitCode}</td>
                    <td className="px-3 py-2 text-xs">{obs.family?.key || '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      {obs.source?.code || '—'}
                      {obs.source ? (
                        <span className="ml-1">
                          <StatusBadge status={obs.source.healthStatus} />
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={obs.status} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={obs.reviewStatus} />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(obs.checkedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <span className="text-gray-500">{total} observations</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="self-center text-xs text-gray-500">
              Page {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
