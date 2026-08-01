'use client';

import { useState } from 'react';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import { usePiAuditLog } from '@/hooks/usePriceIntelligence';

const PAGE_SIZE = 50;

export default function AuditHistoryPage() {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const { data, isLoading, isError, error } = usePiAuditLog({
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
    action: action || undefined,
    entityType: entityType || undefined,
  });

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <PiPageHeader
        title="Audit History"
        description="Append-only log of Price Intelligence admin actions."
      />

      <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Action (exact)
          <input
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            placeholder="e.g. review_case.assign"
            className="rounded-lg border px-2 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Entity type
          <input
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(0);
            }}
            placeholder="e.g. PriceReviewCase"
            className="rounded-lg border px-2 py-2 text-sm"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading audit log…</p>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed'}
          </p>
        ) : !data?.items.length ? (
          <PiEmptyState title="No audit events" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{row.action}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {row.entityType}
                      {row.entityId ? (
                        <span className="block font-mono text-[11px] text-gray-400">
                          {row.entityId}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {row.actorAdminId ? (
                        <span className="font-mono">{row.actorAdminId.slice(0, 8)}…</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-xs text-gray-600">
                      {row.reason || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <span className="text-gray-500">{total} events</span>
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
