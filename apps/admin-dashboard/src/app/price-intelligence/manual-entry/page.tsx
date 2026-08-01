'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload } from 'lucide-react';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import { usePiManualEntries } from '@/hooks/usePriceIntelligence';
import { getCurrentUser } from '@/lib/auth';
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

export default function ManualEntryPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = usePiManualEntries({ take: 50 });
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [locationKey, setLocationKey] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceFileRef, setEvidenceFileRef] = useState('');
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const createMut = useMutation({
    mutationFn: () =>
      priceIntelligenceApi.createManualEntry({
        title,
        locationKey: locationKey || undefined,
        notes: notes || undefined,
        evidenceFileRef: evidenceFileRef || undefined,
        items: items.map((it) => ({
          productLabel: it.productLabel,
          familyKey: it.familyKey || undefined,
          originalWording: it.originalWording || it.productLabel,
          originalPrice: Number(it.originalPrice),
          originalUnitCode: it.originalUnitCode,
          brandName: it.brandName || undefined,
          locationKey: locationKey || undefined,
        })),
      }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Draft entry created' });
      setTitle('');
      setNotes('');
      setEvidenceFileRef('');
      setItems([emptyItem()]);
      void qc.invalidateQueries({ queryKey: ['pi', 'manual-entries'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const submitMut = useMutation({
    mutationFn: (id: string) => priceIntelligenceApi.submitManualEntry(id),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Entry submitted for review' });
      void qc.invalidateQueries({ queryKey: ['pi', 'manual-entries'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const reviewMut = useMutation({
    mutationFn: ({
      id,
      decision,
      reviewNote,
    }: {
      id: string;
      decision: 'approve' | 'reject';
      reviewNote?: string;
    }) => priceIntelligenceApi.reviewManualEntry(id, { decision, reviewNote }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Review decision recorded' });
      void qc.invalidateQueries({ queryKey: ['pi', 'manual-entries'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await priceIntelligenceApi.uploadEvidence(file);
      setEvidenceFileRef(url);
      setMessage({ tone: 'ok', text: 'Evidence uploaded' });
    } catch (e) {
      setMessage({ tone: 'err', text: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const submitted = (data?.items || []).filter((e) => e.status === 'submitted');

  return (
    <div className="space-y-6">
      <PiPageHeader
        title="Manual Entry"
        description="Enter prices from boards, receipts, or WhatsApp photos. Maker-checker: a different reviewer should approve."
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

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Create entry</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-gray-500">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500">
            Location key
            <input
              value={locationKey}
              onChange={(e) => setLocationKey(e.target.value)}
              placeholder="e.g. lagos"
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-xs text-gray-500">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 h-20 w-full rounded-lg border px-2 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload evidence image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
          {evidenceFileRef ? (
            <span className="truncate text-xs text-gray-500">{evidenceFileRef}</span>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-gray-500">Line items</h3>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"
            >
              <Plus className="h-3 w-3" /> Add item
            </button>
          </div>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 md:grid-cols-3"
            >
              {(
                [
                  ['productLabel', 'Product label'],
                  ['familyKey', 'Family key'],
                  ['brandName', 'Brand'],
                  ['originalWording', 'Original wording'],
                  ['originalPrice', 'Price'],
                  ['originalUnitCode', 'Unit code'],
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
                    className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="button"
                  disabled={items.length <= 1}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="inline-flex items-center gap-1 text-xs text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={!title.trim() || createMut.isPending}
          onClick={() => createMut.mutate()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Save draft
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Entries</h2>
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed'}
          </p>
        ) : !data?.items.length ? (
          <PiEmptyState title="No manual entries yet" />
        ) : (
          <div className="divide-y">
            {data.items.map((entry) => (
              <div key={entry.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{entry.title}</p>
                    <p className="text-xs text-gray-500">
                      {entry.locationKey || 'No location'} ·{' '}
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={entry.status} />
                </div>
                {entry.status === 'draft' ? (
                  <button
                    type="button"
                    disabled={submitMut.isPending}
                    onClick={() => submitMut.mutate(entry.id)}
                    className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    Submit for review
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Review submitted entries</h2>
          <p className="text-xs text-gray-500">
            Maker-checker: if you created the entry, ask another admin to approve.
          </p>
        </div>
        {submitted.length === 0 ? (
          <PiEmptyState title="Nothing pending review" />
        ) : (
          <div className="divide-y">
            {submitted.map((entry) => (
              <div key={entry.id} className="space-y-2 px-4 py-3 text-sm">
                <p className="font-medium">{entry.title}</p>
                <textarea
                  value={reviewNotes[entry.id] || ''}
                  onChange={(e) =>
                    setReviewNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))
                  }
                  placeholder="Review note"
                  className="h-16 w-full rounded-lg border px-2 py-1.5 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
                    onClick={async () => {
                      const me = await getCurrentUser();
                      if (me && me.id === entry.createdByAdminId) {
                        if (
                          !window.confirm(
                            'You created this entry. Maker-checker recommends a different reviewer. Continue anyway?',
                          )
                        ) {
                          return;
                        }
                      }
                      reviewMut.mutate({
                        id: entry.id,
                        decision: 'approve',
                        reviewNote: reviewNotes[entry.id],
                      });
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                    onClick={() =>
                      reviewMut.mutate({
                        id: entry.id,
                        decision: 'reject',
                        reviewNote: reviewNotes[entry.id] || 'Rejected',
                      })
                    }
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
