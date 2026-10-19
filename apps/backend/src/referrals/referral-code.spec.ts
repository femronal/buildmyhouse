import { BadRequestException } from '@nestjs/common';
import { assertCustomReferralCode, normalizeReferralCode, randomReferralCode, REFERRAL_CODE_ALPHABET } from './referral-code';

describe('referral codes', () => {
  it('avoids ambiguous characters', () => {
    for (let i = 0; i < 40; i += 1) {
      const code = randomReferralCode();
      expect(code).toHaveLength(6);
      expect(code.split('').every((char) => REFERRAL_CODE_ALPHABET.includes(char))).toBe(true);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('normalises a custom code to uppercase and rejects invalid codes', () => {
    expect(assertCustomReferralCode('ada-12')).toBe('ADA-12');
    expect(normalizeReferralCode(' ab3 ')).toBe('AB3');
    expect(normalizeReferralCode('no')).toBeNull();
    expect(normalizeReferralCode('bad code')).toBeNull();
    expect(() => assertCustomReferralCode('no')).toThrow(BadRequestException);
  });
});
