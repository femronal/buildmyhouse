'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api, naira } from '@/lib/api';

type Overview = {
  name: string;
  code: string;
  rateBps: number;
  earnings: { pending: number; approved: number; paid: number; total: number };
  visitors: number;
  lockedHomeowners: number;
  completedProjects: number;
  nextCampaign: { title: string; caption: string; link: string } | null;
};

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<Overview>('/partner/overview').then(setData).catch((err: Error) => setError(err.message));
  }, []);

  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active partner</p>
        <h1 className="mt-1 text-2xl font-bold">{data?.name || 'Overview'}</h1>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card label="Visitors" value={String(data?.visitors ?? '—')} />
          <Card label="Homeowner sign-ups" value={String(data?.lockedHomeowners ?? '—')} />
          <Card label="Completed projects" value={String(data?.completedProjects ?? '—')} />
          <Card label="Total earnings" value={data ? naira(data.earnings.total) : '—'} />
        </section>
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Paid {data ? naira(data.earnings.paid) : '—'}</p>
          <p className="text-sm text-gray-600">Approved, not paid yet {data ? naira(data.earnings.approved) : '—'}</p>
          <p className="text-sm text-gray-600">Awaiting checks {data ? naira(data.earnings.pending) : '—'}</p>
          <p className="mt-2 text-xs text-gray-500">Your rate is {data ? data.rateBps / 100 : 2.5}% of the contractor amount. Contingency is excluded.</p>
        </section>
        {data?.nextCampaign ? (
          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold">What to promote next</h2>
            <p className="mt-2 text-sm text-gray-800">{data.nextCampaign.caption}</p>
            {data.nextCampaign.link ? (
              <>
                <p className="mt-2 break-all text-xs text-gray-500">{data.nextCampaign.link}</p>
                <button
                  type="button"
                  className="mt-3 rounded-lg bg-black px-3 py-2 text-sm text-white"
                  onClick={async () => {
                    await navigator.clipboard.writeText(data.nextCampaign?.link || '');
                    setCopied(true);
                  }}
                >
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </>
            ) : null}
          </section>
        ) : null}
      </main>
    </Shell>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
