'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useReferral, useReferralMutations, useReferralSettings } from '@/hooks/useReferrals';
import { formatLagosDate } from '@/lib/referrals';

export default function ReferralDetailPage() {
  const params = useParams<{ id: string }>();
  const settings = useReferralSettings();
  const query = useReferral(params.id);
  const mutations = useReferralMutations();
  const row = query.data;
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [attachKind, setAttachKind] = useState<'project' | 'artisan_listing' | 'professional_listing' | 'vendor'>('artisan_listing');
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<{ id: string; label: string }[]>([]);

  if (query.isLoading) return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  if (!row) return <div className="p-8 text-sm text-gray-500">Referrer not found.</div>;

  const lookup = async (value: string) => {
    setSearch(value);
    if (value.trim().length < 2) {
      setMatches([]);
      return;
    }
    const rows = await api.get<{ id: string; label: string }[]>(
      `/admin/referrals/targets?targetType=${attachKind}&q=${encodeURIComponent(value)}`,
    );
    setMatches(rows);
  };

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Link href="/growth/referrals" className="text-sm text-gray-600">Back to referrals</Link>
      <header className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{row.name}</h1>
          <span className="mt-2 inline-flex rounded-full border border-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {row.type}
          </span>
          <p className="mt-3 font-mono text-sm">{row.code}</p>
          <CopyLine label="Share link" value={row.shareUrl} />
          <p className="mt-2 text-sm text-gray-600">
            {[row.whatsapp, row.phone, row.email].filter(Boolean).join(' · ') || 'No contact saved'}
          </p>
          {row.notes ? <p className="mt-2 max-w-2xl text-sm text-gray-700">{row.notes}</p> : null}
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            onClick={() => mutations.update.mutate({ id: row.id, body: { archived: !row.archivedAt } })}
          >
            {row.archivedAt ? 'Restore' : 'Archive'}
          </button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        <Metric label="Listings brought in" value={row.listingsCount} />
        <Metric label="Homeowner jobs" value={row.jobsCount} />
        <Metric label="Paid jobs" value={row.paidJobsCount} />
        <Metric
          label="Completed jobs"
          value={row.completedJobsCount}
          hint="Counts projects marked completed. Homeowner sign-off is not tracked separately yet."
        />
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Listings</h2>
        <AttachSearch
          kind={attachKind}
          onKind={setAttachKind}
          search={search}
          onSearch={lookup}
          matches={matches}
          onPick={async (id) => {
            await mutations.attach.mutateAsync({ targetType: attachKind, targetId: id, referrerId: row.id });
            setMatches([]);
            setSearch('');
          }}
        />
        <SimpleTable
          rows={(row.listings || []).map((item: any) => ({
            key: `${item.kind}-${item.id}`,
            cells: [
              <Link key="n" href={item.kind === 'artisan' ? `/artisans/${item.id}` : item.kind === 'vendor' ? `/vendors/${item.id}` : `/professionals/${item.id}`} className="hover:underline">
                {item.displayName}
              </Link>,
              item.kind,
              item.state || '-',
              item.claimStatus || '-',
              formatLagosDate(item.createdAt),
            ],
          }))}
          headers={['Name', 'Kind', 'State', 'Claim', 'Added']}
        />
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Homeowner jobs</h2>
        <SimpleTable
          rows={(row.projects || []).map((item: any) => ({
            key: item.id,
            cells: [
              <Link key="n" href={`/projects/${item.id}`} className="hover:underline">{item.name}</Link>,
              item.state || '-',
              item.status,
              item.paid ? 'Yes' : 'No',
              item.referralSource || '-',
              formatLagosDate(item.createdAt),
            ],
          }))}
          headers={['Project', 'State', 'Status', 'Paid', 'Source', 'Created']}
        />
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Leads from /start</h2>
        <SimpleTable
          rows={(row.startRequests || []).map((item: any) => ({
            key: item.reference,
            cells: [item.reference, item.path, formatLagosDate(item.createdAt)],
          }))}
          headers={['Reference', 'Path', 'Created']}
        />
      </section>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {editing ? (
        <EditModal
          row={row}
          onClose={() => setEditing(false)}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div title={hint}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value || 0}</p>
    </div>
  );
}

function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="mt-2 text-sm text-gray-700">
      {label}: <span className="font-mono text-xs">{value}</span>{' '}
      <button
        type="button"
        className="text-[#22c55e]"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </p>
  );
}

function AttachSearch(props: {
  kind: string;
  onKind: (value: 'project' | 'artisan_listing' | 'professional_listing' | 'vendor') => void;
  search: string;
  onSearch: (value: string) => void;
  matches: { id: string; label: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500">Attach a listing or job</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <select className="rounded-lg border px-3 py-2 text-sm" value={props.kind} onChange={(event) => props.onKind(event.target.value as any)}>
          <option value="artisan_listing">Artisan listing</option>
          <option value="professional_listing">Professional listing</option>
          {settings.data?.trackVendors ? <option value="vendor">Vendor</option> : null}
          <option value="project">Homeowner job</option>
        </select>
        <input
          className="rounded-lg border px-3 py-2 text-sm"
          placeholder="Search by name"
          value={props.search}
          onChange={(event) => props.onSearch(event.target.value)}
        />
      </div>
      {props.matches.length ? (
        <ul className="mt-2 divide-y rounded-lg border">
          {props.matches.map((match) => (
            <li key={match.id}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => props.onPick(match.id)}>
                {match.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: { key: string; cells: any[] }[] }) {
  if (!rows.length) return <p className="mt-3 text-sm text-gray-500">None yet.</p>;
  return (
    <table className="mt-3 min-w-full text-left text-sm">
      <thead>
        <tr>{headers.map((header) => <th key={header} className="px-2 py-2 text-xs uppercase text-gray-500">{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-t border-gray-100">
            {row.cells.map((cell, index) => <td key={index} className="px-2 py-2">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EditModal({ row, onClose, onError }: { row: any; onClose: () => void; onError: (value: string) => void }) {
  const mutations = useReferralMutations();
  const [name, setName] = useState(row.name || '');
  const [code, setCode] = useState(row.code || '');
  const [notes, setNotes] = useState(row.notes || '');
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-md rounded-xl bg-white p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await mutations.update.mutateAsync({ id: row.id, body: { name, code, notes } });
            onClose();
          } catch (error) {
            onError(error instanceof Error ? error.message : 'Could not save.');
          }
        }}
      >
        <h2 className="text-lg font-semibold">Edit referrer</h2>
        <input className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
        <input className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" value={code} onChange={(event) => setCode(event.target.value)} />
        <textarea className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border px-3 py-2 text-sm">Cancel</button>
          <button type="submit" className="rounded-lg bg-black px-3 py-2 text-sm text-white">Save</button>
        </div>
      </form>
    </div>
  );
}
