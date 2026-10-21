import {
  activationAmount,
  parseFundingAccount,
  payableFromRequest,
  paymentReference,
  readFundingInvoice,
  referenceFromText,
  withFundingInvoice,
} from './funding-invoice';
import { verifyResendWebhook } from './resend-webhook';
import { createHmac } from 'crypto';

describe('funding invoice', () => {
  it('builds a stable payment reference', () => {
    expect(paymentReference('ab12cd34-0000-0000-0000-000000000000')).toBe('BMH-PAY-AB12CD34');
  });

  it('reads a reference from a reply subject', () => {
    expect(referenceFromText('Re: Invoice BMH-PAY-AB12CD34: Washing machine')).toBe('BMH-PAY-AB12CD34');
    expect(referenceFromText('no code here')).toBeNull();
  });

  it('accepts a 10-digit account and rejects a short one', () => {
    expect(parseFundingAccount({
      bankName: 'Access',
      accountNumber: '0123 456 789',
      accountName: 'BuildMyHouse',
    })).toEqual({
      bankName: 'Access',
      accountNumber: '0123456789',
      accountName: 'BuildMyHouse',
    });
    expect(parseFundingAccount({ bankName: 'Access', accountNumber: '123', accountName: 'BuildMyHouse' })).toBeNull();
  });

  it('uses the signed total plus fees, and keeps that amount for confirmation', () => {
    const request = {
      gcNotes: JSON.stringify({ kind: 'plan_quote', totalPayable: 130000, contractorAmount: 100000 }),
      totalQuoteAmount: 1,
    };
    expect(payableFromRequest(request)).toBe(130000);
    const analysis = withFundingInvoice({ phases: [{ name: 'Repair' }] }, {
      reference: 'BMH-PAY-AB12CD34',
      amount: 130000,
      sentAt: '2026-10-20T00:00:00.000Z',
      account: { bankName: 'Access', accountNumber: '0123456789', accountName: 'BuildMyHouse' },
      receipt: null,
    });
    expect(readFundingInvoice(analysis)?.amount).toBe(130000);
    expect((analysis.phases as unknown[]).length).toBe(1);
    expect(activationAmount({ budget: 100000, aiAnalysis: analysis })).toBe(130000);
    expect(activationAmount({ budget: 100000, aiAnalysis: {} })).toBe(100000);
  });
});

describe('resend webhook signature', () => {
  it('accepts a current Svix signature and rejects a stale one', () => {
    const rawKey = Buffer.from('funding-webhook-secret');
    const secret = `whsec_${rawKey.toString('base64')}`;
    const payload = '{"type":"email.received"}';
    const id = 'msg_1';
    const timestamp = '1700000000';
    const signature = createHmac('sha256', rawKey).update(`${id}.${timestamp}.${payload}`).digest('base64');
    expect(verifyResendWebhook({
      payload,
      id,
      timestamp,
      signature: `v1,${signature}`,
      secret,
      now: 1700000000,
    })).toBe(true);
    expect(verifyResendWebhook({
      payload,
      id,
      timestamp,
      signature: `v1,${signature}`,
      secret,
      now: 1700000000 + 10 * 60,
    })).toBe(false);
    expect(verifyResendWebhook({ payload, id, timestamp, signature: `v1,${signature}`, secret: '' })).toBe(false);
  });
});
