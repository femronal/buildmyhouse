import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminAccessGateService } from './admin-access-gate.service';

/**
 * Enforces admin access profile + JWT access-version after JwtAuthGuard.
 */
@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly gate: AdminAccessGateService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'admin') {
      return true;
    }

    const result = await this.gate.assertAdminSession({
      userId: String(user.sub || ''),
      email: String(user.email || ''),
      tokenAccessVersion:
        user.aav !== undefined && user.aav !== null ? Number(user.aav) : null,
    });

    if (result.ok === false) {
      throw new ForbiddenException(result.reason || 'Admin session is not valid.');
    }

    return true;
  }
}
