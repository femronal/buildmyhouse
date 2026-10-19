'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useReferralList, useReferralMutations, useReferralSettings, useReferralSummary } from '@/hooks/useReferrals';
import { api } from '@/lib/api';
import { formatLagosDate, type ReferralProgramSettings, type ReferrerListItem } from '@/lib/referrals';

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

      <ReferralRules />

      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Funnel label="Listings brought in" value={summary.data?.listingsCount} counts={summary.data?.countsWhen === 'listing'} />
          <Funnel label="Homeowner jobs" value={summary.data?.jobsCount} counts={summary.data?.countsWhen === 'job_created'} />
          <Funnel label="Paid jobs" value={summary.data?.paidJobsCount} accent counts={summary.data?.countsWhen === 'job_paid'} />
          <Funnel label="Completed jobs" value={summary.data?.completedJobsCount} accent counts={summary.data?.countsWhen === 'job_completed'} />
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

function Funnel({ label, value, accent, counts }: { label: string; value?: number; accent?: boolean; counts?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-[#22c55e]' : 'text-gray-900'}`}>{value ?? 0}</p>
      {counts ? <p className="mt-1 text-xs text-[#22c55e]">This is the number that counts</p> : null}
    </div>
  );
}

function ReferralRules() {
  const query = useReferralSettings();
  const [form, setForm] = useState<ReferralProgramSettings | null>(null);
  const [status, setStatus] = useState('');
  const current = form || query.data;
  if (!current) return null;
  const set = (patch: Partial<ReferralProgramSettings>) => setForm({ ...current, ...patch });
  return (
    <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-base font-semibold text-gray-900">Referral rules</h2>
      <p className="mt-1 text-sm text-gray-600">These choices are saved here. Change them on this page. They are not fixed in the app.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex items-start gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            className="mt-1"
            checked={current.allowHomeownerTypedCode}
            onChange={(event) => set({ allowHomeownerTypedCode: event.target.checked })}
          />
          <span>
            <span className="font-medium">Homeowners can type a referral code</span>
            <span className="mt-1 block text-xs text-gray-500">Shows a code field when someone starts a job or uploads a plan.</span>
          </span>
        </label>
        <label className="text-sm text-gray-800">
          <span className="font-medium">A shared link stays valid for</span>
          <span className="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              className="w-24 rounded-lg border border-gray-200 px-3 py-2"
              value={current.linkValidityDays}
              onChange={(event) => set({ linkValidityDays: Number(event.target.value) })}
            />
            <span>days</span>
          </span>
        </label>
        <label className="text-sm text-gray-800">
          <span className="font-medium">If a newer code arrives</span>
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            value={current.attributionRule}
            onChange={(event) => set({ attributionRule: event.target.value as ReferralProgramSettings['attributionRule'] })}
          >
            <option value="first_touch">Keep the first code during the validity window</option>
            <option value="latest_code">Replace it with the newest code</option>
          </select>
        </label>
        <label className="text-sm text-gray-800">
          <span className="font-medium">A referral counts when</span>
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            value={current.countsWhen}
            onChange={(event) => set({ countsWhen: event.target.value as ReferralProgramSettings['countsWhen'] })}
          >
            <option value="undecided">Not decided yet</option>
            <option value="listing">A listing is brought in</option>
            <option value="job_created">A homeowner job is created</option>
            <option value="job_paid">A homeowner job is paid</option>
            <option value="job_completed">A homeowner job is completed</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-800 md:col-span-2">
          <input
            type="checkbox"
            className="mt-1"
            checked={current.trackVendors}
            onChange={(event) => set({ trackVendors: event.target.checked })}
          />
          <span>
            <span className="font-medium">Track vendors as well</span>
            <span className="mt-1 block text-xs text-gray-500">Lets you attach a referrer on a vendor page. Off means vendors stay out of this list.</span>
          </span>
        </label>
        <label className="text-sm text-gray-800 md:col-span-2">
          <span className="font-medium">Payout rules</span>
          <span className="mt-1 block text-xs text-gray-500">Write the rule you want followed. This page records it. It does not send money.</span>
          <textarea
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2"
            rows={3}
            value={current.payoutRules || ''}
            onChange={(event) => set({ payoutRules: event.target.value })}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          onClick={async () => {
            setStatus('');
            try {
              await api.patch('/admin/referrals/settings', {
                allowHomeownerTypedCode: current.allowHomeownerTypedCode,
                linkValidityDays: current.linkValidityDays,
                attributionRule: current.attributionRule,
                trackVendors: current.trackVendors,
                countsWhen: current.countsWhen,
                payoutRules: current.payoutRules || '',
              });
              setStatus('Saved.');
              setForm(null);
              await query.refetch();
            } catch (error) {
              setStatus(error instanceof Error ? error.message : 'Could not save.');
            }
          }}
        >
          Save rules
        </button>
        {status ? <p className="text-sm text-gray-600">{status}</p> : null}
      </div>
    </section>
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
