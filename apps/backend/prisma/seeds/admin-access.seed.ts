import { PrismaClient } from '@prisma/client';
import { SUPER_ADMIN_ROLE_KEY } from '../../src/hr/permissions/permission-catalog';
import { seedPeopleHr } from './people-hr.seed';

const prisma = new PrismaClient();

/**
 * Migrates legacy admin users into AdminAccessProfile + super_admin role assignment.
 * Mirrors AdminAccessService.ensureMigratedProfiles().
 */
export async function seedAdminAccess(options?: { seedRolesFirst?: boolean }) {
  if (options?.seedRolesFirst !== false) {
    await seedPeopleHr();
  }

  console.log('🔐 Seeding Admin Access profiles...');

  const superRole = await prisma.adminRole.findUnique({
    where: { key: SUPER_ADMIN_ROLE_KEY },
    select: { id: true },
  });
  if (!superRole) {
    throw new Error(
      'Super Admin role missing after People & HR seed. Cannot migrate admin access profiles.',
    );
  }

  const admins = await prisma.user.findMany({
    where: {
      role: 'admin',
      adminAccessProfile: null,
    },
    select: {
      id: true,
      email: true,
      adminDashboardAccess: true,
      staffProfile: {
        select: {
          id: true,
          roleAssignments: {
            where: { revokedAt: null },
            select: { roleId: true },
          },
        },
      },
    },
  });

  let migrated = 0;
  for (const admin of admins) {
    const profile = await prisma.adminAccessProfile.create({
      data: {
        userId: admin.id,
        staffProfileId: admin.staffProfile?.id ?? null,
        accessRelationship: admin.staffProfile ? 'employee' : 'external',
        status: admin.adminDashboardAccess ? 'active' : 'revoked',
        accessStartsAt: admin.adminDashboardAccess ? new Date() : null,
        revokedAt: admin.adminDashboardAccess ? null : new Date(),
        revokeReason: admin.adminDashboardAccess
          ? null
          : 'Migrated without dashboard access',
      },
    });

    // Preserve limited staff roles; only unrestricted admins become Super Admin.
    const existingRoleIds = admin.staffProfile?.roleAssignments.map((a) => a.roleId) ?? [];
    const roleIds =
      existingRoleIds.length > 0 ? Array.from(new Set(existingRoleIds)) : [superRole.id];

    await prisma.adminUserRoleAssignment.createMany({
      data: roleIds.map((roleId) => ({
        accessProfileId: profile.id,
        roleId,
      })),
      skipDuplicates: true,
    });

    console.log(
      `  → migrated ${admin.email} (${profile.status}, ${roleIds.length} role(s))`,
    );
    migrated += 1;
  }

  console.log(`✅ Admin Access seed complete (${migrated} profiles migrated)`);
  return { migrated };
}

async function main() {
  await seedAdminAccess();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
