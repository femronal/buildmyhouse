import { normalizePostAuthReturnPath } from '@/lib/post-auth-navigation';

export function vendorClaimPath(token: string): string {
  return `/vendors/claim/${token}`;
}

export function buildAuthContinueHref(
  destinationPath: string,
  mode: 'signin' | 'signup' = 'signup',
): string {
  const returnTo = normalizePostAuthReturnPath(destinationPath);
  const params = new URLSearchParams();
  params.set('mode', mode);
  if (returnTo) params.set('returnTo', returnTo);
  return `/email-login?${params.toString()}`;
}

export function postAuthContinueMessage(returnPath: string | null | undefined): string | null {
  if (!returnPath) return null;
  if (returnPath.startsWith('/vendors/claim/')) {
    return 'After you create an account or sign in, we will bring you back to claim this vendor profile.';
  }
  if (returnPath === '/vendors/manage' || returnPath.startsWith('/vendors/manage?')) {
    return 'After you sign in, we will bring you back to manage your vendor listing.';
  }
  return 'Sign in to continue from where you left off.';
}
