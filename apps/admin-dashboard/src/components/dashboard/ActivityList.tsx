'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ageLabel } from './format';
import type { RecentActivityItem } from '@/hooks/useAdminDashboard';

export default function ActivityList({ items }: { items: RecentActivityItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-950">Activity</h2>
        <button
          type="button"
          className="text-sm font-medium text-green-700"
          onClick={() => {
            const bell = document.querySelector('[aria-label="Notifications"]');
            if (bell instanceof HTMLButtonElement) bell.click();
          }}
        >
          See all
        </button>
      </header>
      <button type="button" className="flex min-h-14 w-full items-center px-4 text-left text-sm font-medium text-gray-700 md:hidden" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : `Show ${items.length}`}
      </button>
      <ul className={open ? 'block' : 'hidden md:block'}>
        {items.map((item) => {
          const body = (
            <>
              <p className="text-sm font-medium text-gray-950">{item.label}</p>
              <p className="text-sm text-gray-500">{item.detail} · {ageLabel(item.createdAt)}</p>
            </>
          );
          return (
            <li key={item.id} className="min-h-14 border-t border-gray-50 px-4 py-3">
              {item.link ? <Link href={item.link}>{body}</Link> : body}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
