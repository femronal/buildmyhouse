import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SUPER_ADMIN_ROLE_KEY } from '../hr/permissions/permission-catalog';

export type EffectivePermissions = {
  isSuperAdmin: boolean;
  /** Final keys after deny/grant/role resolution. */
  permissions: string[];
  roleKeys: string[];
  rolePermissionKeys: string[];
  grantedOverrides: string[];
  deniedOverrides: string[];
  accessAllowed: boolean;
  accessStatus: string | null;
  accessBlockedReason: string | null;
};

/**
 * Effective permission resolution.
 * Priority: explicit deny > explicit grant > role permission > default deny.
 * Super Admin (role key) grants wildcard '*'.
 */
@Injectable()
export class AdminAccessPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        adminDashboardAccess: true,
        adminAccessProfile: {
          select: {
            id: true,
            status: true,
            accessStartsAt: true,
            accessExpiresAt: true,
            suspendedUntil: true,
            staffProfile: { select: { employmentStatus: true } },
            roleAssignments: {
              where: { revokedAt: null },
              select: {
                role: {
                  select: {
                    key: true,
                    permissions: {
                      select: { permission: { select: { key: true } } },
                    },
                  },
                },
              },
            },
            overrides: {
              where: { revokedAt: null },
              select: {
                effect: true,
                permission: { select: { key: true } },
              },
            },
          },
        },
        staffProfile: {
          select: {
            employmentStatus: true,
            roleAssignments: {
              where: { revokedAt: null },
              select: {
                role: {
                  select: {
                    key: true,
                    permissions: {
                      select: { permission: { select: { key: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const empty: EffectivePermissions = {
      isSuperAdmin: false,
      permissions: [],
      roleKeys: [],
      rolePermissionKeys: [],
      grantedOverrides: [],
      deniedOverrides: [],
      accessAllowed: false,
      accessStatus: null,
      accessBlockedReason: 'Account not found or not an admin',
    };

    if (!user || user.role !== 'admin') {
      return empty;
    }

    const gate = this.evaluateAccessGate(user);
    if (!gate.accessAllowed) {
      return {
        ...empty,
        accessAllowed: false,
        accessStatus: gate.accessStatus,
        accessBlockedReason: gate.accessBlockedReason,
      };
    }

    const profile = user.adminAccessProfile;
    const roleAssignments =
      profile?.roleAssignments?.length
        ? profile.roleAssignments
        : user.staffProfile?.roleAssignments ?? [];

    const roleKeys = roleAssignments.map((a) => a.role.key);
    const hasSuperRole = roleKeys.includes(SUPER_ADMIN_ROLE_KEY);

    // Migration / backward compat: enabled admins with no profile roles and no
    // staff-limited roles remain Super Admin until explicitly limited.
    const legacyFullAdmin =
      !profile &&
      user.adminDashboardAccess &&
      (user.staffProfile?.roleAssignments?.length ?? 0) === 0;

    if (hasSuperRole || legacyFullAdmin) {
      return {
        isSuperAdmin: true,
        permissions: ['*'],
        roleKeys: hasSuperRole ? roleKeys : [SUPER_ADMIN_ROLE_KEY],
        rolePermissionKeys: ['*'],
        grantedOverrides: [],
        deniedOverrides: [],
        accessAllowed: true,
        accessStatus: profile?.status ?? 'active',
        accessBlockedReason: null,
      };
    }

    // Profile exists with zero roles → default deny (limited account not configured)
    if (profile && roleAssignments.length === 0) {
      return {
        isSuperAdmin: false,
        permissions: [],
        roleKeys: [],
        rolePermissionKeys: [],
        grantedOverrides: [],
        deniedOverrides: [],
        accessAllowed: true,
        accessStatus: profile.status,
        accessBlockedReason: null,
      };
    }

    // Pre-migration path: staff-limited via StaffRoleAssignment only
    if (!profile && roleAssignments.length > 0) {
      if (user.staffProfile?.employmentStatus === 'exited') {
        return {
          ...empty,
          accessStatus: 'revoked',
          accessBlockedReason: 'Staff profile is exited',
        };
      }
    }

    const rolePermissionKeys = new Set<string>();
    for (const assignment of roleAssignments) {
      for (const rp of assignment.role.permissions) {
        rolePermissionKeys.add(rp.permission.key);
      }
    }

    const grantedOverrides: string[] = [];
    const deniedOverrides: string[] = [];
    for (const override of profile?.overrides ?? []) {
      if (override.effect === 'deny') deniedOverrides.push(override.permission.key);
      if (override.effect === 'grant') grantedOverrides.push(override.permission.key);
    }

    const effective = new Set<string>(rolePermissionKeys);
    for (const key of grantedOverrides) effective.add(key);
    for (const key of deniedOverrides) effective.delete(key);

    return {
      isSuperAdmin: false,
      permissions: Array.from(effective).sort(),
      roleKeys,
      rolePermissionKeys: Array.from(rolePermissionKeys).sort(),
      grantedOverrides: grantedOverrides.sort(),
      deniedOverrides: deniedOverrides.sort(),
      accessAllowed: true,
      accessStatus: profile?.status ?? 'active',
      accessBlockedReason: null,
    };
  }

  async userHasPermission(userId: string, required: string | string[]): Promise<boolean> {
    const effective = await this.getEffectivePermissions(userId);
    if (!effective.accessAllowed) return false;
    if (effective.isSuperAdmin || effective.permissions.includes('*')) return true;
    const needed = Array.isArray(required) ? required : [required];
    return needed.every((key) => effective.permissions.includes(key));
  }

  private evaluateAccessGate(user: {
    adminDashboardAccess: boolean;
    adminAccessProfile: {
      status: string;
      accessStartsAt: Date | null;
      accessExpiresAt: Date | null;
      suspendedUntil: Date | null;
      staffProfile: { employmentStatus: string } | null;
    } | null;
  }): Pick<EffectivePermissions, 'accessAllowed' | 'accessStatus' | 'accessBlockedReason'> {
    const now = new Date();
    const profile = user.adminAccessProfile;

    if (profile) {
      if (profile.accessStartsAt && profile.accessStartsAt > now) {
        return {
          accessAllowed: false,
          accessStatus: profile.status,
          accessBlockedReason: 'Access has not started yet',
        };
      }
      if (profile.accessExpiresAt && profile.accessExpiresAt <= now) {
        return {
          accessAllowed: false,
          accessStatus: 'expired',
          accessBlockedReason: 'Access has expired',
        };
      }
      if (profile.status === 'suspended') {
        if (profile.suspendedUntil && profile.suspendedUntil <= now) {
          // timed suspension elapsed — treat as active for permission calc;
          // caller should restore status asynchronously; still allow if flag on
        } else {
          return {
            accessAllowed: false,
            accessStatus: 'suspended',
            accessBlockedReason: 'Access is suspended',
          };
        }
      }
      if (profile.status === 'revoked') {
        return {
          accessAllowed: false,
          accessStatus: 'revoked',
          accessBlockedReason: 'Access has been revoked',
        };
      }
      if (profile.status === 'expired') {
        return {
          accessAllowed: false,
          accessStatus: 'expired',
          accessBlockedReason: 'Access has expired',
        };
      }
      if (profile.status === 'invited') {
        return {
          accessAllowed: false,
          accessStatus: 'invited',
          accessBlockedReason: 'Invitation has not been accepted yet',
        };
      }
      if (profile.staffProfile?.employmentStatus === 'exited') {
        return {
          accessAllowed: false,
          accessStatus: profile.status,
          accessBlockedReason: 'Linked staff profile is exited',
        };
      }
      if (profile.status === 'active' || (profile.status === 'suspended' && profile.suspendedUntil && profile.suspendedUntil <= now)) {
        if (!user.adminDashboardAccess) {
          return {
            accessAllowed: false,
            accessStatus: profile.status,
            accessBlockedReason: 'Dashboard access flag is disabled',
          };
        }
        return { accessAllowed: true, accessStatus: 'active', accessBlockedReason: null };
      }
      return {
        accessAllowed: false,
        accessStatus: profile.status,
        accessBlockedReason: `Access status is ${profile.status}`,
      };
    }

    // No profile yet — legacy allowlist only
    if (!user.adminDashboardAccess) {
      return {
        accessAllowed: false,
        accessStatus: null,
        accessBlockedReason: 'Dashboard access is restricted',
      };
    }
    return { accessAllowed: true, accessStatus: 'active', accessBlockedReason: null };
  }
}
