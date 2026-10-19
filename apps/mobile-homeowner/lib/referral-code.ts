import { Platform } from 'react-native';
import { API_BASE_URL } from '@/lib/api';

const STORAGE_KEY = 'bmh_ref';

export type ReferralProgram = {
  allowHomeownerTypedCode: boolean;
  linkValidityDays: number;
  attributionRule: 'first_touch' | 'latest_code';
};

const fallbackProgram: ReferralProgram = {
  allowHomeownerTypedCode: false,
  linkValidityDays: 30,
  attributionRule: 'first_touch',
};

let program: ReferralProgram = fallbackProgram;

let typedReferralCode = '';

export function setTypedReferralCode(code: string) {
  typedReferralCode = code.trim().toUpperCase();
}

export function typedReferralCodeValue() {
  return typedReferralCode;
}

export function referralProgram() {
  return program;
}

export async function loadReferralProgram() {
  if (Platform.OS !== 'web') return program;
  try {
    const response = await fetch(`${API_BASE_URL}/referrals/program`);
    if (!response.ok) return program;
    const body = (await response.json()) as Partial<ReferralProgram>;
    program = {
      allowHomeownerTypedCode: body.allowHomeownerTypedCode === true,
      linkValidityDays: Number(body.linkValidityDays) > 0 ? Number(body.linkValidityDays) : 30,
      attributionRule: body.attributionRule === 'latest_code' ? 'latest_code' : 'first_touch',
    };
  } catch {
    program = fallbackProgram;
  }
  return program;
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

function maxAgeMs() {
  return program.linkValidityDays * 24 * 60 * 60 * 1000;
}

export function captureReferralCode() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const incoming = String(params.get('ref') || '').trim();
  if (!/^[A-Za-z0-9-]{3,20}$/.test(incoming)) return;
  const existing = readStored();
  const stillValid = existing && Date.now() - existing.capturedAt < maxAgeMs();
  if (stillValid && program.attributionRule !== 'latest_code') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: incoming.toUpperCase(), capturedAt: Date.now() }));
}

export function getReferralCode(): string | null {
  const existing = readStored();
  if (!existing) return null;
  if (Date.now() - existing.capturedAt >= maxAgeMs()) {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return existing.code;
}
