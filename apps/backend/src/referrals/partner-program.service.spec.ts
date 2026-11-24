import { campaignShare, PartnerProgramService } from './partner-program.service';

function service(prisma: any) {
  return new PartnerProgramService(prisma, { send: async () => true } as any, { generatePartnerToken: async () => 'jwt' } as any, {
    get: () => 'test',
  } as any);
}

describe('PartnerProgramService attribution', () => {
  it('keeps the first customer lock after a later code arrives', async () => {
    const prisma = {
      customerAttribution: {
        findUnique: jest.fn(async () => ({
          id: 'lock-1',
          referrerId: 'affiliate-1',
          source: 'link',
          referrer: { id: 'affiliate-1', archivedAt: null, userId: 'other' },
        })),
      },
    };
    const locked = await service(prisma).lockHomeowner({ userId: 'home-1', code: 'LATER1', source: 'link' });
    expect(locked?.referrerId).toBe('affiliate-1');
    expect(prisma.customerAttribution.findUnique).toHaveBeenCalledTimes(1);
  });

  it('does not attribute a link after the click window, and does attribute a typed code', async () => {
    const prisma = {
      customerAttribution: {
        findUnique: jest.fn(async () => null),
        create: jest.fn(async ({ data }: { data: { referrerId: string; source: string } }) => ({
          ...data,
          referrer: { id: data.referrerId, archivedAt: null, userId: null },
        })),
      },
      referralProgramRule: {
        findFirst: jest.fn(async () => ({ attributionRule: 'first_touch', clickWindowDays: 30, status: 'published' })),
      },
      referralClick: { findMany: jest.fn(async () => []) },
      referrer: {
        findUnique: jest.fn(async () => ({ id: 'affiliate-2', code: 'TYPED1', archivedAt: null, userId: null, email: 'a@example.com' })),
      },
      user: { findUnique: jest.fn(async () => ({ email: 'home@example.com' })) },
    };
    const program = service(prisma);
    await expect(program.referralFieldsForNewProject('home-1', 'OLD111', 'link', 'anon-12345678')).resolves.toEqual({});
    await expect(program.referralFieldsForNewProject('home-1', 'TYPED1', 'code_entered')).resolves.toMatchObject({
      referrerId: 'affiliate-2',
      referralSource: 'code_entered',
    });
  });
});

describe('PartnerProgramService commissions', () => {
  function projectPrisma(overrides: Record<string, unknown> = {}) {
    const project = {
      id: 'project-1',
      status: 'completed',
      completedAt: new Date('2026-11-01'),
      homeownerId: 'home-1',
      generalContractorId: 'gc-1',
      referrerId: 'affiliate-1',
      referredAt: new Date('2026-01-01'),
      referralSource: 'link',
      stages: [{ status: 'completed', approvedAt: new Date('2026-11-01') }],
      payments: [{ status: 'completed', amount: 55_000_000 }],
      projectRequests: [{ estimatedBudget: 50_000_000, monitoringFeeAmount: null, coordinationFeeAmount: null, contingencyFeeAmount: null, homeownerAcceptedQuoteAt: new Date() }],
      homeowner: { id: 'home-1', email: 'home@example.com' },
      referrer: null,
      ...overrides,
    };
    return {
      partnerCommission: {
        findUnique: jest.fn(async () => null),
        findFirst: jest.fn(),
        count: jest.fn(async () => 0),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'commission-1', ...data })),
      },
      project: {
        findUnique: jest.fn(async () => project),
        update: jest.fn(),
      },
      customerAttribution: {
        findUnique: jest.fn(async () => ({
          referrer: {
            id: 'affiliate-1',
            type: 'affiliate',
            applicationStatus: 'approved',
            archivedAt: null,
            userId: 'partner-user',
            email: 'partner@example.com',
          },
        })),
      },
      partnerAgreement: {
        findFirst: jest.fn(async () => ({ id: 'agreement-1', rateBps: 250, ruleId: 'rule-1' })),
      },
      referralProgramRule: { findFirst: jest.fn(async () => null) },
    };
  }

  it('records ₦1,250,000 on a ₦50 million project and excludes contingency', async () => {
    const prisma = projectPrisma();
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result).toMatchObject({ action: 'recorded', amount: 1_250_000, status: 'awaiting_checks' });
    expect(prisma.partnerCommission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eligibleContractorAmount: 50_000_000,
          controllingFeeAmount: 5_000_000,
          contingencyAmount: 10_000_000,
          amount: 1_250_000,
        }),
      }),
    );
  });

  it('does not create a commission for a completed project before the controlling fee is received', async () => {
    const prisma = projectPrisma({ payments: [{ status: 'completed', amount: 50_000_000 }] });
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result.action).toBe('skip');
    expect(prisma.partnerCommission.create).not.toHaveBeenCalled();
  });

  it('holds a contractor conflict for review instead of approving it', async () => {
    const prisma = projectPrisma({ generalContractorId: 'partner-user' });
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result).toMatchObject({ action: 'recorded', status: 'needs_review' });
  });

  it('does not pay the lifetime rate to an ordinary referrer while that reward is unpublished', async () => {
    const prisma = projectPrisma();
    prisma.customerAttribution.findUnique = jest.fn(async () => ({
      referrer: {
        id: 'referrer-1',
        type: 'referrer',
        applicationStatus: 'none',
        archivedAt: null,
        userId: 'gc-9',
        email: 'gc@example.com',
      },
    }));
    prisma.partnerAgreement.findFirst = jest.fn(async () => null);
    prisma.referralProgramRule.findFirst = jest.fn(async () => ({
      id: 'rule-r',
      status: 'draft',
      rewardKind: 'unpublished',
      rateBps: null,
    }));
    const result = await service(prisma).evaluateProjectCommission('project-1');
    expect(result.action).toBe('skip');
    expect(String((result as { reasons?: string[] }).reasons?.join(' '))).toMatch(/not published/i);
    expect(prisma.partnerCommission.create).not.toHaveBeenCalled();
  });
});

describe('PartnerProgramService applications', () => {
  function applyPrisma(existing: { id: string } | null) {
    return {
      referrer: {
        findFirst: jest.fn(async () => existing),
        findUnique: jest.fn(async () => null),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'ref-1', ...data })),
      },
    };
  }

  it('emails and notifies once for a new application', async () => {
    const email = { send: jest.fn(async () => true) };
    const ws = { sendNotificationToRole: jest.fn(async () => ({ count: 1 })) };
    const config = {
      get: (key: string) => {
        if (key === 'ADMIN_NOTIFY_EMAIL') return 'ops@buildmyhouse.app';
        if (key === 'ADMIN_DASHBOARD_URL') return 'https://admin.buildmyhouse.app';
        return '';
      },
    };
    const prisma = applyPrisma(null);
    const program = new PartnerProgramService(prisma as any, email as any, {} as any, config as any, ws as any);
    await expect(program.apply({
      name: 'Ada Organiser',
      email: 'Ada@Example.com',
      phone: '08030000000',
      audience: 'London newsletter',
    })).resolves.toEqual({ ok: true });
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ops@buildmyhouse.app',
      text: expect.stringContaining('https://admin.buildmyhouse.app/growth/referrals/ref-1'),
    }));
    expect(ws.sendNotificationToRole).toHaveBeenCalledWith('admin', expect.objectContaining({
      type: 'affiliate_application',
      data: { referrerId: 'ref-1' },
    }));
  });

  it('does not email a repeat application', async () => {
    const email = { send: jest.fn() };
    const ws = { sendNotificationToRole: jest.fn() };
    const prisma = applyPrisma({ id: 'existing' });
    const program = new PartnerProgramService(prisma as any, email as any, {} as any, { get: () => '' } as any, ws as any);
    await program.apply({ name: 'Ada', email: 'ada@example.com' });
    expect(email.send).not.toHaveBeenCalled();
    expect(ws.sendNotificationToRole).not.toHaveBeenCalled();
    expect(prisma.referrer.create).not.toHaveBeenCalled();
  });

  it('still accepts the application when notice delivery fails', async () => {
    const email = { send: jest.fn(async () => { throw new Error('mailbox down'); }) };
    const ws = { sendNotificationToRole: jest.fn(async () => { throw new Error('socket down'); }) };
    const program = new PartnerProgramService(
      applyPrisma(null) as any,
      email as any,
      {} as any,
      { get: () => 'ops@buildmyhouse.app' } as any,
      ws as any,
    );
    await expect(program.apply({ name: 'Ada', email: 'ada@example.com' })).resolves.toEqual({ ok: true });
  });
});

describe('Partner library links', () => {
  it('does not put a referral code on a Google Drive file', () => {
    const shared = campaignShare('CODE1', 'https://buildmyhouse.app', {
      slug: 'site-video',
      destinationPath: '',
      assetUrl: 'https://drive.google.com/file/d/abc/view',
    });
    expect(shared.link).toBeNull();
    expect(shared.assetUrl).toBe('https://drive.google.com/file/d/abc/view');
    expect(shared.tracksIntroduction).toBe(false);
  });

  it('tracks the BuildMyHouse page and leaves the Drive link unchanged', () => {
    const shared = campaignShare('CODE1', 'https://buildmyhouse.app', {
      slug: 'site-video',
      destinationPath: '/start',
      assetUrl: 'https://drive.google.com/file/d/abc/view',
    });
    expect(shared.link).toContain('ref=CODE1');
    expect(shared.assetUrl).toBe('https://drive.google.com/file/d/abc/view');
    expect(shared.assetUrl).not.toContain('ref=');
  });

  it('adds utm_medium when a channel is set and leaves the link unchanged without one', () => {
    const withChannel = campaignShare('CODE1', 'https://buildmyhouse.app', {
      slug: 'site-video',
      destinationPath: '/start',
    }, 'online');
    expect(withChannel.link).toContain('utm_campaign=site-video');
    expect(withChannel.link).toContain('utm_medium=online');
    expect(withChannel.link?.indexOf('utm_campaign')).toBeLessThan(withChannel.link?.indexOf('utm_medium') || 0);
    const plain = campaignShare('CODE1', 'https://buildmyhouse.app', {
      slug: 'site-video',
      destinationPath: '/start',
    });
    expect(plain.link).toBe('https://buildmyhouse.app/start?ref=CODE1&utm_campaign=site-video');
    expect(plain.link).not.toContain('utm_medium');
  });

  it('rejects a file that is not on Google Drive', async () => {
    const prisma = { marketingCampaign: { create: jest.fn(), findUnique: jest.fn() } };
    const program = new PartnerProgramService(prisma as any, { send: async () => true } as any, {} as any, { get: () => '' } as any);
    await expect(program.saveLibraryItem({
      kind: 'video',
      title: 'Walkthrough',
      audience: 'Owners abroad',
      problem: 'People want a video, not only a tool.',
      promise: 'See the house before you send money.',
      caption: 'Watch the walkthrough.',
      assetUrl: 'https://buildmyhouse-prod.s3.amazonaws.com/video.mp4',
      publish: true,
    })).rejects.toThrow(/Google Drive/);
    expect(prisma.marketingCampaign.create).not.toHaveBeenCalled();
  });
});

describe('PartnerProgramService leaderboard', () => {
  function boardPrisma(settings: Record<string, unknown>) {
    return {
      referrer: {
        findUnique: jest.fn(async () => ({
          id: 'me',
          name: 'Ada Example',
          code: 'ADA111',
          email: 'ada@example.com',
          type: 'affiliate',
          applicationStatus: 'approved',
          archivedAt: null,
          leaderboardNickname: 'Sparrow',
          leaderboardHidden: false,
        })),
        findMany: jest.fn(async () => [
          partner('me', 'Ada Example', 'ADA111', 'Sparrow', 50000, 'affiliate', 'approved', null),
          partner('other', 'Ngozi Falcon', 'NGZ999', 'Heron', 80000, 'affiliate', 'approved', null),
          partner('gone', 'Suspended Person', 'GONE11', null, 900000, 'affiliate', 'suspended', null),
          partner('old', 'Archived Person', 'OLD111', null, 700000, 'affiliate', 'approved', new Date()),
          partner('ref', 'Plain Referrer', 'REF111', null, 600000, 'referrer', 'none', null),
        ]),
      },
      referralProgramSettings: { findUnique: jest.fn(async () => settings) },
    };
  }

  function partner(id: string, name: string, code: string, nickname: string | null, amount: number, type: string, applicationStatus: string, archivedAt: Date | null) {
    return {
      id,
      name,
      code,
      email: `${id}@example.com`,
      type,
      applicationStatus,
      archivedAt,
      leaderboardNickname: nickname,
      leaderboardHidden: false,
      commissions: [{ referrerId: id, amount, status: 'approved', approvedAt: new Date(), paidAt: null }],
    };
  }

  it('hides another partner name, code and amount unless real names are on', async () => {
    const prisma = boardPrisma({ id: 'default' });
    const result = await service(prisma).leaderboard('me', 'all');
    const other = result.rows.find((row) => row.label === 'Heron');
    expect(other).toEqual({ rank: 1, label: 'Heron', tierKey: 'bronze', tierLabel: 'Bronze', band: '₦1 to ₦100k', isYou: false });
    expect(JSON.stringify(result)).not.toContain('Ngozi Falcon');
    expect(JSON.stringify(result)).not.toContain('NGZ999');
    expect(result.rows.find((row) => row.isYou)?.amount).toBe(50000);
    expect(result.you.periodAmount).toBe(50000);
    expect(result.showRealNames).toBe(false);
    expect(result.rows.map((row) => row.label)).toEqual(['Heron', 'Sparrow']);
  });

  it('shows real names and exact amounts when the admin switch is on', async () => {
    const prisma = boardPrisma({ id: 'default', leaderboardShowRealNames: true });
    const result = await service(prisma).leaderboard('me', 'month');
    expect(result.showRealNames).toBe(true);
    expect(result.rows.find((row) => row.rank === 1)).toMatchObject({ label: 'Ngozi Falcon', amount: 80000 });
    expect(result.rows.find((row) => row.isYou)?.amount).toBe(50000);
  });
});
