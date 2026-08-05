import { AdminAccessPermissionsService } from './admin-access-permissions.service';

function makeService(user: any) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
    },
  } as any;
  return new AdminAccessPermissionsService(prisma);
}

describe('AdminAccessPermissionsService', () => {
  it('grants wildcard to super_admin role', async () => {
    const service = makeService({
      id: 'u1',
      role: 'admin',
      adminDashboardAccess: true,
      adminAccessProfile: {
        status: 'active',
        accessStartsAt: null,
        accessExpiresAt: null,
        suspendedUntil: null,
        staffProfile: null,
        roleAssignments: [
          {
            role: {
              key: 'super_admin',
              permissions: [{ permission: { key: 'dashboard.view' } }],
            },
          },
        ],
        overrides: [],
      },
      staffProfile: null,
    });

    const result = await service.getEffectivePermissions('u1');
    expect(result.isSuperAdmin).toBe(true);
    expect(result.permissions).toEqual(['*']);
    expect(result.accessAllowed).toBe(true);
  });

  it('applies deny > grant > role priority', async () => {
    const service = makeService({
      id: 'u2',
      role: 'admin',
      adminDashboardAccess: true,
      adminAccessProfile: {
        status: 'active',
        accessStartsAt: null,
        accessExpiresAt: null,
        suspendedUntil: null,
        staffProfile: null,
        roleAssignments: [
          {
            role: {
              key: 'operations_admin',
              permissions: [
                { permission: { key: 'projects.view' } },
                { permission: { key: 'contractors.verify' } },
              ],
            },
          },
        ],
        overrides: [
          { effect: 'grant', permission: { key: 'emails.send' } },
          { effect: 'deny', permission: { key: 'contractors.verify' } },
        ],
      },
      staffProfile: null,
    });

    const result = await service.getEffectivePermissions('u2');
    expect(result.permissions).toEqual(['emails.send', 'projects.view']);
    expect(await service.userHasPermission('u2', 'projects.view')).toBe(true);
    expect(await service.userHasPermission('u2', 'emails.send')).toBe(true);
    expect(await service.userHasPermission('u2', 'contractors.verify')).toBe(false);
    expect(await service.userHasPermission('u2', 'payments.confirm')).toBe(false);
  });

  it('blocks suspended and expired access', async () => {
    const suspended = makeService({
      id: 'u3',
      role: 'admin',
      adminDashboardAccess: true,
      adminAccessProfile: {
        status: 'suspended',
        accessStartsAt: null,
        accessExpiresAt: null,
        suspendedUntil: null,
        staffProfile: null,
        roleAssignments: [],
        overrides: [],
      },
      staffProfile: null,
    });
    expect((await suspended.getEffectivePermissions('u3')).accessAllowed).toBe(false);

    const expired = makeService({
      id: 'u4',
      role: 'admin',
      adminDashboardAccess: true,
      adminAccessProfile: {
        status: 'active',
        accessStartsAt: null,
        accessExpiresAt: new Date(Date.now() - 60_000),
        suspendedUntil: null,
        staffProfile: null,
        roleAssignments: [
          {
            role: {
              key: 'auditor_read_only',
              permissions: [{ permission: { key: 'projects.view' } }],
            },
          },
        ],
        overrides: [],
      },
      staffProfile: null,
    });
    expect((await expired.getEffectivePermissions('u4')).accessAllowed).toBe(false);
  });

  it('keeps legacy full admins without profiles as super admins', async () => {
    const service = makeService({
      id: 'u5',
      role: 'admin',
      adminDashboardAccess: true,
      adminAccessProfile: null,
      staffProfile: null,
    });
    const result = await service.getEffectivePermissions('u5');
    expect(result.isSuperAdmin).toBe(true);
    expect(result.accessAllowed).toBe(true);
  });
});
