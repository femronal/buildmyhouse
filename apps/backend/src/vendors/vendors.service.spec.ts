import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  VendorClaimStatus,
  VendorListingStatus,
  VendorVerificationStatus,
} from '@prisma/client';
import { VendorsService } from './vendors.service';

function mockPrisma(overrides: Record<string, any> = {}) {
  return {
    vendorProfile: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    vendorClaimInvite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    vendorQuoteRequest: { create: jest.fn() },
    vendorActivity: { create: jest.fn() },
    vendorAdminNote: { create: jest.fn() },
    vendorOffering: { deleteMany: jest.fn(), createMany: jest.fn() },
    vendorServiceArea: { deleteMany: jest.fn(), createMany: jest.fn() },
    vendorRepresentative: { deleteMany: jest.fn(), create: jest.fn() },
    vendorDocument: { create: jest.fn() },
    vendorVerificationCheck: { upsert: jest.fn(), findMany: jest.fn() },
    vendorProfileChangeRequest: { create: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
    ...overrides,
  };
}

describe('VendorsService', () => {
  const email = { send: jest.fn().mockResolvedValue(true) };

  it('searchPublic returns only listed vendors via where clause', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.count.mockResolvedValue(1);
    prisma.vendorProfile.findMany.mockResolvedValue([
      {
        id: '1',
        slug: 'acme',
        tradingName: 'Acme',
        logoUrl: null,
        description: null,
        listingStatus: VendorListingStatus.listed,
        verificationStatus: VendorVerificationStatus.verified,
        businessTypes: [],
        stateLabel: 'Lagos',
        cityLabel: null,
        yearEstablished: null,
        profileCompleteness: 50,
        nationwideDelivery: false,
        interstateDelivery: false,
        offerings: [],
        updatedAt: new Date(),
      },
    ]);
    const service = new VendorsService(prisma as any, email as any);
    const result = await service.searchPublic({ page: 1, limit: 20 });
    expect(prisma.vendorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          listingStatus: VendorListingStatus.listed,
          deletedAt: null,
        }),
      }),
    );
    expect(result.data[0].slug).toBe('acme');
    expect(result.data[0].isBuildMyHouseVerified).toBe(true);
  });

  it('getPublicBySlug 404s for internal_only vendors', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findFirst.mockResolvedValue(null);
    const service = new VendorsService(prisma as any, email as any);
    await expect(service.getPublicBySlug('secret-supplier')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.vendorProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          listingStatus: VendorListingStatus.listed,
        }),
      }),
    );
  });

  it('blocks vendor self-verify / self-approve', () => {
    const service = new VendorsService(mockPrisma() as any, email as any);
    expect(() => service.assertVendorCannotSelfVerify()).toThrow(ForbiddenException);
  });

  it('adminCreate can save incomplete internal-only vendor', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findUnique.mockResolvedValue(null);
    prisma.vendorProfile.findMany.mockResolvedValue([]);
    prisma.vendorProfile.create.mockResolvedValue({
      id: 'v1',
      tradingName: 'WhatsApp Lead',
      listingStatus: VendorListingStatus.internal_only,
      claimStatus: VendorClaimStatus.unclaimed,
    });
    const service = new VendorsService(prisma as any, email as any);
    const created = await service.adminCreate('admin-1', {
      tradingName: 'WhatsApp Lead',
      publicWhatsApp: '08012345678',
      saveAsInternalOnly: true,
      acquisitionNote: 'From site WhatsApp',
    });
    expect(prisma.vendorProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          listingStatus: VendorListingStatus.internal_only,
          createdByAdminId: 'admin-1',
        }),
      }),
    );
    expect(created.listingStatus).toBe(VendorListingStatus.internal_only);
  });

  it('claim invite cannot be reused', async () => {
    const prisma = mockPrisma();
    prisma.vendorClaimInvite.findUnique.mockResolvedValue({
      id: 'inv1',
      vendorProfileId: 'v1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });
    const service = new VendorsService(prisma as any, email as any);
    await expect(service.previewClaim('raw-token')).rejects.toThrow(/already been used/i);
  });

  it('adminApproveListing publishes without auto-verifying', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findFirst
      .mockResolvedValueOnce({
        id: 'v1',
        listingStatus: VendorListingStatus.submitted,
        publicEmail: null,
        tradingName: 'Acme',
        slug: 'acme',
        deletedAt: null,
      })
      .mockResolvedValueOnce({
        id: 'v1',
        listingStatus: VendorListingStatus.listed,
        verificationStatus: VendorVerificationStatus.unverified,
        deletedAt: null,
        offerings: [],
        serviceAreas: [],
        representatives: [],
        verificationChecks: [],
        documents: [],
        adminNotes: [],
        activities: [],
        claimInvites: [],
        quoteRequests: [],
        changeRequests: [],
      });
    prisma.vendorProfile.update.mockResolvedValue({});
    prisma.vendorActivity.create.mockResolvedValue({});
    const service = new VendorsService(prisma as any, email as any);
    const result = await service.adminApproveListing('v1', 'admin-1', {});
    expect(prisma.vendorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          listingStatus: VendorListingStatus.listed,
        }),
      }),
    );
    const updateData = prisma.vendorProfile.update.mock.calls[0][0].data;
    expect(updateData.verificationStatus).toBeUndefined();
    expect(result.listingStatus).toBe(VendorListingStatus.listed);
  });
});
