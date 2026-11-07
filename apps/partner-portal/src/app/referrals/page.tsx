'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api, statusLabel } from '@/lib/api';

type Referral = {
  id: string;
  homeowner: string;
  area: string;
  stage: string;
  projects: Array<{ status: string; area: string }>;
};

export default function ReferralsPage() {
  const [rows, setRows] = useState<Referral[]>([]);
  useEffect(() => {
    api.get<Referral[]>('/partner/referrals').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="mt-2 text-sm text-gray-600">Names are shortened. Addresses, plans and documents stay with BuildMyHouse.</p>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No homeowners are locked to you yet.</p> : null}
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-medium">{row.homeowner}</p>
              <p className="text-sm text-gray-600">{row.area || 'Area not shown'}</p>
              <p className="mt-2 text-sm">{statusLabel(row.stage)}</p>
            </article>
          ))}
        </div>
      </main>
    </Shell>
  );
}
