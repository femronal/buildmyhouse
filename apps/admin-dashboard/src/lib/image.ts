const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '') || 'http://localhost:3001';

/**
 * Converts a backend-relative upload path (e.g. /uploads/profiles/xxx) into an absolute URL.
 */
export function getBackendAssetUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}
