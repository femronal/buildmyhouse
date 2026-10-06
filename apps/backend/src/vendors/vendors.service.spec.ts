import {
  BadRequestException,
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
    vendorRepresentative: { deleteMany: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    vendorDocument: { create: jest.fn(), findFirst: jest.fn() },
    vendorProduct: { deleteMany: jest.fn(), createMany: jest.fn() },
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
    expect(prisma.vendorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { verificationStatus: 'desc' },
          { profileCompleteness: 'desc' },
          { listedAt: 'desc' },
          { createdAt: 'desc' },
          { id: 'asc' },
        ],
      }),
    );
  });

  it('searchPublic sorts by trading name when sort=name', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.count.mockResolvedValue(0);
    prisma.vendorProfile.findMany.mockResolvedValue([]);
    const service = new VendorsService(prisma as any, email as any);
    await service.searchPublic({ page: 1, limit: 20, sort: 'name' });
    expect(prisma.vendorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ tradingName: 'asc' }, { id: 'asc' }],
      }),
    );
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

  it('persists a vendor street address on admin update (Nigerchin regression)', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findFirst.mockResolvedValue({
      id: 'nigerchin',
      publicAddress: 'old yard',
      websiteUrl: null,
      documents: [],
    });
    prisma.vendorProfile.update.mockResolvedValue({});
    prisma.vendorProfile.findUnique.mockResolvedValue({
      tradingName: 'Nigerchin',
      description: null,
      offerings: [],
      products: [],
      serviceAreas: [],
      documents: [],
      representatives: [],
      businessTypes: [],
      paymentMethodsAccepted: [],
      secondaryFamilyKeys: [],
      primaryFamilyKey: null,
      priceListAvailable: false,
    });
    prisma.vendorActivity.create.mockResolvedValue({});
    const service = new VendorsService(prisma as any, email as any);
    await service.adminUpdate('nigerchin', 'admin-1', {
      publicAddress: '12 Industrial Crescent, Lagos',
      websiteUrl: '',
    });
    expect(prisma.vendorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicAddress: '12 Industrial Crescent, Lagos',
          websiteUrl: null,
        }),
      }),
    );
    expect(prisma.vendorActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            changes: expect.arrayContaining([
              expect.objectContaining({
                field: 'publicAddress',
                old: 'old yard',
                new: '12 Industrial Crescent, Lagos',
              }),
            ]),
          }),
        }),
      }),
    );
  });

  it('refuses to mark registration Passed without an RC number and registry status', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findFirst.mockResolvedValue({
      id: 'v1',
      cacNumber: null,
      cacRegistryStatus: null,
    });
    const service = new VendorsService(prisma as any, email as any);
    await expect(
      service.adminUpsertVerificationChecks('v1', 'admin-1', {
        checks: [{ checkKey: 'business_registration' as any, status: 'passed' as any }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.vendorVerificationCheck.upsert).not.toHaveBeenCalled();
  });

  it('matches plywood in product names and aliases pop-ceilings to ceilings', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.count.mockResolvedValue(0);
    prisma.vendorProfile.findMany.mockResolvedValue([]);
    const service = new VendorsService(prisma as any, email as any);
    await service.searchPublic({ query: 'plywood', page: 1, limit: 20 });
    expect(JSON.stringify(prisma.vendorProfile.findMany.mock.calls[0][0].where)).toContain('plywood');
    await service.searchPublic({ familyKey: 'pop-ceilings', page: 1, limit: 20 });
    const categoryWhere = JSON.stringify(prisma.vendorProfile.findMany.mock.calls[1][0].where);
    expect(categoryWhere).toContain('ceilings');
    expect(categoryWhere).toContain('pop-ceilings');
  });

  it('returns a signed document URL instead of the stored public object URL', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findFirst.mockResolvedValue({
      id: 'v1',
      documents: [{ id: 'doc', fileRef: 'https://buildmyhouse-prod-uploads.s3.amazonaws.com/uploads/vendors/cac.pdf' }],
    });
    const uploads = { signGetUrl: jest.fn().mockResolvedValue('https://signed.example/cac?X-Amz-Signature=1') };
    const service = new VendorsService(prisma as any, email as any, uploads as any);
    const result = await service.adminGet('v1');
    expect(result.documents[0].fileRef).toBe('https://signed.example/cac?X-Amz-Signature=1');
    expect(result.documents[0].fileRef).not.toContain('cac.pdf');
  });

  function ownerProfile(overrides: Record<string, unknown> = {}) {
    return {
      id: 'vendor-1',
      userId: 'user-1',
      listingStatus: VendorListingStatus.listed,
      documents: [],
      offerings: [],
      products: [],
      serviceAreas: [],
      representatives: [],
      businessTypes: [],
      paymentMethodsAccepted: [],
      secondaryFamilyKeys: [],
      primaryFamilyKey: null,
      description: null,
      priceListAvailable: false,
      ...overrides,
    };
  }

  it('does not create a cement offering when an owner save has no category', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findUnique.mockResolvedValue(ownerProfile());
    prisma.vendorProfile.update.mockResolvedValue({});
    const service = new VendorsService(prisma as any, email as any);

    await service.updateManagedProfile('user-1', { description: 'Updated hours' });
    await service.updateManagedProfile('user-1', { offerings: [{ familyKey: '' }] });
    await service.updateManagedProfile('user-1', { offerings: [{ familyKey: '   ' }] });

    expect(prisma.vendorOffering.deleteMany).not.toHaveBeenCalled();
    expect(prisma.vendorOffering.createMany).not.toHaveBeenCalled();
  });

  it('creates exactly the category an owner chose', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findUnique.mockResolvedValue(ownerProfile());
    prisma.vendorProfile.update.mockResolvedValue({});
    const service = new VendorsService(prisma as any, email as any);

    await service.updateManagedProfile('user-1', {
      offerings: [{ familyKey: 'roofing-sheets', brands: ['Gerard'] }],
    });

    expect(prisma.vendorOffering.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ familyKey: 'roofing-sheets', brands: ['Gerard'] })],
    });
    expect(JSON.stringify(prisma.vendorOffering.createMany.mock.calls)).not.toContain('cement');
  });

  it('leaves existing offerings unchanged when the owner saves other fields', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findUnique.mockResolvedValue(
      ownerProfile({ offerings: [{ id: 'off-1', familyKey: 'doors', brands: ['Pearl'] }] }),
    );
    prisma.vendorProfile.update.mockResolvedValue({});
    const service = new VendorsService(prisma as any, email as any);

    await service.updateManagedProfile('user-1', { logoUrl: 'https://cdn.example/logo.png' });

    expect(prisma.vendorOffering.deleteMany).not.toHaveBeenCalled();
    expect(prisma.vendorOffering.createMany).not.toHaveBeenCalled();
  });

  it('keeps a representative phone when an admin save does not send one', async () => {
    const prisma = mockPrisma();
    prisma.vendorProfile.findFirst.mockResolvedValue({
      id: 'mayor',
      websiteUrl: null,
      documents: [],
    });
    prisma.vendorProfile.update.mockResolvedValue({});
    prisma.vendorProfile.findUnique.mockResolvedValue(ownerProfile({ id: 'mayor' }));
    prisma.vendorRepresentative.findFirst.mockResolvedValue({
      name: 'Pastor Emeka Ezeagu',
      phone: '+2348012345678',
      role: 'Pastor',
      email: 'emeka@example.com',
      showPublicly: false,
    });
    prisma.vendorActivity.create.mockResolvedValue({});
    const service = new VendorsService(prisma as any, email as any);

    await service.adminUpdate('mayor', 'admin-1', {
      representative: { name: 'Pastor Emeka Ezeagu', isPrimary: true },
    });

    expect(prisma.vendorRepresentative.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Pastor Emeka Ezeagu',
        phone: '+2348012345678',
        role: 'Pastor',
        email: 'emeka@example.com',
      }),
    });
  });

  it('requires confirmation before a bulk vendor action', async () => {
    const prisma = mockPrisma();
    const service = new VendorsService(prisma as any, email as any);
    await expect(
      service.adminBulk('admin-1', {
        action: 'send_claim_invites',
        ids: ['v1'],
        confirm: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
