import { cleanEvidence } from './stage-evidence';

export type CataloguePhase = {
  name?: string;
  description?: string;
  estimatedDuration?: string;
  estimatedCost?: number;
};

export type PaymentModelChoice = 'pay_in_full' | 'pay_by_stage';

export type QuoteStageDraft = {
  name: string;
  doneWhen: string;
  amount: number;
  duration: string;
  deposit?: number;
  evidence?: string[];
};

export type QuoteScopeDraft = {
  signedTotal: number;
  lumpSum: boolean;
  fileReadable: boolean;
  paymentModel: PaymentModelChoice;
  notice: string;
  stages: QuoteStageDraft[];
  contractorAmount: number;
  monitoringFee: number;
  coordinationFee: number;
  contingencyFee: number;
  totalPayable: number;
};

export type StageSuggestion = {
  lumpSum: boolean;
  stages: Array<{ name?: string; doneWhen?: string; weight?: number; evidence?: string[] }>;
};

const MONITORING_RATE = 0.05;
const COORDINATION_RATE = 0.05;
const CONTINGENCY_RATE = 0.2;
const GENERATED_MAX_SHARE = 0.6;
const SUBMIT_MAX_SHARE = 0.75;

function paymentSentence(model: PaymentModelChoice, audience: 'contractor' | 'homeowner'): string {
  if (model === 'pay_in_full') {
    return audience === 'homeowner'
      ? 'You pay the full invoice before work starts.'
      : 'The homeowner pays the full invoice before work starts, so materials for later stages can be bought once that payment is confirmed.';
  }
  return audience === 'homeowner'
    ? 'You pay each stage before that stage starts.'
    : 'The homeowner pays for a stage before that stage starts, and each stage ends when there is something they can see.';
}

export function homeownerScopeNotice(model: PaymentModelChoice): string {
  return `Based on BuildMyHouse's policies and systems, this is the project's new scope after inspection. ${paymentSentence(model, 'homeowner')}`;
}

function contractorNotice(model: PaymentModelChoice, lumpSum: boolean): string {
  if (!lumpSum) {
    return `Based on BuildMyHouse's policies and systems, this is the project's new scope after inspection. Check each stage. ${paymentSentence(model, 'contractor')}`;
  }
  return `Your quote is not staged. Based on the lump sum and project details, BuildMyHouse formatted it like this so the homeowner can track it. ${paymentSentence(model, 'contractor')}`;
}
const UNREADABLE_NOTE =
  ' The file could not be read, so this uses the signed total and the plan the homeowner selected.';

function toKobo(value: number): number {
  return Math.round(Number(value) * 100);
}

function fromKobo(value: number): number {
  return Math.round(value) / 100;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function cleanText(value: unknown, fallback: string): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function capShares(weights: number[], maxShare: number): number[] {
  const safe = weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 0));
  const total = sum(safe);
  if (total <= 0) return weights.map(() => 1 / Math.max(weights.length, 1));
  let shares = safe.map((weight) => weight / total);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const excess = sum(shares.map((share) => Math.max(0, share - maxShare)));
    if (excess <= 0.0001) break;
    const room = shares.map((share) => Math.max(0, maxShare - share));
    const roomTotal = sum(room);
    if (roomTotal <= 0) break;
    shares = shares.map((share, index) => Math.min(maxShare, share) + excess * (room[index] / roomTotal));
  }
  return shares;
}

function allocate(totalKobo: number, weights: number[], maxShare: number): number[] {
  const shares = capShares(weights, maxShare);
  const amounts = shares.map((share) => Math.max(1, Math.round(totalKobo * share)));
  const drift = totalKobo - sum(amounts);
  amounts[amounts.length - 1] += drift;
  if (amounts[amounts.length - 1] < 1) {
    const even = Math.floor(totalKobo / amounts.length);
    const next = amounts.map(() => even);
    next[next.length - 1] += totalKobo - sum(next);
    return next;
  }
  return amounts;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '');
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function parsePricedLines(quoteText?: string): Array<{ name: string; amount: number }> {
  const lines = String(quoteText || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const priced: Array<{ name: string; amount: number }> = [];
  for (const line of lines) {
    const currency = line.match(/(?:₦|NGN|N)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
    const trailing = line.match(/(?:^|\s)([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})(?:\.\d{1,2})?\s*$/);
    const amount = parseAmount(currency?.[1] || trailing?.[1] || '');
    if (!amount) continue;
    const name = line
      .replace(currency?.[0] || trailing?.[0] || '', '')
      .replace(/^[\d.)\-\s]+/, '')
      .replace(/[-:–|]+$/g, '')
      .trim();
    if (name.length < 3) continue;
    priced.push({ name, amount });
  }
  return priced;
}

export function stageDepositAmounts(stageAmounts: number[], contractorAmount: number, totalPayable: number): number[] {
  const prices = stageAmounts.map((amount) => toKobo(amount));
  if (!prices.length) return [];
  const contractorKobo = toKobo(contractorAmount);
  const invoiceKobo = toKobo(totalPayable);
  const fees = invoiceKobo - contractorKobo;
  if (fees === 0 || contractorKobo <= 0) {
    const next = [...prices];
    next[next.length - 1] += invoiceKobo - sum(next);
    return next.map(fromKobo);
  }
  const shares = prices.map((amount) => Math.round((fees * amount) / contractorKobo));
  shares[shares.length - 1] += fees - sum(shares);
  return prices.map((amount, index) => fromKobo(amount + shares[index]));
}

export function feesOnContractorAmount(amount: number) {
  return feesFor(toKobo(amount));
}

export function depositForIncrease(increase: number): number {
  const amount = Number(increase);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return feesFor(toKobo(amount)).totalPayable;
}

function catalogueStages(phases: CataloguePhase[] | undefined, total: number, model: PaymentModelChoice): QuoteStageDraft[] {
  const usable = (phases || [])
    .map((phase) => ({
      name: cleanText(phase?.name, ''),
      doneWhen: cleanText(phase?.description, ''),
      duration: cleanText(phase?.estimatedDuration, 'As agreed'),
      weight: Number(phase?.estimatedCost) > 0 ? Number(phase.estimatedCost) : 1,
    }))
    .filter((phase) => phase.name);
  if (usable.length >= 2) {
    const maxShare = model === 'pay_in_full' ? 1 : GENERATED_MAX_SHARE;
    const amounts = allocate(toKobo(total), usable.map((phase) => phase.weight), maxShare);
    return usable.map((phase, index) => ({
      name: phase.name,
      doneWhen: phase.doneWhen || `This stage is done when ${phase.name.toLowerCase()} is finished and photographed.`,
      amount: fromKobo(amounts[index]),
      duration: phase.duration,
      evidence: cleanEvidence((phase as { evidence?: string[] }).evidence),
    }));
  }
  const workName = usable[0]?.name || 'Main work';
  if (model === 'pay_by_stage') {
    const amounts = allocate(toKobo(total), [0.7, 0.3], GENERATED_MAX_SHARE);
    return [
      {
        name: workName,
        doneWhen: usable[0]?.doneWhen || `This stage is done when ${workName.toLowerCase()} is in place and the homeowner can see it.`,
        amount: fromKobo(amounts[0]),
        duration: usable[0]?.duration || 'As agreed',
      },
      {
        name: 'Testing and handover',
        doneWhen: 'The homeowner has seen the finished work.',
        amount: fromKobo(amounts[1]),
        duration: 'As agreed',
      },
    ];
  }
  const amounts = allocate(toKobo(total), [0.4, 0.4, 0.2], GENERATED_MAX_SHARE);
  return [
    {
      name: 'Materials and mobilisation',
      doneWhen: 'The agreed materials for later work are bought and on site.',
      amount: fromKobo(amounts[0]),
      duration: 'As agreed',
    },
    {
      name: workName,
      doneWhen: usable[0]?.doneWhen || `This stage is done when ${workName.toLowerCase()} is finished and photographed.`,
      amount: fromKobo(amounts[1]),
      duration: usable[0]?.duration || 'As agreed',
    },
    {
      name: 'Testing and handover',
      doneWhen: 'The homeowner has seen the finished work.',
      amount: fromKobo(amounts[2]),
      duration: 'As agreed',
    },
  ];
}

function feesFor(totalKobo: number) {
  const monitoring = Math.round(totalKobo * MONITORING_RATE);
  const coordination = Math.round(totalKobo * COORDINATION_RATE);
  const contingency = Math.round(totalKobo * CONTINGENCY_RATE);
  return {
    contractorAmount: fromKobo(totalKobo),
    monitoringFee: fromKobo(monitoring),
    coordinationFee: fromKobo(coordination),
    contingencyFee: fromKobo(contingency),
    totalPayable: fromKobo(totalKobo + monitoring + coordination + contingency),
  };
}

export function buildInspectionScope(input: {
  signedTotal: number;
  quoteText?: string;
  cataloguePhases?: CataloguePhase[];
  suggestion?: StageSuggestion | null;
  fileReadable?: boolean;
  paymentModel?: PaymentModelChoice | null;
}): QuoteScopeDraft {
  const signedTotal = Number(input.signedTotal);
  if (!Number.isFinite(signedTotal) || signedTotal <= 0) {
    throw new Error('Signed quote total is required');
  }
  if (input.paymentModel !== 'pay_in_full' && input.paymentModel !== 'pay_by_stage') {
    throw new Error('Choose pay in full or pay stage by stage before the stages are published.');
  }
  const paymentModel = input.paymentModel;
  const fileReadable = input.fileReadable !== false;
  const priced = parsePricedLines(input.quoteText);
  const pricedKobo = priced.map((line) => toKobo(line.amount));
  const pricedSum = sum(pricedKobo);
  const target = toKobo(signedTotal);
  const pricedMatches = priced.length >= 2 && Math.abs(pricedSum - target) <= Math.max(100, Math.round(target * 0.05));
  let lumpSum = true;
  let stages: QuoteStageDraft[];

  if (pricedMatches) {
    lumpSum = false;
    const amounts = allocate(target, pricedKobo, 1);
    stages = priced.map((line, index) => ({
      name: line.name,
      doneWhen: `This stage is done when ${line.name.toLowerCase()} is finished and photographed.`,
      amount: fromKobo(amounts[index]),
      duration: 'As agreed',
      evidence: [],
    }));
  } else if (input.suggestion && input.suggestion.stages.length >= 2) {
    lumpSum = input.suggestion.lumpSum !== false;
    const suggested = input.suggestion.stages
      .map((stage) => ({
        name: cleanText(stage.name, ''),
        doneWhen: cleanText(stage.doneWhen, ''),
        weight: Number(stage.weight) > 0 ? Number(stage.weight) : 1,
        evidence: cleanEvidence(stage.evidence),
      }))
      .filter((stage) => stage.name)
      .slice(0, 8);
    if (suggested.length >= 2) {
      const maxShare = paymentModel === 'pay_in_full' ? 1 : GENERATED_MAX_SHARE;
      const amounts = allocate(target, suggested.map((stage) => stage.weight), maxShare);
      stages = suggested.map((stage, index) => ({
        name: stage.name,
        doneWhen: stage.doneWhen || `This stage is done when ${stage.name.toLowerCase()} is finished and photographed.`,
        amount: fromKobo(amounts[index]),
        duration: 'As agreed',
        evidence: stage.evidence,
      }));
      lumpSum = input.suggestion.lumpSum !== false;
    } else {
      stages = catalogueStages(input.cataloguePhases, signedTotal, paymentModel);
    }
  } else {
    stages = catalogueStages(input.cataloguePhases, signedTotal, paymentModel);
  }

  const fees = feesFor(target);
  const deposits = stageDepositAmounts(
    stages.map((stage) => stage.amount),
    fees.contractorAmount,
    fees.totalPayable,
  );
  stages = stages.map((stage, index) => ({ ...stage, deposit: deposits[index] }));
  const notice = `${contractorNotice(paymentModel, lumpSum)}${fileReadable ? '' : UNREADABLE_NOTE}`;
  return {
    signedTotal: fromKobo(target),
    lumpSum,
    fileReadable,
    paymentModel,
    notice,
    stages,
    ...fees,
  };
}

export function normalizeSubmittedStages(
  signedTotal: number,
  stages: QuoteStageDraft[],
  paymentModel?: PaymentModelChoice | null,
): QuoteStageDraft[] {
  const target = toKobo(signedTotal);
  if (!Number.isFinite(signedTotal) || target <= 0) {
    throw new Error('Enter the signed quote total.');
  }
  if (!Array.isArray(stages) || stages.length < 2) {
    throw new Error('Add at least two stages so the homeowner can track the work.');
  }
  const normalized = stages.map((stage, index) => ({
    name: cleanText(stage?.name, ''),
    doneWhen: cleanText(stage?.doneWhen, ''),
    amount: fromKobo(toKobo(Number(stage?.amount))),
    duration: cleanText(stage?.duration, 'As agreed'),
    evidence: cleanEvidence(stage?.evidence),
    index,
  }));
  if (normalized.some((stage) => !stage.name || !stage.doneWhen || !(stage.amount > 0))) {
    throw new Error('Every stage needs a name, an amount, and what “done” means.');
  }
  const total = sum(normalized.map((stage) => toKobo(stage.amount)));
  if (Math.abs(total - target) > 100) {
    throw new Error('The stages must add up to the signed quote.');
  }
  if (total !== target) {
    const last = normalized[normalized.length - 1];
    last.amount = fromKobo(toKobo(last.amount) + (target - total));
  }
  if (paymentModel !== 'pay_in_full') {
    const tooLarge = normalized.find((stage) => toKobo(stage.amount) > Math.round(target * SUBMIT_MAX_SHARE));
    if (tooLarge) {
      throw new Error(`“${tooLarge.name}” is more than 75% of the quote. Split it so each stage ends when the homeowner can see the work.`);
    }
  }
  return normalized.map(({ name, doneWhen, amount, duration, evidence }) => ({ name, doneWhen, amount, duration, evidence }));
}
