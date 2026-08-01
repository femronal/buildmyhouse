import { createHmac } from 'crypto';
import { verifyPaystackSignature } from './paystack.provider';

describe('verifyPaystackSignature', () => {
  const secret = 'sk_test_dummy_secret_for_signature_tests';
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'pc_abc', amount: 500000 } });

  it('accepts a valid HMAC SHA512 signature', () => {
    const signature = createHmac('sha512', secret).update(body).digest('hex');
    expect(verifyPaystackSignature({ rawBody: body, signatureHeader: signature, secret })).toBe(true);
  });

  it('rejects an invalid signature', () => {
    expect(
      verifyPaystackSignature({
        rawBody: body,
        signatureHeader: 'deadbeef',
        secret,
      }),
    ).toBe(false);
  });

  it('rejects missing signature or secret', () => {
    expect(verifyPaystackSignature({ rawBody: body, signatureHeader: undefined, secret })).toBe(false);
    expect(verifyPaystackSignature({ rawBody: body, signatureHeader: 'abc', secret: '' })).toBe(false);
  });
});
