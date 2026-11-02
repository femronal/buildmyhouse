export type UploadHostConfig = {
  bucket: string;
  region: string;
  publicBaseUrl: string | null;
};

export function isBuildMyHouseUploadUrl(raw: string, config: UploadHostConfig): boolean {
  const value = String(raw || '').trim();
  if (!value || value.includes('..')) return false;
  if (value.startsWith('/uploads/') && !value.includes('://')) return true;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  const bucket = config.bucket.toLowerCase();
  const region = config.region.toLowerCase();
  if (bucket && region && host === `${bucket}.s3.${region}.amazonaws.com`) return true;
  if (bucket && region && host === `s3.${region}.amazonaws.com` && url.pathname.startsWith(`/${config.bucket}/`)) {
    return true;
  }
  if (!config.publicBaseUrl) return false;
  try {
    const base = new URL(config.publicBaseUrl);
    const basePath = base.pathname.replace(/\/$/, '');
    return host === base.hostname.toLowerCase() && url.pathname.startsWith(`${basePath}/`);
  } catch {
    return false;
  }
}
