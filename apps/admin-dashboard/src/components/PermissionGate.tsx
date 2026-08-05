'use client';

import { usePathname } from 'next/navigation';
import AccessRestricted from '@/components/admin-access/AccessRestricted';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { canAccessPath } from '@/lib/admin-access/nav-permissions';

export default function PermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSuperAdmin, permissions, isLoading } = useMyPermissions();

  if (isLoading) return null;

  if (!canAccessPath(pathname, permissions, isSuperAdmin)) {
    return <AccessRestricted />;
  }

  return <>{children}</>;
}
