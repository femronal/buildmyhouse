import { PrismaClient } from '@prisma/client';
import {
  HR_PERMISSION_CATALOG,
  SYSTEM_ROLE_DEFS,
  SUPER_ADMIN_ROLE_KEY,
} from '../../src/hr/permissions/permission-catalog';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  'Executive & Administration',
  'Human Resources',
  'Sales & Partnerships',
  'Marketing',
  'Operations',
  'Finance',
  'Compliance & Legal',
  'Product & Engineering',
  'Customer Experience',
];

const PDE_KPIS = [
  { kpi: 'Qualified consultants researched', monthlyTarget: 30 },
  { kpi: 'Meaningful professional conversations', monthlyTarget: 20 },
  { kpi: 'Founder meetings scheduled', monthlyTarget: 10 },
  { kpi: 'Live demonstrations completed', monthlyTarget: 8 },
  { kpi: 'Consultant reports submitted', monthlyTarget: 8 },
  { kpi: 'Partnership opportunities identified', monthlyTarget: 2 },
];

async function upsertPermissions() {
  for (const perm of HR_PERMISSION_CATALOG) {
    await prisma.adminPermission.upsert({
      where: { key: perm.key },
      create: {
        key: perm.key,
        groupLabel: perm.groupLabel,
        description: perm.description,
        isCritical: !!perm.isCritical,
      },
      update: {
        groupLabel: perm.groupLabel,
        description: perm.description,
        isCritical: !!perm.isCritical,
      },
    });
  }
}

async function setRolePermissions(roleId: string, keys: string[]) {
  const permissions = await prisma.adminPermission.findMany({
    where: { key: { in: keys } },
  });
  await prisma.adminRolePermission.deleteMany({ where: { roleId } });
  if (permissions.length === 0) return;
  await prisma.adminRolePermission.createMany({
    data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    skipDuplicates: true,
  });
}

async function upsertRoles() {
  const allKeys = HR_PERMISSION_CATALOG.map((p) => p.key);

  for (const def of SYSTEM_ROLE_DEFS) {
    const role = await prisma.adminRole.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        isSystem: true,
      },
      update: {
        name: def.name,
        description: def.description,
        isSystem: true,
        archivedAt: null,
      },
    });

    const permissionKeys =
      def.key === SUPER_ADMIN_ROLE_KEY || !def.permissionKeys
        ? allKeys
        : def.permissionKeys;

    await setRolePermissions(role.id, permissionKeys);
  }
}

async function upsertDepartmentsAndPdePosition() {
  for (const name of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  const sales = await prisma.department.findUniqueOrThrow({
    where: { name: 'Sales & Partnerships' },
  });

  await prisma.position.upsert({
    where: {
      departmentId_name: {
        departmentId: sales.id,
        name: 'Partnership Development Executive',
      },
    },
    create: {
      departmentId: sales.id,
      name: 'Partnership Development Executive',
      description:
        'Contract position focused on researching consultants, building partnership pipeline, and coordinating founder meetings.',
      purpose:
        'Grow BuildMyHouse partnerships with advisors and firms that support homeowners.',
      responsibilities: [
        'Researching qualified consultants',
        'Identifying firms that advise homeowners',
        'Building a consultant database',
        'Scheduling appointments',
        'Coordinating founder meetings',
        'Following up with prospects',
        'Recording consultant feedback',
        'Maintaining CRM records',
        'Identifying partnership opportunities',
      ],
      requiredSkills: [
        'Research',
        'CRM hygiene',
        'Professional outreach',
        'Meeting coordination',
      ],
      allowedWorkforceTypes: ['fixed_term', 'consultant', 'independent_contractor', 'freelancer'],
      kpiDefinitions: PDE_KPIS,
      active: true,
    },
    update: {
      description:
        'Contract position focused on researching consultants, building partnership pipeline, and coordinating founder meetings.',
      purpose:
        'Grow BuildMyHouse partnerships with advisors and firms that support homeowners.',
      responsibilities: [
        'Researching qualified consultants',
        'Identifying firms that advise homeowners',
        'Building a consultant database',
        'Scheduling appointments',
        'Coordinating founder meetings',
        'Following up with prospects',
        'Recording consultant feedback',
        'Maintaining CRM records',
        'Identifying partnership opportunities',
      ],
      kpiDefinitions: PDE_KPIS,
      active: true,
    },
  });
}

export async function seedPeopleHr() {
  console.log('🧑‍🤝‍🧑 Seeding People & HR defaults...');
  await upsertPermissions();
  await upsertRoles();
  await upsertDepartmentsAndPdePosition();
  console.log('✅ People & HR seed complete');
}

async function main() {
  await seedPeopleHr();
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
