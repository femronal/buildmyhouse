import { BadRequestException } from '@nestjs/common';
import { ArtisanVerificationStatus } from '@prisma/client';
import { ArtisansService } from './artisans.service';

function serviceWith() {
  const prisma: any = {
    artisanListing: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
    artisanApplication: { create: jest.fn() },
    artisanTrade: { findUnique: jest.fn() },
    vendorProfile: { findMany: jest.fn().mockResolvedValue([]) },
    professionalListing: { findMany: jest.fn().mockResolvedValue([]) },
    artisanVerificationCheck: { create: jest.fn() },
  };
  return { prisma, service: new ArtisansService(prisma) };
}

describe('artisan admin listing rules', () => {
  it('refuses verification without an evidence note', async () => {
    const { prisma, service } = serviceWith();
    await expect(
      service.setVerification('admin-1', 'listing-1', { verificationStatus: ArtisanVerificationStatus.verified }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.artisanListing.update).not.toHaveBeenCalled();
  });

  it('keeps a honeypot application off the directory', async () => {
    const { prisma, service } = serviceWith();
    const result = await service.apply({
      displayName: 'Spam Shop',
      tradeKey: 'plumber',
      companyFax: '555',
    } as any);
    expect(result).toEqual({ received: true });
    expect(prisma.artisanApplication.create).not.toHaveBeenCalled();
    expect(prisma.artisanListing.update).not.toHaveBeenCalled();
  });

  it('matches a phone that already belongs to a vendor or professional', async () => {
    const { prisma, service } = serviceWith();
    prisma.vendorProfile.findMany.mockResolvedValue([{ id: 'v1', slug: 'primecool', tradingName: 'PrimeCool Tech Ltd' }]);
    prisma.professionalListing.findMany.mockResolvedValue([{ id: 'p1', slug: 'ada-architects', displayName: 'Ada Architects' }]);
    const matches = await service.findDuplicates({ phone: '08031234567' });
    expect(prisma.vendorProfile.findMany).toHaveBeenCalled();
    expect(prisma.professionalListing.findMany).toHaveBeenCalled();
    expect(matches.map((item) => item.kind).sort()).toEqual(['professional', 'vendor']);
    expect(matches.find((item) => item.kind === 'vendor')?.href).toBe('/vendors/primecool');
  });
});
