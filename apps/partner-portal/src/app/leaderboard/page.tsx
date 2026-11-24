'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api, naira } from '@/lib/api';

type Tier = { key: string; label: string; min: number; band: string };
type Row = { rank: number; label: string; tierLabel: string; band: string; isYou: boolean; amount?: number; completedProjects?: number };
type Board = {
  period: 'month' | 'all';
  rankedCount: number;
  rows: Row[];
  tiers: Tier[];
  you: { rank: number | null; label: string; tier: Tier; periodAmount: number; completedProjects: number; band?: string };
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [data, setData] = useState<Board | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Board>(`/partner/leaderboard?period=${period}`).then(setData).catch((err: Error) => setError(err.message));
  }, [period]);

  const ordered = data?.rows || [];
  const podium = [ordered[1] || null, ordered[0] || null, ordered[2] || null];
  const list = ordered.slice(3);
  const youInList = ordered.some((row) => row.isYou);
  const youRow = data && data.you.rank && !youInList ? data.you : null;

  return (
    <Shell>
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-gray-600">Ranked by approved and paid commission.</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 grid grid-cols-2 rounded-xl bg-gray-200/70 p-1 text-sm">
          <button type="button" className={`min-h-11 rounded-lg ${period === 'month' ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`} onClick={() => setPeriod('month')}>This month</button>
          <button type="button" className={`min-h-11 rounded-lg ${period === 'all' ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`} onClick={() => setPeriod('all')}>All time</button>
        </div>
        {data && data.rows.length === 0 ? <p className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">No one is ranked yet this month. The first approved project takes rank 1.</p> : null}
        {data && data.rows.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 items-end gap-2">
            {podium.map((row, index) => (
              <article key={row ? `${index}-${row.rank}-${row.label}` : `empty-${index}`} className={`rounded-xl border bg-white p-3 text-center ${row?.isYou ? 'border-black bg-black text-white' : row?.rank === 1 ? 'border-2 border-black' : 'border-gray-200'} ${row?.rank === 1 ? 'min-h-40' : 'min-h-32'}`}>
                {row ? (
                  <>
                    <p className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${row.isYou ? 'bg-white text-black' : 'bg-gray-100'}`}>{row.rank}</p>
                    <p className="mt-2 text-sm font-semibold">{row.isYou ? `You - ${row.label}` : row.label}</p>
                    <p className={`mt-1 text-xs ${row.isYou ? 'text-white/70' : 'text-gray-500'}`}>{row.amount == null ? row.band : naira(row.amount)}</p>
                    <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${row.isYou ? 'bg-white text-black' : 'bg-gray-100'}`}>{row.tierLabel}</p>
                  </>
                ) : <p className="text-xs text-gray-400"> </p>}
              </article>
            ))}
          </div>
        ) : null}
        <div className="mt-4 space-y-2">
          {list.map((row, index) => <RankLine key={`${index}-${row.rank}-${row.label}`} row={row} period={period} />)}
          {youRow ? <RankLine period={period} row={{ rank: youRow.rank || 0, label: youRow.label, tierLabel: youRow.tier.label, band: youRow.tier.band, isYou: true, amount: youRow.periodAmount, completedProjects: youRow.completedProjects }} /> : null}
        </div>
        {data && data.you.rank == null ? <p className="mt-4 text-sm text-gray-700">Not ranked yet. Your first approved project puts you on the board.</p> : null}
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">Tiers</h2>
          <div className="mt-3 space-y-3">
            {(data?.tiers || []).map((tier) => (
              <div key={tier.key} className="flex items-center justify-between gap-3 text-sm">
                <span className={`rounded-full px-3 py-1 ${tier.key === 'gold' || tier.key === 'platinum' ? 'bg-black text-white' : 'border border-gray-300'}`}>{tier.label}</span>
                <span className="text-gray-600">{tier.band}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-gray-500">Your tier counts all your approved and paid commission. Awaiting checks and reversed amounts do not count. Other partners see your nickname and tier, never your amount. Change your nickname in Settings.</p>
        </section>
      </main>
    </Shell>
  );
}

function RankLine({ row, period }: { row: Row; period: 'month' | 'all' }) {
  const detail = row.amount == null
    ? row.band
    : `${naira(row.amount)} approved ${period === 'month' ? 'this month' : 'all time'}${row.completedProjects != null ? ` · ${row.completedProjects} project${row.completedProjects === 1 ? '' : 's'}` : ''}`;
  return (
    <article className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${row.isYou ? 'bg-black text-white' : 'border border-gray-200 bg-white'}`}>
      <div>
        <p className="text-sm font-semibold">{row.rank} {row.isYou ? `You - ${row.label}` : row.label}</p>
        <p className={`text-xs ${row.isYou ? 'text-white/70' : 'text-gray-500'}`}>{detail}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs ${row.isYou ? 'bg-white text-black' : 'border border-gray-300'}`}>{row.tierLabel}</span>
    </article>
  );
}
