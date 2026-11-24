'use client';

import { useEffect, useState } from 'react';
import { postedOn } from '@/components/RankBits';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

type Post = { id: string; platform: string; platformLabel: string; url: string; summary: string; postedAt: string };

export default function LatestPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [platform, setPlatform] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Post[]>('/partner/latest').then(setPosts).catch((err: Error) => setError(err.message));
  }, []);

  const platforms = Array.from(new Map((posts || []).map((post) => [post.platform, post.platformLabel])).entries());
  const shown = (posts || []).filter((post) => platform === 'all' || post.platform === platform);

  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Latest from BuildMyHouse</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">Our newest posts. Open one to like, comment or share it from your own account.</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 flex gap-2 overflow-x-auto">
          <Chip label="All" on={platform === 'all'} onClick={() => setPlatform('all')} />
          {platforms.map(([key, label]) => (
            <Chip key={key} label={label} on={platform === key} onClick={() => setPlatform(key)} />
          ))}
        </div>
        {posts && shown.length === 0 ? <p className="mt-4 text-sm text-gray-600">No posts yet.</p> : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {shown.map((post) => (
            <article key={post.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <PlatformIcon platform={post.platform} />
                {post.platformLabel}
              </div>
              <p className="mt-3 text-sm text-gray-800">{post.summary}</p>
              <p className="mt-2 text-xs text-gray-500">{postedOn(post.postedAt)}</p>
              <a className="mt-3 inline-flex min-h-11 items-center text-sm underline" href={post.url} target="_blank" rel="noreferrer">Open post</a>
            </article>
          ))}
        </div>
      </main>
    </Shell>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${on ? 'bg-black text-white' : 'border border-gray-300 bg-white'}`} onClick={onClick}>
      {label}
    </button>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'instagram') {
    return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="11.2" cy="4.8" r="0.7" fill="currentColor" /></svg>;
  }
  if (platform === 'tiktok') {
    return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 3v6.2a2.2 2.2 0 1 1-1.6-2.1V5.2A4 4 0 0 0 11 7V3.6A3.2 3.2 0 0 1 9 3Z" fill="currentColor" /></svg>;
  }
  if (platform === 'x') {
    return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h2.2l2.7 3.6L11.2 3H13l-4 5.2L13.2 13H11L8.1 9.1 5 13H3.2l4.2-5.5L3 3Z" fill="currentColor" /></svg>;
  }
  if (platform === 'google_business') {
    return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5 3 7v6h3.2V9.2h3.6V13H13V7L8 2.5Z" fill="currentColor" /></svg>;
  }
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M2.8 8h10.4M8 2.8c1.6 1.6 1.6 8.8 0 10.4M8 2.8c-1.6 1.6-1.6 8.8 0 10.4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
