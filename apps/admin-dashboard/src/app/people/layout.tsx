'use client';

import PeopleSubnav from '@/components/people/PeopleSubnav';

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-gray-100">
      <PeopleSubnav />
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
