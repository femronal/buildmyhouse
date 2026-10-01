'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useArtisan } from '@/hooks/useArtisans';

export default function ArtisanAdminDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useArtisan(id);
  const artisan = query.data as Record<string, any> | undefined;
  const [notice, setNotice] = useState('');
  const [notes, setNotes] = useState('');

  const act = async (path: string, body: Record<string, unknown>) => {
    setNotice('');
    try {
      await api.patch(`/admin/artisans/${path}`, body);
      await query.refetch();
      setNotice('Saved.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save.');
    }
  };

  if (!artisan) return <div className="p-6">Loading artisan…</div>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">{artisan.displayName}</h1>
        <p className="text-sm text-gray-600">{artisan.primaryTrade?.label} · Trust {artisan.trustScore}% · {artisan.publicUrl}</p>
      </div>
      {notice ? <p className="text-sm">{notice}</p> : null}
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Overview</h2>
        <p className="mt-2 text-sm text-gray-700">Claim: {artisan.claimStatus}. Verification: {artisan.verificationStatus}. Recruitment: {artisan.recruitmentStatus}. Used by BMH: {artisan.usedByBmh ? 'Yes' : 'No'}.</p>
        <p className="mt-2 text-sm text-gray-700">Source: {artisan.sourceType}. Created {new Date(artisan.createdAt).toLocaleDateString()}.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/listing-status`, { listingStatus: 'hidden' })}>Hide</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/listing-status`, { listingStatus: 'listed' })}>List</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/listing-status`, { listingStatus: 'archived' })}>Archive</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/verification`, { verificationStatus: 'verified', checkKey: 'identity_checked', checkStatus: 'passed' })}>Mark verified</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/verification`, { verificationStatus: 'rejected' })}>Reject verification</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={async () => {
            const invite = (await api.post(`/admin/artisans/${id}/claim-invitation`, {})) as { claimUrl: string };
            await navigator.clipboard.writeText(invite.claimUrl);
            setNotice(invite.claimUrl);
          }}>Copy claim link</button>
        </div>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Recruitment</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {['contacted', 'claim_invited', 'ready_for_jobs', 'active', 'paused', 'blocked'].map((status) => (
            <button key={status} className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/recruitment-status`, { recruitmentStatus: status })}>{status.replaceAll('_', ' ')}</button>
          ))}
        </div>
        <textarea className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="Internal note" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button className="mt-2 rounded-full bg-gray-950 px-4 py-2 text-sm text-white" onClick={() => act(id, { internalNotes: notes })}>Save note</button>
        <button className="ml-2 mt-2 rounded-full border px-4 py-2 text-sm" onClick={() => act(id, { usedByBmh: true, usedByBmhNote: notes || 'Historical BMH engagement' })}>Mark used by BMH</button>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Media</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {(artisan.media || []).map((item: any) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span>{item.mediaType} · {item.reviewStatus}</span>
              <span className="flex gap-2">
                <button onClick={() => api.patch(`/admin/artisans/media/${item.id}`, { reviewStatus: 'reviewed' }).then(() => query.refetch())}>Reviewed</button>
                <button onClick={() => api.patch(`/admin/artisans/media/${item.id}`, { reviewStatus: 'rejected', rejectionReason: 'Not a clear workshop photo' }).then(() => query.refetch())}>Reject</button>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <h2 className="font-semibold text-gray-950">Trust suggestions</h2>
        <ul className="mt-2 space-y-1">
          {(artisan.trust?.suggestions || []).map((item: any) => (
            <li key={item.key}>+{item.points}% — {item.label}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
