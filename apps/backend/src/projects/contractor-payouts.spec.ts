import { BadRequestException } from '@nestjs/common';
import { checkContractorPayout } from './contractor-payouts';

const now = new Date('2026-11-23T12:00:00.000Z');

function input(overrides: Record<string, unknown> = {}) {
  return {
    stage: { status: 'in_progress', approvedAt: null, estimatedCost: 100000 },
    existingPayouts: [] as Array<{ amount?: number | null; voidedAt?: Date | string | null; bankReference?: string | null }>,
    amount: 1000,
    bankReference: 'FT1',
    proofFileUrl: 'https://files.example/receipt.pdf',
    sentAt: '2026-11-22T12:00:00.000Z',
    earlyPaymentReason: 'GC needs cash for blocks',
    gcUserId: 'gc-1',
    now,
    ...overrides,
  };
}

describe('checkContractorPayout', () => {
  it('rejects an unapproved stage with no reason', () => {
    expect(() => checkContractorPayout(input({ earlyPaymentReason: '' }))).toThrow(
      'This stage is not approved yet. Write why you are paying now.',
    );
  });

  it('keeps the reason when the stage is not approved', () => {
    const result = checkContractorPayout(input());
    expect(result.earlyPaymentReason).toBe('GC needs cash for blocks');
    expect(result.amount).toBe(1000);
    expect(result.bankReference).toBe('FT1');
  });

  it('drops the reason when the stage is approved', () => {
    const result = checkContractorPayout(input({
      stage: { status: 'completed', approvedAt: '2026-11-20T12:00:00.000Z', estimatedCost: 100000 },
      earlyPaymentReason: 'GC needs cash for blocks',
    }));
    expect(result.earlyPaymentReason).toBeNull();
  });

  it('treats pending homeowner approval as not approved', () => {
    expect(() => checkContractorPayout(input({
      stage: { status: 'pending_homeowner_approval', approvedAt: '2026-11-20T12:00:00.000Z', estimatedCost: 100000 },
      earlyPaymentReason: 'too short',
    }))).toThrow('This stage is not approved yet. Write why you are paying now.');
  });

  it('rejects a zero or negative amount', () => {
    expect(() => checkContractorPayout(input({ amount: 0 }))).toThrow('Enter the amount you sent.');
    expect(() => checkContractorPayout(input({ amount: -5 }))).toThrow('Enter the amount you sent.');
  });

  it('allows a payment that reaches the stage amount exactly', () => {
    const result = checkContractorPayout(input({
      existingPayouts: [{ amount: 60000, voidedAt: null, bankReference: 'OLD' }],
      amount: 40000,
    }));
    expect(result.amount).toBe(40000);
  });

  it('rejects a payment that passes the stage amount', () => {
    const over = 100001;
    const limit = 100000;
    expect(() => checkContractorPayout(input({
      existingPayouts: [{ amount: 60000, voidedAt: null, bankReference: 'OLD' }],
      amount: 40001,
    }))).toThrow(
      `This would send ₦${over.toLocaleString('en-NG')} for this stage. The stage contractor amount is ₦${limit.toLocaleString('en-NG')}.`,
    );
  });

  it('ignores a voided payout when checking the stage amount', () => {
    const result = checkContractorPayout(input({
      existingPayouts: [{ amount: 60000, voidedAt: now, bankReference: 'OLD' }],
      amount: 100000,
    }));
    expect(result.amount).toBe(100000);
  });

  it('rejects a stage with no contractor amount', () => {
    expect(() => checkContractorPayout(input({
      stage: { status: 'in_progress', approvedAt: null, estimatedCost: 0 },
    }))).toThrow('This stage has no contractor amount. Set the stage amount first.');
  });

  it('rejects a missing bank reference, receipt, future date, missing contractor, or duplicate reference', () => {
    expect(() => checkContractorPayout(input({ bankReference: '  ' }))).toThrow('Enter the bank reference.');
    expect(() => checkContractorPayout(input({ proofFileUrl: '' }))).toThrow('Upload the transfer receipt.');
    expect(() => checkContractorPayout(input({ sentAt: '2026-11-24T00:00:00.000Z' }))).toThrow(
      'Enter the date the money was sent. It cannot be in the future.',
    );
    expect(() => checkContractorPayout(input({ gcUserId: '' }))).toThrow('This job has no general contractor yet.');
    expect(() => checkContractorPayout(input({
      existingPayouts: [{ amount: 10, voidedAt: null, bankReference: 'FT1' }],
      bankReference: 'ft1',
    }))).toThrow('This bank reference is already recorded on this job.');
    expect(() => checkContractorPayout(input({
      existingPayouts: [{ amount: 60000, voidedAt: now, bankReference: 'FT1' }],
      bankReference: 'ft1',
      amount: 1000,
    }))).not.toThrow();
  });

  it('uses BadRequestException for a bad amount', () => {
    expect(() => checkContractorPayout(input({ amount: Number.NaN }))).toThrow(BadRequestException);
  });
});
