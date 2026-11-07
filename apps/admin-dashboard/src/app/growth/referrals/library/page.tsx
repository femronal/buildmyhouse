'use client';

import { useState } from 'react';
import PartnerProgramNav from '@/components/growth/PartnerProgramNav';
import { usePartnerLibrary, type PartnerLibraryItem } from '@/hooks/useReferrals';
import { api } from '@/lib/api';

const EMPTY = {
  id: '',
  kind: 'post' as 'post' | 'video' | 'image',
  title: '',
  audience: '',
  problem: '',
  promise: '',
  caption: '',
  assetUrl: '',
  destinationPath: '',
};

export default function PartnerLibraryPage() {
  const query = usePartnerLibrary();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('');
  const rows = query.data || [];
  const tools = rows.filter((row) => row.kind === 'tool');
  const library = rows.filter((row) => row.kind !== 'tool');

  const save = async (publish: boolean) => {
    setStatus('');
    try {
      await api.post('/admin/referrals/library', {
        id: form.id || undefined,
        kind: form.kind,
        title: form.title,
        audience: form.audience,
        problem: form.problem,
        promise: form.promise,
        caption: form.caption,
        assetUrl: form.assetUrl || undefined,
        destinationPath: form.destinationPath || undefined,
        publish,
      });
      setForm(EMPTY);
      setStatus(publish ? 'Published. Approved affiliates can see it in Marketing.' : 'Saved as a draft.');
      await query.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save.');
    }
  };

  const setRowStatus = async (row: PartnerLibraryItem, next: 'draft' | 'approved') => {
    setStatus('');
    try {
      await api.patch(`/admin/referrals/library/${row.id}`, { status: next });
      setStatus(next === 'approved' ? 'Published.' : 'Moved back to draft.');
      await query.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update.');
    }
  };

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Library</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Add a post, video, or image for every approved affiliate to share. Paste a public Google Drive link. The file stays on Drive and is not stored on BuildMyHouse.
        Share the file so anyone with the link can view it. The disclosure line is added for you.
      </p>
      <div className="mt-4">
        <PartnerProgramNav />
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">{form.id ? 'Edit library item' : 'New library item'}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <label className="text-sm">
            Kind
            <select className="mt-1 block w-full rounded-lg border px-3 py-2" value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as typeof form.kind })}>
              <option value="post">Post</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>
          </label>
          <Field label="Who is this for?" value={form.audience} onChange={(audience) => setForm({ ...form, audience })} />
          <Field label="Google Drive link" value={form.assetUrl} onChange={(assetUrl) => setForm({ ...form, assetUrl })} />
          <Field label="What problem does it solve?" value={form.problem} onChange={(problem) => setForm({ ...form, problem })} />
          <Field label="What outcome can they promise?" value={form.promise} onChange={(promise) => setForm({ ...form, promise })} />
          <Field label="Caption" value={form.caption} onChange={(caption) => setForm({ ...form, caption })} />
          <Field label="Tracked page, optional" value={form.destinationPath} onChange={(destinationPath) => setForm({ ...form, destinationPath })} placeholder="/start" />
        </div>
        <p className="mt-2 text-xs text-gray-500">A Drive file does not carry the affiliate code. Add a BuildMyHouse page, such as /start, when the introduction should be recorded.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg border bg-white px-4 py-2 text-sm" onClick={() => save(false)}>Save draft</button>
          <button type="button" className="rounded-lg bg-black px-4 py-2 text-sm text-white" onClick={() => save(true)}>Publish</button>
          {form.id ? <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600" onClick={() => setForm(EMPTY)}>Cancel edit</button> : null}
        </div>
        {status ? <p className="mt-3 text-sm text-gray-700">{status}</p> : null}
      </section>
      <section className="mt-4 space-y-3">
        {library.map((row) => (
          <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{row.title}</h2>
              <p className="text-xs uppercase tracking-wide text-gray-500">{row.kind} · {row.status}</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">{row.caption}</p>
            {row.assetUrl ? <p className="mt-2 break-all text-xs text-gray-500">{row.assetUrl}</p> : null}
            {row.destinationPath ? <p className="mt-1 text-xs text-gray-500">Tracked page {row.destinationPath}</p> : <p className="mt-1 text-xs text-gray-500">This file alone does not record the introduction.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setForm({
                id: row.id,
                kind: row.kind === 'tool' ? 'post' : row.kind,
                title: row.title,
                audience: row.audience,
                problem: row.problem,
                promise: row.promise,
                caption: row.caption,
                assetUrl: row.assetUrl || '',
                destinationPath: row.destinationPath || '',
              })}>Edit</button>
              {row.status === 'approved' ? (
                <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setRowStatus(row, 'draft')}>Unpublish</button>
              ) : (
                <button type="button" className="rounded-lg bg-black px-3 py-2 text-sm text-white" onClick={() => setRowStatus(row, 'approved')}>Publish</button>
              )}
            </div>
          </article>
        ))}
        {library.length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No posts, videos, or images yet.</p> : null}
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900">Tools</h2>
        <p className="mt-1 text-xs text-gray-500">These three campaigns stay in Marketing. This form does not replace them.</p>
        <div className="mt-3 space-y-2">
          {tools.map((row) => (
            <p key={row.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">{row.title}</p>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="text-sm">
      {label}
      <input className="mt-1 block w-full rounded-lg border px-3 py-2" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
