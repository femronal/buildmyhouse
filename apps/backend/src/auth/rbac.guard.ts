import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
  Inject,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAccessGateService } from '../admin-access/admin-access-gate.service';

/**
 * Roles decorator to specify which roles can access an endpoint
 * Usage: @Roles('admin', 'homeowner')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => AdminAccessGateService))
    private readonly adminAccessGate?: AdminAccessGateService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access (endpoint is public or role-checked elsewhere)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is attached (shouldn't happen if JwtAuthGuard is used first), deny access
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user's role matches any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    if (user.role === 'admin' && requiredRoles.includes('admin')) {
      const hasAccess = await this.hasAdminDashboardAccess(
        String(user.sub || ''),
        String(user.email || ''),
        user.aav !== undefined && user.aav !== null ? Number(user.aav) : null,
      );
      if (!hasAccess) {
        throw new ForbiddenException('Admin access is restricted for this account.');
      }
    }

    return true;
  }

  private getAdminDashboardAllowlist() {
    const raw =
      this.configService.get<string>('ADMIN_DASHBOARD_ALLOWED_EMAILS') ||
      this.configService.get<string>('ADMIN_ALLOWED_EMAILS') ||
      '';

    const emails = raw
      .split(',')
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean);

    return new Set(emails);
  }

  private async hasAdminDashboardAccess(
    userId: string,
    email: string,
    tokenAccessVersion?: number | null,
  ) {
    if (this.adminAccessGate && userId) {
      const result = await this.adminAccessGate.assertAdminSession({
        userId,
        email,
        tokenAccessVersion,
      });
      return result.ok;
    }

    // Fallback when AdminAccessGateService is not available (e.g. unit tests)
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return false;
    }

    const enabledAdmins = await this.prisma.user.findMany({
      where: {
        role: 'admin',
        adminDashboardAccess: true,
      },
      select: { email: true },
      take: 200,
    });

    if (enabledAdmins.length > 0) {
      return enabledAdmins.some(
        (admin) => String(admin.email || '').trim().toLowerCase() === normalizedEmail,
      );
    }

    const envAllowlist = this.getAdminDashboardAllowlist();
    if (envAllowlist.size > 0) {
      return envAllowlist.has(normalizedEmail);
    }

    return true;
  }
}

// Note: Import JwtAuthGuard separately when using
// Usage: @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
