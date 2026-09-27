import { renovationBudgetPlannerPageContent as pageContent } from '@/lib/renovation-budget-planner-content';
import {
  isFinish,
  isLocation,
  isPropertyType,
  isSize,
  isSpace,
  isWorkType,
  renovationBudgetConfig as config,
  type FinishId,
  type LocationId,
  type PropertyTypeId,
  type SizeId,
  type SpaceId,
  type WorkTypeId,
} from '@/lib/renovationBudget.config';

export type SpaceChoice = { space: SpaceId; workType: WorkTypeId };

export type BudgetRow = SpaceChoice & { estimate: number };

export type BudgetResult = {
  rows: BudgetRow[];
  subtotal: number;
  contingencyAmount: number;
  total: number;
};

export type SavedDraft = {
  version: 2;
  step: number;
  propertyType: PropertyTypeId | null;
  location: LocationId | null;
  sizeBand: SizeId | null;
  finishLevel: FinishId | null;
  contingency: number;
  spaces: SpaceChoice[];
  updatedAt: string;
};

export function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function pdfNaira(value: number) {
  const formatted = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(Math.round(value));
  return `NGN ${formatted}`;
}

export function estimateSpace(space: SpaceId, location: LocationId, sizeBand: SizeId, finishLevel: FinishId, workType: WorkTypeId) {
  const raw =
    config.costs[space] *
    config.locationMultiplier[location] *
    config.sizeMultiplier[sizeBand] *
    config.finishMultiplier[finishLevel] *
    config.workMultiplier[workType];
  return Math.round(raw);
}

export function computeBudget(
  location: LocationId,
  sizeBand: SizeId,
  finishLevel: FinishId,
  contingency: number,
  spaces: SpaceChoice[],
): BudgetResult {
  const rows = spaces.map((choice) => ({
    ...choice,
    estimate: estimateSpace(choice.space, location, sizeBand, finishLevel, choice.workType),
  }));
  const subtotal = rows.reduce((sum, row) => sum + row.estimate, 0);
  const pct = Math.max(0, Math.min(config.contingency.otherMax, contingency));
  const contingencyAmount = Math.round((subtotal * pct) / 100);
  return { rows, subtotal, contingencyAmount, total: subtotal + contingencyAmount };
}

export function highCostAreas(rows: BudgetRow[]) {
  const guidanceSet = new Set(
    pageContent.suggestedGuidance.items.map((item) => item.toLowerCase().replace(/\s+and\s+/g, '/').replace(/\s+/g, '')),
  );
  const subtotal = rows.reduce((sum, row) => sum + row.estimate, 0);
  const matched = rows.filter((row) => {
    const normalizedSpace = row.space.toLowerCase().replace(/\s+/g, '');
    const inGuidance = Array.from(guidanceSet).some((item) => {
      const short = item.replace(/[^a-z/]/g, '');
      return normalizedSpace.includes(short.split('/')[0] || short);
    });
    const expensiveByShare = subtotal > 0 ? row.estimate / subtotal >= 0.2 : false;
    return inGuidance || expensiveByShare;
  });
  if (matched.length > 0) return matched;
  return [...rows].sort((a, b) => b.estimate - a.estimate).slice(0, 2);
}

export function buildShareText(input: {
  propertyType: PropertyTypeId;
  location: LocationId;
  sizeBand: SizeId;
  finishLevel: FinishId;
  result: BudgetResult;
  contingency: number;
}) {
  const lines = [
    'My renovation budget (BuildMyHouse)',
    `${input.propertyType} in ${input.location} · ${input.sizeBand} · ${input.finishLevel}`,
    ...input.result.rows.map((row) => `${row.space} (${row.workType}) – ${pdfNaira(row.estimate)}`),
    `Kept aside ${input.contingency}% (${pdfNaira(input.result.contingencyAmount)})`,
    `Total: ${pdfNaira(input.result.total)}`,
    '',
    `Make your own: ${config.toolUrl}`,
  ];
  let text = lines.join('\n');
  if (text.length <= 1500) return text;
  const kept = lines.slice(-3);
  const head = [lines[0], lines[1]];
  const roomLines = lines.slice(2, -3);
  while (roomLines.length && [...head, ...roomLines, '…', ...kept].join('\n').length > 1500) roomLines.pop();
  text = [...head, ...roomLines, '…', ...kept].join('\n');
  return text.slice(0, 1500);
}

export function firstIncompleteStep(draft: Pick<SavedDraft, 'propertyType' | 'location' | 'sizeBand' | 'finishLevel' | 'spaces'>) {
  if (!draft.propertyType) return 1;
  if (!draft.location) return 2;
  if (!draft.sizeBand) return 3;
  if (!draft.finishLevel) return 4;
  if (!draft.spaces.length) return 5;
  if (draft.spaces.some((space) => !space.workType)) return 6;
  return 8;
}

function clampContingency(value: number) {
  if (!Number.isFinite(value)) return config.contingency.default;
  return Math.max(0, Math.min(config.contingency.otherMax, Math.round(value)));
}

export function parseDraft(value: unknown): SavedDraft | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<SavedDraft>;
  if (raw.version !== 2) return null;
  const spaces = Array.isArray(raw.spaces)
    ? raw.spaces.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const space = (item as SpaceChoice).space;
        const workType = (item as SpaceChoice).workType;
        if (!isSpace(space) || !isWorkType(workType)) return [];
        return [{ space, workType }];
      })
    : [];
  const step = Number(raw.step);
  return {
    version: 2,
    step: step >= 1 && step <= 8 ? step : 1,
    propertyType: isPropertyType(raw.propertyType) ? raw.propertyType : null,
    location: isLocation(raw.location) ? raw.location : null,
    sizeBand: isSize(raw.sizeBand) ? raw.sizeBand : null,
    finishLevel: isFinish(raw.finishLevel) ? raw.finishLevel : null,
    contingency: clampContingency(Number(raw.contingency)),
    spaces,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export function draftFromLegacy(value: unknown): SavedDraft | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {
    propertyType?: unknown;
    location?: unknown;
    sizeBand?: unknown;
    finishLevel?: unknown;
    contingencyPercentage?: unknown;
    selectedSpaces?: unknown;
    spaceWorkTypes?: unknown;
  };
  const propertyType = isPropertyType(raw.propertyType) ? raw.propertyType : null;
  const location = isLocation(raw.location) ? raw.location : null;
  const sizeBand = isSize(raw.sizeBand) ? raw.sizeBand : null;
  const finishLevel = isFinish(raw.finishLevel) ? raw.finishLevel : null;
  const workTypes = raw.spaceWorkTypes && typeof raw.spaceWorkTypes === 'object' ? (raw.spaceWorkTypes as Record<string, unknown>) : {};
  const spaces = Array.isArray(raw.selectedSpaces)
    ? raw.selectedSpaces.flatMap((space) => {
        if (!isSpace(space)) return [];
        const workType = workTypes[space];
        return [{ space, workType: isWorkType(workType) ? workType : ('Upgrade' as const) }];
      })
    : [];
  if (!propertyType && !location && !sizeBand && !finishLevel && !spaces.length && raw.contingencyPercentage == null) return null;
  return {
    version: 2,
    step: spaces.length ? 8 : 1,
    propertyType,
    location,
    sizeBand,
    finishLevel,
    contingency: clampContingency(Number(raw.contingencyPercentage)),
    spaces,
    updatedAt: new Date().toISOString(),
  };
}
