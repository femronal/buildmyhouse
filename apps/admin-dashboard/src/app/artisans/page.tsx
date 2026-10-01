'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useArtisans, useCreateArtisan } from '@/hooks/useArtisans';

export default function ArtisansAdminPage() {
  const [q, setQ] = useState('');
  const [trade, setTrade] = useState('');
  const [recruitmentStatus, setRecruitmentStatus] = useState('');
  const list = useArtisans({ q, trade, recruitmentStatus });
  const create = useCreateArtisan();
  const [form, setForm] = useState({
    displayName: '',
    tradeKey: 'plumber',
    phone: '',
    city: '',
    state: '',
    bio: '',
    sourceType: 'admin_research',
    acknowledgeDuplicates: false,
  });
  const [notice, setNotice] = useState('');

  const rows = (list.data as { data?: Array<Record<string, any>> } | undefined)?.data || [];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-gray-950">Artisans</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        New listings publish immediately as listed, unclaimed and unverified. Trust score does not hide them.
      </p>

      <form
        className="mt-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setNotice('');
          try {
            const created = (await create.mutateAsync(form)) as { publicUrl?: string; trustScore?: number };
            setNotice(`Published ${created.publicUrl}. Trust score ${created.trustScore}%.`);
            setForm({ ...form, displayName: '', phone: '', city: '', bio: '', acknowledgeDuplicates: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not create the listing.';
            if (message.toLowerCase().includes('duplicate')) {
              setForm({ ...form, acknowledgeDuplicates: true });
              setNotice(`${message} Submit again to publish anyway.`);
              return;
            }
            setNotice(message);
          }
        }}
      >
        <input className="rounded-lg border px-3 py-2" placeholder="Artisan or business name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required />
        <input className="rounded-lg border px-3 py-2" placeholder="Trade key, plumber" value={form.tradeKey} onChange={(event) => setForm({ ...form, tradeKey: event.target.value })} required />
        <input className="rounded-lg border px-3 py-2" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
        <select className="rounded-lg border px-3 py-2" value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}>
          <option value="admin_research">Admin research</option>
          <option value="grok_research">Grok research</option>
          <option value="referral">Referral</option>
        </select>
        <textarea className="rounded-lg border px-3 py-2 md:col-span-3" placeholder="Short factual bio" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        <button className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white" type="submit">Publish listing</button>
      </form>
      {notice ? <p className="mt-3 text-sm text-gray-800">{notice}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <input className="rounded-lg border px-3 py-2" placeholder="Search name, phone, city, trade" value={q} onChange={(event) => setQ(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Trade key" value={trade} onChange={(event) => setTrade(event.target.value)} />
        <select className="rounded-lg border px-3 py-2" value={recruitmentStatus} onChange={(event) => setRecruitmentStatus(event.target.value)}>
          <option value="">All recruitment</option>
          {['discovered', 'researched', 'contacted', 'claim_invited', 'claimed', 'verification_pending', 'ready_for_jobs', 'active', 'paused', 'blocked'].map((status) => (
            <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              {['Artisan', 'Trade', 'Location', 'Trust', 'Claim', 'Verification', 'Recruitment', 'Used by BMH', 'Action'].map((heading) => (
                <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-950">{row.displayName}</td>
                <td className="px-3 py-2">{row.trade}</td>
                <td className="px-3 py-2">{[row.city, row.state].filter(Boolean).join(', ')}</td>
                <td className="px-3 py-2">{row.trustScore}%</td>
                <td className="px-3 py-2">{row.claimStatus}</td>
                <td className="px-3 py-2">{row.verificationStatus}</td>
                <td className="px-3 py-2">{String(row.recruitmentStatus).replaceAll('_', ' ')}</td>
                <td className="px-3 py-2">{row.usedByBmh ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2"><Link className="font-semibold" href={`/artisans/${row.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
