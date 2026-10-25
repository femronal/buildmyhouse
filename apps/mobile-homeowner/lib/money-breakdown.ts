export type MoneySummaryInput = {
  hasHomeownerReceipts?: boolean | null;
  youSentIn?: number | null;
  stillWithBuildMyHouse?: number | null;
  sentToContractor?: number | null;
  paidToShopsForMaterials?: number | null;
  paidToTeamMembers?: number | null;
};

export type MoneySegmentKey = 'still' | 'contractor' | 'shops' | 'team';

export type MoneySegment = {
  key: MoneySegmentKey;
  label: string;
  amount: number;
  pct: number | null;
  widthPct: number;
  color: string;
};

export type MoneyBreakdown = {
  base: number;
  mode: 'receipts' | 'moved' | 'empty';
  hasReceipts: boolean;
  youSentIn: number;
  overPaid: boolean;
  showBar: boolean;
  segments: MoneySegment[];
};

const SEGMENT_META: { key: MoneySegmentKey; label: string; color: string }[] = [
  { key: 'still', label: 'Still with BuildMyHouse', color: '#111111' },
  { key: 'contractor', label: 'Sent to your contractor', color: '#4A6CF7' },
  { key: 'shops', label: 'Paid to shops for materials', color: '#C6F432' },
  { key: 'team', label: 'Paid to team members', color: '#7A9E1A' },
];

function asMoney(value?: number | null) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function largestRemainder(exact: number[]) {
  const floors = exact.map((value) => Math.floor(value + 1e-8));
  let left = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value + 1e-8) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  const result = [...floors];
  let cursor = 0;
  while (left > 0 && order.length > 0) {
    result[order[cursor % order.length].index] += 1;
    left -= 1;
    cursor += 1;
    if (cursor > order.length * 3) break;
  }
  return result;
}

/** Whole percents that add up to 100. Still with BuildMyHouse keeps the remainder after the other rows are rounded, so 14,500 of 19,500 reads 75. */
function displayPercents(amounts: number[], base: number) {
  if (base <= 0) return amounts.map(() => 0);
  const exact = amounts.map((amount) => (amount / base) * 100);
  if (amounts[0] > 0) {
    const rounded = exact.map((value, index) => {
      if (index === 0 || amounts[index] <= 0) return 0;
      return Math.round(value);
    });
    const otherSum = rounded.reduce((sum, value) => sum + value, 0);
    if (otherSum <= 100) {
      rounded[0] = 100 - otherSum;
      return rounded;
    }
  }
  return largestRemainder(exact.map((value, index) => (amounts[index] <= 0 ? 0 : value)));
}

export function formatNaira(amount: number) {
  return `₦${Math.round(asMoney(amount)).toLocaleString('en-US')}`;
}

export function buildMoneyBarLabel(breakdown: MoneyBreakdown) {
  if (!breakdown.showBar) return '';
  const phrase: Record<MoneySegmentKey, string> = {
    still: 'still with BuildMyHouse',
    contractor: 'sent to your contractor',
    shops: 'paid to shops for materials',
    team: 'paid to team members',
  };
  const parts = breakdown.segments
    .filter((segment) => segment.pct != null)
    .map((segment) => `${segment.pct}% ${phrase[segment.key]}`);
  if (breakdown.hasReceipts) {
    return `Of ${formatNaira(breakdown.youSentIn)} you sent in: ${parts.join(', ')}`;
  }
  return `Of the money paid out so far: ${parts.join(', ')}`;
}

export function buildMoneyBreakdown(summary?: MoneySummaryInput | null): MoneyBreakdown {
  const youSentIn = asMoney(summary?.youSentIn);
  const hasReceipts = Boolean(summary?.hasHomeownerReceipts) && youSentIn > 0;
  const contractor = asMoney(summary?.sentToContractor);
  const shops = asMoney(summary?.paidToShopsForMaterials);
  const team = asMoney(summary?.paidToTeamMembers);
  const moved = contractor + shops + team;
  const overPaid = hasReceipts && moved > youSentIn;
  const still = hasReceipts && !overPaid ? asMoney(summary?.stillWithBuildMyHouse) : 0;
  const amounts = [still, contractor, shops, team];

  let base = 0;
  let mode: MoneyBreakdown['mode'] = 'empty';
  if (!hasReceipts && moved <= 0) {
    mode = 'empty';
    base = 0;
  } else if (hasReceipts && !overPaid) {
    mode = 'receipts';
    base = youSentIn;
  } else {
    mode = 'moved';
    base = moved;
  }

  const showBar = base > 0 && (hasReceipts || moved > 0) && mode !== 'empty';
  const percents = displayPercents(amounts, base);
  const segments: MoneySegment[] = SEGMENT_META.map((meta, index) => {
    const amount = amounts[index];
    const widthPct = !showBar || base <= 0 || (meta.key === 'still' && !hasReceipts) ? 0 : (amount / base) * 100;
    const pct = meta.key === 'still' && !hasReceipts ? null : percents[index];
    return {
      ...meta,
      amount,
      pct,
      widthPct: amount <= 0 ? 0 : widthPct,
    };
  });

  return {
    base,
    mode,
    hasReceipts,
    youSentIn,
    overPaid,
    showBar: showBar && segments.some((segment) => segment.widthPct > 0),
    segments,
  };
}
