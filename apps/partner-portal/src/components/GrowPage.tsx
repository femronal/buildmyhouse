'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VideoSlot } from '@/components/PartnerBits';
import { postedOn } from '@/components/RankBits';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

type Video = { title: string; assetUrl: string | null; caption?: string };
type Skit = { id: string; title: string; whoFilms: string | null; format: string; script: string; caption: string; updatedAt: string };
type Grow = { videos: { word_of_mouth: Video | null; online: Video | null }; skitIdeas: Skit[] };

export function GrowPage({ mode }: { mode: 'word_of_mouth' | 'online' }) {
  const [data, setData] = useState<Grow | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState('');

  useEffect(() => {
    api.get<Grow>('/partner/grow').then(setData).catch((err: Error) => setError(err.message));
  }, []);

  const video = mode === 'word_of_mouth' ? data?.videos.word_of_mouth : data?.videos.online;

  return (
    <Shell>
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <h1 className="text-3xl font-bold">Bring clients</h1>
        <div className="mt-4 grid grid-cols-2 rounded-full bg-gray-200 p-1">
          <Link href="/grow/word-of-mouth" className={`flex min-h-11 items-center justify-center rounded-full text-sm ${mode === 'word_of_mouth' ? 'bg-black text-white' : 'text-gray-700'}`}>Word of mouth</Link>
          <Link href="/grow/online" className={`flex min-h-11 items-center justify-center rounded-full text-sm ${mode === 'online' ? 'bg-black text-white' : 'text-gray-700'}`}>Online</Link>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold">{mode === 'word_of_mouth' ? 'How to get clients' : 'How to post on your socials'}</h2>
          <div className="mt-4">
            <VideoSlot video={video?.assetUrl ? { assetUrl: video.assetUrl } : null} />
          </div>
          {mode === 'word_of_mouth' ? (
            <Steps items={[
              'Tell friends and family abroad who are building or repairing at home.',
              'Share your link in church, alumni and hometown WhatsApp groups.',
              "Always say you're a BuildMyHouse partner.",
            ]} />
          ) : (
            <>
              <Steps items={[
                'Put your link in your social bio. Make it the only link there.',
                'Post a Thespian skit: a short acted drama about a building project gone wrong.',
                'End with the fix: agree what each stage is, and approve it before any money moves. Then point to the link in your bio.',
              ]} />
              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-950">Skit rules</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Keep the on-screen label &quot;Skit. Dramatised.&quot; visible for the whole video.</li>
                  <li>The caption always includes &quot;#ad&quot; and &quot;BuildMyHouse partner&quot;.</li>
                  <li>The only link is your own referral link in your bio.</li>
                  <li>Never use real names or faces, never promise results, and never offer free projects.</li>
                </ul>
              </div>
            </>
          )}
        </section>
        {mode === 'online' ? (
          <section className="mt-4">
            <h2 className="text-sm font-semibold">Skit ideas</h2>
            {data && data.skitIdeas.length === 0 ? <p className="mt-2 text-sm text-gray-600">No skit ideas yet.</p> : null}
            <div className="mt-2 space-y-2">
              {(data?.skitIdeas || []).map((idea) => (
                <article key={idea.id} className="rounded-xl border border-gray-200 bg-white">
                  <button type="button" className="flex min-h-11 w-full items-start justify-between gap-3 px-3 py-3 text-left" onClick={() => setOpen(open === idea.id ? '' : idea.id)}>
                    <span>
                      <span className="block text-sm font-medium">{idea.title}</span>
                      {idea.whoFilms ? <span className="mt-1 block text-xs text-gray-500">{idea.whoFilms}</span> : null}
                      <span className="mt-1 block text-xs text-gray-500">Updated {postedOn(idea.updatedAt)}</span>
                    </span>
                    {idea.format === 'alternative' ? <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs">Alternative format</span> : null}
                  </button>
                  {open === idea.id ? (
                    <div className="space-y-3 border-t border-gray-100 px-3 py-3 text-sm text-gray-800">
                      <p className="whitespace-pre-wrap">{idea.script}</p>
                      <p className="whitespace-pre-wrap">{idea.caption}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 text-sm leading-5 text-gray-800">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-950">{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
