import { ContractorMatcherService } from './contractor-matcher.service';

describe('ContractorMatcherService', () => {
  let service: ContractorMatcherService;

  beforeEach(() => {
    service = new ContractorMatcherService();
  });

  it('filters out non-eligible contractors via strict gates', () => {
    const result = service.recommend({
      project: {
        id: 'project-1',
        state: 'Lagos',
        city: 'Ikeja',
        budget: 12000000,
        aiAnalysis: { projectTypeTag: 'repair' },
      },
      candidates: [
        {
          id: 'c1',
          userId: 'u1',
          verified: true,
          user: { id: 'u1', role: 'general_contractor', verified: true },
          specialtyCategory: 'repairer',
          location: 'Ikeja, Lagos',
          rating: 4.8,
          reviews: 11,
          projects: 40,
        },
        {
          id: 'c2',
          userId: 'u2',
          verified: true,
          user: { id: 'u2', role: 'general_contractor', verified: true },
          specialtyCategory: 'upgrader',
          location: 'Abuja',
          rating: 4.9,
          reviews: 50,
          projects: 90,
        },
      ],
      limit: 3,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].id).toBe('c1');
    expect(result.diagnostics.filteredCounts.specialtyMismatch).toBe(1);
  });

  it('returns match score, breakdown and reasons', () => {
    const result = service.recommend({
      project: {
        id: 'project-2',
        state: 'Lagos',
        city: 'Lekki',
        budget: 25000000,
        aiAnalysis: {
          projectTypeTag: 'full_builds',
          rooms: ['kitchen', 'living room'],
          materials: ['reinforced concrete', 'steel beams'],
          features: ['solar', 'smart home'],
        },
      },
      candidates: [
        {
          id: 'c1',
          userId: 'u1',
          verified: true,
          user: { id: 'u1', role: 'general_contractor', verified: true },
          specialtyCategory: 'general_contractor',
          specialtyTags: ['smart home', 'concrete'],
          description: 'General contractor specialized in smart homes and high-rise builds.',
          location: 'Lekki, Lagos',
          rating: 4.8,
          reviews: 31,
          projects: 120,
          experienceYears: 12,
          certificationCount: 3,
          requestStats: {
            total: 20,
            accepted: 12,
            rejected: 4,
            pending: 4,
            responded: 18,
            responseRate: 0.9,
            acceptanceRate: 0.6,
            avgResponseHours: 14,
          },
          disputeStats: {
            total: 3,
            open: 0,
            inReview: 1,
            resolved: 2,
          },
        },
      ],
      limit: 3,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matchScore).toBeGreaterThan(0);
    expect(result.matches[0].matchScore).toBeLessThanOrEqual(100);
    expect(result.matches[0].matchBreakdown.capabilityFit).toBeGreaterThan(0);
    expect(Array.isArray(result.matches[0].matchReasons)).toBe(true);
    expect(result.matches[0].matchReasons.length).toBeGreaterThan(0);
  });

  it('applies deterministic tie-breakers when scores are equal', () => {
    const result = service.recommend({
      project: {
        id: 'project-3',
        state: 'Lagos',
        city: 'Yaba',
        budget: 15000000,
        aiAnalysis: { projectTypeTag: 'renovation' },
      },
      candidates: [
        {
          id: 'a',
          userId: 'ua',
          verified: true,
          user: { id: 'ua', role: 'general_contractor', verified: true },
          specialtyCategory: 'renovator',
          location: 'Yaba, Lagos',
          rating: 4.7,
          reviews: 20,
          projects: 40,
          requestStats: {
            total: 8,
            accepted: 3,
            rejected: 2,
            pending: 3,
            responded: 4,
            responseRate: 0.5,
            acceptanceRate: 0.37,
            avgResponseHours: 48,
          },
        },
        {
          id: 'b',
          userId: 'ub',
          verified: true,
          user: { id: 'ub', role: 'general_contractor', verified: true },
          specialtyCategory: 'renovator',
          location: 'Yaba, Lagos',
          rating: 4.7,
          reviews: 20,
          projects: 40,
          requestStats: {
            total: 8,
            accepted: 3,
            rejected: 2,
            pending: 3,
            responded: 8,
            responseRate: 1,
            acceptanceRate: 0.37,
            avgResponseHours: 12,
          },
        },
      ],
      limit: 2,
    });

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].id).toBe('b');
  });
});

