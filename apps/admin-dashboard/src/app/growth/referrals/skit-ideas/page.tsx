'use client';

import { useState } from 'react';
import PartnerProgramNav from '@/components/growth/PartnerProgramNav';
import { useSkitIdeas, type SkitIdea } from '@/hooks/useReferrals';
import { api } from '@/lib/api';
import { formatLagosDate } from '@/lib/referrals';

const EMPTY = { id: '', title: '', whoFilms: '', format: 'skit', script: '', caption: '', sortOrder: '0' };

export default function SkitIdeasPage() {
  const query = useSkitIdeas();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('');
  const rows = [...(query.data || [])].sort((left, right) => Number(left.status !== 'active') - Number(right.status !== 'active'));

  const save = async () => {
    setStatus('');
    const body = {
      title: form.title,
      whoFilms: form.whoFilms || undefined,
      format: form.format,
      script: form.script,
      caption: form.caption,
      sortOrder: Number(form.sortOrder || 0),
    };
    try {
      if (form.id) await api.patch(`/admin/referrals/skit-ideas/${form.id}`, body);
      else await api.post('/admin/referrals/skit-ideas', body);
      setForm(EMPTY);
      setStatus('Saved.');
      await query.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save.');
    }
  };

  const setRowStatus = async (row: SkitIdea, next: 'active' | 'retired') => {
    setStatus('');
    try {
      await api.patch(`/admin/referrals/skit-ideas/${row.id}/status`, { status: next });
      setStatus(next === 'retired' ? 'Retired.' : 'Restored.');
      await query.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update.');
    }
  };

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Skit ideas</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">Partners see active ideas on Bring clients. Retired ideas stay here and drop off the partner list.</p>
      <div className="mt-4"><PartnerProgramNav /></div>
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">{form.id ? 'Edit skit idea' : 'New skit idea'}</h2>
        <div className="mt-3 grid gap-3">
          <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <Field label="Who films it" value={form.whoFilms} onChange={(whoFilms) => setForm({ ...form, whoFilms })} />
          <label className="text-sm">Format
            <select className="mt-1 block w-full rounded-lg border px-3 py-2" value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value })}>
              <option value="skit">Skit</option>
              <option value="alternative">Alternative format</option>
            </select>
          </label>
          <label className="text-sm">Script
            <textarea className="mt-1 block min-h-32 w-full rounded-lg border px-3 py-2" value={form.script} onChange={(event) => setForm({ ...form, script: event.target.value })} />
          </label>
          <label className="text-sm">Caption
            <textarea className="mt-1 block min-h-20 w-full rounded-lg border px-3 py-2" value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} />
          </label>
          <Field label="Order" value={form.sortOrder} onChange={(sortOrder) => setForm({ ...form, sortOrder })} />
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" className="min-h-11 rounded-lg bg-black px-4 py-2 text-sm text-white" onClick={save}>Save</button>
          {form.id ? <button type="button" className="min-h-11 rounded-lg px-4 py-2 text-sm text-gray-600" onClick={() => setForm(EMPTY)}>Cancel edit</button> : null}
        </div>
        {status ? <p className="mt-3 text-sm text-gray-700">{status}</p> : null}
      </section>
      <section className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className={`rounded-xl border border-gray-200 p-4 ${row.status === 'retired' ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{row.title}</h2>
              <p className="text-xs uppercase tracking-wide">{row.format === 'alternative' ? 'Alternative format' : 'Skit'} · {row.status}</p>
            </div>
            {row.whoFilms ? <p className="mt-1 text-sm">{row.whoFilms}</p> : null}
            <p className="mt-1 text-xs">Last updated {formatLagosDate(row.updatedAt)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={() => setForm({
                id: row.id,
                title: row.title,
                whoFilms: row.whoFilms || '',
                format: row.format,
                script: row.script,
                caption: row.caption,
                sortOrder: String(row.sortOrder ?? 0),
              })}>Edit</button>
              {row.status === 'retired' ? (
                <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={() => setRowStatus(row, 'active')}>Restore</button>
              ) : (
                <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={() => setRowStatus(row, 'retired')}>Retire</button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">
      {label}
      <input className="mt-1 block w-full rounded-lg border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
