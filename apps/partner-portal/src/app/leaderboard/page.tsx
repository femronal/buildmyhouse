'use client';

import { useEffect, useState } from 'react';
import { MovementChip, StreakCard, TierMedal, lagosStamp, placeColor, type Movement } from '@/components/RankBits';
import Shell from '@/components/Shell';
import { api, naira } from '@/lib/api';

type Tier = { key: string; label: string; min: number; band: string };
type Part = { key: string; label: string; points: number; detail: string };
type You = {
  rank: number;
  rankedCount: number;
  topPercent: number;
  movement: Movement;
  score: number;
  parts: Part[];
  tier: Tier;
  nextTier: Tier | null;
  allTimeAmount: number;
  streak: number;
  last7: boolean[];
  nickname: string;
};
type Row = { rank: number; label: string; tierKey: string; tierLabel: string; band: string; movement: Movement; isYou: boolean; score?: number };
type Board = { rankedCount: number; updatedAt: string; rows: Row[]; tiers: Tier[]; you: You };

export default function LeaderboardPage() {
  const [data, setData] = useState<Board | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Board>('/partner/leaderboard').then(setData).catch((err: Error) => setError(err.message));
  }, []);

  const podium = [2, 1, 3].map((rank) => (data?.rows || []).find((row) => row.rank === rank) || null);
  const rest = (data?.rows || []).filter((row) => row.rank > 3);

  return (
    <Shell>
      <main className="p-4 pb-36 sm:p-6 lg:pb-6">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-xs text-gray-500">Updated {data ? lagosStamp(data.updatedAt) : ''}</p>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 grid grid-cols-3 items-end gap-2">
          {podium.map((row, index) => (
            <div key={row?.rank || index} className={`rounded-xl border border-gray-200 bg-white p-2 text-center ${row?.rank === 1 ? '-mt-4 pb-6' : ''}`}>
              {row ? (
                <>
                  <p className="text-xs font-semibold" style={{ color: placeColor(row.rank) }}>{row.rank === 1 ? '1st' : row.rank === 2 ? '2nd' : '3rd'}</p>
                  <div className="mt-2 flex justify-center"><TierMedal tierKey={row.tierKey} size={row.rank === 1 ? 'lg' : 'md'} /></div>
                  <p className="mt-2 truncate text-sm font-semibold">{row.label}</p>
                  <div className="mt-1 flex justify-center"><MovementChip movement={row.movement} /></div>
                </>
              ) : <p className="py-8 text-xs text-gray-400">-</p>}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {rest.map((row) => (
            <div key={`${row.rank}-${row.label}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${row.isYou ? 'bg-black text-white' : 'border border-gray-200 bg-white'}`}>
              <span className="w-6 text-sm font-semibold">{row.rank}</span>
              <TierMedal tierKey={row.tierKey} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.label}</p>
                <p className={`text-xs ${row.isYou ? 'text-white/70' : 'text-gray-500'}`}>{row.isYou && row.score != null ? `${row.score} points` : row.band}</p>
              </div>
              <MovementChip movement={row.movement} light={row.isYou} />
            </div>
          ))}
        </div>
        {data ? (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="font-semibold">How your rank is worked out</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {data.you.parts.map((part) => (
                <li key={part.key}>{part.label}: {part.detail}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-gray-600">Commission counts the most. Other partners never see your amount or your score.</p>
          </section>
        ) : null}
        {data ? (
          <section className="mt-4">
            <h2 className="font-semibold">Tiers</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.tiers.map((tier) => {
                const locked = tier.min > data.you.allTimeAmount;
                return (
                  <div key={tier.key} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                    <div className="flex justify-center"><TierMedal tierKey={tier.key} /></div>
                    <p className="mt-2 text-sm font-semibold">{tier.label}</p>
                    <p className="text-xs text-gray-500">{tier.band}</p>
                    {locked ? <p className="mt-1 text-xs text-gray-500">Locked. Unlocks at {naira(tier.min)}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
        {data ? <div className="mt-4 lg:hidden"><StreakCard streak={data.you.streak} last7={data.you.last7 || []} /></div> : null}
      </main>
      {data ? (
        <div className="fixed inset-x-0 bottom-16 z-30 bg-black px-4 py-3 text-white md:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold">#{data.you.rank} {data.you.nickname}</p>
            <p className="shrink-0 text-sm">{data.you.score} points</p>
            <MovementChip movement={data.you.movement} light />
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
