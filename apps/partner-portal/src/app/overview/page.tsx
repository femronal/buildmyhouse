'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CopyButton, VideoSlot } from '@/components/PartnerBits';
import Shell from '@/components/Shell';
import { api, naira } from '@/lib/api';

const COMMISSION_LINE = "You earn 2.5% of the contractor amount from BuildMyHouse's 10% fee. Contingency is excluded. Paid once, after the final stage is approved and BuildMyHouse has confirmed the homeowner's payment. A ₦2,000,000 job pays ₦50,000.";

type Channel = { visitors: number; signUps: number; completed: number };
type Tier = { key: string; label: string; min: number; band: string };
type Overview = {
  name: string;
  code: string;
  earnings: { pending: number; approved: number; paid: number };
  visitors: number;
  lockedHomeowners: number;
  completedProjects: number;
  channels: { word_of_mouth: Channel; online: Channel; not_split: Channel };
  nextStep: 'add_bank' | 'share_first_link' | 'post_skit' | 'tell_people';
  rank: {
    month: number | null;
    monthCount: number;
    allTime: number | null;
    allTimeCount: number;
    tier: Tier;
    nextTier: Tier | null;
    toNextTier: number;
    progressPct: number;
    allTimeAmount: number;
  };
  nextCampaign: { title: string; caption: string; link: string } | null;
};
type BoardRow = { rank: number; label: string; tierLabel: string; band: string; isYou: boolean; amount?: number; completedProjects?: number };
type Board = { rows: BoardRow[]; you: { rank: number | null; label: string; periodAmount: number; completedProjects: number; tier: Tier } };

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [links, setLinks] = useState({ wordOfMouth: '', online: '' });
  const [videos, setVideos] = useState<{ word_of_mouth: { title: string; assetUrl: string | null } | null; online: { title: string; assetUrl: string | null } | null }>({ word_of_mouth: null, online: null });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Overview>('/partner/overview').then(setData).catch((err: Error) => setError(err.message));
    api.get<{ wordOfMouth?: string; online?: string }>('/partner/links').then((row) => {
      setLinks({ wordOfMouth: row.wordOfMouth || '', online: row.online || '' });
    }).catch(() => undefined);
    api.get<{ videos: { word_of_mouth: { title: string; assetUrl: string | null } | null; online: { title: string; assetUrl: string | null } | null } }>('/partner/grow').then((row) => setVideos(row.videos)).catch(() => undefined);
  }, []);

  useEffect(() => {
    api.get<Board>(`/partner/leaderboard?period=${period}`).then(setBoard).catch(() => setBoard(null));
  }, [period]);

  return (
    <Shell>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active partner</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-950">{data?.name || 'Overview'}</h1>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-4">
          <div className="space-y-4">
            <section className="rounded-2xl bg-black p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Your rank this month</p>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs">{data?.rank.tier.label || 'Starter'}</span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-4xl font-bold leading-none">{data?.rank.month == null ? 'Not ranked' : `#${data.rank.month}`}{data?.rank.month != null ? <span className="ml-2 text-base font-normal text-white/70">of {data.rank.monthCount} ranked</span> : null}</p>
                <p className="shrink-0 text-right text-sm text-white/80">All time<br /><span className="text-xl font-semibold text-white">{data?.rank.allTime == null ? 'Not ranked' : `#${data.rank.allTime}`}</span> {data?.rank.allTime != null ? <span className="text-white/70">of {data.rank.allTimeCount}</span> : null}</p>
              </div>
              {data && data.rank.month == null ? <p className="mt-3 text-sm text-white/80">Not ranked yet. Your first approved project puts you on the board.</p> : null}
              {data?.rank.nextTier ? <p className="mt-4 text-sm">{naira(data.rank.toNextTier)} more approved commission to reach {data.rank.nextTier.label}</p> : data ? <p className="mt-4 text-sm">You are on {data.rank.tier.label}.</p> : null}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-white" style={{ width: `${data?.rank.progressPct || 0}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-white/70">
                <span>{naira(data?.rank.allTimeAmount)} approved</span>
                <span>{data?.rank.nextTier ? `${data.rank.nextTier.label} at ${naira(data.rank.nextTier.min)}` : data?.rank.tier.band}</span>
              </div>
              <Link href="/leaderboard" className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-black lg:hidden">See the leaderboard</Link>
            </section>
            {data ? <NextStep step={data.nextStep} channels={data.channels} links={links} /> : null}
            <section className="grid grid-cols-3 gap-3">
              <Stat label="Visitors" value={data?.visitors} />
              <Stat label="Homeowner sign-ups" value={data?.lockedHomeowners} />
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
            {data?.nextCampaign ? (
              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold">New from BuildMyHouse</h2>
                <p className="mt-2 text-sm text-gray-800">{data.nextCampaign.caption}</p>
                {data.nextCampaign.link ? (
                  <>
                    <p className="mt-2 break-all text-xs text-gray-500">{data.nextCampaign.link}</p>
                    <div className="mt-3"><CopyButton value={data.nextCampaign.link} label="Copy link" /></div>
                  </>
                ) : null}
              </section>
            ) : null}
          </div>
          <aside className="mt-4 hidden space-y-4 lg:mt-0 lg:block">
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Leaderboard</h2>
                <Link href="/leaderboard" className="text-sm text-gray-600">See all</Link>
              </div>
              <PeriodTabs period={period} onChange={setPeriod} />
              <div className="mt-3 space-y-2">
                {previewRows(board).map((row, index) => (
                  <div key={`${index}-${row.rank}-${row.label}`} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${row.isYou ? 'bg-black text-white' : 'bg-gray-50'}`}>
                    <div>
                      <p className="text-sm font-medium">{row.rank} {row.isYou ? `You - ${row.label}` : row.label}</p>
                      <p className={`text-xs ${row.isYou ? 'text-white/70' : 'text-gray-500'}`}>{row.amount == null ? row.band : `${naira(row.amount)} approved ${period === 'month' ? 'this month' : 'all time'}${row.completedProjects != null ? ` · ${row.completedProjects} project${row.completedProjects === 1 ? '' : 's'}` : ''}`}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${row.isYou ? 'bg-white text-black' : 'bg-white text-gray-700'}`}>{row.tierLabel}</span>
                  </div>
                ))}
                {board && board.rows.length === 0 ? <p className="text-sm text-gray-600">{period === 'month' ? 'No one is ranked yet this month. The first approved project takes rank 1.' : 'No one is ranked yet. The first approved project takes rank 1.'}</p> : null}
              </div>
            </section>
            <div className="grid grid-cols-2 gap-3">
              <ChannelCard title="1 Word of mouth" channel={data?.channels.word_of_mouth} link={links.wordOfMouth} video={videos.word_of_mouth} />
              <ChannelCard title="2 Online" channel={data?.channels.online} link={links.online} video={videos.online} />
            </div>
            {data ? <p className="text-xs leading-5 text-gray-500">Not split yet: {data.channels.not_split.visitors} visitors, {data.channels.not_split.signUps} sign-up{data.channels.not_split.signUps === 1 ? '' : 's'}, {data.channels.not_split.completed} completed project{data.channels.not_split.completed === 1 ? '' : 's'}. <Link href="/grow" className="underline">Bring clients</Link> shows every method.</p> : null}
          </aside>
        </div>
      </main>
    </Shell>
  );
}

function previewRows(board: Board | null) {
  const top = (board?.rows || []).slice(0, 5);
  if (!board?.you.rank || top.some((row) => row.isYou)) return top;
  return [...top, {
    rank: board.you.rank,
    label: board.you.label,
    tierLabel: board.you.tier.label,
    band: board.you.tier.band,
    isYou: true,
    amount: board.you.periodAmount,
    completedProjects: board.you.completedProjects,
  }];
}

function NextStep({ step, channels, links }: { step: Overview['nextStep']; channels: Overview['channels']; links: { wordOfMouth: string; online: string } }) {
  if (step === 'add_bank') {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Your next step</p>
        <h2 className="mt-1 text-xl font-semibold">Add the bank account we should pay</h2>
        <p className="mt-2 text-sm text-gray-600">Approved commission is on file and the account number is empty.</p>
        <Link href="/settings" className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-black text-sm text-white lg:w-auto lg:px-4">Add bank details</Link>
      </section>
    );
  }
  if (step === 'share_first_link') {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Your next step</p>
        <h2 className="mt-1 text-xl font-semibold">Share your first link</h2>
        <p className="mt-2 text-sm text-gray-600">No one has opened a link yet.</p>
        <div className="mt-4"><CopyButton value={links.wordOfMouth} label="Copy word-of-mouth link" /></div>
      </section>
    );
  }
  if (step === 'post_skit') {
    const onlineCompleted = channels.online.completed === 0 ? 'no completed project yet' : `${channels.online.completed} completed project${channels.online.completed === 1 ? '' : 's'}`;
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Your next step</p>
        <h2 className="mt-1 text-xl font-semibold">Post a skit with your link in your bio</h2>
        <p className="mt-2 text-sm text-gray-600">Your online link has {channels.online.signUps} sign-up{channels.online.signUps === 1 ? '' : 's'} and {onlineCompleted}. Word of mouth brought {channels.word_of_mouth.signUps}.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <CopyButton value={links.online} label="Copy online link" />
          <Link href="/grow#online" className="flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 px-4 text-sm lg:w-auto">How to make a skit</Link>
        </div>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Your next step</p>
      <h2 className="mt-1 text-xl font-semibold">Tell people who are building at home</h2>
      <p className="mt-2 text-sm text-gray-600">Word of mouth brought {channels.word_of_mouth.signUps}. Share the link with someone who is repairing a house.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <CopyButton value={links.wordOfMouth} label="Copy word-of-mouth link" />
        <Link href="/grow#word-of-mouth" className="flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 px-4 text-sm lg:w-auto">How to tell people</Link>
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
    <div className="flex items-center justify-between gap-3 lg:block">
      <p className="text-gray-600">{label}</p>
      <p className="font-semibold">{naira(value)}</p>
    </div>
  );
}

function PeriodTabs({ period, onChange }: { period: 'month' | 'all'; onChange: (period: 'month' | 'all') => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm">
      <button type="button" className={`min-h-11 rounded-lg ${period === 'month' ? 'bg-white font-medium' : 'text-gray-500'}`} onClick={() => onChange('month')}>This month</button>
      <button type="button" className={`min-h-11 rounded-lg ${period === 'all' ? 'bg-white font-medium' : 'text-gray-500'}`} onClick={() => onChange('all')}>All time</button>
    </div>
  );
}

function ChannelCard({ title, channel, link, video }: { title: string; channel?: Channel; link: string; video: { title: string; assetUrl: string | null } | null }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[11px] text-gray-500">
        <p>Visitors<br /><span className="text-base font-semibold text-gray-950">{channel?.visitors ?? 0}</span></p>
        <p>Sign-ups<br /><span className="text-base font-semibold text-gray-950">{channel?.signUps ?? 0}</span></p>
        <p>Completed<br /><span className="text-base font-semibold text-gray-950">{channel?.completed ?? 0}</span></p>
      </div>
      <div className="mt-3"><VideoSlot video={video} /></div>
      <div className="mt-3"><CopyButton value={link} label="Copy link" light fullWidth /></div>
    </section>
  );
}
