'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import StatusBadge from '@/components/price-intelligence/StatusBadge';
import { usePiReviewers, usePiSettings } from '@/hooks/usePriceIntelligence';
import { priceIntelligenceApi } from '@/lib/price-intelligence-api';

export default function PiSettingsPage() {
  const qc = useQueryClient();
  const settingsQ = usePiSettings();
  const reviewersQ = usePiReviewers();
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('{\n  \n}');

  const [reviewerForm, setReviewerForm] = useState({
    adminUserId: '',
    availabilityNotes: '',
    maximumOpenCases: '25',
    active: true,
  });

  const upsertSetting = useMutation({
    mutationFn: () => {
      let valueJson: unknown;
      try {
        valueJson = JSON.parse(settingValue);
      } catch {
        throw new Error('Value must be valid JSON');
      }
      return priceIntelligenceApi.upsertSetting({ key: settingKey.trim(), valueJson });
    },
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Setting saved' });
      void qc.invalidateQueries({ queryKey: ['pi', 'settings'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const upsertReviewer = useMutation({
    mutationFn: () =>
      priceIntelligenceApi.upsertReviewer({
        adminUserId: reviewerForm.adminUserId.trim(),
        availabilityNotes: reviewerForm.availabilityNotes || null,
        maximumOpenCases: Number(reviewerForm.maximumOpenCases) || 25,
        active: reviewerForm.active,
      }),
    onSuccess: () => {
      setMessage({ tone: 'ok', text: 'Reviewer saved' });
      setReviewerForm({
        adminUserId: '',
        availabilityNotes: '',
        maximumOpenCases: '25',
        active: true,
      });
      void qc.invalidateQueries({ queryKey: ['pi', 'reviewers'] });
    },
    onError: (e: Error) => setMessage({ tone: 'err', text: e.message }),
  });

  const settings = settingsQ.data ?? [];
  const reviewers = reviewersQ.data ?? [];

  return (
    <div className="space-y-6">
      <PiPageHeader
        title="Settings"
        description="SLA thresholds, ops knobs, and reviewer roster."
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
            <h2 className="text-sm font-semibold">Settings</h2>
          </div>
          {settingsQ.isLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading…</p>
          ) : settings.length === 0 ? (
            <PiEmptyState title="No settings stored yet" />
          ) : (
            <div className="divide-y">
              {settings.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                  onClick={() => {
                    setSettingKey(s.key);
                    setSettingValue(JSON.stringify(s.valueJson, null, 2));
                  }}
                >
                  <p className="font-mono text-xs font-semibold text-gray-900">{s.key}</p>
                  <pre className="mt-1 max-h-24 overflow-auto text-[11px] text-gray-500">
                    {JSON.stringify(s.valueJson, null, 2)}
                  </pre>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Upsert setting</h2>
          <label className="block text-xs text-gray-500">
            Key
            <input
              value={settingKey}
              onChange={(e) => setSettingKey(e.target.value)}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm font-mono"
            />
          </label>
          <label className="block text-xs text-gray-500">
            Value (JSON)
            <textarea
              value={settingValue}
              onChange={(e) => setSettingValue(e.target.value)}
              className="mt-1 h-40 w-full rounded-lg border px-2 py-2 font-mono text-sm"
            />
          </label>
          <button
            type="button"
            disabled={!settingKey.trim() || upsertSetting.isPending}
            onClick={() => upsertSetting.mutate()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save setting
          </button>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Reviewers</h2>
          </div>
          {reviewersQ.isLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading…</p>
          ) : reviewers.length === 0 ? (
            <PiEmptyState title="No reviewers configured" />
          ) : (
            <div className="divide-y">
              {reviewers.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {r.adminUser?.fullName || r.adminUserId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.adminUser?.email || r.adminUserId}
                    </p>
                    <p className="text-xs text-gray-500">
                      Max cases: {r.maximumOpenCases}
                      {r.availabilityNotes ? ` · ${r.availabilityNotes}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={r.active ? 'active' : 'disabled'} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Upsert reviewer</h2>
          <label className="block text-xs text-gray-500">
            Admin user ID
            <input
              value={reviewerForm.adminUserId}
              onChange={(e) =>
                setReviewerForm((s) => ({ ...s, adminUserId: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm font-mono"
            />
          </label>
          <label className="block text-xs text-gray-500">
            Availability notes
            <input
              value={reviewerForm.availabilityNotes}
              onChange={(e) =>
                setReviewerForm((s) => ({ ...s, availabilityNotes: e.target.value }))
              }
              placeholder="e.g. Mon/Thu 1 hour"
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-gray-500">
            Max open cases
            <input
              type="number"
              value={reviewerForm.maximumOpenCases}
              onChange={(e) =>
                setReviewerForm((s) => ({ ...s, maximumOpenCases: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={reviewerForm.active}
              onChange={(e) =>
                setReviewerForm((s) => ({ ...s, active: e.target.checked }))
              }
              className="rounded border-gray-300 text-blue-600"
            />
            Active
          </label>
          <button
            type="button"
            disabled={!reviewerForm.adminUserId.trim() || upsertReviewer.isPending}
            onClick={() => upsertReviewer.mutate()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save reviewer
          </button>
        </section>
      </div>
    </div>
  );
}
