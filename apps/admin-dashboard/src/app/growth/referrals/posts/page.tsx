'use client';

import { useState } from 'react';
import PartnerProgramNav from '@/components/growth/PartnerProgramNav';
import { useBmhPlatforms, useBmhPosts, type BmhPostRow } from '@/hooks/useReferrals';
import { api } from '@/lib/api';
import { formatLagosDate } from '@/lib/referrals';

const EMPTY = { id: '', platform: '', url: '', summary: '', postedAt: '' };

export default function BmhPostsPage() {
  const query = useBmhPosts();
  const platforms = useBmhPlatforms();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('');
  const rows = query.data || [];
  const options = platforms.data || [];

  const save = async () => {
    setStatus('');
    const body = { platform: form.platform, url: form.url, summary: form.summary, postedAt: form.postedAt };
    try {
      if (form.id) await api.patch(`/admin/referrals/posts/${form.id}`, body);
      else await api.post('/admin/referrals/posts', body);
      setForm(EMPTY);
      setStatus('Saved.');
      await query.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save.');
    }
  };

  const setRowStatus = async (row: BmhPostRow, next: 'published' | 'hidden') => {
    setStatus('');
    try {
      await api.patch(`/admin/referrals/posts/${row.id}/status`, { status: next });
      setStatus(next === 'hidden' ? 'Hidden.' : 'Shown.');
      await query.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update.');
    }
  };

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">BuildMyHouse posts</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">Add a link to a post BuildMyHouse already published. Partners open it on that platform.</p>
      <div className="mt-4"><PartnerProgramNav /></div>
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">{form.id ? 'Edit post' : 'New post'}</h2>
        <div className="mt-3 grid gap-3">
          <label className="text-sm">Platform
            <select className="mt-1 block w-full rounded-lg border px-3 py-2" value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>
              <option value="">Choose a platform</option>
              {options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-sm">Post link
            <input className="mt-1 block w-full rounded-lg border px-3 py-2" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
          </label>
          <label className="text-sm">Short summary
            <textarea className="mt-1 block min-h-20 w-full rounded-lg border px-3 py-2" maxLength={160} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            <span className="mt-1 block text-xs text-gray-500">{form.summary.length}/160</span>
          </label>
          <label className="text-sm">Posted on
            <input type="date" className="mt-1 block w-full rounded-lg border px-3 py-2" value={form.postedAt} onChange={(event) => setForm({ ...form, postedAt: event.target.value })} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" className="min-h-11 rounded-lg bg-black px-4 py-2 text-sm text-white" onClick={save}>Save</button>
          {form.id ? <button type="button" className="min-h-11 rounded-lg px-4 py-2 text-sm text-gray-600" onClick={() => setForm(EMPTY)}>Cancel edit</button> : null}
        </div>
        {status ? <p className="mt-3 text-sm text-gray-700">{status}</p> : null}
      </section>
      <section className="mt-4 space-y-3">
        {rows.length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No posts yet. Add the link to a BuildMyHouse post so partners can see it.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">{row.platformLabel} · {row.status}</p>
              <p className="text-xs text-gray-500">{formatLagosDate(row.postedAt)}</p>
            </div>
            <p className="mt-2 text-sm text-gray-800">{row.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="inline-flex min-h-11 items-center rounded-lg border px-3 py-2 text-sm" href={row.url} target="_blank" rel="noreferrer">Open post</a>
              <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={() => setForm({
                id: row.id,
                platform: row.platform,
                url: row.url,
                summary: row.summary,
                postedAt: String(row.postedAt).slice(0, 10),
              })}>Edit</button>
              {row.status === 'hidden' ? (
                <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={() => setRowStatus(row, 'published')}>Show</button>
              ) : (
                <button type="button" className="min-h-11 rounded-lg border px-3 py-2 text-sm" onClick={() => setRowStatus(row, 'hidden')}>Hide</button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
