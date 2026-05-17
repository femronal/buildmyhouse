import { ConfigService } from '@nestjs/config';
import { ContractorMatcherService } from './contractor-matcher.service';
import { ContractorsService } from './contractors.service';

describe('ContractorsService.recommendGCs', () => {
  const buildService = (matchingVersion: string = 'v1') => {
    const wsService = {
      sendNotification: jest.fn(),
      emitProjectUpdate: jest.fn(),
    } as any;
    const stripeService = {} as any;
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MATCHING_ALGO_VERSION') return matchingVersion;
        return undefined;
      }),
    } as unknown as ConfigService;
    const matcher = new ContractorMatcherService();
    const service = new ContractorsService(wsService, stripeService, configService, matcher);

    const prismaMock = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'project-1',
          name: 'Kitchen Remodel',
          address: 'Lekki, Lagos',
          city: 'Lekki',
          state: 'Lagos',
          budget: 15000000,
          projectType: 'renovation',
          aiAnalysis: { projectTypeTag: 'renovation' },
        }),
      },
      contractor: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'contractor-1',
            userId: 'gc-user-1',
            name: 'Build Co',
            specialtyCategory: 'renovator',
            specialtyTags: ['kitchen', 'interior'],
            specialty: 'Renovation',
            description: 'Experienced renovation GC.',
            location: 'Lekki, Lagos',
            experienceYears: 10,
            rating: 4.8,
            reviews: 24,
            projects: 60,
            verified: true,
            hiringFee: 300000,
            type: 'general_contractor',
            user: {
              id: 'gc-user-1',
              fullName: 'Build Co',
              email: 'gc1@example.com',
              phone: '000',
              pictureUrl: null,
              role: 'general_contractor',
              verified: true,
            },
            _count: {
              certifications: 2,
            },
          },
        ]),
      },
      projectRequest: {
        findMany: jest.fn().mockResolvedValue([
          {
            contractorId: 'gc-user-1',
            status: 'accepted',
            sentAt: new Date('2025-01-01T00:00:00.000Z'),
            respondedAt: new Date('2025-01-01T12:00:00.000Z'),
          },
        ]),
      },
      projectStageDispute: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    (service as any).prisma = prismaMock;
    return { service };
  };

  it('returns enriched scoring payload when v1 is active', async () => {
    const { service } = buildService('v1');
    const matches = await service.recommendGCs('project-1', 3);

    expect(matches).toHaveLength(1);
    expect(matches[0].matchScore).toBeGreaterThan(0);
    expect(matches[0].matchBreakdown).toBeDefined();
    expect(Array.isArray(matches[0].matchReasons)).toBe(true);
  });

  it('supports legacy fallback when configured', async () => {
    const { service } = buildService('legacy');
    const matches = await service.recommendGCs('project-1', 3);

    expect(matches).toHaveLength(1);
    expect(matches[0].matchScore).toBeGreaterThan(0);
    expect(matches[0].matchBreakdown).toBeUndefined();
  });
});

