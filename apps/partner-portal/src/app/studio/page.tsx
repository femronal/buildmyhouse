'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

type Campaign = {
  slug: string;
  title: string;
  audience: string;
  problem: string;
  promise: string;
  caption: string;
  disclosure: string;
  link: string;
};

export default function StudioPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    api.get<{ campaigns: Campaign[] }>('/partner/links').then((data) => setRows(data.campaigns)).catch(() => setRows([]));
  }, []);
  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Marketing studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Use the approved wording. You choose where to post it. Say that you earn from completed projects.
        </p>
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <article key={row.slug} className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="font-semibold">{row.title}</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="text-xs text-gray-500">Who is this for?</dt><dd>{row.audience}</dd></div>
                <div><dt className="text-xs text-gray-500">What problem does it solve?</dt><dd>{row.problem}</dd></div>
                <div><dt className="text-xs text-gray-500">What outcome can I promise?</dt><dd>{row.promise}</dd></div>
                <div><dt className="text-xs text-gray-500">Caption</dt><dd>{row.caption}</dd></div>
                <div><dt className="text-xs text-gray-500">Disclosure</dt><dd>{row.disclosure}</dd></div>
              </dl>
              <p className="mt-3 break-all text-xs text-gray-500">{row.link}</p>
              <button
                type="button"
                className="mt-3 rounded-lg bg-black px-3 py-2 text-sm text-white"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${row.caption}\n\n${row.disclosure}\n${row.link}`);
                  setCopied(row.slug);
                }}
              >
                {copied === row.slug ? 'Copied' : 'Copy caption and link'}
              </button>
            </article>
          ))}
        </div>
      </main>
    </Shell>
  );
}
