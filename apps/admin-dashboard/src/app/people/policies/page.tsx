'use client';

import { FormEvent, useState } from 'react';
import { useHrFeedback } from '@/components/people/HrDialogs';
import { useCreatePolicy, useHrPolicies } from '@/hooks/usePeopleHr';
import { api } from '@/lib/api';

const CATEGORIES = [
  'employment',
  'conduct_ethics',
  'human_resources',
  'operations',
  'sales',
  'marketing',
  'finance_expenses',
  'compliance',
  'data_security',
  'communication',
  'health_safety',
  'leave_attendance',
];

export default function PoliciesPage() {
  const { data: policies = [], isLoading } = useHrPolicies();
  const createPolicy = useCreatePolicy();
  const { notify, feedbackModal } = useHrFeedback();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'human_resources',
    content: '',
    status: 'draft',
  });

  const openPolicy = async (id: string) => {
    setSelectedId(id);
    try {
      const data = await api.get(`/admin/hr/policies/${id}`);
      setDetail(data);
    } catch (err: any) {
      notify('error', 'Could not load policy', err?.message || 'Please try again.');
    }
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await createPolicy.mutateAsync(form);
      const title = form.title;
      setForm({ title: '', category: 'human_resources', content: '', status: 'draft' });
      await openPolicy((created as any).id);
      notify('success', 'Policy created', `${title} was saved.`);
    } catch (err: any) {
      notify('error', 'Could not create policy', err?.message || 'Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Policies</h2>
        <p className="text-sm text-gray-500">Company rules with acknowledgement tracking.</p>
      </div>

      <form onSubmit={onCreate} className="space-y-2 rounded-xl bg-white p-4 shadow">
        <input
          required
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Policy title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <textarea
          required
          className="w-full rounded-lg border px-3 py-2 text-sm"
          rows={5}
          placeholder="Policy content"
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
          Create policy
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl bg-white shadow">
          {isLoading ? (
            <p className="p-4 text-gray-500">Loading…</p>
          ) : (
            <div className="divide-y">
              {policies.map((policy) => (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => void openPolicy(policy.id)}
                  className={`block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${
                    selectedId === policy.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="font-medium">{policy.title}</p>
                  <p className="text-xs text-gray-500">
                    {policy.category.replace(/_/g, ' ')} · v{policy.version} · {policy.status}
                  </p>
                </button>
              ))}
              {policies.length === 0 && (
                <p className="p-8 text-center text-gray-500">No policies yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          {!detail ? (
            <p className="text-sm text-gray-500">Select a policy to view acknowledgement status.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <h3 className="text-lg font-semibold">{detail.title}</h3>
              <p className="text-gray-500">{detail.acknowledgementSummary?.label}</p>
              <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3">{detail.content}</div>
            </div>
          )}
        </div>
      </div>

      {feedbackModal}
    </div>
  );
}
