'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/growth/partnerships', label: 'Today' },
  { href: '/growth/partnerships/leads', label: 'Leads' },
];

export default function PartnershipsNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Partnerships">
      {LINKS.map((link) => {
        const active = link.href === '/growth/partnerships' ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${active ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700'}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
