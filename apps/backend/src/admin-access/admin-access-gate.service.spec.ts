import { AdminAccessGateService } from './admin-access-gate.service';

describe('AdminAccessGateService', () => {
  it('rejects revoked JWT access version', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'a@b.com',
          role: 'admin',
          adminDashboardAccess: true,
          adminAccessVersion: 3,
          forcePasswordReset: false,
          adminAccessProfile: { status: 'active', accessStartsAt: null, accessExpiresAt: null, suspendedUntil: null },
        }),
        update: jest.fn(),
      },
      adminAccessProfile: { update: jest.fn() },
    } as any;

    const permissions = {
      getEffectivePermissions: jest.fn().mockResolvedValue({
        accessAllowed: true,
        accessBlockedReason: null,
      }),
    } as any;

    const gate = new AdminAccessGateService(prisma, permissions);
    const result = await gate.assertAdminSession({
      userId: 'u1',
      email: 'a@b.com',
      tokenAccessVersion: 1,
    });
    expect(result).toEqual({ ok: false, reason: 'Session has been revoked' });
  });

  it('allows matching access version when permissions allow', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'a@b.com',
          role: 'admin',
          adminDashboardAccess: true,
          adminAccessVersion: 2,
          forcePasswordReset: false,
          adminAccessProfile: { status: 'active', accessStartsAt: null, accessExpiresAt: null, suspendedUntil: null },
        }),
        update: jest.fn(),
      },
      adminAccessProfile: { update: jest.fn() },
    } as any;

    const permissions = {
      getEffectivePermissions: jest.fn().mockResolvedValue({
        accessAllowed: true,
        accessBlockedReason: null,
      }),
    } as any;

    const gate = new AdminAccessGateService(prisma, permissions);
    const result = await gate.assertAdminSession({
      userId: 'u1',
      email: 'a@b.com',
      tokenAccessVersion: 2,
    });
    expect(result).toEqual({ ok: true });
  });
});
