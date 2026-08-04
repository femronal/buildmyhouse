'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload } from 'lucide-react';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import {
  usePiMerchantSubmission,
  usePiMerchantSubmissions,
  usePiMerchants,
} from '@/hooks/usePriceIntelligence';
import { priceIntelligenceApi } from '@/lib/price-intelligence-api';

type LineItem = {
  productLabel: string;
  familyKey: string;
  originalWording: string;
  originalPrice: string;
  originalUnitCode: string;
  brandName: string;
};

const emptyItem = (): LineItem => ({
  productLabel: '',
  familyKey: '',
  originalWording: '',
  originalPrice: '',
  originalUnitCode: '',
  brandName: '',
});

export default function MerchantSubmissionsPage() {
  const qc = useQueryClient();
  const merchantsQ = usePiMerchants();
  const subsQ = usePiMerchantSubmissions({ take: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQ = usePiMerchantSubmission(selectedId);
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [merchantForm, setMerchantForm] = useState({
    businessName: '',
    city: '',
    state: '',
  });

  const [subForm, setSubForm] = useState({
    merchantId: '',
    title: '',
    notes: '',
    evidenceFileRef: '',
  });
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const createMerchant = useMutation({
    mutationFn: () =>
      priceIntelligenceApi.createMerchant({
        businessName: merchantForm.businessName,
        city: merchantForm.city || undefined,
        state: merchantForm.state || undefined,
      }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Merchant created' });
      setMerchantForm({ businessName: '', city: '', state: '' });
      void qc.invalidateQueries({ queryKey: ['pi', 'merchants'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const createSub = useMutation({
    mutationFn: () =>
      priceIntelligenceApi.createMerchantSubmission({
        merchantId: subForm.merchantId || undefined,
        title: subForm.title,
        notes: subForm.notes || undefined,
        channel: 'whatsapp',
        evidenceFileRef: subForm.evidenceFileRef || undefined,
        submit: true,
        items: items.map((it) => ({
          productLabel: it.productLabel,
          familyKey: it.familyKey || undefined,
          originalWording: it.originalWording || it.productLabel,
          originalPrice: Number(it.originalPrice),
          originalUnitCode: it.originalUnitCode,
          brandName: it.brandName || undefined,
        })),
      }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Submission created' });
      setSubForm({ merchantId: '', title: '', notes: '', evidenceFileRef: '' });
      setItems([emptyItem()]);
      void qc.invalidateQueries({ queryKey: ['pi', 'merchant-submissions'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const reviewItem = useMutation({
    mutationFn: ({
      submissionId,
      itemId,
      decision,
      reason,
    }: {
      submissionId: string;
      itemId: string;
      decision: 'approve' | 'reject';
      reason?: string;
    }) => priceIntelligenceApi.reviewMerchantItem(submissionId, itemId, { decision, reason }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Item review saved' });
      void qc.invalidateQueries({ queryKey: ['pi', 'merchant-submission'] });
      void qc.invalidateQueries({ queryKey: ['pi', 'merchant-submissions'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await priceIntelligenceApi.uploadEvidence(file);
      setSubForm((s) => ({ ...s, evidenceFileRef: url }));
      setMessage({ tone: 'ok', text: 'Evidence uploaded — you can extract items with AI next' });
    } catch (e) {
      setMessage({ tone: 'err', text: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const onExtractWithAi = async () => {
    if (!subForm.evidenceFileRef) {
      setMessage({ tone: 'err', text: 'Upload a price-list image first' });
      return;
    }
    setExtracting(true);
    try {
      const result = await priceIntelligenceApi.extractMerchantListFromImage({
        imageUrl: subForm.evidenceFileRef,
        hintTitle: subForm.title || undefined,
      });
      if (result.items.length === 0) {
        setMessage({
          tone: 'err',
          text: result.warnings[0] || 'No items extracted — enter them manually',
        });
        return;
      }
      setItems(
        result.items.map((it) => ({
          productLabel: it.productLabel,
          familyKey: it.familyKey ?? '',
          originalWording: it.originalWording,
          originalPrice: String(it.originalPrice),
          originalUnitCode: it.originalUnitCode,
          brandName: it.brandName ?? '',
        })),
      );
      const warn = result.warnings.length ? ` Warnings: ${result.warnings.slice(0, 2).join(' ')}` : '';
      setMessage({
        tone: 'ok',
        text: `Extracted ${result.items.length} draft item(s) with ${result.model}. Review before submit.${warn}`,
      });
    } catch (e) {
      setMessage({ tone: 'err', text: e instanceof Error ? e.message : 'Extraction failed' });
    } finally {
      setExtracting(false);
    }
  };

  const merchants = merchantsQ.data ?? [];
  const submissions = subsQ.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PiPageHeader
        title="Merchant Submissions"
        description="Upload a merchant price list → AI drafts line items → you review → approve into observations. Consumer checks use these before live web research when enough evidence exists."
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
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Create merchant</h2>
          {(
            [
              ['businessName', 'Business name'],
              ['city', 'City'],
              ['state', 'State'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-gray-500">
              {label}
              <input
                value={merchantForm[key]}
                onChange={(e) =>
                  setMerchantForm((s) => ({ ...s, [key]: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
              />
            </label>
          ))}
          <button
            type="button"
            disabled={!merchantForm.businessName.trim() || createMerchant.isPending}
            onClick={() => createMerchant.mutate()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Create merchant
          </button>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Create submission (WhatsApp)</h2>
          <label className="block text-xs text-gray-500">
            Merchant
            <select
              value={subForm.merchantId}
              onChange={(e) => setSubForm((s) => ({ ...s, merchantId: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            >
              <option value="">— Optional —</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.businessName}
                  {m.city ? ` (${m.city})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-gray-500">
            Title
            <input
              value={subForm.title}
              onChange={(e) => setSubForm((s) => ({ ...s, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-gray-500">
            Notes
            <textarea
              value={subForm.notes}
              onChange={(e) => setSubForm((s) => ({ ...s, notes: e.target.value }))}
              className="mt-1 h-16 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload WhatsApp / price-list image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
          {subForm.evidenceFileRef ? (
            <div className="flex flex-col gap-2">
              <p className="truncate text-xs text-gray-500">{subForm.evidenceFileRef}</p>
              <button
                type="button"
                disabled={extracting}
                onClick={() => void onExtractWithAi()}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 disabled:opacity-50"
              >
                {extracting ? 'Extracting with AI…' : 'Extract items with AI (draft)'}
              </button>
              <p className="text-[11px] text-gray-500">
                AI drafts rows only. You still edit family keys and approve items before they affect consumer prices.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-gray-500">Items</h3>
              <button
                type="button"
                onClick={() => setItems((p) => [...p, emptyItem()])}
                className="inline-flex items-center gap-1 text-xs text-blue-600"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid gap-2 rounded border bg-gray-50 p-2 md:grid-cols-2">
                {(
                  [
                    ['productLabel', 'Product'],
                    ['familyKey', 'Family key'],
                    ['originalWording', 'Wording'],
                    ['originalPrice', 'Price'],
                    ['originalUnitCode', 'Unit'],
                    ['brandName', 'Brand'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-xs text-gray-500">
                    {label}
                    <input
                      value={item[key]}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, [key]: e.target.value } : row,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={items.length <= 1}
                  onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  className="inline-flex items-center gap-1 text-xs text-red-600 md:col-span-2"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={!subForm.title.trim() || createSub.isPending}
            onClick={() => createSub.mutate()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Create & submit
          </button>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Submissions</h2>
          </div>
          {subsQ.isLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading…</p>
          ) : submissions.length === 0 ? (
            <PiEmptyState title="No merchant submissions" />
          ) : (
            <div className="divide-y">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedId(sub.id)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${
                    selectedId === sub.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{sub.title}</p>
                      <p className="text-xs text-gray-500">
                        {sub.merchant?.businessName || 'No merchant'} · {sub.channel}
                      </p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Submission detail</h2>
          </div>
          {!selectedId ? (
            <PiEmptyState title="Select a submission" />
          ) : detailQ.isLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading detail…</p>
          ) : !detailQ.data ? (
            <PiEmptyState title="Not found" />
          ) : (
            <div className="space-y-3 p-4 text-sm">
              <p className="font-medium">{detailQ.data.title}</p>
              {detailQ.data.evidenceFileRef ? (
                <a
                  href={detailQ.data.evidenceFileRef}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Open evidence
                </a>
              ) : null}
              <div className="divide-y rounded-lg border">
                {(detailQ.data.items || []).map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div>
                      <p className="font-medium">{item.productLabel}</p>
                      <p className="text-xs text-gray-500">
                        ₦{Number(item.originalPrice).toLocaleString()} / {item.originalUnitCode}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                          onClick={() =>
                            reviewItem.mutate({
                              submissionId: detailQ.data!.id,
                              itemId: item.id,
                              decision: 'approve',
                            })
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                          onClick={() => {
                            const reason = window.prompt('Reject reason?') || 'Rejected';
                            reviewItem.mutate({
                              submissionId: detailQ.data!.id,
                              itemId: item.id,
                              decision: 'reject',
                              reason,
                            });
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
