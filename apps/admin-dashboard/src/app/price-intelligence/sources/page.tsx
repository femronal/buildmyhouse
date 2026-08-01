'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import { usePiSources } from '@/hooks/usePriceIntelligence';
import { priceIntelligenceApi } from '@/lib/price-intelligence-api';
import { useState } from 'react';

export default function SourceHealthPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = usePiSources();
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['pi', 'sources'] });

  const disableMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      priceIntelligenceApi.disableSource(id, { reason }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Source disabled' });
      invalidate();
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const enableMut = useMutation({
    mutationFn: (id: string) => priceIntelligenceApi.enableSource(id),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Source enabled' });
      invalidate();
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const recheckMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      priceIntelligenceApi.recheckSource(id, { note }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Recheck snapshot recorded' });
      invalidate();
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <PiPageHeader
        title="Source Health"
        description="Monitor which sources are healthy, degraded, failing, or manually disabled."
      />

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.tone === 'ok'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading sources…</p>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed'}
          </p>
        ) : items.length === 0 ? (
          <PiEmptyState title="No sources registered" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Health</th>
                  <th className="px-3 py-2">Obs</th>
                  <th className="px-3 py-2">Failures</th>
                  <th className="px-3 py-2">Disabled reason</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((src) => (
                  <tr key={src.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">{src.name}</p>
                      <p className="text-xs text-gray-400">{src.code}</p>
                    </td>
                    <td className="px-3 py-2">{src.tier}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={src.healthStatus} />
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {src._count?.observations ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {src.consecutiveFailures ?? 0}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2 text-xs text-gray-500">
                      {src.disabledReason || '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {src.disabledAt || src.healthStatus === 'disabled' ? (
                          <button
                            type="button"
                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                            onClick={() => enableMut.mutate(src.id)}
                          >
                            Enable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            onClick={() => {
                              const reason = window.prompt('Disable reason (required)');
                              if (!reason?.trim()) return;
                              disableMut.mutate({ id: src.id, reason: reason.trim() });
                            }}
                          >
                            Disable
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                          onClick={() => {
                            const note =
                              window.prompt('Optional recheck note') || undefined;
                            recheckMut.mutate({ id: src.id, note });
                          }}
                        >
                          Recheck
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
