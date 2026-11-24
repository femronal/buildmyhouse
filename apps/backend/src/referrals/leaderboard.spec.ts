import { countsTowardRank, nextTier, publicLabel, rankPartners, tierFor } from './leaderboard';

describe('leaderboard ranks and tiers', () => {
  const now = new Date('2026-11-15T12:00:00.000Z');

  it('ranks only approved and paid commission, and leaves the rest on Starter', () => {
    const ranked = rankPartners([
      { referrerId: 'quiet', amount: 40000, status: 'awaiting_checks', approvedAt: now },
      { referrerId: 'quiet', amount: 10000, status: 'needs_review', approvedAt: now },
      { referrerId: 'quiet', amount: 80000, status: 'reversed', approvedAt: now },
      { referrerId: 'active', amount: 150000, status: 'approved', approvedAt: now },
      { referrerId: 'active', amount: 10000, status: 'paid', paidAt: now },
    ], 'all', now);
    expect(ranked.ranked.map((row) => row.referrerId)).toEqual(['active']);
    expect(tierFor(0).key).toBe('starter');
    expect(countsTowardRank('awaiting_checks')).toBe(false);
    expect(countsTowardRank('paid')).toBe(true);
  });

  it('gives equal totals the same rank and skips the next number', () => {
    const ranked = rankPartners([
      { referrerId: 'high', amount: 200000, status: 'approved', approvedAt: now },
      { referrerId: 'tie-a', amount: 80000, status: 'approved', approvedAt: now },
      { referrerId: 'tie-b', amount: 80000, status: 'paid', paidAt: now },
      { referrerId: 'low', amount: 1000, status: 'approved', approvedAt: now },
    ], 'all', now);
    expect(ranked.ranked.map((row) => [row.referrerId, row.rank])).toEqual([
      ['high', 1],
      ['tie-a', 2],
      ['tie-b', 2],
      ['low', 4],
    ]);
  });

  it('uses the Lagos month, and paidAt only when approvedAt is empty', () => {
    const lastMonth = new Date('2026-10-31T11:00:00.000Z');
    const firstOfMonth = new Date('2026-10-31T23:30:00.000Z');
    const ranked = rankPartners([
      { referrerId: 'old', amount: 90000, status: 'approved', approvedAt: lastMonth },
      { referrerId: 'new', amount: 40000, status: 'approved', approvedAt: firstOfMonth },
      { referrerId: 'paid-only', amount: 20000, status: 'paid', approvedAt: null, paidAt: firstOfMonth },
      { referrerId: 'paid-later', amount: 30000, status: 'paid', approvedAt: lastMonth, paidAt: firstOfMonth },
    ], 'month', now);
    expect(ranked.ranked.map((row) => row.referrerId).sort()).toEqual(['new', 'paid-only']);
  });

  it('places the tier boundaries and the step up to Gold', () => {
    expect(tierFor(0).key).toBe('starter');
    expect(tierFor(1).key).toBe('bronze');
    expect(tierFor(99999).key).toBe('bronze');
    expect(tierFor(100000).key).toBe('silver');
    expect(tierFor(499999).key).toBe('silver');
    expect(tierFor(500000).key).toBe('gold');
    expect(tierFor(2000000).key).toBe('platinum');
    const step = nextTier(150000);
    expect(step.nextTier?.label).toBe('Gold');
    expect(step.toNextTier).toBe(350000);
    expect(step.progressPct).toBe(30);
    expect(nextTier(2000000).nextTier).toBeNull();
  });

  it('hides real names unless the admin switch is on, and always hides a private partner', () => {
    const partner = { id: 'partner-1', name: 'Ada Example', leaderboardNickname: 'Sparrow', leaderboardHidden: false };
    expect(publicLabel(partner, false)).toBe('Sparrow');
    expect(publicLabel({ ...partner, leaderboardNickname: '' }, false)).toMatch(/^Partner [A-F0-9]{4}$/);
    expect(publicLabel({ ...partner, leaderboardNickname: null }, false)).not.toBe('Ada Example');
    expect(publicLabel({ ...partner, leaderboardHidden: true }, false)).toBe('Private partner');
    expect(publicLabel({ ...partner, leaderboardHidden: true }, true)).toBe('Private partner');
    expect(publicLabel(partner, true)).toBe('Ada Example');
  });
});
