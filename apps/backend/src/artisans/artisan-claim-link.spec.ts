import { Reflector } from '@nestjs/core';
import { ArtisansAdminController } from './artisans-admin.controller';
import { ArtisansService } from './artisans.service';

function serviceWith() {
  const prisma: any = {
    artisanListing: { findUnique: jest.fn(), update: jest.fn() },
    artisanClaimInvite: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  };
  return { prisma, service: new ArtisansService(prisma) };
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
});
