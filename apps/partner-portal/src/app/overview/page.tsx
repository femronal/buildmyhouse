'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/PartnerBits';
import { MovementChip, ProgressRing, StreakCard, TierMedal, type Movement } from '@/components/RankBits';
import Shell from '@/components/Shell';
import { api, naira } from '@/lib/api';

const COMMISSION_LINE = "You earn 2.5% of the contractor amount from BuildMyHouse's 10% fee. Contingency is excluded. Paid once, after the final stage is approved and BuildMyHouse has confirmed the homeowner's payment. A ₦2,000,000 job pays ₦50,000.";

type Tier = { key: string; label: string; min: number; band: string };
type Rank = {
  rank: number;
  rankedCount: number;
  topPercent: number;
  movement: Movement;
  score: number;
  tier: Tier;
  nextTier: Tier | null;
  toNextTier: number;
  progressPct: number;
  streak: number;
  last7: boolean[];
  nickname: string;
};
type Post = { id: string; platform: string; platformLabel: string; url: string; summary: string; postedAt: string };
type Overview = {
  name: string;
  code: string;
  startLink: string;
  earnings: { pending: number; approved: number; paid: number };
  visitors: number;
  signUps: number;
  projectsStarted: number;
  completedProjects: number;
  nextStep: 'add_bank' | 'complete_profile' | 'share_link' | 'watch_word_of_mouth' | 'post_skit';
  rank: Rank | null;
  latestPost: Post | null;
};
type BoardRow = { rank: number; label: string; tierKey: string; tierLabel: string; band: string; movement: Movement; isYou: boolean; score?: number };
type Board = { rows: BoardRow[]; you: Rank };

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Overview>('/partner/overview').then(setData).catch((err: Error) => setError(err.message));
    api.get<Board>('/partner/leaderboard').then(setBoard).catch(() => undefined);
  }, []);

  const rank = data?.rank;

  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-4">
          <div className="space-y-4">
            <section className="rounded-xl bg-black p-4 text-white">
              <p className="text-xs uppercase tracking-wide text-white/70">Rank</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <p className="text-4xl font-bold leading-none">{rank ? `#${rank.rank}` : '-'}<span className="ml-2 text-base font-normal text-white/70">of {rank?.rankedCount ?? 0}</span></p>
                <MovementChip movement={rank?.movement} light />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <p>{rank?.streak ?? 0} day streak</p>
                <p>Top {rank?.topPercent ?? 100}%</p>
              </div>
            </section>
            {rank ? (
              <section className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="relative">
                  <ProgressRing percent={rank.progressPct} tierKey={rank.tier.key} />
                  <span className="absolute inset-0 flex items-center justify-center"><TierMedal tierKey={rank.tier.key} size="sm" /></span>
                </div>
                <div>
                  <p className="font-semibold">{rank.tier.label}</p>
                  <p className="mt-1 text-sm text-gray-600">{rank.nextTier ? `${naira(rank.toNextTier)} more approved commission to reach ${rank.nextTier.label}` : 'Top tier reached'}</p>
                </div>
              </section>
            ) : null}
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your link</p>
              <p className="mt-1 font-semibold">Start a Project</p>
              <p className="mt-2 break-all text-sm text-gray-700">{data?.startLink}</p>
              <div className="mt-3"><CopyButton value={data?.startLink || ''} label="Copy link" fullWidth /></div>
              <p className="mt-2 text-sm text-gray-600">Put this one link in your social bio.</p>
            </section>
            {data ? <NextStep step={data.nextStep} link={data.startLink} /> : null}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Visitors" value={data?.visitors} />
              <Stat label="Homeowner sign-ups" value={data?.signUps} />
              <Stat label="Projects started" value={data?.projectsStarted} />
              <Stat label="Completed projects" value={data?.completedProjects} />
            </section>
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Your money</h2>
                <p className="text-xs text-gray-500">Only you see this</p>
              </div>
              <div className="mt-3 space-y-2 text-sm lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0">
                <Money label="Paid" value={data?.earnings.paid} />
                <Money label="Approved, not paid yet" value={data?.earnings.approved} />
                <Money label="Awaiting checks" value={data?.earnings.pending} />
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">{COMMISSION_LINE}</p>
            </section>
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Latest from BuildMyHouse</h2>
                <Link href="/latest" className="text-sm text-gray-600">See all</Link>
              </div>
              {data?.latestPost ? (
                <article className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{data.latestPost.platformLabel}</p>
                  <p className="mt-1 text-sm text-gray-800">{data.latestPost.summary}</p>
                  <a className="mt-3 inline-flex min-h-11 items-center text-sm underline" href={data.latestPost.url} target="_blank" rel="noreferrer">Open post</a>
                </article>
              ) : <p className="mt-3 text-sm text-gray-600">No posts yet.</p>}
            </section>
          </div>
          <aside className="mt-4 hidden space-y-4 lg:mt-0 lg:block">
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Leaderboard</h2>
                <Link href="/leaderboard" className="text-sm text-gray-600">See all</Link>
              </div>
              <div className="mt-3 space-y-2">
                {(board?.rows || []).slice(0, 5).map((row) => (
                  <div key={`${row.rank}-${row.label}`} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${row.isYou ? 'bg-black text-white' : 'bg-gray-50'}`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <TierMedal tierKey={row.tierKey} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.rank} {row.isYou ? `You, ${row.label}` : row.label}</p>
                        <p className={`text-xs ${row.isYou ? 'text-white/70' : 'text-gray-500'}`}>{row.isYou && row.score != null ? `${row.score} points` : row.band}</p>
                      </div>
                    </div>
                    <MovementChip movement={row.movement} light={row.isYou} />
                  </div>
                ))}
              </div>
            </section>
            {rank ? <StreakCard streak={rank.streak} last7={rank.last7 || []} /> : null}
          </aside>
        </div>
      </main>
    </Shell>
  );
}

function NextStep({ step, link }: { step: Overview['nextStep']; link: string }) {
  const copy = step === 'share_link';
  const href = step === 'add_bank' || step === 'complete_profile' ? '/settings' : step === 'watch_word_of_mouth' ? '/grow/word-of-mouth' : '/grow/online';
  const label = step === 'add_bank' ? 'Add bank details' : step === 'complete_profile' ? 'Complete your profile' : step === 'share_link' ? 'Copy your link' : step === 'watch_word_of_mouth' ? 'Watch how to get clients' : 'See skit ideas';
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Your next step</p>
      <div className="mt-3">
        {copy ? <CopyButton value={link} label={label} fullWidth /> : <Link href={href} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-black px-4 text-sm text-white lg:w-auto">{label}</Link>}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value ?? 0}</p>
    </div>
  );
}

function Money({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold">{naira(value)}</p>
    </div>
  );
}
