import { createHash } from 'crypto';

export const TIERS = [
  { key: 'starter', label: 'Starter', min: 0, band: 'No approved commission yet' },
  { key: 'bronze', label: 'Bronze', min: 1, band: '₦1 to ₦100k' },
  { key: 'silver', label: 'Silver', min: 100000, band: '₦100k to ₦500k' },
  { key: 'gold', label: 'Gold', min: 500000, band: '₦500k to ₦2m' },
  { key: 'platinum', label: 'Platinum', min: 2000000, band: '₦2m and up' },
] as const;

export type Tier = (typeof TIERS)[number];

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
