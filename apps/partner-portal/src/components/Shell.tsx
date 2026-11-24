'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/api';

const LINKS = [
  { href: '/overview', label: 'Overview' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/grow', label: 'Bring clients' },
  { href: '/links', label: 'My links' },
  { href: '/referrals', label: 'Referrals' },
  { href: '/earnings', label: 'Earnings' },
  { href: '/studio', label: 'Marketing' },
  { href: '/settings', label: 'Settings' },
];

const MOBILE = [
  { href: '/overview', label: 'Home', icon: 'home' },
  { href: '/leaderboard', label: 'Ranks', icon: 'ranks' },
  { href: '/grow', label: 'Bring clients', icon: 'people' },
  { href: '/earnings', label: 'Earnings', icon: 'earnings' },
  { href: '/more', label: 'More', icon: 'more' },
];

const MORE_PATHS = ['/more', '/links', '/referrals', '/studio', '/settings'];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth.getToken()) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <p className="p-6 text-sm text-gray-500">Loading…</p>;

  const signOut = () => {
    auth.clear();
    router.replace('/');
  };
  const active = (href: string) => (href === '/more' ? MORE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      <header className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">BuildMyHouse</p>
        <p className="text-sm font-semibold">Partner Network</p>
      </header>
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white p-4 md:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">BuildMyHouse</p>
        <p className="mt-1 text-sm font-semibold">Partner Network</p>
        <nav className="mt-6 space-y-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm ${pathname === link.href ? 'bg-black text-white' : 'text-gray-700'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button type="button" className="mt-6 px-3 text-sm text-gray-500" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-gray-200 bg-white md:hidden">
        {MOBILE.map((link) => {
          const on = active(link.href);
          return (
            <Link key={link.href} href={link.href} className={`flex min-h-11 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] ${on ? 'font-semibold text-black' : 'text-gray-500'}`}>
              <NavIcon name={link.icon} active={on} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#111827' : '#9ca3af';
  if (name === 'home') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3 8.5 10 3l7 5.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V8.5Z" fill={active ? color : 'none'} stroke={color} strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === 'ranks') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 16V9h3v7H4Zm4.5 0V4h3v12h-3ZM13 16v-5h3v5h-3Z" fill={color} />
      </svg>
    );
  }
  if (name === 'people') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="7" cy="7" r="2.2" fill={color} />
        <circle cx="13" cy="8" r="1.8" fill={color} />
        <path d="M3.5 16c.4-2.2 2-3.4 3.5-3.4S10.1 13.8 10.5 16M11 16c.2-1.6 1.3-2.6 2.4-2.6 1.2 0 2.2 1 2.6 2.6" stroke={color} strokeWidth="1.6" fill="none" />
      </svg>
    );
  }
  if (name === 'earnings') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="5" width="14" height="10" rx="2" fill="none" stroke={color} strokeWidth="1.6" />
        <path d="M3 8.5h14" stroke={color} strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="5" cy="10" r="1.4" fill={color} />
      <circle cx="10" cy="10" r="1.4" fill={color} />
      <circle cx="15" cy="10" r="1.4" fill={color} />
    </svg>
  );
}
