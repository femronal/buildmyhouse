'use client';

import { useId } from 'react';

export const TIER_STOPS: Record<string, [string, string]> = {
  starter: ['#94a3b8', '#e2e8f0'],
  bronze: ['#b45309', '#f59e0b'],
  silver: ['#6b7280', '#e5e7eb'],
  gold: ['#ca8a04', '#fde047'],
  platinum: ['#4f46e5', '#c7d2fe'],
};

const PLACE = ['#ca8a04', '#6b7280', '#b45309'];

export type Movement = { direction: 'up' | 'down' | 'same' | 'new'; places: number };

export function TierMedal({ tierKey, size = 'md' }: { tierKey: string; size?: 'sm' | 'md' | 'lg' }) {
  const id = useId();
  const [from, to] = TIER_STOPS[tierKey] || TIER_STOPS.starter;
  const px = size === 'sm' ? 28 : size === 'lg' ? 72 : 44;
  return (
    <svg width={px} height={px} viewBox="0 0 64 72" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d="M20 38 14 68l18-10 18 10-6-30" fill={from} />
      <circle cx="32" cy="28" r="20" fill={`url(#${id})`} stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export function ProgressRing({ percent, tierKey }: { percent: number; tierKey: string }) {
  const [from] = TIER_STOPS[tierKey] || TIER_STOPS.starter;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, percent)) / 100) * circumference;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke={from}
        strokeWidth="6"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}

export function MovementChip({ movement, light = false }: { movement?: Movement | null; light?: boolean }) {
  if (!movement || movement.direction === 'same') {
    return <span className={`text-xs ${light ? 'text-white/60' : 'text-gray-400'}`}>-</span>;
  }
  if (movement.direction === 'new') {
    return <span className={`rounded-full px-2 py-0.5 text-xs ${light ? 'bg-white text-black' : 'bg-gray-100 text-gray-700'}`}>New</span>;
  }
  const up = movement.direction === 'up';
  return <span className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>{up ? `Up ${movement.places}` : `Down ${movement.places}`}</span>;
}

export function placeColor(rank: number) {
  return PLACE[rank - 1] || '#111827';
}

export function StreakCard({ streak, last7 }: { streak: number; last7: boolean[] }) {
  const days = last7.length === 7 ? last7 : [false, false, false, false, false, false, false];
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Flame />
        <div>
          <p className="text-3xl font-bold leading-none">{streak}</p>
          <p className="text-sm text-gray-600">day streak</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1">
        {days.map((on, index) => (
          <span key={index} className="flex justify-center" aria-hidden="true">
            <Flame small muted={!on} />
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {[3, 7, 14].map((mark) => (
          <span key={mark} className={`rounded-full px-2 py-1 text-xs ${streak >= mark ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
            {mark} days
          </span>
        ))}
      </div>
    </section>
  );
}

function Flame({ small = false, muted = false }: { small?: boolean; muted?: boolean }) {
  const fill = muted ? '#e5e7eb' : '#111827';
  const size = small ? 18 : 36;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2s2 3 2 5c1-1 2-1 2-1s1 3 0 5c2 0 4 2 4 5a8 8 0 1 1-16 0c0-3 2-5 4-6 0 2 2 3 2 3S10 8 12 2Z" fill={fill} />
    </svg>
  );
}

export function lagosStamp(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
  }).format(new Date(value));
}

export function postedOn(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' }).format(new Date(value));
}
