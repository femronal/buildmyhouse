'use client';

import { useEffect, useState } from 'react';
import { usePartnershipLead, usePartnershipMutations, usePartnershipSummary, type PartnershipError } from '@/hooks/usePartnerships';
import { CHANNEL_LABEL, DIRECTION_LABEL, KIND_LABEL, OUTCOME_LABEL, STAGE_LABEL, STEP_LABEL, formatLagosDayDate, lagosDateTimeLocal } from '@/lib/partnerships';

export default function FollowUpDrawer({ lead, preset, onClose }: { lead: any; preset?: { kind?: string; summary?: string }; onClose: () => void }) {
  const loaded = usePartnershipLead(lead.id);
  const view = loaded.data || lead;
  const { logTouch } = usePartnershipMutations(view.id);
  const summary = usePartnershipSummary({ ownerId: view.ownerId });
  const contact = view.contacts?.find((item: any) => item.isPrimary) || view.contacts?.[0];
  const [form, setForm] = useState({
    contactId: contact?.id || '',
    channel: 'email',
    direction: 'outbound',
    kind: preset?.kind || (lead.followUpStep === 'day_0' ? 'first_outreach' : 'utility'),
    outcome: 'delivered',
    occurredAt: lagosDateTimeLocal(),
    fromMailbox: 'inspect@buildmyhouse.app',
    toAddress: contact?.email || '',
    summary: preset?.summary || '',
    nextStep: lead.suggestedStep || 'day_4',
    nextFollowUpOverride: '',
    toStage: '',
    reason: '',
  });
  useEffect(() => {
    if (!loaded.data) return;
    const next = loaded.data.contacts?.find((item: any) => item.isPrimary) || loaded.data.contacts?.[0];
    setForm((current) => ({
      ...current,
      contactId: current.contactId || next?.id || '',
      toAddress: current.toAddress || next?.email || '',
      nextStep: loaded.data.suggestedStep || current.nextStep,
    }));
  }, [loaded.data]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <form
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          try {
            const result = await logTouch.mutateAsync({
              id: view.id,
              body: {
                ...form,
                contactId: form.contactId || undefined,
                occurredAt: `${form.occurredAt}:00+01:00`,
                nextFollowUpOverride: form.nextFollowUpOverride || undefined,
                toStage: form.toStage || undefined,
                outcome: form.outcome || undefined,
              },
            });
            if (result?.warning) setWarning(result.warning);
            else onClose();
          } catch (caught) {
            setError((caught as PartnershipError).message);
          }
        }}
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Log follow-up</h2>
            <p className="text-sm text-gray-600">{view.companyName} | {view.leadRef}</p>
            <p className="text-sm text-gray-600">Stage: {STAGE_LABEL[view.stage] || view.stage} · Step: {STEP_LABEL[view.followUpStep] || view.followUpStep} · {view.effectiveDueIso ? `Due ${formatLagosDayDate(`${view.effectiveDueIso}T12:00:00+01:00`)}` : 'No date set'}</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-xl" aria-label="Close">×</button>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <Select label="Contact" value={form.contactId} onChange={(value) => set('contactId', value)} options={(view.contacts || []).map((item: any) => ({ value: item.id, label: `${item.fullName}${item.isPrimary ? ' (primary)' : ''}` }))} />
          <Select label="Channel" value={form.channel} onChange={(value) => set('channel', value)} options={Object.entries(CHANNEL_LABEL).map(([value, label]) => ({ value, label }))} />
          <Select label="Direction" value={form.direction} onChange={(value) => set('direction', value)} options={Object.entries(DIRECTION_LABEL).map(([value, label]) => ({ value, label }))} />
          <label className="text-sm">Kind
            <select value={form.kind} onChange={(event) => set('kind', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              {Object.entries(KIND_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-500">Pick First outreach for a new lead. {summary.data?.outreachLeft ?? 0} of 2 new outreach left today.</span>
          </label>
          <Select label="Outcome" value={form.outcome} onChange={(value) => set('outcome', value)} options={Object.entries(OUTCOME_LABEL).map(([value, label]) => ({ value, label }))} />
          <label className="text-sm">Occurred at
            <input type="datetime-local" value={form.occurredAt} max={lagosDateTimeLocal()} onChange={(event) => set('occurredAt', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            <span className="mt-1 block text-xs text-gray-500">Future times are blocked.</span>
          </label>
          <label className="text-sm">From mailbox<input value={form.fromMailbox} onChange={(event) => set('fromMailbox', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">To<input value={form.toAddress} onChange={(event) => set('toAddress', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm sm:col-span-2">Summary<textarea value={form.summary} onChange={(event) => set('summary', event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Next step
            <select value={form.nextStep} onChange={(event) => set('nextStep', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              {Object.entries(STEP_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-500">Pre-filled with the next playbook step. You can change it.</span>
          </label>
          <label className="text-sm">Next follow-up date (optional)
            <input type="date" value={form.nextFollowUpOverride} onChange={(event) => set('nextFollowUpOverride', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            <span className="mt-1 block text-xs text-gray-500">Empty means the playbook date.</span>
          </label>
          <label className="text-sm sm:col-span-2">Change stage (optional)
            <select value={form.toStage} onChange={(event) => set('toStage', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">No change</option>
              {(view.allowedMoves || []).map((stage: string) => <option key={stage} value={stage}>{STAGE_LABEL[stage] || stage}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-500">Only allowed moves are listed.</span>
          </label>
          {form.toStage ? <label className="text-sm sm:col-span-2">Reason<input value={form.reason} onChange={(event) => set('reason', event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label> : null}
          {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
          {warning ? <p className="text-sm text-gray-700 sm:col-span-2">{warning} <button type="button" className="underline" onClick={onClose}>Close</button></p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border px-4 text-sm">Cancel</button>
          <button type="submit" className="min-h-11 rounded-full bg-gray-950 px-4 text-sm text-white">Save follow-up</button>
        </div>
      </form>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="text-sm">{label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
