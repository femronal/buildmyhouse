'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/api';

const LINKS = [
  { href: '/overview', label: 'Overview' },
  { href: '/links', label: 'My links' },
  { href: '/referrals', label: 'Referrals' },
  { href: '/earnings', label: 'Earnings' },
  { href: '/studio', label: 'Marketing' },
  { href: '/settings', label: 'Settings' },
];

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

  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <p className="text-sm font-semibold">Partner Network</p>
        <button type="button" className="text-sm text-gray-500" onClick={signOut}>
          Sign out
        </button>
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
        <button type="button" className="mt-6 text-sm text-gray-500" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 flex border-t border-gray-200 bg-white md:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 px-1 py-3 text-center text-[11px] ${pathname === link.href ? 'font-semibold text-black' : 'text-gray-500'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
