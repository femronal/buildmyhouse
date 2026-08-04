'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/people', label: 'Overview', exact: true },
  { href: '/people/directory', label: 'People' },
  { href: '/people/recruitment', label: 'Recruitment' },
  { href: '/people/structure', label: 'Departments & Roles' },
  { href: '/people/permissions', label: 'Permissions' },
  { href: '/people/documents', label: 'Documents' },
  { href: '/people/communications', label: 'Communications' },
  { href: '/people/policies', label: 'Policies' },
  { href: '/people/audit', label: 'Activity / Audit Log' },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PeopleSubnav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-poppins">People & HR</h1>
          <p className="text-sm text-gray-500">
            Internal workforce, recruitment, permissions, and policies.
          </p>
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
