'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useHrFeedback } from '@/components/people/HrDialogs';
import {
  useHrCandidates,
  useHrCommunications,
  useHrPeople,
  useHrTemplates,
  useSendHrCommunication,
} from '@/hooks/usePeopleHr';

export default function CommunicationsPage() {
  const { data: templates = [] } = useHrTemplates();
  const { data: communications = [], isLoading } = useHrCommunications();
  const { data: candidates = [] } = useHrCandidates();
  const { data: people = [] } = useHrPeople();
  const send = useSendHrCommunication();
  const { notify, feedbackModal } = useHrFeedback();
  const [form, setForm] = useState({
    templateKey: 'interview_invitation',
    recipientEmail: '',
    candidateId: '',
    staffProfileId: '',
    subject: '',
    bodyText: '',
    name: '',
    position: '',
  });

  useEffect(() => {
    const template = templates.find((t) => t.key === form.templateKey);
    if (template) {
      setForm((prev) => ({
        ...prev,
        subject: template.subject,
        bodyText: template.bodyText,
      }));
    }
  }, [form.templateKey, templates]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await send.mutateAsync({
        ...form,
        candidateId: form.candidateId || undefined,
        staffProfileId: form.staffProfileId || undefined,
      });
      notify(
        'success',
        'Communication sent',
        'The message was sent, or queued if the email provider is unavailable.',
      );
    } catch (err: any) {
      notify('error', 'Send failed', err?.message || 'Could not send the communication.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Communications</h2>
        <p className="text-sm text-gray-500">
          Reuses BuildMyHouse Resend email infrastructure. Messages are logged against people/candidates.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.templateKey}
            onChange={(e) => setForm((p) => ({ ...p, templateKey: e.target.value }))}
          >
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.key.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <input
            required
            type="email"
            placeholder="Recipient email"
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.recipientEmail}
            onChange={(e) => setForm((p) => ({ ...p, recipientEmail: e.target.value }))}
          />
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.candidateId}
            onChange={(e) => {
              const candidate = candidates.find((c) => c.id === e.target.value);
              setForm((p) => ({
                ...p,
                candidateId: e.target.value,
                recipientEmail: candidate?.email || p.recipientEmail,
                name: candidate?.firstName || p.name,
                position: candidate?.position?.name || p.position,
              }));
            }}
          >
            <option value="">Link candidate (optional)</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.staffProfileId}
            onChange={(e) => {
              const person = people.find((p) => p.id === e.target.value);
              setForm((p) => ({
                ...p,
                staffProfileId: e.target.value,
                recipientEmail: person?.email || p.recipientEmail,
                name: person?.firstName || p.name,
              }));
            }}
          >
            <option value="">Link staff (optional)</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          placeholder="Subject"
          required
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm"
          rows={8}
          value={form.bodyText}
          onChange={(e) => setForm((p) => ({ ...p, bodyText: e.target.value }))}
          required
        />
        <button
          type="submit"
          disabled={send.isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
      </form>

      <div className="rounded-xl bg-white shadow">
        <div className="border-b px-4 py-3 font-semibold">Recent HR emails</div>
        {isLoading ? (
          <p className="p-4 text-gray-500">Loading…</p>
        ) : communications.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No communications yet.</p>
        ) : (
          <div className="divide-y">
            {communications.map((item: any) => (
              <div key={item.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{item.subject}</p>
                <p className="text-xs text-gray-500">
                  {item.recipientEmail} · {item.status} ·{' '}
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {feedbackModal}
    </div>
  );
}
