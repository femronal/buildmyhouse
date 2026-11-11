'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { logout } from '@/lib/auth';
import { useFeedbackQueueCounts } from '@/hooks/useListingReviews';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { canAccessPath } from '@/lib/admin-access/nav-permissions';
import { NAV_GROUPS } from '@/lib/nav-groups';

function isToolsPath(pathname: string): boolean {
  return (
    pathname === '/tools' ||
    pathname.startsWith('/tools/') ||
    pathname.startsWith('/price-intelligence') ||
    pathname === '/price-checker-revenue'
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/articles' && pathname.startsWith('/service-pages')) return true;
  if (href === '/tools' && isToolsPath(pathname)) return true;
  if (href === '/reports/weekly' && pathname.startsWith('/reports')) return true;
  if (href === '/dashboard') return false;
  if (href === '/tools' || href === '/vendors') return pathname.startsWith(`${href}/`) || pathname.startsWith(href);
  return pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  isMobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
};

export default function Sidebar({ isMobile = false, onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin, permissions } = useMyPermissions();
  const counts = useFeedbackQueueCounts();
  const dashboard = useAdminDashboard();
  const strip = dashboard.data?.strip;
  const verificationCount = dashboard.data?.trust.find((item) => item.kind === 'gcs_ready')?.count || 0;

  const badgeFor = (href: string) => {
    if (dashboard.isError) return 0;
    if (href === '/dashboard') return strip?.needsYou.total || 0;
    if (href === '/disputes') return strip?.openDisputes.count || 0;
    if (href === '/verification') return verificationCount;
    if (href === '/listing-reviews') return counts.data?.pendingReviews || 0;
    if (href === '/scam-reports') return counts.data?.newReports || 0;
    return 0;
  };

  const badgeIsRed = (href: string) => href === '/dashboard' || href === '/disputes' || href === '/scam-reports';

  const canSee = (href: string) => canAccessPath(href, permissions, isSuperAdmin);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item.href)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className={`flex w-56 flex-col bg-gray-900 px-3 py-4 text-white ${isMobile ? 'min-h-full' : 'h-full min-h-screen'}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="font-poppins text-base font-bold leading-tight">BuildMyHouse</h1>
          <p className="text-xs leading-tight text-gray-400">Admin Dashboard</p>
        </div>
        {isMobile ? (
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-300 hover:bg-gray-800 hover:text-white" aria-label="Close navigation menu">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);
                const badge = badgeFor(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${active ? 'bg-gray-950 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium leading-tight">{item.label}</span>
                    {badge > 0 ? (
                      <span className={`ml-auto rounded-full px-1.5 text-[11px] leading-4 ${badgeIsRed(item.href) ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'}`}>{badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button onClick={() => { onNavigate?.(); logout(); }} className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-gray-300 hover:bg-gray-800">
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium leading-tight">Logout</span>
      </button>
    </aside>
  );
}
