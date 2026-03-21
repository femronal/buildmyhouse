const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const ASSET_BASE_URL = apiUrl
  ? apiUrl.replace(/\/api\/?$/, '')
  : (__DEV__ ? 'http://localhost:3001' : 'https://api.buildmyhouse.app');

/**
 * Converts a backend-relative upload path (e.g. `/uploads/...`) into an absolute URL
 * so Expo Web doesn’t try to fetch it from the app origin (e.g. localhost:8082).
 */
export function getBackendAssetUrl(url?: string | null) {
  if (!url) return url as any;
  if (/^\/+https?:\/\//i.test(url)) return url.replace(/^\/+/, '');
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${ASSET_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

