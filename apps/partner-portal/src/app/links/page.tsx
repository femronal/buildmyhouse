'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

type LinkRow = { slug?: string; title?: string; link: string; destinationPath?: string };

export default function LinksPage() {
  const [start, setStart] = useState('');
  const [campaigns, setCampaigns] = useState<LinkRow[]>([]);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.get<{ start: string; campaigns: LinkRow[] }>('/partner/links').then((data) => {
      setStart(data.start);
      setCampaigns(data.campaigns);
    }).catch(() => {
      setStart('');
      setCampaigns([]);
    });
  }, []);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
  };

  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">My links</h1>
        <p className="mt-2 text-sm text-gray-600">Each link carries your code. A click lasts 30 days. The homeowner stays yours after they sign up.</p>
        <article className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Start a project</h2>
          <p className="mt-2 break-all text-sm text-gray-700">{start}</p>
          <button type="button" className="mt-3 rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-40" disabled={!start} onClick={() => copy(start)}>
            {start && copied === start ? 'Copied' : 'Copy link'}
          </button>
        </article>
        {campaigns.map((campaign) => (
          <article key={campaign.slug || campaign.link} className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold">{campaign.title}</h2>
            <p className="mt-2 break-all text-sm text-gray-700">{campaign.link}</p>
            <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={() => copy(campaign.link)}>
              {copied === campaign.link ? 'Copied' : 'Copy link'}
            </button>
          </article>
        ))}
      </main>
    </Shell>
  );
}
