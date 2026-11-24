export const BMH_POST_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', hosts: ['instagram.com', 'www.instagram.com'] },
  { key: 'tiktok', label: 'TikTok', hosts: ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com'] },
  { key: 'google_business', label: 'Google Business Profile', hosts: ['g.page', 'maps.app.goo.gl', 'g.co', 'business.google.com', 'www.google.com', 'google.com'] },
  { key: 'x', label: 'X', hosts: ['x.com', 'twitter.com', 'www.x.com', 'mobile.twitter.com'] },
] as const;

export type BmhPostPlatform = (typeof BMH_POST_PLATFORMS)[number]['key'];

export function platformFor(key: string) {
  return BMH_POST_PLATFORMS.find((item) => item.key === key) || null;
}

export function validPostUrl(key: string, url: string) {
  const platform = platformFor(key);
  if (!platform) return false;
  let parsed: URL;
  try {
    parsed = new URL(String(url || '').trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  return platform.hosts.some((host) => host === parsed.hostname.toLowerCase());
}
