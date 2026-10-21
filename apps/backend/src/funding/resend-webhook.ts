import { createHmac, timingSafeEqual } from 'crypto';

const MAX_AGE_SECONDS = 5 * 60;

export function verifyResendWebhook(params: {
  payload: string;
  id?: string | null;
  timestamp?: string | null;
  signature?: string | null;
  secret?: string | null;
  now?: number;
}): boolean {
  const secret = String(params.secret || '').trim();
  const id = String(params.id || '').trim();
  const timestamp = String(params.timestamp || '').trim();
  const signature = String(params.signature || '').trim();
  if (!secret || !id || !timestamp || !signature) return false;
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  const now = params.now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - sentAt) > MAX_AGE_SECONDS) return false;

  let key: Buffer;
  try {
    key = Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64');
  } catch {
    return false;
  }
  if (!key.length) return false;

  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${params.payload}`).digest('base64');
  const expectedBuf = Buffer.from(expected);
  const parts = signature.split(' ').map((part) => part.split(',')[1] || '').filter(Boolean);
  return parts.some((part) => {
    const actual = Buffer.from(part);
    return actual.length === expectedBuf.length && timingSafeEqual(actual, expectedBuf);
  });
}
