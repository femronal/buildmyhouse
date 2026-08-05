import { HrPermissionsService } from './hr-permissions.service';
import { SUPER_ADMIN_ROLE_KEY } from './permission-catalog';

describe('HrPermissionsService', () => {
  it('delegates to AdminAccessPermissionsService', async () => {
    const adminAccessPermissions = {
      getEffectivePermissions: jest.fn().mockResolvedValue({
        isSuperAdmin: true,
        permissions: ['*'],
        roleKeys: [SUPER_ADMIN_ROLE_KEY],
      }),
      userHasPermission: jest.fn().mockResolvedValue(true),
    };

    const service = new HrPermissionsService(adminAccessPermissions as any);
    const result = await service.getPermissionKeysForUser('admin-1');

    expect(adminAccessPermissions.getEffectivePermissions).toHaveBeenCalledWith('admin-1');
    expect(result.isSuperAdmin).toBe(true);
    expect(result.permissions).toEqual(['*']);
  });

  it('maps limited permissions from effective set', async () => {
    const adminAccessPermissions = {
      getEffectivePermissions: jest.fn().mockResolvedValue({
        isSuperAdmin: false,
        permissions: ['hr.people.manage', 'hr.view'],
        roleKeys: ['hr_manager'],
      }),
      userHasPermission: jest.fn().mockResolvedValue(false),
    };

    const service = new HrPermissionsService(adminAccessPermissions as any);
    const result = await service.getPermissionKeysForUser('staff-user');

    expect(result.isSuperAdmin).toBe(false);
    expect(result.permissions).toEqual(['hr.people.manage', 'hr.view']);
  });

  it('userHasPermission delegates', async () => {
    const adminAccessPermissions = {
      getEffectivePermissions: jest.fn(),
      userHasPermission: jest.fn().mockResolvedValue(true),
    };

    const service = new HrPermissionsService(adminAccessPermissions as any);
    await expect(service.userHasPermission('u1', 'hr.view')).resolves.toBe(true);
    expect(adminAccessPermissions.userHasPermission).toHaveBeenCalledWith('u1', 'hr.view');
  });
});
