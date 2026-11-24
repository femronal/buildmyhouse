import { nextTier, publicLabel, tierFor } from './leaderboard';

describe('leaderboard tiers', () => {
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
    expect(nextTier(2000000).progressPct).toBe(100);
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
