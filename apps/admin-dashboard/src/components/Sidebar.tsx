'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  HardHat,
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
} from 'lucide-react';
import { logout } from '@/lib/auth';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { NAV_PERMISSION_MAP } from '@/lib/admin-access/nav-permissions';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/homeowners', label: 'Homeowners', icon: Users },
  { href: '/contractors', label: 'Contractors', icon: HardHat },
  { href: '/projects', label: 'Projects', icon: Building2 },
  { href: '/verification', label: 'Verification', icon: CheckCircle2 },
  { href: '/disputes', label: 'Disputes', icon: Scale },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/articles', label: 'Content', icon: FileText },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/people', label: 'People & HR', icon: UserCog },
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
      className={`w-64 bg-gray-900 text-white p-4 flex flex-col ${
        isMobile ? 'min-h-full' : 'h-full min-h-screen'
      }`}
    >
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins">BuildMyHouse</h1>
          <p className="text-gray-400 text-sm">Admin Dashboard</p>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="space-y-2 flex-1">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors w-full"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </aside>
  );
}



