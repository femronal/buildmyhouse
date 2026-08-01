'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PriorityBadge from '@/components/price-intelligence/PriorityBadge';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import {
  usePiCaseMutations,
  usePiReviewCase,
} from '@/hooks/usePriceIntelligence';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatMoney(value: unknown) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `₦${n.toLocaleString()}`;
}

export default function ReviewCaseWorkspacePage() {
  const params = useParams();
  const caseId = String(params.caseId || '');
  const { data, isLoading, isError, error } = usePiReviewCase(caseId);
  const mutations = usePiCaseMutations(caseId);

  const [transitionTo, setTransitionTo] = useState('');
  const [transitionNote, setTransitionNote] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const [structured, setStructured] = useState({
    familyKey: '',
    originalWording: '',
    originalPrice: '',
    originalUnitCode: '',
    reason: '',
    approvedPrices: '',
  });

  const [reportCorr, setReportCorr] = useState({
    reason: '',
    typicalPrice: '',
    rangeLow: '',
    rangeHigh: '',
    confidenceLabel: '',
  });

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setActionError(null);
    setActionOk(null);
    try {
      await fn();
      setActionOk(okMsg);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading case workspace…</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/price-intelligence/review-queue"
          className="inline-flex items-center gap-1 text-sm text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Case not found'}
        </p>
      </div>
    );
  }

  const payload = data.report?.payload as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/price-intelligence/review-queue"
          className="mb-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
        <PiPageHeader
          title={data.productLabel || 'Review case'}
          description={`${data.caseType.replace(/_/g, ' ')} · ${caseId}`}
          actions={
            <div className="flex items-center gap-2">
              <PriorityBadge priority={data.priority} />
              <StatusBadge status={data.status} />
            </div>
          }
        />
      </div>

      {(actionError || actionOk) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {actionError || actionOk}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Case summary</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              <div>
                <dt className="text-xs text-gray-500">Family</dt>
                <dd className="font-medium">{data.productFamilyKey || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Location</dt>
                <dd className="font-medium">{data.locationKey || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Confidence</dt>
                <dd className="font-medium">
                  {data.confidenceLabel || '—'}
                  {data.confidenceScore != null ? ` (${data.confidenceScore})` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Assigned</dt>
                <dd className="font-medium">
                  {data.assignedReviewer?.fullName || 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Due</dt>
                <dd className="font-medium">{formatDate(data.dueAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Opened</dt>
                <dd className="font-medium">{formatDate(data.openedAt)}</dd>
              </div>
              <div className="col-span-2 md:col-span-3">
                <dt className="text-xs text-gray-500">Priority reason</dt>
                <dd className="font-medium">{data.priorityReason}</dd>
              </div>
              <div className="col-span-2 md:col-span-3">
                <dt className="text-xs text-gray-500">Trigger</dt>
                <dd className="font-medium">{data.triggerCode}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              Consumer report preview
            </h2>
            {!data.report ? (
              <p className="text-sm text-gray-500">No linked report on this case.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Report {data.report.id.slice(0, 8)}…</span>
                  <span>v{data.report.currentVersion}</span>
                  <StatusBadge status={data.report.status} />
                </div>
                {payload ? (
                  <pre className="max-h-80 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                ) : (
                  <div className="space-y-2">
                    {(data.report.items || []).map((item) => (
                      <div
                        key={String(item.id)}
                        className="rounded-lg border border-gray-100 px-3 py-2"
                      >
                        <p className="font-medium">
                          Outcome: {String(item.outcome ?? '—')}
                        </p>
                        <p className="text-xs text-gray-600">
                          Typical {formatMoney(item.typicalPrice)} · Range{' '}
                          {formatMoney(item.rangeLow)} – {formatMoney(item.rangeHigh)} ·{' '}
                          {String(item.confidence ?? '—')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {data.report.customerUpdateNotice ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Notice: {data.report.customerUpdateNotice}
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Events timeline</h2>
            {data.events.length === 0 ? (
              <p className="text-sm text-gray-500">No events yet.</p>
            ) : (
              <ol className="space-y-3 border-l-2 border-gray-100 pl-4">
                {data.events.map((ev) => (
                  <li key={ev.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <p className="font-medium text-gray-900">
                      {ev.eventType}
                      {ev.fromStatus || ev.toStatus
                        ? ` · ${ev.fromStatus || '?'} → ${ev.toStatus || '?'}`
                        : ''}
                    </p>
                    {ev.note ? <p className="text-gray-600">{ev.note}</p> : null}
                    <p className="text-xs text-gray-400">{formatDate(ev.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Actions</h2>

            <button
              type="button"
              disabled={mutations.assign.isPending}
              onClick={() => run(() => mutations.assign.mutateAsync(), 'Assigned to you')}
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Assign to me
            </button>

            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium uppercase text-gray-500">Transition</p>
              <select
                value={transitionTo}
                onChange={(e) => setTransitionTo(e.target.value)}
                className="w-full rounded-lg border px-2 py-2 text-sm"
              >
                <option value="">Select status…</option>
                {(data.allowedTransitions || []).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <input
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="Optional note"
                className="w-full rounded-lg border px-2 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!transitionTo || mutations.transition.isPending}
                onClick={() =>
                  run(
                    () =>
                      mutations.transition.mutateAsync({
                        toStatus: transitionTo,
                        note: transitionNote || undefined,
                      }),
                    'Transitioned',
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Apply transition
              </button>
            </div>

            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium uppercase text-gray-500">Approve</p>
              <input
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Optional note"
                className="w-full rounded-lg border px-2 py-2 text-sm"
              />
              <button
                type="button"
                disabled={mutations.approve.isPending}
                onClick={() =>
                  run(
                    () => mutations.approve.mutateAsync(approveNote || undefined),
                    'Approved',
                  )
                }
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
            </div>

            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium uppercase text-gray-500">Reject</p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Rejection reason (required)"
                className="h-20 w-full rounded-lg border px-2 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!rejectNote.trim() || mutations.reject.isPending}
                onClick={() => {
                  if (!window.confirm('Reject this case? This requires a note.')) return;
                  void run(() => mutations.reject.mutateAsync(rejectNote.trim()), 'Rejected');
                }}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Correct structured</h2>
            <p className="text-xs text-gray-500">
              Creates a corrected observation (never overwrites). Confirmation required.
            </p>
            {(
              [
                ['familyKey', 'Family key'],
                ['originalWording', 'Original wording'],
                ['originalPrice', 'Price'],
                ['originalUnitCode', 'Unit code'],
                ['reason', 'Reason'],
                ['approvedPrices', 'Approved prices (comma-separated, optional)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs text-gray-500">
                {label}
                <input
                  value={structured[key]}
                  onChange={(e) =>
                    setStructured((s) => ({ ...s, [key]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm text-gray-900"
                />
              </label>
            ))}
            <button
              type="button"
              disabled={mutations.correctStructured.isPending}
              onClick={() => {
                if (!window.confirm('Apply structured correction?')) return;
                const prices = structured.approvedPrices
                  .split(',')
                  .map((p) => Number(p.trim()))
                  .filter((n) => !Number.isNaN(n));
                void run(
                  () =>
                    mutations.correctStructured.mutateAsync({
                      familyKey: structured.familyKey,
                      originalWording: structured.originalWording,
                      originalPrice: Number(structured.originalPrice),
                      originalUnitCode: structured.originalUnitCode,
                      reason: structured.reason,
                      approvedPrices: prices.length ? prices : undefined,
                    }),
                  'Structured correction applied',
                );
              }}
              className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Apply structured correction
            </button>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Apply report correction</h2>
            {!data.reportId ? (
              <p className="text-xs text-gray-500">No report linked to this case.</p>
            ) : (
              <>
                <label className="block text-xs text-gray-500">
                  Reason
                  <input
                    value={reportCorr.reason}
                    onChange={(e) =>
                      setReportCorr((s) => ({ ...s, reason: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm text-gray-900"
                  />
                </label>
                {(
                  [
                    ['typicalPrice', 'Typical price'],
                    ['rangeLow', 'Range low'],
                    ['rangeHigh', 'Range high'],
                    ['confidenceLabel', 'Confidence label'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-xs text-gray-500">
                    {label} (optional)
                    <input
                      value={reportCorr[key]}
                      onChange={(e) =>
                        setReportCorr((s) => ({ ...s, [key]: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm text-gray-900"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={
                    !reportCorr.reason.trim() || mutations.applyReportCorrection.isPending
                  }
                  onClick={() => {
                    if (!window.confirm('Apply report correction and bump version?')) return;
                    const pricingOverride: {
                      typicalPrice?: number;
                      rangeLow?: number;
                      rangeHigh?: number;
                      confidenceLabel?: string;
                    } = {};
                    if (reportCorr.typicalPrice)
                      pricingOverride.typicalPrice = Number(reportCorr.typicalPrice);
                    if (reportCorr.rangeLow)
                      pricingOverride.rangeLow = Number(reportCorr.rangeLow);
                    if (reportCorr.rangeHigh)
                      pricingOverride.rangeHigh = Number(reportCorr.rangeHigh);
                    if (reportCorr.confidenceLabel)
                      pricingOverride.confidenceLabel = reportCorr.confidenceLabel;
                    void run(
                      () =>
                        mutations.applyReportCorrection.mutateAsync({
                          reportId: data.reportId!,
                          reason: reportCorr.reason.trim(),
                          pricingOverride:
                            Object.keys(pricingOverride).length > 0
                              ? pricingOverride
                              : undefined,
                        }),
                      'Report correction applied',
                    );
                  }}
                  className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Apply report correction
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
