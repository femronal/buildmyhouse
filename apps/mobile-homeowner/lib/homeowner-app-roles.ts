/** Roles that may sign in on buildmyhouse.app (homeowner web + vendor portal). */
export const HOMEOWNER_APP_ROLES = ['homeowner', 'vendor'] as const;

export type HomeownerAppRole = (typeof HOMEOWNER_APP_ROLES)[number];

export function canSignInOnHomeownerApp(role?: string | null): boolean {
  return role === 'homeowner' || role === 'vendor';
}

export function isVendorPortalReturnPath(path?: string | null): boolean {
  if (!path) return false;
  return path === '/vendors/manage' || path.startsWith('/vendors/manage?') || path.startsWith('/vendors/claim/');
}

export function registerRoleForReturnPath(path?: string | null): 'homeowner' | 'vendor' {
  return isVendorPortalReturnPath(path) ? 'vendor' : 'homeowner';
}
