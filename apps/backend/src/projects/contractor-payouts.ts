import { BadRequestException } from '@nestjs/common';

export function isStageApproved(stage: { status?: string | null; approvedAt?: Date | string | null }): boolean {
  return stage?.status === 'completed' && Boolean(stage?.approvedAt);
}

export function activePayoutTotal(payouts: Array<{ amount?: number | null; voidedAt?: Date | string | null }>): number {
  return (payouts || []).reduce((sum, row) => {
    if (row?.voidedAt) return sum;
    return sum + (Number(row?.amount) || 0);
  }, 0);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function naira(value: number): string {
  return `₦${roundMoney(value).toLocaleString('en-NG')}`;
}

export function checkContractorPayout(input: {
  stage: { status?: string | null; approvedAt?: Date | string | null; estimatedCost?: number | null };
  existingPayouts: Array<{ amount?: number | null; voidedAt?: Date | string | null; bankReference?: string | null }>;
  referencePayouts?: Array<{ amount?: number | null; voidedAt?: Date | string | null; bankReference?: string | null }>;
  amount: number;
  bankReference?: string | null;
  proofFileUrl?: string | null;
  sentAt?: Date | string | null;
  earlyPaymentReason?: string | null;
  gcUserId?: string | null;
  now: Date;
}): { amount: number; bankReference: string; earlyPaymentReason: string | null } {
  if (!String(input.gcUserId || '').trim()) {
    throw new BadRequestException('This job has no general contractor yet.');
  }
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException('Enter the amount you sent.');
  }
  const bankReference = String(input.bankReference || '').trim();
  if (!bankReference) {
    throw new BadRequestException('Enter the bank reference.');
  }
  const proofFileUrl = String(input.proofFileUrl || '').trim();
  if (!proofFileUrl.startsWith('https://')) {
    throw new BadRequestException('Upload the transfer receipt.');
  }
  const sentAt = input.sentAt ? new Date(input.sentAt) : null;
  if (!sentAt || Number.isNaN(sentAt.getTime()) || sentAt.getTime() > input.now.getTime()) {
    throw new BadRequestException('Enter the date the money was sent. It cannot be in the future.');
  }
  const approved = isStageApproved(input.stage);
  const earlyPaymentReason = String(input.earlyPaymentReason || '').trim();
  if (!approved && earlyPaymentReason.length < 10) {
    throw new BadRequestException('This stage is not approved yet. Write why you are paying now.');
  }
  const estimatedCost = Number(input.stage?.estimatedCost);
  if (!Number.isFinite(estimatedCost) || estimatedCost <= 0) {
    throw new BadRequestException('This stage has no contractor amount. Set the stage amount first.');
  }
  const roundedAmount = roundMoney(amount);
  const newTotal = roundMoney(activePayoutTotal(input.existingPayouts) + roundedAmount);
  const limit = roundMoney(estimatedCost);
  if (newTotal > limit) {
    throw new BadRequestException(`This would send ${naira(newTotal)} for this stage. The stage contractor amount is ${naira(limit)}.`);
  }
  const reference = bankReference.toLowerCase();
  const duplicate = (input.referencePayouts || input.existingPayouts).some((row) => {
    if (row?.voidedAt) return false;
    return String(row?.bankReference || '').trim().toLowerCase() === reference;
  });
  if (duplicate) {
    throw new BadRequestException('This bank reference is already recorded on this job.');
  }
  return {
    amount: roundedAmount,
    bankReference,
    earlyPaymentReason: approved ? null : earlyPaymentReason,
  };
}
