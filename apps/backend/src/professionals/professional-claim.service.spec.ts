import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ProfessionalCredentialVerification, ProfessionalOwnershipStatus } from '@prisma/client';
import { ProfessionalsService } from './professionals.service';

function serviceWith(overrides: Record<string, any> = {}) {
  const prisma: any = {
    professionalListing: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    professionalClaimInvite: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    professionalCredential: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    professionalDocument: { create: jest.fn() },
    professionalListingService: { deleteMany: jest.fn(), createMany: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
    ...overrides,
  };
  const email = { send: jest.fn().mockResolvedValue({ id: 'email-1' }) };
  return { prisma, email, service: new ProfessionalsService(prisma, email as any) };
}

describe('professional claim invites', () => {
  it('sends a single-use invite without changing the admin ownership flag', async () => {
    const { prisma, email, service } = serviceWith();
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: '8215319e-943b-4eef-aeb5-1db2b9237f4f',
      displayName: 'IAA Associates Limited',
      email: 'iaa@example.com',
      phone: '0801',
      ownershipStatus: ProfessionalOwnershipStatus.unclaimed,
    });
    prisma.professionalClaimInvite.create.mockImplementation(async ({ data }: any) => ({ id: 'inv1', ...data }));
    prisma.professionalListing.update.mockResolvedValue({});

    const result = await service.adminCreateClaimInvite('8215319e-943b-4eef-aeb5-1db2b9237f4f', 'admin1', {
      email: 'iaa@example.com',
    });

    expect(result.claimUrl).toContain('https://buildmyhouse.app/professionals/claim/');
    expect(result.status).toBe('pending');
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'iaa@example.com',
        subject: 'Claim your BuildMyHouse professional listing',
      }),
    );
    const created = prisma.professionalClaimInvite.create.mock.calls[0][0].data;
    expect(created.tokenHash).toHaveLength(64);
    expect(created.tokenHash).not.toBe(result.claimUrl.split('/').pop());
    const listingUpdate = prisma.professionalListing.update.mock.calls[0][0].data;
    expect(listingUpdate.ownershipStatus).toBeUndefined();
    expect(listingUpdate.claimedAt).toBeUndefined();
    expect(listingUpdate.claimEmail).toBe('iaa@example.com');
  });

  it('attaches the listing on accept and does not mark it verified or change ownership status', async () => {
    const { prisma, service } = serviceWith();
    const raw = 'abc123';
    const tokenHash = require('crypto').createHash('sha256').update(raw).digest('hex');
    prisma.professionalClaimInvite.findUnique.mockResolvedValue({
      id: 'inv1',
      professionalListingId: 'p1',
      tokenHash,
      email: 'owner@example.com',
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
      revokedAt: null,
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'user1', role: 'homeowner' });
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      claimedByUserId: null,
      linkedUserId: null,
      claimedAt: null,
      ownershipStatus: ProfessionalOwnershipStatus.unclaimed,
      verificationStatus: 'unverified',
    });
    prisma.professionalListing.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'p1',
      slug: 'iaa',
      displayName: 'IAA Associates Limited',
      credentials: [],
      services: [],
      documents: [],
      serviceStates: [],
      serviceCities: [],
    });

    await service.acceptClaim(raw, 'user1');

    const writes = prisma.$transaction.mock.calls[0][0];
    expect(writes).toHaveLength(2);
    const listingWrite = prisma.professionalListing.update.mock.calls[0][0].data;
    expect(listingWrite.claimedByUserId).toBe('user1');
    expect(listingWrite.linkedUserId).toBe('user1');
    expect(listingWrite.claimedAt).toBeInstanceOf(Date);
    expect(listingWrite.ownershipStatus).toBeUndefined();
    expect(listingWrite.verificationStatus).toBeUndefined();
    expect(prisma.user.update).toBeUndefined();
  });

  it('rejects a used, expired, or revoked token without writing', async () => {
    const cases = [
      { usedAt: new Date(), revokedAt: null, expiresAt: new Date(Date.now() + 1000), error: ConflictException },
      { usedAt: null, revokedAt: new Date(), expiresAt: new Date(Date.now() + 1000), error: BadRequestException },
      { usedAt: null, revokedAt: null, expiresAt: new Date(Date.now() - 1000), error: BadRequestException },
    ];
    for (const row of cases) {
      const { prisma, service } = serviceWith();
      prisma.professionalClaimInvite.findUnique.mockResolvedValue({
        id: 'inv1',
        professionalListingId: 'p1',
        ...row,
      });
      await expect(service.previewClaim('dead-token')).rejects.toBeInstanceOf(row.error);
      expect(prisma.professionalListing.update).not.toHaveBeenCalled();
    }
  });

  it('rejects owner attempts to set verification or used-by-BMH', () => {
    const { service } = serviceWith();
    expect(() => service.assertOwnerCannotEscalate({ verificationStatus: 'verified' })).toThrow(ForbiddenException);
    expect(() => service.assertOwnerCannotEscalate({ usedByBmh: true, listingStatus: 'listed' })).toThrow(
      ForbiddenException,
    );
    expect(() => service.assertOwnerCannotEscalate({ markChecked: true })).toThrow(ForbiddenException);
    expect(() => service.assertPublicCannotSelfVerify()).toThrow(ForbiddenException);
  });

  it('sends a checked registration number back to needs re-check when the owner changes it', async () => {
    const { prisma, service } = serviceWith();
    prisma.professionalListing.findFirst.mockResolvedValue({
      id: 'p1',
      credentials: [],
      services: [],
      documents: [],
      specialties: [],
      deliverables: [],
      projectStages: [],
    });
    prisma.professionalCredential.findFirst.mockResolvedValue({
      id: 'cred1',
      professionalListingId: 'p1',
      regulatorKey: 'coren',
      registrationNumber: 'R100',
      normalizedRegKey: 'coren:r100',
      verificationStatus: ProfessionalCredentialVerification.checked,
      verifiedAt: new Date(),
      verifiedByAdminId: 'admin1',
    });
    prisma.professionalCredential.findUnique.mockResolvedValue(null);
    prisma.professionalCredential.update.mockResolvedValue({});
    prisma.professionalCredential.findMany.mockResolvedValue([
      {
        isPrimary: true,
        verificationStatus: ProfessionalCredentialVerification.needs_recheck,
        credentialStatus: 'current',
        expiresAt: null,
      },
    ]);
    prisma.professionalListing.update.mockResolvedValue({});
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      displayName: 'IAA',
      professionalType: 'firm',
      primaryProfessionId: 'profession_architect',
      phone: null,
      email: null,
      website: null,
      whatsapp: null,
      city: 'Lagos',
      state: 'Lagos',
      bio: null,
      yearsExperience: null,
      serviceStates: [],
      specialties: [],
      services: [],
      deliverables: [],
      projectStages: [],
      credentials: [],
      remoteConsultation: false,
      siteVisits: false,
      usedByBmh: false,
      verificationStatus: 'pending',
      ownershipStatus: 'unclaimed',
      completenessScore: 10,
    });

    await service.updateManagedCredential('user1', 'cred1', { registrationNumber: 'R200' });

    expect(prisma.professionalCredential.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          registrationNumber: 'R200',
          verificationStatus: ProfessionalCredentialVerification.needs_recheck,
          verifiedAt: null,
        }),
      }),
    );
  });

  it('stores an owner document as private and pending', async () => {
    const { prisma, service } = serviceWith();
    prisma.professionalListing.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.professionalDocument.create.mockImplementation(async ({ data }: any) => ({
      id: 'doc1',
      createdAt: new Date(),
      ...data,
    }));

    const created = await service.addManagedDocument('user1', {
      documentType: 'licence',
      fileRef: 'private/licence.pdf',
      label: 'COREN.pdf',
    });

    expect(created.reviewStatus).toBe('pending');
    expect(created).not.toHaveProperty('fileRef');
    expect(prisma.professionalDocument.create.mock.calls[0][0].data.isPublic).toBe(false);
  });
});
