'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ArtisanCatalogPanel from '@/components/ArtisanCatalogPanel';
import { ClaimLinkCopyButton } from '@/components/ClaimLinkPanel';
import { useArtisans, useCreateArtisan } from '@/hooks/useArtisans';

const emptyForm = {
  displayName: '',
  tradeKey: '',
  phone: '',
  whatsapp: '',
  email: '',
  website: '',
  instagramUrl: '',
  facebookUrl: '',
  address: '',
  serviceCities: '',
  serviceStates: '',
  city: '',
  state: '',
  workingHours: '',
  bio: '',
  sourceUrls: '',
  internalNotes: '',
  researchConfidence: '' as '' | 'high' | 'medium',
  sourceType: 'admin_research',
  capabilityIds: [] as string[],
  acknowledgeDuplicates: false,
  overrideSuppressionReason: '',
};

export default function ArtisansAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogOpen = searchParams.get('catalog') === '1';
  const [q, setQ] = useState('');
  const [trade, setTrade] = useState('');
  const [recruitmentStatus, setRecruitmentStatus] = useState('');
  const list = useArtisans({ q, trade, recruitmentStatus });
  const create = useCreateArtisan();
  const client = useQueryClient();
  const meta = useQuery({ queryKey: ['artisan-admin-meta'], queryFn: () => api.get<any>('/admin/artisans/meta') });
  const applications = useQuery({ queryKey: ['artisan-applications'], queryFn: () => api.get<any[]>('/admin/artisans/applications') });
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const [needsOverride, setNeedsOverride] = useState(false);

  const selectedTrade = useMemo(
    () => (meta.data?.trades || []).find((item: any) => item.key === form.tradeKey),
    [form.tradeKey, meta.data],
  );
  const rows = (list.data as { data?: Array<Record<string, any>> } | undefined)?.data || [];
  const pending = (applications.data || []).filter((item) => item.status === 'pending');

  const set = (patch: Partial<typeof emptyForm>) => setForm((current) => ({ ...current, ...patch, acknowledgeDuplicates: false }));

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Artisans</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Admin-created listings publish immediately. Applications from the public form stay pending until you approve them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.replace(catalogOpen ? '/artisans' : '/artisans?catalog=1', { scroll: false })}
          className={`rounded-lg border px-4 py-2 text-sm ${catalogOpen ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-800'}`}
          aria-expanded={catalogOpen}
        >
          Trades and problems
        </button>
      </div>

      {catalogOpen ? <div className="mt-6"><ArtisanCatalogPanel /></div> : null}

      <form
        className="mt-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.tradeKey) {
            setNotice('Choose a trade.');
            return;
          }
          setNotice('');
          try {
            const created = (await create.mutateAsync({
              ...form,
              email: form.email.trim() || undefined,
              serviceCities: form.serviceCities.split(',').map((item) => item.trim()).filter(Boolean),
              serviceStates: form.serviceStates.split(',').map((item) => item.trim()).filter(Boolean),
              sourceUrls: form.sourceUrls.split('\n').map((item) => item.trim()).filter(Boolean),
              sourceNotes: form.internalNotes,
              internalNotes: form.internalNotes,
              researchConfidence: form.researchConfidence || undefined,
              acknowledgeDuplicates: form.acknowledgeDuplicates,
              overrideSuppressionReason: form.overrideSuppressionReason || undefined,
            })) as { publicUrl?: string; trustScore?: number };
            setNotice(`Published ${created.publicUrl}. Trust score ${created.trustScore}%.`);
            setNeedsOverride(false);
            setForm(emptyForm);
            await list.refetch();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not create the listing.';
            if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('create anyway')) {
              setForm((current) => ({ ...current, acknowledgeDuplicates: true }));
            }
            if (message.toLowerCase().includes('asked not to be listed')) setNeedsOverride(true);
            setNotice(message);
          }
        }}
      >
        <input className="rounded-lg border px-3 py-2" placeholder="Artisan or business name" value={form.displayName} onChange={(event) => set({ displayName: event.target.value })} required />
        <select className="rounded-lg border px-3 py-2" value={form.tradeKey} onChange={(event) => set({ tradeKey: event.target.value, capabilityIds: [] })} required>
          <option value="">Select a trade</option>
          {(meta.data?.trades || []).map((item: any) => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </select>
        <input className="rounded-lg border px-3 py-2" placeholder="Phone" value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="WhatsApp" value={form.whatsapp} onChange={(event) => set({ whatsapp: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={(event) => set({ email: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="Website" value={form.website} onChange={(event) => set({ website: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="Instagram URL" value={form.instagramUrl} onChange={(event) => set({ instagramUrl: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="Facebook URL" value={form.facebookUrl} onChange={(event) => set({ facebookUrl: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="City" value={form.city} onChange={(event) => set({ city: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="State" value={form.state} onChange={(event) => set({ state: event.target.value })} />
        <input className="rounded-lg border px-3 py-2 md:col-span-3" placeholder="Workshop or business address" value={form.address} onChange={(event) => set({ address: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="Service cities, comma separated" value={form.serviceCities} onChange={(event) => set({ serviceCities: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="Service states, comma separated" value={form.serviceStates} onChange={(event) => set({ serviceStates: event.target.value })} />
        <input className="rounded-lg border px-3 py-2" placeholder="Business hours" value={form.workingHours} onChange={(event) => set({ workingHours: event.target.value })} />
        <select className="rounded-lg border px-3 py-2" value={form.researchConfidence} onChange={(event) => set({ researchConfidence: event.target.value as '' | 'high' | 'medium' })}>
          <option value="">Research confidence</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
        <select className="rounded-lg border px-3 py-2" value={form.sourceType} onChange={(event) => set({ sourceType: event.target.value })}>
          <option value="admin_research">Admin research</option>
          <option value="grok_research">Grok research</option>
          <option value="referral">Referral</option>
        </select>
        <textarea className="rounded-lg border px-3 py-2 md:col-span-3" placeholder="Short factual bio" value={form.bio} onChange={(event) => set({ bio: event.target.value })} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-3" placeholder="Source URLs, one per line" value={form.sourceUrls} onChange={(event) => set({ sourceUrls: event.target.value })} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-3" placeholder="Internal notes" value={form.internalNotes} onChange={(event) => set({ internalNotes: event.target.value })} />
        {selectedTrade ? (
          <div className="md:col-span-3 grid gap-3 md:grid-cols-2">
            <CheckGroup title="Problems they solve" items={selectedTrade.problems || []} selected={form.capabilityIds} onChange={(capabilityIds) => set({ capabilityIds })} />
            <CheckGroup title="Services" items={selectedTrade.services || []} selected={form.capabilityIds} onChange={(capabilityIds) => set({ capabilityIds })} />
            <CheckGroup title="Specialties" items={selectedTrade.specialties || []} selected={form.capabilityIds} onChange={(capabilityIds) => set({ capabilityIds })} />
            <p className="text-sm text-gray-500 md:col-span-2">
              Leave these unchecked to list this artisan for every active repair problem and service in the trade. Check specific ones when you know the work they take on.
            </p>
          </div>
        ) : null}
        {form.acknowledgeDuplicates || needsOverride ? (
          <input className="rounded-lg border px-3 py-2 md:col-span-3" placeholder="Reason for creating this listing anyway" value={form.overrideSuppressionReason} onChange={(event) => setForm((current) => ({ ...current, overrideSuppressionReason: event.target.value }))} required={needsOverride} />
        ) : null}
        <button className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={needsOverride && !form.overrideSuppressionReason.trim()}>
          {form.acknowledgeDuplicates || needsOverride ? 'Create anyway' : 'Publish listing'}
        </button>
      </form>
      {notice ? <NoticeText text={notice} /> : null}

      {pending.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">Pending applications</h2>
          {pending.map((item) => (
            <div key={item.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{item.displayName} · {item.tradeKey} · {item.city || 'No city'}</span>
              <button
                className="rounded-full bg-gray-950 px-3 py-1.5 text-white"
                onClick={async () => {
                  await api.patch(`/admin/artisans/applications/${item.id}`, { status: 'approved' });
                  await client.invalidateQueries({ queryKey: ['artisan-applications'] });
                  await list.refetch();
                }}
              >
                Approve and publish
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <input className="rounded-lg border px-3 py-2" placeholder="Search name, phone, city, trade" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="rounded-lg border px-3 py-2" value={trade} onChange={(event) => setTrade(event.target.value)}>
          <option value="">All trades</option>
          {(meta.data?.trades || []).map((item: any) => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </select>
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
              {['Artisan', 'Trade', 'Repairs', 'Location', 'Trust', 'Claim', 'Verification', 'Recruitment', 'Used by BMH', 'Claim link', 'Action'].map((heading) => (
                <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-950">{row.displayName}</td>
                <td className="px-3 py-2">{row.trade}</td>
                <td className="px-3 py-2">{(row.problems || []).slice(0, 2).join(', ') || 'All problems in this trade'}</td>
                <td className="px-3 py-2">{[row.city, row.state].filter(Boolean).join(', ')}</td>
                <td className="px-3 py-2">{row.trustScore}%</td>
                <td className="px-3 py-2">{row.claimStatus}</td>
                <td className="px-3 py-2">{row.verificationStatus}</td>
                <td className="px-3 py-2">{String(row.recruitmentStatus).replaceAll('_', ' ')}</td>
                <td className="px-3 py-2">{row.usedByBmh ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2"><ClaimLinkCopyButton kind="artisans" id={row.id} /></td>
                <td className="px-3 py-2"><Link className="font-semibold" href={`/artisans/${row.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NoticeText({ text }: { text: string }) {
  const parts = text.split(/(\/(?:artisans|vendors|professionals)\/[^\s)]+)/g);
  return (
    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">
      {parts.map((part, index) =>
        part.startsWith('/') ? (
          <a key={`${part}-${index}`} className="font-semibold underline" href={`https://buildmyhouse.app${part}`} target="_blank" rel="noreferrer">
            {part}
          </a>
        ) : (
          <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>
        ),
      )}
    </p>
  );
}

function CheckGroup({
  title,
  items,
  selected,
  onChange,
}: {
  title: string;
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <label key={item.id} className={`rounded-full border px-3 py-1 text-xs ${active ? 'bg-gray-950 text-white' : ''}`}>
              <input
                className="sr-only"
                type="checkbox"
                checked={active}
                onChange={() => onChange(active ? selected.filter((id) => id !== item.id) : [...selected, item.id])}
              />
              {item.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
