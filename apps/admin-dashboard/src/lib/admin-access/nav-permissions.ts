/** Sidebar route → required permission. Super admin / '*' bypasses. */
export const NAV_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/homeowners': 'homeowners.view',
  '/contractors': 'contractors.view',
  '/projects': 'projects.view',
  '/verification': 'verification.view',
  '/disputes': 'disputes.view',
  '/opportunities': 'opportunities.view',
  '/tools': 'tools.view',
  '/articles': 'content.view',
  '/emails': 'emails.view',
  '/people': 'hr.view',
  '/admin-access': 'admin_access.view',
};

export function canAccessPath(
  pathname: string,
  permissions: string[] | undefined,
  isSuperAdmin?: boolean,
): boolean {
  if (isSuperAdmin || permissions?.includes('*')) return true;
  // Backward compatible: if permissions not loaded, allow (shell still requires admin role).
  if (!permissions) return true;

  const match = Object.entries(NAV_PERMISSION_MAP).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );
  if (!match) return true;
  return permissions.includes(match[1]);
}

export function requiredPermissionForPath(pathname: string): string | null {
  const match = Object.entries(NAV_PERMISSION_MAP).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return match ? match[1] : null;
}
