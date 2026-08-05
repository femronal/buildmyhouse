import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { AdminAccessPermissionsService } from '../../admin-access/admin-access-permissions.service';

@Injectable()
export class HrPermissionsService {
  constructor(
    @Inject(forwardRef(() => AdminAccessPermissionsService))
    private readonly adminAccessPermissions: AdminAccessPermissionsService,
  ) {}

  /**
   * Delegates to AdminAccessPermissionsService (profile roles + overrides + gate).
   */
  async getPermissionKeysForUser(userId: string): Promise<{
    isSuperAdmin: boolean;
    permissions: string[];
  }> {
    const effective = await this.adminAccessPermissions.getEffectivePermissions(userId);
    return {
      isSuperAdmin: effective.isSuperAdmin,
      permissions: effective.permissions,
    };
  }

  async userHasPermission(userId: string, required: string | string[]): Promise<boolean> {
    return this.adminAccessPermissions.userHasPermission(userId, required);
  }
}
