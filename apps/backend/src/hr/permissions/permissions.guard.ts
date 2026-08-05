import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator';
import { AdminAccessPermissionsService } from '../../admin-access/admin-access-permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminAccessPermissions: AdminAccessPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = String(user?.sub || '');
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Non-admin roles on mixed endpoints are authorized by RolesGuard only.
    // Fine-grained permissions apply to admin/internal access users.
    if (user?.role && user.role !== 'admin') {
      return true;
    }

    const allowed = await this.adminAccessPermissions.userHasPermission(userId, required);
    if (!allowed) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required.join(', ')}`,
      );
    }

    return true;
  }
}
