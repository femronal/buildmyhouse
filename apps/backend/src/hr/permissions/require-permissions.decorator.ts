import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'hr_permissions';

/** Require all listed permission keys (super admins bypass). */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
