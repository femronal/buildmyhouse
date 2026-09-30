export type ListingWelcomeKind = 'professional' | 'vendor';

const HANDLED_KEY = 'bmh-listing-welcome-done';
const handled = new Set<string>();

export function ownerHomeWithListingWelcome(kind: ListingWelcomeKind) {
  return `/(tabs)/home?listingWelcome=${kind}`;
}

export function listingManagePath(kind: ListingWelcomeKind) {
  return kind === 'vendor' ? '/vendors/manage' : '/professionals/manage';
}

export function listingWelcomeHandled(kind: ListingWelcomeKind) {
  if (handled.has(kind)) return true;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(HANDLED_KEY) === kind) {
      handled.add(kind);
      return true;
    }
  } catch {
    // sessionStorage is unavailable in some native contexts.
  }
  return false;
}

export function markListingWelcomeHandled(kind: ListingWelcomeKind) {
  handled.add(kind);
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(HANDLED_KEY, kind);
  } catch {
    // Ignore storage failures. The in-memory flag still covers this session.
  }
}
