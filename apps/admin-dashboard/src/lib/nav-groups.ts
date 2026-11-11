import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  HardHat,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Scale,
  Shield,
  ShieldAlert,
  Store,
  UserCog,
  Users,
  Waypoints,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon };

export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Today',
    items: [{ href: '/dashboard', label: 'Today', icon: LayoutDashboard }],
  },
  {
    label: 'Jobs',
    items: [
      { href: '/projects', label: 'Projects', icon: Building2 },
      { href: '/disputes', label: 'Disputes', icon: Scale },
    ],
  },
  {
    label: 'Money',
    items: [{ href: '/reports/weekly', label: 'Weekly report', icon: BarChart3 }],
  },
  {
    label: 'Trust',
    items: [
      { href: '/verification', label: 'Verification', icon: CheckCircle2 },
      { href: '/listing-reviews', label: 'Listing reviews', icon: MessageSquare },
      { href: '/scam-reports', label: 'Scam reports', icon: ShieldAlert },
    ],
  },
  {
    label: 'Directory',
    items: [
      { href: '/homeowners', label: 'Homeowners', icon: Users },
      { href: '/contractors', label: 'Contractors', icon: HardHat },
      { href: '/vendors', label: 'Vendors', icon: Store },
      { href: '/artisans', label: 'Artisans', icon: Wrench },
      { href: '/professionals', label: 'Professionals', icon: BadgeCheck },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/growth', label: 'Growth', icon: Waypoints },
      { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
      { href: '/articles', label: 'Content', icon: FileText },
      { href: '/emails', label: 'Emails', icon: Mail },
    ],
  },
  {
    label: 'Company',
    items: [
      { href: '/tools', label: 'Tools', icon: Wrench },
      { href: '/people', label: 'People & HR', icon: UserCog },
      { href: '/admin-access', label: 'Admin access', icon: Shield },
    ],
  },
];
