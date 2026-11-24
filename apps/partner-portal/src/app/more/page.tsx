'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { auth } from '@/lib/api';

const LINKS = [
  { href: '/links', label: 'My links' },
  { href: '/referrals', label: 'Referrals' },
  { href: '/studio', label: 'Marketing' },
  { href: '/settings', label: 'Settings' },
];

export default function MorePage() {
  const router = useRouter();
  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">More</h1>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="block min-h-11 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0">
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            className="block min-h-11 w-full px-4 py-3 text-left text-sm text-gray-700"
            onClick={() => {
              auth.clear();
              router.replace('/');
            }}
          >
            Sign out
          </button>
        </div>
      </main>
    </Shell>
  );
}
