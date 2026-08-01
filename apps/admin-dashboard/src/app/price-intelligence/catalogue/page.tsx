'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import {
  usePiCatalogueFamilies,
  usePiCatalogueOverview,
} from '@/hooks/usePriceIntelligence';
import { priceIntelligenceApi } from '@/lib/price-intelligence-api';

export default function CataloguePage() {
  const qc = useQueryClient();
  const familiesQ = usePiCatalogueFamilies();
  const overviewQ = usePiCatalogueOverview();
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [aliasForm, setAliasForm] = useState({ familyKey: '', alias: '' });
  const [brandName, setBrandName] = useState('');
  const [deactivateForm, setDeactivateForm] = useState({
    familyKey: '',
    productKey: '',
    reason: '',
  });

  const createAlias = useMutation({
    mutationFn: () => priceIntelligenceApi.createAlias(aliasForm),
    onSuccess: (res) => {
      const impact =
        res.impactWarnings != null
          ? ` Impact: ${JSON.stringify(res.impactWarnings)}`
          : '';
      setMessage({ tone: 'ok', text: `Alias created.${impact}` });
      setAliasForm({ familyKey: '', alias: '' });
      void qc.invalidateQueries({ queryKey: ['pi', 'catalogue'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const createBrand = useMutation({
    mutationFn: () => priceIntelligenceApi.createBrand({ name: brandName }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Brand upserted' });
      setBrandName('');
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const deactivateProduct = useMutation({
    mutationFn: () => priceIntelligenceApi.deactivateProduct(deactivateForm),
    onSuccess: (res) => {
      setMessage({
        tone: 'ok',
        text: `Product deactivated. ${typeof res === 'object' ? JSON.stringify(res) : ''}`,
      });
      setDeactivateForm({ familyKey: '', productKey: '', reason: '' });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const families = familiesQ.data ?? [];

  return (
    <div className="space-y-6">
      <PiPageHeader
        title="Catalogue"
        description="Add aliases and brands, or deactivate products — with impact awareness."
      />

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm break-words ${
            message.tone === 'ok'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {overviewQ.data ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-600 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-gray-900">Catalogue overview</p>
          <pre className="max-h-40 overflow-auto">{JSON.stringify(overviewQ.data, null, 2)}</pre>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Add alias</h2>
          <label className="block text-xs text-gray-500">
            Family key
            <select
              value={aliasForm.familyKey}
              onChange={(e) => setAliasForm((s) => ({ ...s, familyKey: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {families.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.key}
                  {f.name ? ` — ${String(f.name)}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-gray-500">
            Alias
            <input
              value={aliasForm.alias}
              onChange={(e) => setAliasForm((s) => ({ ...s, alias: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={!aliasForm.familyKey || !aliasForm.alias.trim() || createAlias.isPending}
            onClick={() => createAlias.mutate()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Create alias
          </button>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Add brand</h2>
          <label className="block text-xs text-gray-500">
            Brand name
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={!brandName.trim() || createBrand.isPending}
            onClick={() => createBrand.mutate()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Upsert brand
          </button>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Deactivate product</h2>
          <label className="block text-xs text-gray-500">
            Family key
            <select
              value={deactivateForm.familyKey}
              onChange={(e) =>
                setDeactivateForm((s) => ({ ...s, familyKey: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {families.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.key}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-gray-500">
            Product key
            <input
              value={deactivateForm.productKey}
              onChange={(e) =>
                setDeactivateForm((s) => ({ ...s, productKey: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-gray-500">
            Reason
            <input
              value={deactivateForm.reason}
              onChange={(e) =>
                setDeactivateForm((s) => ({ ...s, reason: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={
              !deactivateForm.familyKey ||
              !deactivateForm.productKey ||
              !deactivateForm.reason.trim() ||
              deactivateProduct.isPending
            }
            onClick={() => {
              if (!window.confirm('Deactivate this product?')) return;
              deactivateProduct.mutate();
            }}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Deactivate
          </button>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Families ({families.length})</h2>
        </div>
        {familiesQ.isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading families…</p>
        ) : families.length === 0 ? (
          <PiEmptyState title="No families loaded" />
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {families.map((f) => (
                  <tr key={f.key}>
                    <td className="px-3 py-2 font-mono text-xs">{f.key}</td>
                    <td className="px-3 py-2">{String(f.name ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
