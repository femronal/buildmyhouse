'use client';

import { Suspense } from 'react';
import PermissionGate from '@/components/PermissionGate';
import PartnershipsChrome from '@/components/partnerships/PartnershipsChrome';

export default function PartnershipsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate>
      <Suspense fallback={<p className="p-8 text-sm text-gray-600">Loading partnerships.</p>}>
        <PartnershipsChrome>{children}</PartnershipsChrome>
      </Suspense>
    </PermissionGate>
  );
}
