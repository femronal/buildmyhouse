import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAccessPermissionsService } from './admin-access-permissions.service';

/**
 * Runtime gate for admin JWT sessions.
 * Checks: role, dashboard flag, access profile status/expiry, token access version.
 */
@Injectable()
export class AdminAccessGateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: AdminAccessPermissionsService,
  ) {}

  async assertAdminSession(params: {
    userId: string;
    email: string;
    tokenAccessVersion?: number | null;
    /** When true (e.g. login), skip JWT access-version comparison. */
    skipVersionCheck?: boolean;
  }): Promise<{ ok: true } | { ok: false; reason: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        email: true,
        role: true,
        adminDashboardAccess: true,
        adminAccessVersion: true,
        forcePasswordReset: true,
        adminAccessProfile: {
          select: {
            status: true,
            accessStartsAt: true,
            accessExpiresAt: true,
            suspendedUntil: true,
          },
        },
      },
    });

    if (!user || user.role !== 'admin') {
      return { ok: false, reason: 'Not an admin account' };
    }

    if (!params.skipVersionCheck) {
      // Missing aav on legacy JWTs is treated as version 0.
      const tokenVersion = Number(params.tokenAccessVersion ?? 0);
      if (tokenVersion !== Number(user.adminAccessVersion ?? 0)) {
        return { ok: false, reason: 'Session has been revoked' };
      }
    }

    // Auto-mark expired profiles
    const profile = user.adminAccessProfile;
    if (
      profile &&
      profile.accessExpiresAt &&
      profile.accessExpiresAt <= new Date() &&
      profile.status !== 'expired' &&
      profile.status !== 'revoked'
    ) {
      await this.prisma.adminAccessProfile
        .update({
          where: { userId: user.id },
          data: { status: 'expired' },
        })
        .catch(() => undefined);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { adminDashboardAccess: false },
      });
      return { ok: false, reason: 'Access has expired' };
    }

    const effective = await this.permissions.getEffectivePermissions(user.id);
    if (!effective.accessAllowed) {
      return { ok: false, reason: effective.accessBlockedReason || 'Access denied' };
    }

    return { ok: true };
  }

  async bumpAccessVersion(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { adminAccessVersion: { increment: 1 } },
      select: { id: true, adminAccessVersion: true },
    });
  }
}
