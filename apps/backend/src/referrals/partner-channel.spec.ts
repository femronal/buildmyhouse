import { TYPED_CODE_CHANNEL, channelFor } from './partner-channel';
import { PartnerProgramService } from './partner-program.service';

describe('partner channels', () => {
  it('keeps a stored channel, treats a typed code as word of mouth, and leaves the rest unsplit', () => {
    expect(channelFor({ channel: 'online', source: 'link' })).toBe('online');
    expect(channelFor({ channel: null, source: 'code_entered' })).toBe('word_of_mouth');
    expect(channelFor({ channel: null, source: 'code_entered' })).toBe(TYPED_CODE_CHANNEL);
    expect(channelFor({ channel: null, source: 'link' })).toBe('not_split');
    expect(channelFor({ channel: null, source: 'admin' })).toBe('not_split');
  });

  it('splits overview counts into three buckets that add back to the totals', async () => {
    const prisma = {
      referrer: {
        findUnique: jest.fn(async () => ({
          id: 'me',
          name: 'Ada',
          code: 'ADA111',
          type: 'affiliate',
          applicationStatus: 'approved',
          archivedAt: null,
          leaderboardNickname: 'Sparrow',
          leaderboardHidden: false,
        })),
        findMany: jest.fn(async () => []),
      },
      partnerCommission: {
        findMany: jest.fn(async () => [
          { referrerId: 'me', homeownerId: 'home-online', amount: 50000, status: 'approved', approvedAt: new Date(), paidAt: null },
          { referrerId: 'me', homeownerId: 'home-plain', amount: 10000, status: 'awaiting_checks', approvedAt: null, paidAt: null },
        ]),
      },
      referralClick: {
        count: jest.fn(async () => 4),
        findMany: jest.fn(async () => [
          { channel: 'word_of_mouth' },
          { channel: 'word_of_mouth' },
          { channel: 'online' },
          { channel: null },
        ]),
      },
      customerAttribution: {
        count: jest.fn(async () => 3),
        findMany: jest.fn(async ({ where }: { where: { userId?: { in: string[] }; referrerId?: string } }) => {
          if (where.userId) {
            return [{ userId: 'home-online', channel: 'online', source: 'link' }];
          }
          return [
            { channel: null, source: 'code_entered' },
            { channel: 'online', source: 'link' },
            { channel: null, source: 'admin' },
          ];
        }),
      },
      partnerPayoutProfile: { findUnique: jest.fn(async () => ({ accountNumber: '0123456789' })) },
      partnerAgreement: { findFirst: jest.fn(async () => null) },
      referralProgramRule: { upsert: jest.fn(async () => ({})) },
      marketingCampaign: { upsert: jest.fn(async () => ({})), findMany: jest.fn(async () => []) },
    };
    const overview = await new PartnerProgramService(prisma as any, { send: async () => true } as any, {} as any, { get: () => '' } as any).overview('me');
    const buckets = overview.channels;
    expect(buckets.word_of_mouth.visitors + buckets.online.visitors + buckets.not_split.visitors).toBe(overview.visitors);
    expect(buckets.word_of_mouth.signUps + buckets.online.signUps + buckets.not_split.signUps).toBe(overview.lockedHomeowners);
    expect(buckets.word_of_mouth.completed + buckets.online.completed + buckets.not_split.completed).toBe(overview.completedProjects);
    expect(buckets.word_of_mouth.signUps).toBe(1);
    expect(buckets.online.completed).toBe(1);
    expect(buckets.not_split.completed).toBe(1);
  });
});
