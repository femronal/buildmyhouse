'use client';

import { useState } from 'react';

export function CopyButton({ value, label, light = false, fullWidth = false }: { value: string; label: string; light?: boolean; fullWidth?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!value}
      className={`min-h-11 rounded-lg px-4 text-sm disabled:opacity-40 ${fullWidth ? 'w-full' : 'w-full lg:w-auto'} ${light ? 'border border-gray-300 bg-white text-gray-950' : 'bg-black text-white'}`}
      onClick={async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

export function VideoSlot({ video }: { video?: { title?: string; assetUrl?: string | null } | null }) {
  const match = String(video?.assetUrl || '').match(/\/file\/d\/([^/]+)/);
  if (match) {
    return (
      <div>
        <iframe className="aspect-video w-full rounded-xl border border-gray-200" src={`https://drive.google.com/file/d/${match[1]}/preview`} title={video?.title || 'Video'} allow="autoplay" />
        {video?.title ? <p className="mt-2 text-sm text-gray-700">{video.title}</p> : null}
      </div>
    );
  }
  if (video?.assetUrl) {
    return (
      <a className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm" href={video.assetUrl} target="_blank" rel="noreferrer">
        Open video
      </a>
    );
  }
  return (
    <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-xs">▶</span>
      Video coming soon
    </div>
  );
}
