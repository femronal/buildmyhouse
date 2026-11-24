import { createHash } from 'crypto';

export const TIERS = [
  { key: 'starter', label: 'Starter', min: 0, band: 'No approved commission yet' },
  { key: 'bronze', label: 'Bronze', min: 1, band: '₦1 to ₦100k' },
  { key: 'silver', label: 'Silver', min: 100000, band: '₦100k to ₦500k' },
  { key: 'gold', label: 'Gold', min: 500000, band: '₦500k to ₦2m' },
  { key: 'platinum', label: 'Platinum', min: 2000000, band: '₦2m and up' },
] as const;

export type Tier = (typeof TIERS)[number];

export type RankRow = {
  referrerId: string;
  amount: number;
  status: string;
  approvedAt?: Date | string | null;
  paidAt?: Date | string | null;
};

export function countsTowardRank(status: string) {
  return status === 'approved' || status === 'paid';
}

export function tierFor(amount: number): Tier {
  let current: Tier = TIERS[0];
  for (const tier of TIERS) {
    if (amount >= tier.min) current = tier;
  }
  return current;
}

export function nextTier(amount: number) {
  const tier = tierFor(amount);
  const index = TIERS.findIndex((item) => item.key === tier.key);
  const next = TIERS[index + 1] || null;
  const toNextTier = next ? Math.max(0, next.min - amount) : 0;
  const progressPct = next ? Math.min(100, Math.max(0, Math.round((amount / next.min) * 100))) : 100;
  return { tier, nextTier: next, toNextTier, progressPct };
}

function asDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function lagosMonth(date: Date) {
  const shifted = new Date(date.getTime() + 60 * 60 * 1000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() };
}

function inLagosMonth(date: Date, now: Date) {
  const left = lagosMonth(date);
  const right = lagosMonth(now);
  return left.year === right.year && left.month === right.month;
}

export function rankPartners(rows: RankRow[], period: 'month' | 'all', now: Date) {
  const totals = new Map<string, { referrerId: string; amount: number; completedProjects: number }>();
  for (const row of rows) {
    if (!countsTowardRank(row.status)) continue;
    const when = asDate(row.approvedAt) || asDate(row.paidAt);
    if (period === 'month') {
      if (!when || !inLagosMonth(when, now)) continue;
    }
    const amount = Number(row.amount) || 0;
    if (amount <= 0) continue;
    const current = totals.get(row.referrerId) || { referrerId: row.referrerId, amount: 0, completedProjects: 0 };
    current.amount += amount;
    current.completedProjects += 1;
    totals.set(row.referrerId, current);
  }
  const sorted = [...totals.values()].sort((left, right) => right.amount - left.amount || left.referrerId.localeCompare(right.referrerId));
  let rank = 0;
  let lastAmount: number | null = null;
  const ranked = sorted.map((row, index) => {
    if (lastAmount === null || row.amount !== lastAmount) {
      rank = index + 1;
      lastAmount = row.amount;
    }
    return { ...row, rank };
  });
  return { ranked, rankedCount: ranked.length };
}

export function publicLabel(
  referrer: { id: string; name: string; leaderboardNickname?: string | null; leaderboardHidden?: boolean | null },
  showRealNames: boolean,
) {
  if (referrer.leaderboardHidden) return 'Private partner';
  if (showRealNames) return referrer.name;
  const nickname = String(referrer.leaderboardNickname || '').trim();
  if (nickname) return nickname;
  const hash = createHash('sha256').update(referrer.id).digest('hex').slice(0, 4).toUpperCase();
  return `Partner ${hash}`;
}
