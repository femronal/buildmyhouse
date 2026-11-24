'use client';

import { useEffect, useState } from 'react';
import { CopyButton, VideoSlot } from '@/components/PartnerBits';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

type Channel = { visitors: number; signUps: number; completed: number };
type Video = { title: string; assetUrl: string | null; caption?: string };
type Grow = {
  links: { wordOfMouth: string; online: string; code: string };
  channels: { word_of_mouth: Channel; online: Channel; not_split: Channel };
  videos: { word_of_mouth: Video | null; online: Video | null };
  skitIdeas: { title: string; caption: string; assetUrl: string | null }[];
  typedCodeOn: boolean;
};

export default function GrowPage() {
  const [data, setData] = useState<Grow | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Grow>('/partner/grow').then(setData).catch((err: Error) => setError(err.message));
  }, []);

  const split = data?.channels.not_split;
  const showSplit = !!split && (split.visitors > 0 || split.signUps > 0 || split.completed > 0);

  return (
    <Shell>
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <h1 className="text-3xl font-bold">Bring clients</h1>
        <p className="mt-2 text-sm text-gray-600">Two ways to bring homeowners. Each has its own link, so you can see which one works for you.</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <a href="#word-of-mouth" className="min-h-11 rounded-full bg-black px-4 py-2 text-sm text-white">Word of mouth</a>
          <a href="#online" className="min-h-11 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm">Online</a>
        </div>

        <section id="word-of-mouth" className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold">1 Word of mouth</p>
          <p className="text-xs text-gray-500">People you speak to</p>
          <Counts channel={data?.channels.word_of_mouth} />
          <div className="mt-4"><VideoSlot video={data?.videos.word_of_mouth} /></div>
          <Steps items={[
            'Tell friends and family abroad who are building or repairing at home.',
            'Share your link in church, alumni and hometown WhatsApp groups.',
            "Always say you're a BuildMyHouse partner.",
          ]} />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Your word-of-mouth link</p>
          <p className="mt-1 break-all text-sm text-gray-700">{data?.links.wordOfMouth}</p>
          <div className="mt-3"><CopyButton value={data?.links.wordOfMouth || ''} label="Copy word-of-mouth link" /></div>
          {data?.typedCodeOn ? <p className="mt-3 text-sm text-gray-600">Homeowners who type your code {data.links.code} count here too.</p> : null}
        </section>

        <section id="online" className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold">2 Online</p>
          <p className="text-xs text-gray-500">Your link in a bio, a post or a skit</p>
          <Counts channel={data?.channels.online} />
          <div className="mt-4"><VideoSlot video={data?.videos.online} /></div>
          <Steps items={[
            'Put your online link in your social bio. Make it the only link there.',
            'Post a Thespian skit: a short acted drama about a building project gone wrong.',
            'End with the fix: agree what each stage is, and approve it before any money moves. Then point to the link in your bio.',
          ]} />
          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-950">Skit rules</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Show &quot;Skit. Dramatised.&quot; on screen the whole time.</li>
              <li>Put &quot;I&apos;m a BuildMyHouse partner&quot; in every caption.</li>
              <li>No real names or faces. Never name a price or a town.</li>
              <li>Don&apos;t promise a result, a date, or that anyone is hired.</li>
            </ul>
          </div>
          <h2 className="mt-4 text-sm font-semibold">Skit ideas</h2>
          {data && data.skitIdeas.length === 0 ? <p className="mt-2 text-sm text-gray-600">Skit ideas coming soon</p> : null}
          <div className="mt-2 space-y-2">
            {(data?.skitIdeas || []).map((idea) => (
              <article key={idea.title} className="rounded-lg border border-gray-200 px-3 py-3">
                <p className="text-sm font-medium">{idea.title}</p>
                {idea.caption ? <p className="mt-1 text-sm text-gray-600">{idea.caption}</p> : null}
                {idea.assetUrl ? <a className="mt-1 block break-all text-xs text-gray-500 underline" href={idea.assetUrl}>Open</a> : null}
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Your online link</p>
          <p className="mt-1 break-all text-sm text-gray-700">{data?.links.online}</p>
          <div className="mt-3"><CopyButton value={data?.links.online || ''} label="Copy online link" /></div>
        </section>

        {showSplit && split ? (
          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="font-semibold">Not split yet</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{split.visitors} visitors, {split.signUps} sign-up{split.signUps === 1 ? '' : 's'} and {split.completed} completed project{split.completed === 1 ? '' : 's'} came before we started telling the two apart, or through a link with no label. They still count in your totals and on your rank.</p>
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

function Counts({ channel }: { channel?: Channel }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <p className="text-xs text-gray-500">Visitors<br /><span className="text-2xl font-semibold text-gray-950">{channel?.visitors ?? 0}</span></p>
      <p className="text-xs text-gray-500">Sign-ups<br /><span className="text-2xl font-semibold text-gray-950">{channel?.signUps ?? 0}</span></p>
      <p className="text-xs text-gray-500">Completed<br /><span className="text-2xl font-semibold text-gray-950">{channel?.completed ?? 0}</span></p>
    </div>
  );
}
