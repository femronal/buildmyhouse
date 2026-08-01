'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type PiStatCardProps = {
  label: string;
  value: number;
  href?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'amber' | 'red' | 'green';
  emptyHint?: string;
};

const TONE_BORDER: Record<NonNullable<PiStatCardProps['tone']>, string> = {
  default: 'border-gray-200',
  amber: 'border-amber-300',
  red: 'border-red-300',
  green: 'border-green-300',
};

const TONE_VALUE: Record<NonNullable<PiStatCardProps['tone']>, string> = {
  default: 'text-gray-900',
  amber: 'text-amber-700',
  red: 'text-red-700',
  green: 'text-green-700',
};

export default function PiStatCard({
  label,
  value,
  href,
  icon: Icon,
  tone = 'default',
  emptyHint = 'None',
}: PiStatCardProps) {
  const content = (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${TONE_BORDER[tone]} ${
        href ? 'transition-colors hover:border-blue-400 hover:bg-blue-50/40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-gray-400" /> : null}
      </div>
      {value === 0 ? (
        <p className="mt-2 text-sm text-gray-400">{emptyHint}</p>
      ) : (
        <p className={`mt-2 text-2xl font-bold tabular-nums ${TONE_VALUE[tone]}`}>{value}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
