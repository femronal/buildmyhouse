'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  HardHat,
  Store,
  Users, 
  Building2, 
  Briefcase,
  Mail,
  CheckCircle2, 
  Scale,
  FileText, 
  Shield, 
  LogOut, 
  X,
  Wrench,
  UserCog,
  Waypoints,
  BadgeCheck,
} from 'lucide-react';
import { logout } from '@/lib/auth';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { NAV_PERMISSION_MAP } from '@/lib/admin-access/nav-permissions';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/homeowners', label: 'Homeowners', icon: Users },
  { href: '/contractors', label: 'Contractors', icon: HardHat },
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/professionals', label: 'Professionals', icon: BadgeCheck },
  { href: '/projects', label: 'Projects', icon: Building2 },
  { href: '/verification', label: 'Verification', icon: CheckCircle2 },
  { href: '/disputes', label: 'Disputes', icon: Scale },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/articles', label: 'Content', icon: FileText },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/people', label: 'People & HR', icon: UserCog },
  { href: '/growth', label: 'Growth', icon: Waypoints },
  { href: '/admin-access', label: 'Admin Access', icon: Shield },
];

function isToolsPath(pathname: string): boolean {
  return (
    pathname === '/tools' ||
    pathname.startsWith('/tools/') ||
    pathname.startsWith('/price-intelligence') ||
    pathname === '/price-checker-revenue'
  );
}

type SidebarProps = {
  isMobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
};

export default function Sidebar({ isMobile = false, onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin, permissions, hasPermission } = useMyPermissions();

  const visibleItems = menuItems.filter((item) => {
    if (isSuperAdmin || permissions?.includes('*')) return true;
    if (!permissions) return true;
    const required = NAV_PERMISSION_MAP[item.href];
    if (!required) return true;
    return hasPermission(required);
  });

  const handleLogout = () => {
    onNavigate?.();
    logout();
  };

  return (
    <aside
      className={`w-40 bg-gray-900 text-white px-1.5 py-2 flex flex-col ${
        isMobile ? 'min-h-full' : 'h-full min-h-screen'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-1">
        <div>
          <h1 className="text-[11px] font-bold font-poppins leading-tight">BuildMyHouse</h1>
          <p className="text-gray-400 text-[9px] leading-tight">Admin Dashboard</p>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-gray-300 hover:bg-gray-800 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <nav className="space-y-px flex-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/articles' && pathname.startsWith('/service-pages')) ||
            (item.href === '/tools' && isToolsPath(pathname)) ||
            (item.href !== '/dashboard' &&
              item.href !== '/tools' &&
              pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-2.5 h-2.5 shrink-0" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-gray-300 hover:bg-gray-800 transition-colors w-full mt-1.5"
      >
        <LogOut className="w-2.5 h-2.5 shrink-0" />
        <span className="text-[10px] font-medium leading-tight">Logout</span>
      </button>
    </aside>
  );
}



