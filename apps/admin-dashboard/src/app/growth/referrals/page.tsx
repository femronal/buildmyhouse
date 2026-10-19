'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useReferralList, useReferralMutations, useReferralSummary } from '@/hooks/useReferrals';
import { formatLagosDate, type ReferrerListItem } from '@/lib/referrals';

const CHIPS = [
  { id: '', label: 'All' },
  { id: 'referrer', label: 'Referrers' },
  { id: 'affiliate', label: 'Affiliates' },
] as const;

type SortKey = 'jobsCount' | 'listingsCount' | 'paidJobsCount' | 'completedJobsCount';

export default function ReferralsPage() {
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sort, setSort] = useState<SortKey>('jobsCount');
  const [open, setOpen] = useState(false);
  const list = useReferralList({ type, q, includeArchived });
  const summary = useReferralSummary();
  const rows = useMemo(() => {
    const items = [...(list.data || [])];
    items.sort((a, b) => Number(b[sort] || 0) - Number(a[sort] || 0));
    return items;
  }, [list.data, sort]);

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals and affiliates</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Who brings us listings and homeowner jobs, and how many of those jobs are paid and completed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Add referrer
        </button>
      </header>

      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Funnel label="Listings brought in" value={summary.data?.listingsCount} />
          <Funnel label="Homeowner jobs" value={summary.data?.jobsCount} />
          <Funnel label="Paid jobs" value={summary.data?.paidJobsCount} accent />
          <Funnel label="Completed jobs" value={summary.data?.completedJobsCount} accent />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {summary.data?.projectsWithoutReferrer ?? 0} projects and {summary.data?.listingsWithoutReferrer ?? 0} listings have no referrer yet.
        </p>
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.id || 'all'}
              type="button"
              onClick={() => setType(chip.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                type === chip.id ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, code or phone"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Show archived
        </label>
      </div>

      {list.isLoading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {!list.isLoading && rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-700">
            No referrers yet. Add the first person who brought you a listing or a homeowner.
          </p>
          <button type="button" onClick={() => setOpen(true)} className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white">
            Add referrer
          </button>
        </div>
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <SortHead label="Listings" active={sort === 'listingsCount'} onClick={() => setSort('listingsCount')} />
                <SortHead label="Jobs" active={sort === 'jobsCount'} onClick={() => setSort('jobsCount')} />
                <SortHead label="Paid" active={sort === 'paidJobsCount'} onClick={() => setSort('paidJobsCount')} />
                <SortHead label="Completed" active={sort === 'completedJobsCount'} onClick={() => setSort('completedJobsCount')} />
                <th className="px-4 py-3">First referral</th>
                <th className="px-4 py-3">Last referral</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/growth/referrals/${row.id}`} className="font-medium text-gray-900 hover:underline">
                      {row.name}
                    </Link>
                    <span className="ml-2 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CopyCode code={row.code} />
                  </td>
                  <td className="px-4 py-3">{row.listingsCount}</td>
                  <td className="px-4 py-3">{row.jobsCount}</td>
                  <td className="px-4 py-3 text-[#22c55e]">{row.paidJobsCount}</td>
                  <td className="px-4 py-3 text-[#22c55e]">{row.completedJobsCount}</td>
                  <td className="px-4 py-3">{formatLagosDate(row.firstReferralAt)}</td>
                  <td className="px-4 py-3">{formatLagosDate(row.lastReferralAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {open ? <AddReferrerModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function Funnel({ label, value, accent }: { label: string; value?: number; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-[#22c55e]' : 'text-gray-900'}`}>{value ?? 0}</p>
    </div>
  );
}

function SortHead({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-4 py-3">
      <button type="button" onClick={onClick} className={active ? 'text-gray-900' : ''}>
        {label}
      </button>
    </th>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="font-mono text-xs"
      onClick={async (event) => {
        event.preventDefault();
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied' : code}
    </button>
  );
}

function AddReferrerModal({ onClose }: { onClose: () => void }) {
  const mutations = useReferralMutations();
  const [form, setForm] = useState({
    type: 'referrer',
    name: '',
    whatsapp: '',
    phone: '',
    email: '',
    code: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-lg rounded-xl bg-white p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          try {
            await mutations.create.mutateAsync({
              type: form.type,
              name: form.name,
              whatsapp: form.whatsapp || undefined,
              phone: form.phone || undefined,
              email: form.email || undefined,
              code: form.code || undefined,
              notes: form.notes || undefined,
            });
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save.');
          }
        }}
      >
        <h2 className="text-lg font-semibold">Add referrer</h2>
        <div className="mt-4 grid gap-3">
          <select className="rounded-lg border px-3 py-2 text-sm" value={form.type} onChange={(event) => set('type', event.target.value)}>
            <option value="referrer">Referrer</option>
            <option value="affiliate">Affiliate</option>
          </select>
          <input required className="rounded-lg border px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(event) => set('name', event.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="WhatsApp" value={form.whatsapp} onChange={(event) => set('whatsapp', event.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(event) => set('phone', event.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(event) => set('email', event.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Code. Leave empty to generate one" value={form.code} onChange={(event) => set('code', event.target.value)} />
          <textarea className="rounded-lg border px-3 py-2 text-sm" placeholder="Notes" value={form.notes} onChange={(event) => set('notes', event.target.value)} />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm text-white">Save</button>
        </div>
      </form>
    </div>
  );
}

export type { ReferrerListItem };
