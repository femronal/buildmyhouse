import { ConflictException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ArtisanRecruitmentStatus } from '@prisma/client';
import { ProfessionalsService } from '../professionals/professionals.service';
import { VendorsService } from '../vendors/vendors.service';
import { ArtisansAdminController } from './artisans-admin.controller';
import { ArtisansService } from './artisans.service';

function serviceWith() {
  const prisma: any = {
    artisanListing: { findUnique: jest.fn(), update: jest.fn() },
    artisanClaimInvite: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    artisanClaimRequest: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    contractor: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg))),
  };
  return { prisma, service: new ArtisansService(prisma) };
}

function managedListing(listing: Record<string, any>) {
  return {
    slug: 'designfab-metal-works',
    displayName: 'Designfab Metal Works',
    businessName: null,
    bio: null,
    primaryTradeId: 'trade',
    primaryTrade: { id: 'trade', label: 'Welder' },
    phone: null,
    email: null,
    whatsapp: null,
    website: null,
    publicPhone: true,
    publicEmail: false,
    publicWhatsapp: true,
    publicWebsite: true,
    workingHours: null,
    address: null,
    city: 'Abuja',
    state: 'FCT',
    serviceStates: [],
    serviceCities: [],
    listingStatus: 'listed',
    verificationStatus: 'unverified',
    usedByBmh: false,
    capabilities: [],
    media: [],
    checks: [],
    ...listing,
  };
}

describe('artisan claim links', () => {
  it('returns the existing link instead of creating another', async () => {
    const { prisma, service } = serviceWith();
    prisma.artisanListing.findUnique.mockResolvedValue({ id: 'a1', email: null, phone: null, linkedUserId: null });
    const existing = {
      id: 'inv',
      rawToken: 'a'.repeat(64),
      expiresAt: new Date(Date.now() + 86400000),
      emailedAt: null,
    };
    prisma.artisanClaimInvite.findMany.mockResolvedValue([existing]);
    const result = await service.ensureClaimLink('a1', 'admin');
    expect(prisma.artisanClaimInvite.create).not.toHaveBeenCalled();
    expect(result.claimUrl).toBe(`https://buildmyhouse.app/artisans/claim/${'a'.repeat(64)}`);
    expect(result.status).toBe('generated');
  });

  it('does not expose the token on the public profile shape', () => {
    const reflector = new Reflector();
    expect(reflector.get<string[]>('roles', ArtisansAdminController)).toEqual(['admin']);
  });

  it('promotes a homeowner who accepts an artisan claim and does not create a second contractor row', async () => {
    const { prisma, service } = serviceWith();
    const invite = {
      id: 'inv',
      artisanListingId: 'a1',
      usedAt: null as Date | null,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    };
    const listing: Record<string, any> = {
      id: 'a1',
      linkedUserId: null,
      linkedContractorId: null,
      claimedAt: null,
      claimStatus: 'unclaimed',
      recruitmentStatus: ArtisanRecruitmentStatus.discovered,
    };
    const user: Record<string, any> = {
      id: 'u1',
      role: 'homeowner',
      fullName: 'Yunusa Usman',
      profileSetupCompleted: false,
      artisanClaimAccess: false,
    };
    let contractor: Record<string, any> | null = null;
    prisma.user.findUnique.mockImplementation(async () => user);
    prisma.user.update.mockImplementation(async ({ data }: any) => Object.assign(user, data));
    prisma.artisanClaimInvite.findUnique.mockImplementation(async () => invite);
    prisma.artisanClaimInvite.update.mockImplementation(async () => {
      invite.usedAt = new Date();
      return invite;
    });
    prisma.artisanListing.findUnique.mockImplementation(async ({ include }: any) =>
      include ? managedListing(listing) : listing,
    );
    prisma.artisanListing.update.mockImplementation(async ({ data }: any) => Object.assign(listing, data));
    prisma.contractor.findUnique.mockImplementation(async () => contractor);
    prisma.contractor.create.mockImplementation(async ({ data }: any) => {
      contractor = { id: 'c1', ...data };
      return contractor;
    });

    const first = await service.acceptClaim('raw-token', 'u1');
    const second = await service.acceptClaim('raw-token', 'u1');

    expect(user.role).toBe('general_contractor');
    expect(user.profileSetupCompleted).toBe(true);
    expect(user.artisanClaimAccess).toBe(true);
    expect(contractor).toEqual(expect.objectContaining({
      platformKind: 'artisan',
      verified: false,
      type: 'general_contractor',
    }));
    expect(prisma.contractor.create).toHaveBeenCalledTimes(1);
    expect(listing.linkedUserId).toBe('u1');
    expect(listing.linkedContractorId).toBe('c1');
    expect(first.redirectTo).toBe('contractor');
    expect(second.redirectTo).toBe('contractor');
    expect(second.introPending).toBe(true);
  });

  it('keeps an existing general contractor role and reuses the contractor row', async () => {
    const { prisma, service } = serviceWith();
    const existing = {
      id: 'c-existing',
      userId: 'u1',
      platformKind: 'artisan',
      verified: false,
    };
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'general_contractor',
      fullName: 'Ada',
      profileSetupCompleted: true,
    });
    prisma.artisanClaimInvite.findUnique.mockResolvedValue({
      id: 'inv',
      artisanListingId: 'a1',
      usedAt: null,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    prisma.artisanListing.findUnique.mockImplementation(async ({ include }: any) => {
      const listing = {
        id: 'a1',
        linkedUserId: null,
        linkedContractorId: null,
        claimedAt: null,
        recruitmentStatus: ArtisanRecruitmentStatus.claim_invited,
      };
      return include ? managedListing(listing) : listing;
    });
    prisma.contractor.findUnique.mockResolvedValue(existing);

    await service.acceptClaim('raw-token', 'u1');

    expect(prisma.contractor.create).not.toHaveBeenCalled();
    const userWrite = prisma.user.update.mock.calls[0][0].data;
    expect(userWrite.role).toBeUndefined();
    expect(userWrite.artisanClaimAccess).toBe(true);
    expect(prisma.artisanListing.update.mock.calls[0][0].data.linkedContractorId).toBe('c-existing');
  });

  it('rejects a second person who tries to claim a linked listing', async () => {
    const { prisma, service } = serviceWith();
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', role: 'homeowner', fullName: 'Other', profileSetupCompleted: false });
    prisma.artisanClaimInvite.findUnique.mockResolvedValue({
      id: 'inv',
      artisanListingId: 'a1',
      usedAt: new Date(),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    prisma.artisanListing.findUnique.mockResolvedValue({
      id: 'a1',
      linkedUserId: 'u1',
      recruitmentStatus: ArtisanRecruitmentStatus.claimed,
    });

    await expect(service.acceptClaim('raw-token', 'u2')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.contractor.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('promotes a homeowner when an admin approves their claim request', async () => {
    const { prisma, service } = serviceWith();
    prisma.artisanClaimRequest.findUnique.mockResolvedValue({
      id: 'req',
      artisanListingId: 'a1',
      requesterUserId: 'u1',
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'homeowner',
      fullName: 'Yunusa Usman',
      profileSetupCompleted: false,
    });
    prisma.artisanListing.findUnique.mockImplementation(async ({ include }: any) => {
      const listing = {
        id: 'a1',
        slug: 'designfab-metal-works',
        linkedUserId: null,
        claimedAt: null,
        recruitmentStatus: ArtisanRecruitmentStatus.discovered,
      };
      return include ? managedListing(listing) : listing;
    });
    prisma.contractor.create.mockResolvedValue({ id: 'c1', platformKind: 'artisan', verified: false });

    await service.reviewClaim('admin', 'req', { status: 'approved' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        artisanClaimAccess: true,
        role: 'general_contractor',
        profileSetupCompleted: true,
      },
    });
    expect(prisma.contractor.create.mock.calls[0][0].data).toEqual(expect.objectContaining({
      platformKind: 'artisan',
      verified: false,
    }));
  });
});

describe('vendor and professional claim roles stay as they are', () => {
  it('turns a homeowner who accepts a vendor claim into a vendor', async () => {
    const prisma: any = {
      vendorClaimInvite: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      vendorProfile: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      vendorActivity: { create: jest.fn().mockResolvedValue({}) },
      user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn(async (arg: any) => Promise.all(arg)),
    };
    prisma.vendorClaimInvite.findUnique.mockResolvedValue({
      id: 'inv',
      vendorProfileId: 'v1',
      email: 'shop@example.com',
      usedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'homeowner', fullName: 'Shop Owner' });
    prisma.vendorProfile.findFirst.mockResolvedValue({
      id: 'v1',
      userId: null,
      claimStatus: 'unclaimed',
      claimedAt: null,
      procurementRelationship: 'never_contacted',
    });
    prisma.vendorProfile.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 'v1', documents: [] });
    const service = new VendorsService(prisma, { send: jest.fn() } as any);

    await service.acceptClaim('raw-token', 'u1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'vendor' },
    });
  });

  it('turns a homeowner who accepts a professional claim into a general contractor', async () => {
    const prisma: any = {
      professionalClaimInvite: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      professionalListing: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      contractor: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'c1' }) },
      $transaction: jest.fn(async (arg: any) => arg(prisma)),
    };
    prisma.professionalClaimInvite.findUnique.mockResolvedValue({
      id: 'inv',
      professionalListingId: 'p1',
      email: 'pro@example.com',
      usedAt: null,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'homeowner', fullName: 'Pro Owner' });
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      displayName: 'IAA',
      claimedByUserId: null,
      linkedUserId: null,
      claimedAt: null,
      city: 'Lagos',
      state: 'Lagos',
      yearsExperience: 4,
      primaryProfession: { label: 'Architect' },
    });
    prisma.professionalListing.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        id: 'p1',
        slug: 'iaa',
        displayName: 'IAA',
        serviceStates: [],
        serviceCities: [],
        services: [],
        credentials: [],
        documents: [],
      });
    const service = new ProfessionalsService(prisma);

    await service.acceptClaim('raw-token', 'u1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'general_contractor', profileSetupCompleted: true },
    });
  });
});
