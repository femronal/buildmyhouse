'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/growth/referrals', label: 'Partners' },
  { href: '/growth/referrals/rules', label: 'Program rules' },
  { href: '/growth/referrals/attribution', label: 'Attribution' },
  { href: '/growth/referrals/commissions', label: 'Commissions' },
  { href: '/growth/referrals/performance', label: 'Performance' },
];

export default function PartnerProgramNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Partner program">
      {LINKS.map((link) => {
        const sections = ['/rules', '/attribution', '/commissions', '/performance'];
        const active =
          link.href === '/growth/referrals'
            ? pathname === link.href ||
              (pathname.startsWith('/growth/referrals/') && !sections.some((section) => pathname.includes(section)))
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
              active ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
