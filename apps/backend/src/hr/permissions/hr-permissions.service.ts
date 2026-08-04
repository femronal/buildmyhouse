import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SUPER_ADMIN_ROLE_KEY } from './permission-catalog';

@Injectable()
export class HrPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Full dashboard admins without a limited staff role assignment keep wildcard access.
   * Staff with active role assignments get the union of those role permissions.
   * Super Admin role also grants wildcard.
   */
  async getPermissionKeysForUser(userId: string): Promise<{
    isSuperAdmin: boolean;
    permissions: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        adminDashboardAccess: true,
        staffProfile: {
          select: {
            id: true,
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

    if (!user || user.role !== 'admin') {
      return { isSuperAdmin: false, permissions: [] };
    }

    const assignments = user.staffProfile?.roleAssignments ?? [];
    const hasSuperRole = assignments.some((a) => a.role.key === SUPER_ADMIN_ROLE_KEY);

    // Backward compatible: admins without staff-limited assignments remain full admins.
    if (assignments.length === 0 || hasSuperRole) {
      return { isSuperAdmin: true, permissions: ['*'] };
    }

    if (user.staffProfile?.employmentStatus === 'exited') {
      return { isSuperAdmin: false, permissions: [] };
    }

    const permissions = new Set<string>();
    for (const assignment of assignments) {
      for (const rp of assignment.role.permissions) {
        permissions.add(rp.permission.key);
      }
    }

    return { isSuperAdmin: false, permissions: Array.from(permissions).sort() };
  }

  async userHasPermission(userId: string, required: string | string[]): Promise<boolean> {
    const { isSuperAdmin, permissions } = await this.getPermissionKeysForUser(userId);
    if (isSuperAdmin || permissions.includes('*')) return true;
    const needed = Array.isArray(required) ? required : [required];
    return needed.every((key) => permissions.includes(key));
  }
}
