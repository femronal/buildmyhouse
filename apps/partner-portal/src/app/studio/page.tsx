'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

type Campaign = {
  slug: string;
  title: string;
  kind?: 'tool' | 'post' | 'video' | 'image';
  audience: string;
  problem: string;
  promise: string;
  caption: string;
  disclosure: string;
  link: string | null;
  assetUrl?: string | null;
  tracksIntroduction?: boolean;
  createdAt?: string;
};

export default function StudioPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    api.get<{ campaigns: Campaign[] }>('/partner/links').then((data) => setRows(data.campaigns)).catch(() => setRows([]));
  }, []);
  const library = rows
    .filter((row) => row.kind && row.kind !== 'tool')
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
  const tools = rows.filter((row) => !row.kind || row.kind === 'tool');
  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Marketing studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Use the approved wording. You choose where to post it. Say that you earn from completed projects.
        </p>
        <section className="mt-6">
          <h2 className="text-sm font-semibold">New from BuildMyHouse</h2>
          <div className="mt-3 space-y-3">
            {library.length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No new posts yet.</p> : null}
            {library.map((row) => (
              <CampaignCard key={row.slug} row={row} copied={copied} onCopy={setCopied} />
            ))}
          </div>
        </section>
        <section className="mt-6">
          <h2 className="text-sm font-semibold">Tools</h2>
          <div className="mt-3 space-y-3">
            {tools.map((row) => (
              <CampaignCard key={row.slug} row={row} copied={copied} onCopy={setCopied} />
            ))}
          </div>
        </section>
      </main>
    </Shell>
  );
}

function captionToCopy(row: Campaign) {
  const lines = [row.caption, '', row.disclosure];
  if (row.link) lines.push(row.link);
  else if (row.assetUrl) lines.push(row.assetUrl);
  return lines.join('\n');
}

function CampaignCard({ row, copied, onCopy }: { row: Campaign; copied: string; onCopy: (slug: string) => void }) {
  const copyText = captionToCopy(row);
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{kindLabel(row.kind)}</p>
      <h2 className="font-semibold">{row.title}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div><dt className="text-xs text-gray-500">Who is this for?</dt><dd>{row.audience}</dd></div>
        <div><dt className="text-xs text-gray-500">What problem does it solve?</dt><dd>{row.problem}</dd></div>
        <div><dt className="text-xs text-gray-500">What outcome can I promise?</dt><dd>{row.promise}</dd></div>
        <div><dt className="text-xs text-gray-500">Caption</dt><dd>{row.caption}</dd></div>
        <div><dt className="text-xs text-gray-500">Disclosure</dt><dd>{row.disclosure}</dd></div>
      </dl>
      {row.assetUrl ? (
        <a className="mt-3 inline-block text-sm font-medium underline" href={row.assetUrl} target="_blank" rel="noreferrer">Open file</a>
      ) : null}
      {row.link ? <p className="mt-3 break-all text-xs text-gray-500">{row.link}</p> : null}
      {row.tracksIntroduction === false ? (
        <p className="mt-2 text-xs text-gray-500">This file alone does not record the introduction.</p>
      ) : null}
      <button
        type="button"
        className="mt-3 rounded-lg bg-black px-3 py-2 text-sm text-white"
        onClick={async () => {
          await navigator.clipboard.writeText(copyText);
          onCopy(row.slug);
        }}
      >
        {copied === row.slug ? 'Copied' : 'Copy caption and link'}
      </button>
    </article>
  );
}

function kindLabel(kind?: Campaign['kind']) {
  if (kind === 'video') return 'Video';
  if (kind === 'image') return 'Image';
  if (kind === 'post') return 'Post';
  return 'Tool';
}
