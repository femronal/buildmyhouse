import { ConflictException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProfessionalsAdminController } from './professionals-admin.controller';
import { ProfessionalsService } from './professionals.service';

function serviceWith() {
  const prisma: any = {
    professionalListing: { findUnique: jest.fn(), update: jest.fn() },
    professionalClaimInvite: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  };
  const email = { send: jest.fn() };
  return { prisma, email, service: new ProfessionalsService(prisma, email as any) };
}

describe('professional claim links', () => {
  it('generates a link without emailing and returns the same link again', async () => {
    const { prisma, email, service } = serviceWith();
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      displayName: 'IAA',
      email: null,
      phone: '0801',
      claimedByUserId: null,
      linkedUserId: null,
    });
    let stored: any = null;
    prisma.professionalClaimInvite.create.mockImplementation(async ({ data }: any) => {
      stored = { id: 'inv1', emailedAt: null, openedAt: null, usedAt: null, revokedAt: null, ...data };
      return stored;
    });
    prisma.professionalClaimInvite.findMany.mockImplementation(async () => (stored ? [stored] : []));

    const first = await service.ensureClaimLink('p1', 'admin');
    const second = await service.ensureClaimLink('p1', 'admin');

    expect(email.send).not.toHaveBeenCalled();
    expect(prisma.professionalClaimInvite.create).toHaveBeenCalledTimes(1);
    expect(first.claimUrl).toContain('https://buildmyhouse.app/professionals/claim/');
    expect(second.claimUrl).toBe(first.claimUrl);
    expect(first.status).toBe('generated');
    expect(first.claimUrl?.split('/').pop()).toHaveLength(64);
  });

  it('regenerate revokes the previous token', async () => {
    const { prisma, service } = serviceWith();
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      displayName: 'IAA',
      email: null,
      claimedByUserId: null,
      linkedUserId: null,
    });
    prisma.professionalClaimInvite.create.mockResolvedValue({
      id: 'new',
      rawToken: 'new-token-value',
      expiresAt: new Date(Date.now() + 100000),
      emailedAt: null,
    });

    const result = await service.regenerateClaimLink('p1', 'admin');
    expect(prisma.professionalClaimInvite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ professionalListingId: 'p1', usedAt: null, revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
    expect(result.claimUrl).toBe('https://buildmyhouse.app/professionals/claim/new-token-value');
  });

  it('reports an expired token without issuing a url', async () => {
    const { prisma, service } = serviceWith();
    prisma.professionalListing.findUnique.mockResolvedValue({ id: 'p1', claimedByUserId: null, linkedUserId: null });
    prisma.professionalClaimInvite.findFirst.mockResolvedValue({
      expiresAt: new Date(Date.now() - 1000),
      emailedAt: null,
      rawToken: 'expired',
    });
    const result = await service.getClaimLink('p1');
    expect(result.status).toBe('expired');
    expect(result.claimUrl).toBeNull();
  });

  it('reports claimed only after the listing is linked to an account', async () => {
    const { prisma, service } = serviceWith();
    prisma.professionalListing.findUnique.mockResolvedValue({
      id: 'p1',
      claimedByUserId: 'user-1',
      linkedUserId: 'user-1',
      claimedAt: new Date('2026-10-01'),
    });
    prisma.user.findUnique.mockResolvedValue({ fullName: 'Ada Owner', email: 'ada@example.com' });
    const result = await service.getClaimLink('p1');
    expect(result.status).toBe('claimed');
    expect(result.claimedBy).toBe('Ada Owner');
    expect(result.claimUrl).toBeNull();
  });

  it('refuses to regenerate a claimed listing', async () => {
    const { prisma, service } = serviceWith();
    prisma.professionalListing.findUnique.mockResolvedValue({ id: 'p1', claimedByUserId: 'user-1', linkedUserId: 'user-1' });
    await expect(service.regenerateClaimLink('p1', 'admin')).rejects.toBeInstanceOf(ConflictException);
  });

  it('keeps claim-link routes behind the admin role', () => {
    const reflector = new Reflector();
    expect(reflector.get<string[]>('roles', ProfessionalsAdminController)).toEqual(['admin']);
  });
});
