import type { ServicePageRegion } from './service-page-catalog';

export function normalizeServicePageSlug(slug: string) {
  return String(slug || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildServicePageCanonicalPath(region: ServicePageRegion, slug: string) {
  const normalizedSlug = normalizeServicePageSlug(slug);
  if (!normalizedSlug) return region === 'lagos' ? '/services/lagos' : '/services';

  if (region === 'lagos') {
    const lagosSlug = normalizedSlug.replace(/^lagos\//, '');
    return `/services/lagos/${lagosSlug}`;
  }

  if (normalizedSlug.endsWith('-nigeria')) {
    return `/services/${normalizedSlug}`;
  }

  return `/services/${normalizedSlug}-nigeria`;
}

export function normalizeServicePageCanonicalPath(path: string) {
  const raw = String(path || '').trim();
  if (!raw) return '/';

  const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
  const cleaned = prefixed.replace(/\/+$/, '');

  if (cleaned.includes('-nigeria-nigeria')) {
    return cleaned.replace(/-nigeria-nigeria/g, '-nigeria');
  }

  return cleaned;
}
