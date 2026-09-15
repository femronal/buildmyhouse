'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Eye, Plus, Search } from 'lucide-react';
import {
  LISTING_STATUS_LABELS,
  OWNERSHIP_STATUS_LABELS,
  PROCUREMENT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  useProfessionalMeta,
  useProfessionals,
} from '@/hooks/useProfessionals';

function pill(kind: 'listing' | 'verification' | 'procurement', value: string) {
  if (kind === 'listing') {
    if (value === 'listed') return 'bg-green-100 text-green-700';
    if (value === 'hidden' || value === 'archived') return 'bg-slate-100 text-slate-700';
    return 'bg-gray-100 text-gray-700';
  }
  if (kind === 'verification') {
    if (value === 'verified') return 'bg-emerald-100 text-emerald-800';
    if (value === 'pending') return 'bg-amber-100 text-amber-800';
    if (value === 'expired' || value === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-600';
  }
  if (value === 'ready') return 'bg-blue-100 text-blue-800';
  if (value === 'blocked' || value === 'hold') return 'bg-red-50 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

export default function ProfessionalsPage() {
  const [query, setQuery] = useState('');
  const [listingStatus, setListingStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [profession, setProfession] = useState('');
  const [procurementStatus, setProcurementStatus] = useState('');
  const [ownershipStatus, setOwnershipStatus] = useState('');
  const [state, setState] = useState('');
  const [usedByBmh, setUsedByBmh] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [page, setPage] = useState(1);
  const meta = useProfessionalMeta();
  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      listingStatus: listingStatus || undefined,
      verificationStatus: verificationStatus || undefined,
      profession: profession || undefined,
      procurementStatus: procurementStatus || undefined,
      ownershipStatus: ownershipStatus || undefined,
      state: state || undefined,
      usedByBmh: usedByBmh || undefined,
      incomplete: incomplete || undefined,
      page,
      limit: 30,
    }),
    [incomplete, listingStatus, ownershipStatus, page, procurementStatus, profession, query, state, usedByBmh, verificationStatus],
  );
  const { data, isLoading, error } = useProfessionals(params);
  const rows = data?.data || [];
  const counts = data?.counts;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Professionals</h1>
          <p className="text-gray-500 mt-1">
            Construction and property professionals — directory, credentials, and internal procurement. Listing is not verification.
          </p>
        </div>
        <Link
          href="/professionals/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add professional
        </Link>
      </div>

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            ['Total', counts.total],
            ['Listed', counts.listed],
            ['Credential checked', counts.credentialChecked],
            ['Pending', counts.pending],
            ['Procurement ready', counts.procurementReady],
            ['Used by BMH', counts.usedByBmh],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white rounded-xl shadow px-3 py-3">
              <p className="text-[11px] text-gray-500">{label}</p>
              <p className="text-xl font-semibold text-gray-900">{value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search name, phone, email, slug, registration…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg"
          />
        </div>
        <select value={profession} onChange={(e) => { setPage(1); setProfession(e.target.value); }} className="border rounded-lg px-3 py-2">
          <option value="">All professions</option>
          {(meta.data?.professions || []).map((p: any) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <select value={listingStatus} onChange={(e) => { setPage(1); setListingStatus(e.target.value); }} className="border rounded-lg px-3 py-2">
          <option value="">All listing statuses</option>
          {Object.entries(LISTING_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={verificationStatus} onChange={(e) => { setPage(1); setVerificationStatus(e.target.value); }} className="border rounded-lg px-3 py-2">
          <option value="">All verification</option>
          {Object.entries(VERIFICATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={procurementStatus} onChange={(e) => { setPage(1); setProcurementStatus(e.target.value); }} className="border rounded-lg px-3 py-2">
          <option value="">All procurement</option>
          {Object.entries(PROCUREMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={ownershipStatus} onChange={(e) => { setPage(1); setOwnershipStatus(e.target.value); }} className="border rounded-lg px-3 py-2">
          <option value="">All claim states</option>
          {Object.entries(OWNERSHIP_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={state} onChange={(e) => { setPage(1); setState(e.target.value); }} className="border rounded-lg px-3 py-2">
          <option value="">All states</option>
          {(meta.data?.states || []).map((s: any) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={usedByBmh} onChange={(e) => { setPage(1); setUsedByBmh(e.target.checked); }} />
          Used by BMH
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={incomplete} onChange={(e) => { setPage(1); setIncomplete(e.target.checked); }} />
          Incomplete profiles
        </label>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-600">
          {isLoading ? 'Loading…' : `${data?.meta?.total ?? 0} professionals`}
        </div>
        {error && <div className="p-8 text-center text-red-600">Failed to load professionals. {(error as Error).message}</div>}
        {!error && !isLoading && rows.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <BadgeCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No professionals match these filters yet.</p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Professional</th>
                  <th className="px-4 py-3 font-medium">Profession</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Regulator / licence</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Credential</th>
                  <th className="px-4 py-3 font-medium">Procurement</th>
                  <th className="px-4 py-3 font-medium">Used by BMH</th>
                  <th className="px-4 py-3 font-medium">Complete</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{row.displayName}</div>
                      <div className="text-xs text-gray-500">{row.slug} · {OWNERSHIP_STATUS_LABELS[row.ownershipStatus]}</div>
                    </td>
                    <td className="px-4 py-3">{row.profession?.label || '—'}</td>
                    <td className="px-4 py-3">{[row.city, row.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      <div>{row.profession?.regulatorLabel || 'Documents'}</div>
                      <div className="text-xs text-gray-500">{row.primaryCredential?.registrationNumber || 'No licence number'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${pill('listing', row.listingStatus)}`}>
                        {LISTING_STATUS_LABELS[row.listingStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${pill('verification', row.verificationStatus)}`}>
                        {VERIFICATION_STATUS_LABELS[row.verificationStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${pill('procurement', row.procurementStatus)}`}>
                        {PROCUREMENT_STATUS_LABELS[row.procurementStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.usedByBmh ? 'Yes' : '—'}</td>
                    <td className="px-4 py-3">{row.completenessScore}%</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/professionals/${row.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border">
                        <Eye className="w-4 h-4" /> Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex justify-end gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
