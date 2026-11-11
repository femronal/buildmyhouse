'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  HardHat,
  House,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Scale,
  Store,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { logout } from '@/lib/auth';
import NotificationBell from '@/components/NotificationBell';
import { useDisputes } from '@/hooks/useDisputes';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { NAV_GROUPS } from '@/lib/nav-groups';

const titles: Array<{ prefix: string; title: string }> = [
  { prefix: '/dashboard', title: 'Today' },
  { prefix: '/reports', title: 'Weekly report' },
  { prefix: '/projects', title: 'Projects' },
  { prefix: '/disputes', title: 'Disputes' },
  { prefix: '/vendors', title: 'Vendors' },
  { prefix: '/artisans', title: 'Artisans' },
  { prefix: '/professionals', title: 'Professionals' },
  { prefix: '/listing-reviews', title: 'Listing reviews' },
  { prefix: '/scam-reports', title: 'Scam reports' },
  { prefix: '/contractors', title: 'Contractors' },
  { prefix: '/homeowners', title: 'Homeowners' },
  { prefix: '/verification', title: 'Verification' },
  { prefix: '/emails', title: 'Emails' },
  { prefix: '/articles', title: 'Content' },
  { prefix: '/growth', title: 'Growth' },
  { prefix: '/people', title: 'People & HR' },
  { prefix: '/tools', title: 'Tools' },
  { prefix: '/opportunities', title: 'Opportunities' },
  { prefix: '/admin-access', title: 'Admin access' },
];

const directoryLinks = [
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/artisans', label: 'Artisans', icon: Wrench },
  { href: '/professionals', label: 'Professionals', icon: BadgeCheck },
  { href: '/contractors', label: 'Contractors', icon: HardHat },
  { href: '/homeowners', label: 'Homeowners', icon: Users },
];

const moreGroups = NAV_GROUPS.filter((group) => group.label !== 'Today');

function pageTitle(pathname: string) {
  const match = titles.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  return match?.title || 'Admin';
}

export default function MobileShell() {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<'directory' | 'more' | null>(null);
  const { disputes } = useDisputes('open');
  const dashboard = useAdminDashboard();
  const openDisputes = dashboard.data?.strip.openDisputes.count ?? disputes.length;
  const todayCount = dashboard.isError ? 0 : dashboard.data?.strip.needsYou.total || 0;
  const title = pageTitle(pathname);
  const directoryActive = directoryLinks.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  const tabs = useMemo(
    () => [
      { href: '/dashboard', label: 'Today', icon: House, active: pathname === '/dashboard' || pathname === '/', badge: todayCount },
      { href: '/projects', label: 'Jobs', icon: Building2, active: pathname.startsWith('/projects') },
      { href: '/disputes', label: 'Disputes', icon: Scale, active: pathname.startsWith('/disputes'), badge: openDisputes },
    ],
    [openDisputes, pathname, todayCount],
  );

  return (
    <>
      <header className="no-print sticky top-0 z-30 grid h-16 grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-2 border-b border-gray-200 bg-white px-3 md:hidden">
        <img
          src="/logo.png"
          alt="BuildMyHouse"
          width={120}
          height={52}
          className="h-[52px] w-[120px] object-cover object-center"
        />
        <h1 className="truncate text-center text-base font-semibold text-gray-950">{title}</h1>
        <NotificationBell />
      </header>

      <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href} className="relative flex flex-col items-center justify-center gap-0.5 text-[12px]">
              <Icon className={`h-6 w-6 ${tab.active ? 'text-gray-950' : 'text-gray-400'}`} />
              <span className={tab.active ? 'font-semibold text-gray-950' : 'text-gray-500'}>{tab.label}</span>
              {tab.active ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#16A34A]" /> : null}
              {tab.badge ? (
                <span className={`absolute right-3 top-1 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 text-white ${tab.href === '/dashboard' || tab.href === '/disputes' ? 'bg-red-600' : 'bg-gray-950'}`}>
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
        <button type="button" onClick={() => setSheet('directory')} className="relative flex flex-col items-center justify-center gap-0.5 text-[12px]">
          <LayoutDashboard className={`h-6 w-6 ${directoryActive ? 'text-gray-950' : 'text-gray-400'}`} />
          <span className={directoryActive ? 'font-semibold text-gray-950' : 'text-gray-500'}>Directory</span>
          {directoryActive ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#16A34A]" /> : null}
        </button>
        <button type="button" onClick={() => setSheet('more')} className="flex flex-col items-center justify-center gap-0.5 text-[12px] text-gray-500">
          <MoreHorizontal className="h-6 w-6" />
          <span>More</span>
        </button>
      </nav>

      {sheet ? (
        <div className="no-print fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-8 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold">{sheet === 'directory' ? 'Directory' : 'More'}</p>
              <button type="button" onClick={() => setSheet(null)} aria-label="Close" className="flex h-11 w-11 items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sheet === 'directory' ? (
              <div className="grid grid-cols-2 gap-3">
                {directoryLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSheet(null)} className="flex min-h-16 items-center gap-3 rounded-2xl border border-gray-200 px-3">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-5">
                {moreGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>
                    <div className="divide-y overflow-hidden rounded-2xl border border-gray-200">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setSheet(null)} className="flex min-h-12 items-center gap-3 px-3 text-sm font-medium">
                            <Icon className="h-4 w-4 text-gray-600" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => logout()} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-gray-200 px-3 text-sm font-medium">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
