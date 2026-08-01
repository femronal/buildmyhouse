'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import { usePiSearchDemand } from '@/hooks/usePriceIntelligence';
import { priceIntelligenceApi } from '@/lib/price-intelligence-api';

export default function SearchDemandPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = usePiSearchDemand();
  const [mapInputs, setMapInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const mapMut = useMutation({
    mutationFn: ({ id, familyKey }: { id: string; familyKey: string }) =>
      priceIntelligenceApi.updateUnmatchedTerm(id, {
        status: 'mapped',
        suggestedFamilyKey: familyKey,
      }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Term mapped to family' });
      void qc.invalidateQueries({ queryKey: ['pi', 'search-demand'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PiPageHeader title="Search Demand" />
        <p className="text-sm text-gray-500">Loading demand…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <PiPageHeader title="Search Demand" />
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PiPageHeader
        title="Search Demand"
        description="Unmatched queries and insufficient-data demand — prioritize what to fix next."
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Unmatched queries</h2>
          </div>
          {data.unmatchedQueries.length === 0 ? (
            <PiEmptyState title="No unmatched query aggregates" />
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Query</th>
                  <th className="px-3 py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.unmatchedQueries.map((row) => (
                  <tr key={row.normalizedQuery}>
                    <td className="px-3 py-2">{row.normalizedQuery}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Insufficient-data demand</h2>
          </div>
          {data.insufficientDataDemand.length === 0 ? (
            <PiEmptyState title="No insufficient-data demand" />
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Label</th>
                  <th className="px-3 py-2 text-left">Family</th>
                  <th className="px-3 py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.insufficientDataDemand.map((row) => (
                  <tr key={`${row.familyKey}-${row.label}`}>
                    <td className="px-3 py-2">{row.label}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {row.familyKey || '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Unmatched terms — map to family</h2>
        </div>
        {data.unmatchedTerms.length === 0 ? (
          <PiEmptyState title="No open unmatched terms" />
        ) : (
          <div className="divide-y">
            {data.unmatchedTerms.map((term) => (
              <div
                key={term.id}
                className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{term.normalizedTerm}</p>
                  <p className="text-xs text-gray-500">
                    Sample: {term.sampleRawQuery} · {term.requestCount} requests
                    {term.paidIntentCount ? ` · ${term.paidIntentCount} paid intent` : ''}
                  </p>
                  <StatusBadge status={term.status} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={mapInputs[term.id] ?? term.suggestedFamilyKey ?? ''}
                    onChange={(e) =>
                      setMapInputs((prev) => ({ ...prev, [term.id]: e.target.value }))
                    }
                    placeholder="familyKey"
                    className="rounded-lg border px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={
                      !(mapInputs[term.id] ?? term.suggestedFamilyKey)?.trim() ||
                      mapMut.isPending
                    }
                    onClick={() =>
                      mapMut.mutate({
                        id: term.id,
                        familyKey: (mapInputs[term.id] ?? term.suggestedFamilyKey ?? '').trim(),
                      })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Custom product requests</h2>
        </div>
        {data.customRequests.length === 0 ? (
          <PiEmptyState title="No custom requests" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Query</th>
                <th className="px-3 py-2 text-right">Requests</th>
                <th className="px-3 py-2 text-right">Paid intent</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.customRequests.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">{row.rawQuery}</td>
                  <td className="px-3 py-2 text-right">{row.requestCount}</td>
                  <td className="px-3 py-2 text-right">{row.paidIntentCount}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
