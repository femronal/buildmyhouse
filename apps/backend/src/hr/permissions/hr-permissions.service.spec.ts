import { HrPermissionsService } from './hr-permissions.service';
import { SUPER_ADMIN_ROLE_KEY } from './permission-catalog';

describe('HrPermissionsService', () => {
  it('treats admins without staff role assignments as super admins', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'admin-1',
          role: 'admin',
          adminDashboardAccess: true,
          staffProfile: null,
        }),
      },
    };
    const service = new HrPermissionsService(prisma);
    const result = await service.getPermissionKeysForUser('admin-1');
    expect(result.isSuperAdmin).toBe(true);
    expect(result.permissions).toEqual(['*']);
  });

  it('unions permissions from active staff role assignments', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'staff-user',
          role: 'admin',
          adminDashboardAccess: true,
          staffProfile: {
            id: 'staff-1',
            employmentStatus: 'active',
            roleAssignments: [
              {
                role: {
                  key: 'hr_manager',
                  permissions: [
                    { permission: { key: 'hr.view' } },
                    { permission: { key: 'hr.people.manage' } },
                  ],
                },
              },
            ],
          },
        }),
      },
    };
    const service = new HrPermissionsService(prisma);
    const result = await service.getPermissionKeysForUser('staff-user');
    expect(result.isSuperAdmin).toBe(false);
    expect(result.permissions).toEqual(['hr.people.manage', 'hr.view']);
  });

  it('grants wildcard for Super Admin role', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'admin-2',
          role: 'admin',
          adminDashboardAccess: true,
          staffProfile: {
            id: 'staff-2',
            employmentStatus: 'active',
            roleAssignments: [
              {
                role: {
                  key: SUPER_ADMIN_ROLE_KEY,
                  permissions: [{ permission: { key: 'hr.view' } }],
                },
              },
            ],
          },
        }),
      },
    };
    const service = new HrPermissionsService(prisma);
    const result = await service.getPermissionKeysForUser('admin-2');
    expect(result.isSuperAdmin).toBe(true);
  });
});
