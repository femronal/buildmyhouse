import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  ProfessionalListingStatus,
  ProfessionalOwnershipStatus,
  ProfessionalReviewStatus,
  ProfessionalVerificationStatus,
} from '@prisma/client';
import { ProfessionalsService } from './professionals.service';

function mockPrisma(overrides: Record<string, any> = {}) {
  const prisma: any = {
    professionCatalog: { upsert: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    professionSpecialty: { upsert: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    professionService: { upsert: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    professionDeliverable: { upsert: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    professionalProjectStage: { upsert: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    professionalNeed: { upsert: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    professionalListing: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    professionalListingSpecialty: { deleteMany: jest.fn(), createMany: jest.fn() },
    professionalListingService: { deleteMany: jest.fn(), createMany: jest.fn() },
    professionalListingDeliverable: { deleteMany: jest.fn(), createMany: jest.fn() },
    professionalListingStage: { deleteMany: jest.fn(), createMany: jest.fn() },
    professionalCredential: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    professionalCredentialDocument: { create: jest.fn() },
    professionalProcurementProfile: { create: jest.fn(), upsert: jest.fn() },
    professionalApplication: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    professionalClaimRequest: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    professionalEnquiry: { create: jest.fn(), findMany: jest.fn() },
    professionalEngagement: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    project: { findUnique: jest.fn() },
    stage: { findFirst: jest.fn() },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
    ...overrides,
  };
  return prisma;
}

const listedRow = {
  id: 'p1',
  slug: 'lagos-qs',
  displayName: 'Lagos QS',
  professionalType: 'firm',
  listingStatus: ProfessionalListingStatus.listed,
  ownershipStatus: ProfessionalOwnershipStatus.unclaimed,
  verificationStatus: ProfessionalVerificationStatus.verified,
  usedByBmh: true,
  phone: '0801',
  email: 'qs@example.com',
  publicPhone: false,
  publicEmail: false,
  publicWhatsapp: false,
  publicWebsite: true,
  website: null,
  city: 'Lagos',
  state: 'Lagos',
  serviceStates: ['Lagos'],
  remoteConsultation: true,
  siteVisits: true,
  canIssueSignedReport: true,
  yearsExperience: 10,
  completenessScore: 70,
  bio: 'Quantity surveying practice.',
  updatedAt: new Date(),
  primaryProfession: { id: 'profession_quantity_surveyor', key: 'quantity-surveyor', label: 'Quantity Surveyor' },
  specialties: [],
  services: [{ service: { key: 'review-variation-request', label: 'Review variation request' } }],
  deliverables: [],
  projectStages: [],
  credentials: [],
};

describe('ProfessionalsService', () => {
  it('searchPublic only queries listed professionals', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.count.mockResolvedValue(1);
    prisma.professionalListing.findMany.mockResolvedValue([listedRow]);
    const service = new ProfessionalsService(prisma);
    const result = await service.searchPublic({ q: 'BOQ', page: 1, limit: 20 });
    expect(prisma.professionalListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ listingStatus: ProfessionalListingStatus.listed, archivedAt: null }),
          ]),
        }),
      }),
    );
    expect(result.data[0].slug).toBe('lagos-qs');
    expect(result.data[0].trust.usedByBmh).toBe(true);
    expect((result.data[0] as any).phone).toBeUndefined();
  });

  it('getPublicBySlug 404s for draft/hidden/archived', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findFirst.mockResolvedValue(null);
    const service = new ProfessionalsService(prisma);
    await expect(service.getPublicBySlug('secret')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.professionalListing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ listingStatus: ProfessionalListingStatus.listed }),
      }),
    );
  });

  it('filters public search by service, location, verification and usedByBmh', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findMany.mockResolvedValue([]);
    const service = new ProfessionalsService(prisma);
    await service.searchPublic({
      service: 'review-variation-request',
      state: 'lagos',
      credentialChecked: true,
      usedByBmh: true,
    });
    const where = prisma.professionalListing.findMany.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain('review-variation-request');
    expect(JSON.stringify(where)).toContain('usedByBmh');
    expect(JSON.stringify(where)).toContain('verified');
  });

  it('creates an application without publishing a listing or requiring a User', async () => {
    const prisma = mockPrisma();
    prisma.professionCatalog.findFirst.mockResolvedValue({ id: 'profession_quantity_surveyor' });
    prisma.professionalApplication.create.mockResolvedValue({ id: 'app1', status: 'pending' });
    const service = new ProfessionalsService(prisma);
    const result = await service.apply({
      professionalType: 'firm' as any,
      displayName: 'North QS',
      professionKey: 'quantity-surveyor',
      email: 'qs@example.com',
    });
    expect(result.status).toBe('pending');
    expect(prisma.professionalListing.create).not.toHaveBeenCalled();
  });

  it('accepts a claim without marking the listing verified', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findFirst.mockResolvedValue({
      id: 'p1',
      listingStatus: ProfessionalListingStatus.listed,
    });
    prisma.professionalClaimRequest.create.mockResolvedValue({ id: 'c1', status: 'pending' });
    const service = new ProfessionalsService(prisma);
    await service.claim({
      slug: 'lagos-qs',
      requesterName: 'Ada',
      relationshipToPractice: 'Principal',
      email: 'ada@example.com',
    });
    expect(prisma.professionalListing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { ownershipStatus: ProfessionalOwnershipStatus.claim_pending },
      }),
    );
  });

  it('admin can create a listing with no linked user', async () => {
    const prisma = mockPrisma();
    prisma.professionCatalog.findUnique.mockResolvedValue({ id: 'profession_structural_engineer', key: 'structural-engineer' });
    prisma.professionalListing.findMany.mockResolvedValue([]);
    prisma.professionalListing.findFirst.mockResolvedValue(null);
    prisma.professionalListing.create.mockResolvedValue({ id: 'p9', displayName: 'Adewale' });
    prisma.professionalListing.findUnique.mockResolvedValue({
      ...listedRow,
      id: 'p9',
      linkedUserId: null,
      procurement: {},
      engagements: [],
      claims: [],
      applications: [],
      enquiries: [],
    });
    const service = new ProfessionalsService(prisma);
    const created = await service.adminCreate('admin-1', {
      displayName: 'Adewale',
      primaryProfessionId: 'profession_structural_engineer',
    });
    expect(created.linkedUserId).toBeNull();
    expect(prisma.professionalListing.create).toHaveBeenCalled();
  });

  it('blocks regulated verification without a checked credential', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      primaryProfession: { verificationMode: 'regulator' },
      credentials: [],
    });
    const service = new ProfessionalsService(prisma);
    await expect(
      service.setVerification('admin-1', 'p1', { verificationStatus: ProfessionalVerificationStatus.verified }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an engagement against a project with optional stage and never touches payments', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
    prisma.stage.findFirst.mockResolvedValue({ id: 'stg1', projectId: 'proj1' });
    prisma.professionalEngagement.create.mockResolvedValue({ id: 'e1', projectId: 'proj1', stageId: 'stg1' });
    const service = new ProfessionalsService(prisma);
    const created = await service.createEngagement('admin-1', 'p1', {
      projectId: 'proj1',
      stageId: 'stg1',
      purpose: 'Independent reinforcement inspection before concrete pour.',
    });
    expect(created.stageId).toBe('stg1');
    expect(prisma.stage.update).toBeUndefined();
  });

  it('stage is optional on engagements', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
    prisma.professionalEngagement.create.mockResolvedValue({ id: 'e1', stageId: null });
    const service = new ProfessionalsService(prisma);
    const created = await service.createEngagement('admin-1', 'p1', {
      projectId: 'proj1',
      purpose: 'Review variation request independently.',
    });
    expect(created.stageId).toBeNull();
    expect(prisma.stage.findFirst).not.toHaveBeenCalled();
  });

  it('detects duplicate regulator registration numbers', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      displayName: 'A',
      professionalType: 'individual',
      primaryProfession: { regulatorKey: 'coren', regulatorLabel: 'COREN' },
    });
    prisma.professionalCredential.findUnique.mockResolvedValue({
      id: 'other',
      professionalListingId: 'p2',
    });
    const service = new ProfessionalsService(prisma);
    await expect(
      service.addCredential('admin-1', 'p1', { regulatorKey: 'coren', registrationNumber: 'R123', markChecked: true }),
    ).rejects.toThrow(/already on another listing/);
  });

  it('approving a claim marks claimed, not verified', async () => {
    const prisma = mockPrisma();
    prisma.professionalClaimRequest.findUnique.mockResolvedValue({
      id: 'c1',
      professionalListingId: 'p1',
    });
    prisma.professionalListing.findUnique.mockResolvedValue({
      ...listedRow,
      ownershipStatus: ProfessionalOwnershipStatus.claimed,
      verificationStatus: ProfessionalVerificationStatus.unverified,
      procurement: {},
      engagements: [],
      claims: [],
      applications: [],
      enquiries: [],
    });
    const service = new ProfessionalsService(prisma);
    const result = await service.reviewClaim('admin-1', 'c1', { status: ProfessionalReviewStatus.approved });
    expect(prisma.professionalListing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownershipStatus: ProfessionalOwnershipStatus.claimed }),
      }),
    );
    expect(result.verificationStatus).toBe(ProfessionalVerificationStatus.unverified);
  });

  it('blocks public self-verify', () => {
    const service = new ProfessionalsService(mockPrisma());
    expect(() => service.assertPublicCannotSelfVerify()).toThrow(ForbiddenException);
  });

  it('requires a note when marking historical Used by BMH', async () => {
    const prisma = mockPrisma();
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      usedByBmh: false,
      usedByBmhNote: null,
      listedAt: null,
      archivedAt: null,
    });
    const service = new ProfessionalsService(prisma);
    await expect(service.adminUpdate('p1', { usedByBmh: true })).rejects.toBeInstanceOf(BadRequestException);
  });
});
