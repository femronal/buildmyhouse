export function canResetPasswordForRequestedApp(
  userRole: string,
  requestedRole?: string | null,
): boolean {
  const homeownerApp = userRole === 'homeowner' || userRole === 'vendor';
  const gcApp = userRole === 'general_contractor';
  if (!homeownerApp && !gcApp) return false;
  if (!requestedRole) return true;
  if (requestedRole === 'homeowner') return homeownerApp;
  if (requestedRole === 'general_contractor') return gcApp;
  return false;
}
