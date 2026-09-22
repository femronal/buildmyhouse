import { LEGAL_OPERATOR_LINE } from '@buildmyhouse/shared-utils';
import {
  PRIVACY_DATA_PROTECTION,
  PRIVACY_HOW_WE_USE_IT,
  PRIVACY_PAYMENT_PROCESSORS,
} from '@/lib/privacy-security-copy';

const PUBLISHED_PRIVACY_COPY = [
  ...PRIVACY_HOW_WE_USE_IT,
  PRIVACY_PAYMENT_PROCESSORS,
  PRIVACY_DATA_PROTECTION,
].join('\n');

describe('approved privacy and operator disclosure', () => {
  it('publishes the approved operator line and keeps Mechus as the legal entity', () => {
    expect(LEGAL_OPERATOR_LINE).toBe('Operated by Mechus Construction Limited (RC 7930858).');
    expect(LEGAL_OPERATOR_LINE).not.toContain('BuildMyHouse Technologies Limited');
  });

  it('uses the approved privacy wording and does not claim live escrow or a provider list', () => {
    expect(PRIVACY_HOW_WE_USE_IT).toEqual([
      'To match you with contractors and manage your account',
      'To run stage-based project workflows (scope, updates, evidence, approvals)',
      'To send project updates and payment instructions through approved providers',
    ]);
    expect(PRIVACY_PAYMENT_PROCESSORS).toBe(
      'Payment information is processed by approved payment providers. We do not store full card details.',
    );
    expect(PRIVACY_DATA_PROTECTION).toBe(
      'We use industry-standard encryption and secure storage. Payments are processed by approved providers. Progression follows scope, evidence, and your approval. Refunds and holds follow platform policies and dispute review — they are not automatic blanket promises. BuildMyHouse is not a bank or escrow company.',
    );

    expect(PUBLISHED_PRIVACY_COPY).not.toMatch(/hold deposits|release funds|held in escrow/i);
    expect(PUBLISHED_PRIVACY_COPY).not.toMatch(/Stripe|Wise|Paystack|Zelle/);
    expect(PRIVACY_DATA_PROTECTION).toContain('BuildMyHouse is not a bank or escrow company.');
  });
});