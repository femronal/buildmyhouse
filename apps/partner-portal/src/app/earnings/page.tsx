'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api, naira, statusLabel } from '@/lib/api';

type Earning = {
  id: string;
  eligibleContractorAmount: number;
  rateBps: number;
  amount: number;
  contingencyAmount: number;
  status: string;
  paymentReference?: string | null;
  reviewReasons?: string | null;
};

export default function EarningsPage() {
  const [rows, setRows] = useState<Earning[]>([]);
  useEffect(() => {
    api.get<Earning[]>('/partner/earnings').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="mt-2 text-sm text-gray-600">Contingency is shown so you can see it was not part of the calculation.</p>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No commissions yet.</p> : null}
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">Eligible project value</p>
              <p className="text-sm">{naira(row.eligibleContractorAmount)}</p>
              <p className="mt-2 text-xs text-gray-500">Your commission rate</p>
              <p className="text-sm">{row.rateBps / 100}%</p>
              <p className="mt-2 text-xs text-gray-500">Calculated commission</p>
              <p className="text-2xl font-semibold">{naira(row.amount)}</p>
              <p className="mt-2 text-sm text-gray-600">Contingency excluded {naira(row.contingencyAmount)}</p>
              <p className="mt-1 text-sm">{statusLabel(row.status)}{row.paymentReference ? ` · ${row.paymentReference}` : ''}</p>
              {row.reviewReasons ? <p className="mt-1 text-xs text-gray-500">{row.reviewReasons}</p> : null}
            </article>
          ))}
        </div>
      </main>
    </Shell>
  );
}
