'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useScamReports, type ScamReportStatus } from '@/hooks/useScamReports';

const TABS: Array<{ id: ScamReportStatus; label: string }> = [
  { id: 'new', label: 'New' },
  { id: 'investigating', label: 'Investigating' },
  { id: 'upheld', label: 'Upheld' },
  { id: 'dismissed', label: 'Dismissed' },
];

export default function ScamReportsPage() {
  const [status, setStatus] = useState<ScamReportStatus>('new');
  const query = useScamReports({ status, page: 1 });
  const rows = query.data?.data || [];

  return (
    <div className="p-4 md:p-8 space-y-4">
      <h1 className="text-2xl font-bold font-poppins">Scam reports</h1>
      <p className="text-sm text-gray-500">These reports stay private unless you uphold one and write a notice.</p>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatus(tab.id)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium ${status === tab.id ? 'bg-gray-950 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {query.isLoading ? <p className="text-sm text-gray-500">Loading reports...</p> : null}
      {!query.isLoading && rows.length === 0 ? <p className="text-sm text-gray-500">No reports in this tab.</p> : null}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">Listing</th>
              <th className="px-3 py-2 font-medium">Kind</th>
              <th className="px-3 py-2 font-medium">Reporter</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-3 py-3">
                  <Link href={`/scam-reports/${row.id}`} className="font-medium text-gray-950 underline">{row.listingName}</Link>
                </td>
                <td className="px-3 py-3 capitalize">{row.listingKind}</td>
                <td className="px-3 py-3">{row.reporterName}</td>
                <td className="px-3 py-3">{row.amountNaira == null ? 'Not stated' : row.amountNaira.toLocaleString('en-NG')}</td>
                <td className="px-3 py-3">{new Date(row.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
