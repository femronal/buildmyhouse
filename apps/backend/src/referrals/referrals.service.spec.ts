import { ReferralsService } from './referrals.service';

function buildService(prisma: any) {
  return new ReferralsService(prisma);
}

describe('ReferralsService', () => {
  it('retries when a generated code is already taken', async () => {
    const seen: string[] = [];
    const prisma = {
      referrer: {
        findUnique: jest.fn(async ({ where }: { where: { code: string } }) => {
          seen.push(where.code);
          return seen.length === 1 ? { id: 'taken' } : null;
        }),
      },
    };
    const code = await buildService(prisma).generateUniqueCode();
    expect(seen.length).toBeGreaterThan(1);
    expect(code).toBe(seen[seen.length - 1]);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it('ignores unknown, archived, and self referrals', async () => {
    const prisma = {
      referrer: {
        findUnique: jest.fn(async ({ where }: { where: { code: string } }) => {
          if (where.code === 'NOPE1' || where.code === 'GONE1') return null;
          if (where.code === 'OLD111') return { id: 'old', userId: 'other', archivedAt: new Date() };
          if (where.code === 'SELF11') return { id: 'self', userId: 'homeowner-1', archivedAt: null };
          return { id: 'ok', userId: 'contractor-1', archivedAt: null };
        }),
      },
    };
    const service = buildService(prisma);
    expect(await service.resolveActiveReferrer('no')).toBeNull();
    expect(await service.resolveActiveReferrer('nope1')).toBeNull();
    expect(await service.resolveActiveReferrer('gone1')).toBeNull();
    expect(await service.resolveActiveReferrer('old111')).toBeNull();
    expect(await service.referralFieldsForNewProject('homeowner-1', 'SELF11', 'link')).toEqual({});
    await expect(service.referralFieldsForNewProject('homeowner-1', 'LIVE11', 'link')).resolves.toMatchObject({
      referrerId: 'ok',
      referralSource: 'link',
    });
  });

  it('counts a paid job once when both payment signals are present', async () => {
    const prisma = {
      referralProgramSettings: {
        findUnique: jest.fn(async () => ({
          id: 'default',
          trackVendors: false,
          countsWhen: 'undecided',
          allowHomeownerTypedCode: false,
          linkValidityDays: 30,
          attributionRule: 'first_touch',
          payoutRules: 'Pay after the job is completed.',
        })),
      },
      referrer: { findMany: jest.fn(async () => [{ id: 'r1' }]) },
      artisanListing: {
        groupBy: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      },
      professionalListing: {
        groupBy: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      },
      startRequest: { groupBy: jest.fn(async () => []) },
      project: {
        count: jest.fn(async () => 0),
        groupBy: jest.fn(async ({ where }: { where: { status?: string } }) => {
          if (where.status === 'completed') return [{ referrerId: 'r1', _count: { _all: 1 } }];
          return [
            {
              referrerId: 'r1',
              _count: { _all: 2 },
              _min: { createdAt: new Date('2026-10-01') },
              _max: { createdAt: new Date('2026-10-19') },
            },
          ];
        }),
        findMany: jest.fn(async () => [
          { id: 'job-both', referrerId: 'r1' },
          { id: 'job-both', referrerId: 'r1' },
        ]),
      },
    };
    const summary = await buildService(prisma).summary();
    expect(summary.paidJobsCount).toBe(1);
    expect(summary.completedJobsCount).toBe(1);
    expect(summary.jobsCount).toBe(2);
    expect(summary.countsWhen).toBe('undecided');
  });

  it('records program rules and hides payout notes from the public response', async () => {
    const saved = {
      id: 'default',
      allowHomeownerTypedCode: true,
      linkValidityDays: 14,
      attributionRule: 'latest_code',
      trackVendors: true,
      countsWhen: 'job_paid',
      payoutRules: 'Agree the amount offline.',
    };
    const prisma = {
      referralProgramSettings: {
        findUnique: jest.fn(async () => saved),
        update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ ...saved, ...data })),
      },
    };
    const service = buildService(prisma);
    await expect(service.publicProgram()).resolves.toEqual({
      allowHomeownerTypedCode: true,
      linkValidityDays: 14,
      attributionRule: 'latest_code',
    });
    await service.updateSettings({ payoutRules: 'Pay nothing until a rule is agreed.', countsWhen: 'job_completed' });
    expect(prisma.referralProgramSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ countsWhen: 'job_completed', payoutRules: 'Pay nothing until a rule is agreed.' }),
      }),
    );
  });

  it('refuses a vendor attach while vendor tracking is off', async () => {
    const prisma = {
      referralProgramSettings: {
        findUnique: jest.fn(async () => ({ trackVendors: false })),
      },
      referrer: { findUnique: jest.fn(async () => ({ id: 'r1', archivedAt: null })) },
      vendorProfile: { update: jest.fn() },
    };
    await expect(
      buildService(prisma).attach({ targetType: 'vendor', targetId: '11111111-1111-1111-1111-111111111111', referrerId: 'r1' }),
    ).rejects.toThrow('Vendor tracking is turned off');
    expect(prisma.vendorProfile.update).not.toHaveBeenCalled();
  });

  it('returns only a valid flag for a public code check', async () => {
    const prisma = {
      referrer: {
        findUnique: jest.fn(async () => ({ id: 'r1', userId: null, archivedAt: null })),
      },
    };
    await expect(buildService(prisma).codeValidity('abc123')).resolves.toEqual({ valid: true });
  });
});

describe('admin referrer updates', () => {
  it('lets an admin set a referrer and ignores everyone else', () => {
    const { adminReferrerUpdate } = require('./admin-referrer-update');
    expect(adminReferrerUpdate('homeowner', 'ref-1')).toEqual({});
    expect(adminReferrerUpdate('general_contractor', 'ref-1')).toEqual({});
    expect(adminReferrerUpdate('admin', undefined)).toEqual({});
    expect(adminReferrerUpdate('admin', 'ref-1')).toMatchObject({
      referrerId: 'ref-1',
      referralSource: 'admin',
    });
    expect(adminReferrerUpdate('admin', null)).toEqual({
      referrerId: null,
      referralSource: null,
      referredAt: null,
    });
  });
});
