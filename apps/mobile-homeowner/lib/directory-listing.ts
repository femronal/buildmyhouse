/** Shared query, heading, and card helpers for /vendors and /professionals. */

export const DIRECTORY_PAGE_SIZE = 12;

export const VENDOR_DIRECTORY_BASE_TITLE = 'Building Material Vendors in Nigeria';
export const PROFESSIONAL_DIRECTORY_BASE_TITLE = 'Construction Professionals in Nigeria';

export const VENDOR_DIRECTORY_SUMMARY =
  'Discover listed building-material suppliers by what they sell, where they operate, and whether BuildMyHouse has verified their business identity. Listing is not the same as verification.';

export const PROFESSIONAL_DIRECTORY_SUMMARY =
  'Find architects, engineers, quantity surveyors, surveyors, property lawyers and other professionals by what you need done, where they operate, and whether BuildMyHouse has checked their credentials. Listing is not the same as verification.';

export const VENDOR_QUERY_ORDER = [
  'q',
  'category',
  'state',
  'verified',
  'wholesale',
  'delivery',
  'sort',
  'page',
] as const;

export const PROFESSIONAL_QUERY_ORDER = [
  'q',
  'profession',
  'need',
  'state',
  'credentialChecked',
  'usedByBmh',
  'siteVisits',
  'remoteConsultation',
  'signedReport',
  'type',
  'sort',
  'page',
] as const;

export type DirectorySort = 'best' | 'name';

export function readFlag(value?: string): boolean {
  return value === '1' || value === 'true';
}

export function readPage(value?: string): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function readSort(value?: string): DirectorySort {
  return value === 'name' ? 'name' : 'best';
}

export function normalizeSearchParams(
  raw: Record<string, string | string[] | undefined>,
  keys: readonly string[],
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  keys.forEach((key) => {
    const value = raw[key];
    const first = Array.isArray(value) ? value[0] : value;
    out[key] = typeof first === 'string' && first.trim().length > 0 ? first : undefined;
  });
  return out;
}

export function directoryHref(
  path: string,
  params: Record<string, string | undefined>,
  order: readonly string[],
): string {
  const search = new URLSearchParams();
  order.forEach((key) => {
    const value = params[key];
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function withDirectoryParams(
  path: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
  order: readonly string[],
  resetPage = true,
): string {
  const next: Record<string, string | undefined> = { ...current };
  Object.entries(patch).forEach(([key, value]) => {
    next[key] = value || undefined;
  });
  if (resetPage && !Object.prototype.hasOwnProperty.call(patch, 'page')) {
    next.page = undefined;
  }
  return directoryHref(path, next, order);
}

export function directoryCanonical(
  path: string,
  params: Record<string, string | undefined>,
  keys: readonly string[],
): string {
  return directoryHref(path, params, keys);
}

export function toggleFilterHref(
  path: string,
  current: Record<string, string | undefined>,
  key: string,
  value: string,
  order: readonly string[],
): string {
  const active = current[key] === value;
  return withDirectoryParams(path, current, { [key]: active ? undefined : value }, order);
}

export function humanizeKey(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function pluralizeLastWord(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return label;
  const last = parts[parts.length - 1];
  let plural = last;
  if (/[^aeiou]y$/i.test(last)) plural = `${last.slice(0, -1)}ies`;
  else if (/(s|x|z|ch|sh)$/i.test(last)) plural = `${last}es`;
  else if (!/s$/i.test(last)) plural = `${last}s`;
  parts[parts.length - 1] = plural;
  return parts.join(' ');
}

export function vendorDirectoryHeading(input: {
  categoryLabel?: string;
  stateLabel?: string;
}): string {
  const place = input.stateLabel || 'Nigeria';
  if (!input.categoryLabel && place === 'Nigeria') return VENDOR_DIRECTORY_BASE_TITLE;
  const subject = input.categoryLabel ? `${input.categoryLabel} Vendors` : 'Building Material Vendors';
  return `${subject} in ${place}`;
}

export function professionalDirectoryHeading(input: {
  professionLabel?: string;
  stateLabel?: string;
  needLabel?: string;
}): string {
  const place = input.stateLabel || 'Nigeria';
  if (input.professionLabel) {
    return `${pluralizeLastWord(input.professionLabel)} in ${place}`;
  }
  if (input.needLabel) return `${input.needLabel} in ${place}`;
  if (place === 'Nigeria') return PROFESSIONAL_DIRECTORY_BASE_TITLE;
  return `Construction Professionals in ${place}`;
}

/** Title and H1 must not open as a "verified vendors/professionals" claim. */
export function headingAvoidsVerifiedLead(heading: string): boolean {
  return !/^\s*verified\b/i.test(heading) && !/\bverified (vendors|professionals)\b/i.test(heading);
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => /[A-Za-z0-9]/.test(part));
  if (!parts.length) return 'BM';
  const first = parts[0].replace(/[^A-Za-z0-9]/g, '');
  if (parts.length === 1) return first.slice(0, 2).toUpperCase() || 'BM';
  const last = parts[parts.length - 1].replace(/[^A-Za-z0-9]/g, '');
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function formatResultCount(count: number, singular: string): string {
  const noun = count === 1 ? singular : `${singular}s`;
  return `${count.toLocaleString('en-US')} ${noun}`;
}
