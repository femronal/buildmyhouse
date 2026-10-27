import { amountStillDue, canStartStage, isPaymentModel, type PaymentModel } from './payment-model';

export type StageStartRow = {
  id: string;
  name?: string | null;
  status?: string | null;
  order?: number | null;
};

export type StageStartRequest = {
  requestedAt?: string | null;
  homeownerReadyAt?: string | null;
  fundedNotifiedAt?: string | null;
};

export type StageStartView = {
  stageId: string;
  stageName: string;
  stageIndex: number;
  amountDue: number;
  funded: boolean;
  requestedAt: string | null;
  homeownerReadyAt: string | null;
};

export function readStageStartRequests(aiAnalysis: unknown): Record<string, StageStartRequest> {
  const raw = aiAnalysis && typeof aiAnalysis === 'object'
    ? (aiAnalysis as { stageStartRequests?: unknown }).stageStartRequests
    : null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const requests: Record<string, StageStartRequest> = {};
  for (const [stageId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const row = value as StageStartRequest;
    requests[stageId] = {
      requestedAt: row.requestedAt || null,
      homeownerReadyAt: row.homeownerReadyAt || null,
      fundedNotifiedAt: row.fundedNotifiedAt || null,
    };
  }
  return requests;
}

export function withStageStartRequest(
  aiAnalysis: unknown,
  stageId: string,
  patch: StageStartRequest,
): Record<string, unknown> {
  const base = aiAnalysis && typeof aiAnalysis === 'object' ? { ...(aiAnalysis as Record<string, unknown>) } : {};
  const requests = readStageStartRequests(base);
  const current = requests[stageId] || {};
  return {
    ...base,
    stageStartRequests: {
      ...requests,
      [stageId]: {
        requestedAt: patch.requestedAt ?? current.requestedAt ?? null,
        homeownerReadyAt: patch.homeownerReadyAt ?? current.homeownerReadyAt ?? null,
        fundedNotifiedAt: patch.fundedNotifiedAt ?? current.fundedNotifiedAt ?? null,
      },
    },
  };
}

export function nextStageToStart(stages: StageStartRow[]) {
  const rows = [...stages].sort((left, right) => Number(left.order || 0) - Number(right.order || 0));
  const blocked = rows.some((stage) => {
    const status = String(stage.status || '').trim().toLowerCase();
    return status === 'in_progress' || status === 'pending_homeowner_approval';
  });
  if (blocked) return null;
  const index = rows.findIndex((stage) => String(stage.status || '').trim().toLowerCase() === 'not_started');
  if (index < 0) return null;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (String(rows[cursor].status || '').trim().toLowerCase() !== 'completed') return null;
  }
  return { stage: rows[index], index };
}

export function buildStageStart(input: {
  paymentModel?: string | null;
  stages: StageStartRow[];
  deposits: number[];
  totalPayable: number;
  received: number;
  requests?: Record<string, StageStartRequest> | null;
}): StageStartView | null {
  const next = nextStageToStart(input.stages);
  if (!next) return null;
  const model: PaymentModel | null = isPaymentModel(input.paymentModel) ? input.paymentModel : null;
  const deposits = (input.deposits || []).map((value) => Number(value) || 0);
  const funded = model
    ? canStartStage({
      paymentModel: model,
      stageIndex: next.index,
      totalPayable: input.totalPayable,
      stageDeposits: deposits,
      received: input.received,
    })
    : true;
  const still = model
    ? amountStillDue({
      paymentModel: model,
      totalPayable: input.totalPayable,
      stageDeposits: deposits,
      received: input.received,
    })
    : 0;
  const ownDeposit = deposits[next.index] || 0;
  const request = input.requests?.[next.stage.id] || {};
  return {
    stageId: next.stage.id,
    stageName: String(next.stage.name || 'This stage'),
    stageIndex: next.index,
    amountDue: Math.round(((still > 0 ? still : ownDeposit) || 0) * 100) / 100,
    funded,
    requestedAt: request.requestedAt || null,
    homeownerReadyAt: request.homeownerReadyAt || null,
  };
}

export function formatStageNaira(amount: number) {
  return `₦${Math.round(Math.max(0, Number(amount) || 0)).toLocaleString('en-US')}`;
}
