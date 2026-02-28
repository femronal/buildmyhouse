'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  HardHat,
  Users, 
  Building2, 
  Building,
  CheckCircle2, 
  Scale,
  LandPlot,
  Home,
  LogOut
} from 'lucide-react';
import { logout } from '@/lib/auth';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/homeowners', label: 'Homeowners', icon: Users },
  { href: '/contractors', label: 'Contractors', icon: HardHat },
  { href: '/projects', label: 'Projects', icon: Building2 },
  { href: '/verification', label: 'Verification', icon: CheckCircle2 },
  { href: '/disputes', label: 'Disputes', icon: Scale },
  { href: '/land', label: 'Land', icon: LandPlot },
  { href: '/houses', label: 'Houses', icon: Home },
  { href: '/rentals', label: 'Rentals', icon: Building },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-poppins">BuildMyHouse</h1>
        <p className="text-gray-400 text-sm">Admin Dashboard</p>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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



