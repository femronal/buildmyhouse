'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ClaimLinkPanel from '@/components/ClaimLinkPanel';
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
        <ClaimLinkPanel kind="artisans" id={id} email={artisan.email} />
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Overview</h2>
        <p className="mt-2 text-sm text-gray-700">Claim: {artisan.claimStatus}. Verification: {artisan.verificationStatus}. Recruitment: {artisan.recruitmentStatus}. Used by BMH: {artisan.usedByBmh ? 'Yes' : 'No'}.</p>
        <p className="mt-2 text-sm text-gray-700">Source: {artisan.sourceType}. Created {new Date(artisan.createdAt).toLocaleDateString()}.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/listing-status`, { listingStatus: 'hidden' })}>Hide</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/listing-status`, { listingStatus: 'listed' })}>List</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/listing-status`, { listingStatus: 'archived' })}>Archive</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => {
            const evidence = window.prompt('What evidence does this verification rest on? Include a date if you observed the work.');
            if (!evidence?.trim()) return;
            if (!window.confirm('Mark this artisan verified for BMH repair work?')) return;
            void act(`${id}/verification`, { verificationStatus: 'verified', checkKey: 'identity_checked', checkStatus: 'passed', notes: evidence.trim() });
          }}>Mark verified</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/verification`, { verificationStatus: 'rejected' })}>Reject verification</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={() => {
            const reason = window.prompt('Why should this artisan not be listed again?');
            if (!reason?.trim()) return;
            void act(`${id}/listing-status`, { listingStatus: 'hidden', suppressFromRelist: true, suppressionReason: reason.trim() });
          }}>Hide and do not relist</button>
        </div>
      </section>
      <ArtisanEditor artisan={artisan} onSave={(body) => act(id, body)} />
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Recruitment</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {['contacted', 'claim_invited', 'ready_for_jobs', 'active', 'paused', 'blocked'].map((status) => (
            <button key={status} className="rounded-full border px-3 py-2 text-sm" onClick={() => act(`${id}/recruitment-status`, { recruitmentStatus: status })}>{status.replaceAll('_', ' ')}</button>
          ))}
        </div>
        <textarea className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="Internal note" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button className="mt-2 rounded-full bg-gray-950 px-4 py-2 text-sm text-white" onClick={() => {
          const line = notes.trim();
          if (!line) return;
          const next = [artisan.internalNotes, line].filter(Boolean).join('\n');
          void act(id, { internalNotes: next });
          setNotes('');
        }}>Save note</button>
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

function ArtisanEditor({ artisan, onSave }: { artisan: Record<string, any>; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const meta = useQuery({ queryKey: ['artisan-admin-meta'], queryFn: () => api.get<any>('/admin/artisans/meta') });
  const trade = (meta.data?.trades || []).find((item: any) => item.key === artisan.primaryTrade?.key);
  const [phone, setPhone] = useState(artisan.phone || '');
  const [email, setEmail] = useState(artisan.email || '');
  const [whatsapp, setWhatsapp] = useState(artisan.whatsapp || '');
  const [website, setWebsite] = useState(artisan.website || '');
  const [instagramUrl, setInstagramUrl] = useState(artisan.instagramUrl || '');
  const [facebookUrl, setFacebookUrl] = useState(artisan.facebookUrl || '');
  const [address, setAddress] = useState(artisan.address || '');
  const [workingHours, setWorkingHours] = useState(artisan.workingHours || '');
  const [serviceCities, setServiceCities] = useState((artisan.serviceCities || []).join(', '));
  const [serviceStates, setServiceStates] = useState((artisan.serviceStates || []).join(', '));
  const [sourceUrls, setSourceUrls] = useState((artisan.sourceUrls || []).join('\n'));
  const [internalNotes, setInternalNotes] = useState(artisan.internalNotes || '');
  const [confidence, setConfidence] = useState(artisan.researchConfidence || '');
  const [capabilityIds, setCapabilityIds] = useState<string[]>((artisan.capabilities || []).map((row: any) => row.capabilityId || row.capability?.id).filter(Boolean));
  const toggle = (id: string) => setCapabilityIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="font-semibold">Public and research details</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input className="rounded-lg border px-3 py-2" placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="WhatsApp" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Website" value={website} onChange={(event) => setWebsite(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Instagram" value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Facebook" value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Business hours" value={workingHours} onChange={(event) => setWorkingHours(event.target.value)} />
        <select className="rounded-lg border px-3 py-2" value={confidence} onChange={(event) => setConfidence(event.target.value)}>
          <option value="">Research confidence</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
        <input className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Workshop address" value={address} onChange={(event) => setAddress(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Service cities" value={serviceCities} onChange={(event) => setServiceCities(event.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Service states" value={serviceStates} onChange={(event) => setServiceStates(event.target.value)} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Source URLs, one per line" value={sourceUrls} onChange={(event) => setSourceUrls(event.target.value)} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Internal notes" value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
      </div>
      {trade ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <CapabilityChecks title="Services" items={trade.services || []} selected={capabilityIds} onToggle={toggle} />
          <CapabilityChecks title="Problems we fix" items={trade.problems || []} selected={capabilityIds} onToggle={toggle} />
        </div>
      ) : null}
      <button
        className="mt-3 rounded-full bg-gray-950 px-4 py-2 text-sm text-white"
        onClick={() => onSave({
          phone,
          email: email.trim() || null,
          whatsapp,
          website,
          instagramUrl,
          facebookUrl,
          address,
          workingHours,
          serviceCities: serviceCities.split(',').map((item) => item.trim()).filter(Boolean),
          serviceStates: serviceStates.split(',').map((item) => item.trim()).filter(Boolean),
          sourceUrls: sourceUrls.split('\n').map((item) => item.trim()).filter(Boolean),
          internalNotes,
          capabilityIds,
          researchConfidence: confidence || undefined,
        })}
      >
        Save details
      </button>
    </section>
  );
}

function CapabilityChecks({ title, items, selected, onToggle }: { title: string; items: Array<{ id: string; label: string }>; selected: string[]; onToggle: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{title}</legend>
      <div className="mt-2 grid gap-1">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            {item.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
