'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const TABS = [
  { href: '/price-intelligence', label: 'Overview', exact: true },
  { href: '/price-intelligence/review-queue', label: 'Review Queue' },
  { href: '/price-intelligence/reports', label: 'Reports' },
  { href: '/price-intelligence/observations', label: 'Observations' },
  { href: '/price-intelligence/merchant-submissions', label: 'Merchant Submissions' },
  { href: '/price-intelligence/manual-entry', label: 'Manual Entry' },
  { href: '/price-intelligence/sources', label: 'Source Health' },
  { href: '/price-intelligence/catalogue', label: 'Catalogue' },
  { href: '/price-intelligence/search-demand', label: 'Search Demand' },
  { href: '/price-intelligence/audit', label: 'Audit History' },
  { href: '/price-intelligence/settings', label: 'Settings' },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PiSubnav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex flex-col gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/tools"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tools
            </Link>
            <span className="hidden text-gray-300 sm:inline">/</span>
            <p className="truncate text-sm font-semibold text-gray-900">Price Checker</p>
          </div>
          <Link
            href="/price-checker-revenue"
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            View Price Checker revenue and margins
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href, 'exact' in tab ? tab.exact : false);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
