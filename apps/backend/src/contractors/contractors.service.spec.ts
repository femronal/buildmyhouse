import { ConfigService } from '@nestjs/config';
import { ContractorMatcherService } from './contractor-matcher.service';
import { ContractorsService } from './contractors.service';

describe('ContractorsService.recommendGCs', () => {
  const buildService = (options?: {
    matchingVersion?: string;
    aiRerankEnabled?: boolean;
    projectOverrides?: Record<string, any>;
    candidates?: any[];
    aiRerankResponse?: { orderedContractorIds: string[]; reasonsById: Record<string, string[]> } | null;
  }) => {
    const matchingVersion = options?.matchingVersion || 'v1';
    const wsService = {
      sendNotification: jest.fn(),
      emitProjectUpdate: jest.fn(),
    } as any;
    const stripeService = {} as any;
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MATCHING_ALGO_VERSION') return matchingVersion;
        if (key === 'GC_MATCHING_AI_RERANK_ENABLED')
          return options?.aiRerankEnabled ? 'true' : 'false';
        if (key === 'GC_MATCHING_AI_POOL_LIMIT') return '20';
        if (key === 'GC_MATCHING_AI_MODEL') return 'gpt-4o-mini';
        return undefined;
      }),
    } as unknown as ConfigService;
    const matcher = new ContractorMatcherService();
    const emailService = {
      sendHomeownerQuoteEmail: jest.fn(),
    } as any;
    const openAIService = {
      isConfigured: jest.fn().mockReturnValue(!!options?.aiRerankEnabled),
      rerankContractorMatches: jest
        .fn()
        .mockResolvedValue(options?.aiRerankResponse ?? null),
    } as any;
    const service = new ContractorsService(
      wsService,
      stripeService,
      configService,
      matcher,
      emailService,
      openAIService,
    );

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
          ...(options?.projectOverrides || {}),
        }),
      },
      contractor: {
        findMany: jest.fn().mockResolvedValue(
          options?.candidates || [
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
          ],
        ),
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
    return { service, openAIService };
  };

  it('returns enriched scoring payload when v1 is active', async () => {
    const { service } = buildService({ matchingVersion: 'v1' });
    const matches = await service.recommendGCs('project-1', 3);

    expect(matches).toHaveLength(1);
    expect(matches[0].matchScore).toBeGreaterThan(0);
    expect(matches[0].matchBreakdown).toBeDefined();
    expect(Array.isArray(matches[0].matchReasons)).toBe(true);
  });

  it('supports legacy fallback when configured', async () => {
    const { service } = buildService({ matchingVersion: 'legacy' });
    const matches = await service.recommendGCs('project-1', 3);

    expect(matches).toHaveLength(1);
    expect(matches[0].matchScore).toBeGreaterThan(0);
    expect(matches[0].matchBreakdown).toBeUndefined();
  });

  it('uses capability-safe fallback when strict matcher returns empty', async () => {
    const { service } = buildService({
      matchingVersion: 'v1',
      projectOverrides: {
        city: 'Lekki',
        state: 'Lagos',
        aiAnalysis: { projectTypeTag: 'full_builds' },
      },
      candidates: [
        {
          id: 'contractor-recovery',
          userId: 'gc-user-recovery',
          name: 'Recovery GC',
          specialtyCategory: 'general_contractor',
          specialtyTags: ['bungalow build', 'new construction'],
          specialty: 'General Contractor',
          description: 'Reliable contractor for full home builds and structural works.',
          location: 'Wuse, Abuja',
          experienceYears: 8,
          rating: 4.9,
          reviews: 18,
          projects: 42,
          verified: true,
          hiringFee: 250000,
          type: 'general_contractor',
          user: {
            id: 'gc-user-recovery',
            fullName: 'Recovery GC',
            email: 'recover@example.com',
            phone: '000',
            pictureUrl: null,
            role: 'general_contractor',
            verified: true,
          },
          _count: {
            certifications: 2,
          },
        },
      ],
    });

    const matches = await service.recommendGCs('project-1', 3);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('contractor-recovery');
  });

  it('capability-safe fallback blocks repair-only GC for full builds', async () => {
    const { service } = buildService({
      matchingVersion: 'v1',
      projectOverrides: {
        city: 'Lekki',
        state: 'Lagos',
        aiAnalysis: { projectTypeTag: 'full_builds' },
      },
      candidates: [
        {
          id: 'repairer-1',
          userId: 'gc-user-repairer',
          name: 'Repair Pro',
          specialtyCategory: 'general_contractor',
          specialtyTags: ['repairs', 'maintenance'],
          specialty: 'Repairer',
          description: 'Fixes household faults and maintenance jobs only.',
          location: 'Wuse, Abuja',
          experienceYears: 9,
          rating: 4.9,
          reviews: 18,
          projects: 42,
          verified: true,
          hiringFee: 250000,
          type: 'general_contractor',
          user: {
            id: 'gc-user-repairer',
            fullName: 'Repair Pro',
            email: 'repair@example.com',
            phone: '000',
            pictureUrl: null,
            role: 'general_contractor',
            verified: true,
          },
          _count: {
            certifications: 2,
          },
        },
      ],
    });

    const matches = await service.recommendGCs('project-1', 3);
    expect(matches).toHaveLength(0);
  });

  it('applies AI reranker ordering when feature flag is enabled', async () => {
    const { service, openAIService } = buildService({
      matchingVersion: 'v1',
      aiRerankEnabled: true,
      aiRerankResponse: {
        orderedContractorIds: ['contractor-2', 'contractor-1'],
        reasonsById: {
          'contractor-2': ['Closer to project location', 'Better reliability signal'],
        },
      },
      candidates: [
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
          _count: { certifications: 2 },
        },
        {
          id: 'contractor-2',
          userId: 'gc-user-2',
          name: 'Prime GC',
          specialtyCategory: 'renovator',
          specialtyTags: ['kitchen', 'interior'],
          specialty: 'Renovation',
          description: 'High-performing renovation GC with strong response metrics.',
          location: 'Lekki, Lagos',
          experienceYears: 12,
          rating: 4.7,
          reviews: 20,
          projects: 55,
          verified: true,
          hiringFee: 290000,
          type: 'general_contractor',
          user: {
            id: 'gc-user-2',
            fullName: 'Prime GC',
            email: 'gc2@example.com',
            phone: '000',
            pictureUrl: null,
            role: 'general_contractor',
            verified: true,
          },
          _count: { certifications: 2 },
        },
      ],
    });

    const matches = await service.recommendGCs('project-1', 2);
    expect(openAIService.rerankContractorMatches).toHaveBeenCalled();
    expect(matches[0].id).toBe('contractor-2');
  });
});

