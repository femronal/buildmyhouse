import {
  currencyByCode,
  milestoneCalculatorConfig,
  projectById,
  type CurrencyCode,
  type ProjectTypeId,
  type StageTemplate,
} from '@/lib/milestoneCalculator.config';

export type StageDraft = {
  id: string;
  key: string;
  name: string;
  pct: number;
  touched: boolean;
  proof: string[];
  note: string;
};

const { min: MIN_PCT, max: MAX_PCT } = milestoneCalculatorConfig.stagePercent;
const { min: MIN_STAGES, max: MAX_STAGES } = milestoneCalculatorConfig.stageCount;

export function sumPct(stages: { pct: number }[]) {
  return stages.reduce((sum, stage) => sum + stage.pct, 0);
}

export function planStatus(stages: { pct: number }[]) {
  const total = sumPct(stages);
  const outOfRange = stages.some((stage) => stage.pct < MIN_PCT || stage.pct > MAX_PCT);
  return { total, outOfRange, ok: total === 100 && !outOfRange };
}

export function formatMoney(amount: number, symbol: string) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${symbol}${formatted}`;
}

export function shortAmount(amount: number, symbol: string) {
  if (amount >= 1_000_000 && amount % 1_000_000 === 0) return `${symbol}${amount / 1_000_000}m`;
  if (amount >= 1_000 && amount % 1_000 === 0) return `${symbol}${amount / 1_000}k`;
  return formatMoney(amount, symbol);
}

export function pdfMoney(amount: number, code: CurrencyCode, symbol: string) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount));
  if (code === 'NGN') return `NGN ${formatted}`;
  return `${symbol}${formatted}`;
}

export function stageFromTemplate(template: StageTemplate, index: number, typeId: ProjectTypeId): StageDraft {
  return {
    id: `${typeId}-${index}-${template.key}`,
    key: template.key,
    name: template.name,
    pct: template.pct,
    touched: false,
    proof: [...template.proof],
    note: '',
  };
}

export function buildDefaultStages(typeId: ProjectTypeId): StageDraft[] {
  return projectById(typeId).stages.map((template, index) => stageFromTemplate(template, index, typeId));
}

export function computePlan(total: number, contingencyPct: number, pcts: number[]) {
  const keptAside = Math.round((total * contingencyPct) / 100);
  const forStages = total - keptAside;
  const amounts: number[] = [];
  let used = 0;
  pcts.forEach((pct, index) => {
    if (index === pcts.length - 1) {
      amounts.push(forStages - used);
      return;
    }
    const amount = Math.round((forStages * pct) / 100);
    amounts.push(amount);
    used += amount;
  });
  const paidSoFar: number[] = [];
  const stillInControl: number[] = [];
  let running = 0;
  amounts.forEach((amount) => {
    running += amount;
    paidSoFar.push(running);
    stillInControl.push(total - running);
  });
  return { keptAside, forStages, amounts, paidSoFar, stillInControl };
}

export function nudge(stages: StageDraft[], index: number, delta: 1 | -1) {
  const current = stages[index];
  if (!current) return stages;
  const nextPct = current.pct + delta;
  if (nextPct < MIN_PCT || nextPct > MAX_PCT) return stages;
  const next = stages.map((stage) => ({ ...stage }));
  next[index] = { ...next[index], pct: nextPct, touched: true };
  const absorb = -delta;
  for (let cursor = next.length - 1; cursor >= 0; cursor -= 1) {
    if (cursor === index || next[cursor].touched) continue;
    const candidate = next[cursor].pct + absorb;
    if (candidate >= MIN_PCT && candidate <= MAX_PCT) {
      next[cursor] = { ...next[cursor], pct: candidate };
      return next;
    }
  }
  return next;
}

function distribute(total: number, weights: number[], min: number, max: number) {
  const count = weights.length;
  const remaining = total - min * count;
  const room = max - min;
  const weightSum = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  const exact = weights.map((weight) =>
    weightSum > 0 ? (remaining * Math.max(0, weight)) / weightSum : remaining / count,
  );
  const extra = exact.map((value) => Math.min(room, Math.max(0, Math.floor(value))));
  let leftover = remaining - extra.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value), weight: weights[index] }))
    .sort((a, b) => b.frac - a.frac || b.weight - a.weight || a.index - b.index);
  for (const item of order) {
    if (leftover <= 0) break;
    if (extra[item.index] < room) {
      extra[item.index] += 1;
      leftover -= 1;
    }
  }
  if (leftover !== 0) {
    const bySize = weights
      .map((weight, index) => ({ index, weight }))
      .sort((a, b) => b.weight - a.weight || a.index - b.index);
    for (const item of bySize) {
      while (leftover > 0 && extra[item.index] < room) {
        extra[item.index] += 1;
        leftover -= 1;
      }
      while (leftover < 0 && extra[item.index] > 0) {
        extra[item.index] -= 1;
        leftover += 1;
      }
    }
  }
  return extra.map((value) => min + value);
}

export function fixIt(stages: StageDraft[], lastChangedIndex: number) {
  if (stages.length === 0) return stages;
  const clamped = stages.map((stage) => ({
    ...stage,
    pct: Math.min(MAX_PCT, Math.max(MIN_PCT, Math.round(stage.pct))),
  }));
  const lock = Math.min(Math.max(0, lastChangedIndex), clamped.length - 1);
  const others = clamped.map((_, index) => index).filter((index) => index !== lock);
  const lockedPct = clamped[lock].pct;
  const distributed = distribute(
    100 - lockedPct,
    others.map((index) => clamped[index].pct),
    MIN_PCT,
    MAX_PCT,
  );
  const next = clamped.map((stage) => ({ ...stage }));
  others.forEach((index, offset) => {
    next[index] = { ...next[index], pct: distributed[offset] };
  });
  return next;
}

export function splitEvenly(stages: StageDraft[]) {
  const count = stages.length;
  if (count === 0) return stages;
  const base = Math.floor(100 / count);
  const extra = 100 - base * count;
  return stages.map((stage, index) => ({ ...stage, pct: base + (index < extra ? 1 : 0) }));
}

export function addStage(stages: StageDraft[], name: string, proof: string[]) {
  if (stages.length >= MAX_STAGES) return stages;
  const next = stages.map((stage) => ({ ...stage }));
  const lastIndex = next.length - 1;
  const last = next[lastIndex];
  let donor = lastIndex;
  let give = Math.floor(last.pct / 2);
  let keep = last.pct - give;
  if (give < MIN_PCT) {
    donor = next.reduce((best, stage, index) => (stage.pct > next[best].pct ? index : best), 0);
    if (next[donor].pct < MIN_PCT + 1) return stages;
    give = 1;
    keep = next[donor].pct - 1;
  }
  next[donor] = { ...next[donor], pct: donor === lastIndex ? keep : next[donor].pct - give };
  next.push({
    id: `custom-${next.length}-${give}`,
    key: 'custom',
    name,
    pct: give,
    touched: false,
    proof: [...proof],
    note: '',
  });
  return next;
}

export function removeStage(stages: StageDraft[], index: number) {
  if (stages.length <= MIN_STAGES || index < 0 || index >= stages.length) return stages;
  const removed = stages[index];
  const next = stages.filter((_, cursor) => cursor !== index).map((stage) => ({ ...stage }));
  const receiver = index === 0 ? 0 : index - 1;
  next[receiver] = { ...next[receiver], pct: next[receiver].pct + removed.pct };
  return next;
}

export function stagesWereEdited(typeId: ProjectTypeId, stages: StageDraft[]) {
  const defaults = buildDefaultStages(typeId);
  if (defaults.length !== stages.length) return true;
  return stages.some((stage, index) => stage.touched || stage.pct !== defaults[index].pct || stage.name !== defaults[index].name);
}

export function firstIncompleteStep(input: {
  projectType: ProjectTypeId | null;
  currency: CurrencyCode | null;
  budget: number;
  stages: StageDraft[];
}) {
  if (!input.projectType) return 1;
  if (!input.currency) return 2;
  const minimum = input.currency ? currencyByCode(input.currency).minBudget : milestoneCalculatorConfig.currencies[0].minBudget;
  if (input.budget < minimum) return 3;
  if (!planStatus(input.stages).ok) return 5;
  return 7;
}

export function buildShareText(input: {
  projectLabel: string;
  symbol: string;
  budget: number;
  contingencyPct: number;
  stages: { name: string; pct: number }[];
  url: string;
}) {
  const plan = computePlan(
    input.budget,
    input.contingencyPct,
    input.stages.map((stage) => stage.pct),
  );
  const header = [
    'My payment plan (BuildMyHouse)',
    `${input.projectLabel} · ${formatMoney(input.budget, input.symbol)} · ${input.contingencyPct}% kept aside (${formatMoney(plan.keptAside, input.symbol)})`,
  ];
  const stageLines = input.stages.map(
    (stage, index) => `${index + 1}. ${stage.name} – ${formatMoney(plan.amounts[index] ?? 0, input.symbol)} (${stage.pct}%)`,
  );
  const footer = ['', `Make your own: ${input.url}`];
  const join = (lines: string[]) => [...header, ...lines, ...footer].join('\n');
  let text = join(stageLines);
  if (text.length <= milestoneCalculatorConfig.shareTextMax) return text;
  const kept: string[] = [];
  for (const line of stageLines) {
    const candidate = join([...kept, line]);
    if (candidate.length > milestoneCalculatorConfig.shareTextMax - 2) break;
    kept.push(line);
  }
  return join([...kept, '…']);
}

export type SavedDraft = {
  version: 2;
  step: number;
  projectType: ProjectTypeId | null;
  currency: CurrencyCode | null;
  budget: number;
  contingency: number;
  stages: StageDraft[];
  updatedAt: number;
};

const PROJECT_IDS = new Set(milestoneCalculatorConfig.projectTypes.map((item) => item.id));
const CURRENCY_IDS = new Set(milestoneCalculatorConfig.currencies.map((item) => item.code));
const PROOF_KEYS = new Set(milestoneCalculatorConfig.proofOptions.map((item) => item.key));

export function parseDraft(value: unknown): SavedDraft | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<SavedDraft>;
  if (raw.version !== 2) return null;
  if (raw.projectType != null && !PROJECT_IDS.has(raw.projectType)) return null;
  if (raw.currency != null && !CURRENCY_IDS.has(raw.currency)) return null;
  if (typeof raw.budget !== 'number' || raw.budget < 0) return null;
  if (typeof raw.contingency !== 'number' || raw.contingency < 0 || raw.contingency > 30) return null;
  if (!Array.isArray(raw.stages) || raw.stages.length < 3) return null;
  const stages: StageDraft[] = [];
  for (const stage of raw.stages) {
    if (!stage || typeof stage !== 'object') return null;
    const row = stage as StageDraft;
    if (typeof row.name !== 'string' || typeof row.pct !== 'number') return null;
    if (!Array.isArray(row.proof) || row.proof.some((item) => !PROOF_KEYS.has(item))) return null;
    stages.push({
      id: String(row.id || row.key || row.name),
      key: String(row.key || 'custom'),
      name: row.name.slice(0, milestoneCalculatorConfig.nameMax),
      pct: row.pct,
      touched: Boolean(row.touched),
      proof: row.proof,
      note: String(row.note || '').slice(0, milestoneCalculatorConfig.noteMax),
    });
  }
  const step = Number(raw.step);
  return {
    version: 2,
    step: step >= 1 && step <= 7 ? step : 1,
    projectType: raw.projectType ?? null,
    currency: raw.currency ?? null,
    budget: Math.round(raw.budget),
    contingency: raw.contingency,
    stages,
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

export function draftFromLegacy(value: unknown): Pick<SavedDraft, 'projectType' | 'currency' | 'budget' | 'contingency'> | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {
    projectType?: string;
    currency?: string;
    totalBudget?: string;
    contingencyPercentage?: string;
  };
  const project = milestoneCalculatorConfig.projectTypes.find((item) => item.legacyLabel === raw.projectType);
  const currency = milestoneCalculatorConfig.currencies.find((item) => item.code === raw.currency);
  if (!project && !currency && !raw.totalBudget) return null;
  const budget = Math.round(Number(String(raw.totalBudget || '').replace(/[^\d]/g, '')) || 0);
  const contingency = Math.min(30, Math.max(0, Math.round(Number(raw.contingencyPercentage) || 10)));
  return {
    projectType: project?.id ?? null,
    currency: currency?.code ?? null,
    budget,
    contingency,
  };
}

export function stageTip(name: string, projectType: ProjectTypeId) {
  const normalized = name.toLowerCase();
  if (normalized.includes('foundation') || normalized.includes('site preparation')) {
    return 'Do not release this payment until digging, concrete work, and site photos are confirmed.';
  }
  if (normalized.includes('structural') || normalized.includes('framing') || normalized.includes('repairs')) {
    return 'Confirm blockwork level and structural progress before paying the next stage.';
  }
  if (
    normalized.includes('mep') ||
    normalized.includes('rough-in') ||
    normalized.includes('systems') ||
    normalized.includes('electrical') ||
    normalized.includes('plumbing') ||
    normalized.includes('wiring')
  ) {
    return 'Make sure wiring or plumbing progress is explained clearly before approving payment.';
  }
  if (normalized.includes('finishes') || normalized.includes('interior') || normalized.includes('fittings') || normalized.includes('styling')) {
    return 'Confirm visible finishing quality and item delivery before releasing this payment.';
  }
  if (projectType === 'interior') {
    return 'Confirm what has been procured, delivered, and installed before you release this payment.';
  }
  if (projectType === 'renovation') {
    return 'Confirm old defects are corrected and fresh work is visible before releasing this payment.';
  }
  return 'Only release this payment after clear site proof and stage completion have been confirmed.';
}
