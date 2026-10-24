export const PAYMENT_MODELS = ['pay_in_full', 'pay_by_stage'] as const;

export type PaymentModel = (typeof PAYMENT_MODELS)[number];

export function isPaymentModel(value: unknown): value is PaymentModel {
  return value === 'pay_in_full' || value === 'pay_by_stage';
}

export function netReceived(payments?: Array<{ status?: string | null; amount?: number | null }> | null): number {
  let total = 0;
  for (const payment of payments || []) {
    const amount = Number(payment.amount) || 0;
    const status = String(payment.status || '').trim().toLowerCase();
    if (status === 'completed') total += amount;
    else if (status === 'refunded') total -= amount;
  }
  return Math.max(0, Math.round(total * 100) / 100);
}

export function amountStillDue(input: {
  paymentModel: PaymentModel;
  totalPayable: number;
  stageDeposits: number[];
  received: number;
}): number {
  const received = Math.max(0, Number(input.received) || 0);
  const invoice = Math.max(0, Number(input.totalPayable) || 0);
  if (input.paymentModel === 'pay_in_full') {
    return Math.max(0, Math.round((invoice - received) * 100) / 100);
  }
  let covered = received;
  const deposits = (input.stageDeposits || []).map((value) => Number(value) || 0).filter((value) => value > 0);
  if (!deposits.length) return Math.max(0, Math.round((invoice - received) * 100) / 100);
  for (const deposit of deposits) {
    if (covered + 0.5 < deposit) return Math.max(0, Math.round((deposit - covered) * 100) / 100);
    covered -= deposit;
  }
  return 0;
}

export function canOpenProject(input: {
  paymentModel: PaymentModel | null;
  totalPayable: number;
  stageDeposits: number[];
  received: number;
}): boolean {
  if (input.paymentModel === 'pay_in_full') {
    return input.totalPayable > 0 && input.received + 0.5 >= input.totalPayable;
  }
  if (input.paymentModel === 'pay_by_stage') {
    const first = (input.stageDeposits || []).map((value) => Number(value) || 0).find((value) => value > 0) || 0;
    const due = first > 0 ? first : Number(input.totalPayable) || 0;
    return due > 0 && input.received + 0.5 >= due;
  }
  return false;
}

export function completePaymentTarget(input: {
  paymentModel: PaymentModel;
  totalPayable: number;
  stageDeposits: number[];
  stageStatuses?: Array<string | null | undefined> | null;
}): number {
  const invoice = Math.max(0, Math.round((Number(input.totalPayable) || 0) * 100) / 100);
  if (input.paymentModel === 'pay_in_full') return invoice;
  const deposits = (input.stageDeposits || []).map((value) => Math.max(0, Number(value) || 0));
  const statuses = input.stageStatuses || [];
  let lastCommenced = -1;
  for (let index = 0; index < Math.max(deposits.length, statuses.length); index += 1) {
    const status = String(statuses[index] || '').trim().toLowerCase();
    if (status && status !== 'not_started') lastCommenced = index;
  }
  if (lastCommenced < 0) {
    const first = deposits.find((value) => value > 0) || invoice;
    return Math.round(first * 100) / 100;
  }
  const covered = deposits.slice(0, lastCommenced + 1).reduce((sum, value) => sum + value, 0);
  return Math.round((covered > 0 ? covered : invoice) * 100) / 100;
}

export function canStartStage(input: {
  paymentModel: PaymentModel | null;
  stageIndex: number;
  totalPayable: number;
  stageDeposits: number[];
  received: number;
}): boolean {
  if (!isPaymentModel(input.paymentModel)) return true;
  if (input.paymentModel === 'pay_in_full') {
    return input.totalPayable > 0 && input.received + 0.5 >= input.totalPayable;
  }
  const need = (input.stageDeposits || [])
    .slice(0, Math.max(0, input.stageIndex) + 1)
    .reduce((sum, value) => sum + (Number(value) || 0), 0);
  return need > 0 && input.received + 0.5 >= need;
}
