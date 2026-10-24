import { amountStillDue, canOpenProject, canStartStage, completePaymentTarget, netReceived } from './payment-model';

describe('payment model gates', () => {
  it('nets refunds out of money received', () => {
    expect(netReceived([
      { status: 'completed', amount: 130000 },
      { status: 'refunded', amount: 10000 },
      { status: 'pending', amount: 5000 },
    ])).toBe(120000);
  });

  it('keeps a full payment closed until the invoice is covered', () => {
    const input = {
      paymentModel: 'pay_in_full' as const,
      totalPayable: 130000,
      stageDeposits: [60000, 70000],
      received: 50000,
    };
    expect(canOpenProject(input)).toBe(false);
    expect(amountStillDue(input)).toBe(80000);
    expect(canOpenProject({ ...input, received: 130000 })).toBe(true);
    expect(canStartStage({ ...input, stageIndex: 0, received: 130000 })).toBe(true);
  });

  it('opens stage by stage when the first deposit is in and holds the next stage', () => {
    const deposits = [40000, 90000];
    expect(canOpenProject({
      paymentModel: 'pay_by_stage',
      totalPayable: 130000,
      stageDeposits: deposits,
      received: 40000,
    })).toBe(true);
    expect(canStartStage({
      paymentModel: 'pay_by_stage',
      stageIndex: 0,
      totalPayable: 130000,
      stageDeposits: deposits,
      received: 40000,
    })).toBe(true);
    expect(canStartStage({
      paymentModel: 'pay_by_stage',
      stageIndex: 1,
      totalPayable: 130000,
      stageDeposits: deposits,
      received: 40000,
    })).toBe(false);
    expect(amountStillDue({
      paymentModel: 'pay_by_stage',
      totalPayable: 130000,
      stageDeposits: deposits,
      received: 40000,
    })).toBe(90000);
  });

  it('records the full invoice when pay in full is marked complete', () => {
    expect(completePaymentTarget({
      paymentModel: 'pay_in_full',
      totalPayable: 78000,
      stageDeposits: [20000, 58000],
      stageStatuses: ['completed', 'not_started'],
    })).toBe(78000);
  });

  it('records deposits through the latest started stage', () => {
    expect(completePaymentTarget({
      paymentModel: 'pay_by_stage',
      totalPayable: 78000,
      stageDeposits: [20000, 30000, 28000],
      stageStatuses: ['completed', 'in_progress', 'not_started'],
    })).toBe(50000);
    expect(completePaymentTarget({
      paymentModel: 'pay_by_stage',
      totalPayable: 78000,
      stageDeposits: [20000, 58000],
      stageStatuses: ['not_started', 'not_started'],
    })).toBe(20000);
  });
});
