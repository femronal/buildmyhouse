import { PrismaClient } from '@prisma/client';
import {
  HR_MANAGER_ROLE_KEY,
  HR_PERMISSION_CATALOG,
  PDE_ROLE_KEY,
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
      create: perm,
      update: {
        groupLabel: perm.groupLabel,
        description: perm.description,
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

  const superAdmin = await prisma.adminRole.upsert({
    where: { key: SUPER_ADMIN_ROLE_KEY },
    create: {
      key: SUPER_ADMIN_ROLE_KEY,
      name: 'Super Admin',
      description: 'Full BuildMyHouse admin access (backward compatible).',
      isSystem: true,
    },
    update: {
      name: 'Super Admin',
      description: 'Full BuildMyHouse admin access (backward compatible).',
      isSystem: true,
    },
  });
  await setRolePermissions(superAdmin.id, allKeys);

  const hrManager = await prisma.adminRole.upsert({
    where: { key: HR_MANAGER_ROLE_KEY },
    create: {
      key: HR_MANAGER_ROLE_KEY,
      name: 'HR Manager',
      description: 'Manage people, candidates, documents, compensation, and policies.',
      isSystem: true,
    },
    update: {
      name: 'HR Manager',
      isSystem: true,
    },
  });
  await setRolePermissions(hrManager.id, [
    'hr.view',
    'hr.candidates.manage',
    'hr.people.manage',
    'hr.compensation.view',
    'hr.documents.manage',
    'hr.performance.manage',
    'hr.policies.manage',
    'emails.view',
    'emails.send',
  ]);

  const pde = await prisma.adminRole.upsert({
    where: { key: PDE_ROLE_KEY },
    create: {
      key: PDE_ROLE_KEY,
      name: 'Partnership Development Executive',
      description:
        'Partnership CRM and approved communications. No payroll, payments, or admin management.',
      isSystem: true,
    },
    update: {
      name: 'Partnership Development Executive',
      isSystem: true,
    },
  });
  await setRolePermissions(pde.id, [
    'hr.view',
    'emails.view',
    'emails.send',
    'content.view',
  ]);
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
