import { Platform } from 'react-native';

const STORAGE_KEY = 'bmh_ref';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Ships off. Flip to true to show a typed referral code field. */
export const SHOW_REFERRAL_CODE_FIELD = false;

let typedReferralCode = '';

export function setTypedReferralCode(code: string) {
  typedReferralCode = code.trim().toUpperCase();
}

export function typedReferralCodeValue() {
  return typedReferralCode;
}

type StoredReferral = { code: string; capturedAt: number };

function readStored(): StoredReferral | null {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReferral;
    if (!parsed?.code || !parsed.capturedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function captureReferralCode() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const incoming = String(params.get('ref') || '').trim();
  if (!/^[A-Za-z0-9-]{3,20}$/.test(incoming)) return;
  const existing = readStored();
  if (existing && Date.now() - existing.capturedAt < MAX_AGE_MS) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: incoming.toUpperCase(), capturedAt: Date.now() }));
}

export function getReferralCode(): string | null {
  const existing = readStored();
  if (!existing) return null;
  if (Date.now() - existing.capturedAt >= MAX_AGE_MS) {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return existing.code;
}
