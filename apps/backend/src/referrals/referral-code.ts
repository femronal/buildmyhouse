import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';

export const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function randomReferralCode(length = 6): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => REFERRAL_CODE_ALPHABET[byte % REFERRAL_CODE_ALPHABET.length]).join('');
}

export function normalizeReferralCode(raw?: string | null): string | null {
  const code = String(raw || '').trim().toUpperCase();
  if (!code) return null;
  if (!/^[A-Z0-9-]{3,20}$/.test(code)) return null;
  return code;
}

export function assertCustomReferralCode(raw: string): string {
  const code = String(raw || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
    throw new BadRequestException('Code must be 3 to 20 letters, numbers or dashes.');
  }
  return code;
}
