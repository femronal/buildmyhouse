export type PermissionDef = {
  key: string;
  groupLabel: string;
  description: string;
  isCritical?: boolean;
};

/**
 * Canonical admin permission catalog.
 * Default-deny: absence of a key means deny.
 * Override priority (enforced in AdminAccessPermissionsService):
 *   explicit deny > explicit grant > role permission > default deny
 */
export const HR_PERMISSION_CATALOG: PermissionDef[] = [
  { key: 'dashboard.view', groupLabel: 'Dashboard', description: 'View admin dashboard' },

  { key: 'homeowners.view', groupLabel: 'Homeowners', description: 'View homeowner accounts' },
  { key: 'homeowners.edit', groupLabel: 'Homeowners', description: 'Edit homeowner accounts' },
  { key: 'homeowners.contact', groupLabel: 'Homeowners', description: 'Contact homeowners' },

  { key: 'contractors.view', groupLabel: 'Contractors', description: 'View contractors' },
  { key: 'contractors.edit', groupLabel: 'Contractors', description: 'Edit contractors' },
  {
    key: 'contractors.verify',
    groupLabel: 'Contractors',
    description: 'Verify contractors',
    isCritical: true,
  },

  { key: 'projects.view', groupLabel: 'Projects', description: 'View projects' },
  { key: 'projects.edit', groupLabel: 'Projects', description: 'Edit projects' },
  { key: 'projects.activate', groupLabel: 'Projects', description: 'Activate projects' },
  { key: 'projects.pause', groupLabel: 'Projects', description: 'Pause projects' },
  { key: 'projects.delete', groupLabel: 'Projects', description: 'Delete projects', isCritical: true },

  { key: 'verification.view', groupLabel: 'Verification', description: 'View verification queue' },
  {
    key: 'verification.manage',
    groupLabel: 'Verification',
    description: 'Manage verification decisions',
    isCritical: true,
  },

  { key: 'disputes.view', groupLabel: 'Disputes', description: 'View disputes' },
  { key: 'disputes.manage', groupLabel: 'Disputes', description: 'Manage disputes', isCritical: true },

  { key: 'opportunities.view', groupLabel: 'Opportunities', description: 'View opportunities' },
  { key: 'opportunities.manage', groupLabel: 'Opportunities', description: 'Manage opportunities' },

  { key: 'tools.view', groupLabel: 'Tools', description: 'View internal tools' },
  { key: 'tools.manage', groupLabel: 'Tools', description: 'Manage internal tools', isCritical: true },

  { key: 'content.view', groupLabel: 'Content', description: 'View content' },
  { key: 'content.create', groupLabel: 'Content', description: 'Create content' },
  { key: 'content.edit', groupLabel: 'Content', description: 'Edit content' },
  { key: 'content.publish', groupLabel: 'Content', description: 'Publish content' },
  { key: 'content.delete', groupLabel: 'Content', description: 'Delete content' },

  { key: 'emails.view', groupLabel: 'Emails', description: 'View email tools' },
  { key: 'emails.send', groupLabel: 'Emails', description: 'Send emails' },

  { key: 'hr.view', groupLabel: 'People & HR', description: 'View People & HR module' },
  { key: 'hr.candidates.manage', groupLabel: 'People & HR', description: 'Manage recruitment candidates' },
  { key: 'hr.people.manage', groupLabel: 'People & HR', description: 'Manage staff profiles' },
  {
    key: 'hr.compensation.view',
    groupLabel: 'People & HR',
    description: 'View compensation data',
    isCritical: true,
  },
  { key: 'hr.documents.manage', groupLabel: 'People & HR', description: 'Manage HR documents' },
  { key: 'hr.performance.manage', groupLabel: 'People & HR', description: 'Manage performance records' },
  { key: 'hr.permissions.manage', groupLabel: 'People & HR', description: 'Manage HR roles (legacy)' },
  { key: 'hr.policies.manage', groupLabel: 'People & HR', description: 'Manage company policies' },

  { key: 'payments.view', groupLabel: 'Finance / Payments', description: 'View payments' },
  {
    key: 'payments.confirm',
    groupLabel: 'Finance / Payments',
    description: 'Confirm payments',
    isCritical: true,
  },
  {
    key: 'payments.refund',
    groupLabel: 'Finance / Payments',
    description: 'Issue refunds',
    isCritical: true,
  },
  {
    key: 'payments.payout',
    groupLabel: 'Finance / Payments',
    description: 'Trigger payouts',
    isCritical: true,
  },
  {
    key: 'payments.manage',
    groupLabel: 'Finance / Payments',
    description: 'Manage payment settings',
    isCritical: true,
  },

  // Legacy aliases kept for existing HR seeds/UI
  { key: 'admin.users.manage', groupLabel: 'Admin Access', description: 'Manage admin accounts (legacy alias)' },
  {
    key: 'admin.permissions.manage',
    groupLabel: 'Admin Access',
    description: 'Manage permission roles (legacy alias)',
  },

  { key: 'admin_access.view', groupLabel: 'Admin Access', description: 'View admin access workspace' },
  {
    key: 'admin_access.grant',
    groupLabel: 'Admin Access',
    description: 'Grant admin access',
    isCritical: true,
  },
  {
    key: 'admin_access.modify',
    groupLabel: 'Admin Access',
    description: 'Modify access profiles and roles',
    isCritical: true,
  },
  {
    key: 'admin_access.suspend',
    groupLabel: 'Admin Access',
    description: 'Suspend or revoke access',
    isCritical: true,
  },
  {
    key: 'admin_access.roles.manage',
    groupLabel: 'Admin Access',
    description: 'Manage system roles',
    isCritical: true,
  },
  {
    key: 'admin_access.permissions.manage',
    groupLabel: 'Admin Access',
    description: 'Manage permission catalog assignments',
    isCritical: true,
  },
];

export const SUPER_ADMIN_ROLE_KEY = 'super_admin';
export const HR_MANAGER_ROLE_KEY = 'hr_manager';
export const PDE_ROLE_KEY = 'partnership_development_executive';
export const OPERATIONS_ADMIN_ROLE_KEY = 'operations_admin';
export const FINANCE_ADMIN_ROLE_KEY = 'finance_admin';
export const MARKETING_CONTENT_ADMIN_ROLE_KEY = 'marketing_content_admin';
export const PARTNERSHIPS_ADMIN_ROLE_KEY = 'partnerships_admin';
export const CUSTOMER_SUPPORT_ADMIN_ROLE_KEY = 'customer_support_admin';
export const AUDITOR_READ_ONLY_ROLE_KEY = 'auditor_read_only';

export type SystemRoleDef = {
  key: string;
  name: string;
  description: string;
  /** If omit, assign all catalog keys (super admin). */
  permissionKeys?: string[];
};

export const SYSTEM_ROLE_DEFS: SystemRoleDef[] = [
  {
    key: SUPER_ADMIN_ROLE_KEY,
    name: 'Super Admin',
    description: 'Full BuildMyHouse administrative access.',
  },
  {
    key: OPERATIONS_ADMIN_ROLE_KEY,
    name: 'Operations Admin',
    description: 'Projects, contractors, homeowners, disputes, operational workflows.',
    permissionKeys: [
      'dashboard.view',
      'homeowners.view',
      'homeowners.edit',
      'homeowners.contact',
      'contractors.view',
      'contractors.edit',
      'contractors.verify',
      'projects.view',
      'projects.edit',
      'projects.activate',
      'projects.pause',
      'verification.view',
      'verification.manage',
      'disputes.view',
      'disputes.manage',
      'opportunities.view',
      'emails.view',
    ],
  },
  {
    key: HR_MANAGER_ROLE_KEY,
    name: 'HR Admin',
    description: 'People & HR, recruitment, documents, policies and staff management.',
    permissionKeys: [
      'dashboard.view',
      'hr.view',
      'hr.candidates.manage',
      'hr.people.manage',
      'hr.compensation.view',
      'hr.documents.manage',
      'hr.performance.manage',
      'hr.policies.manage',
      'emails.view',
      'emails.send',
    ],
  },
  {
    key: FINANCE_ADMIN_ROLE_KEY,
    name: 'Finance Admin',
    description: 'Payments, financial reporting and approved finance functions.',
    permissionKeys: [
      'dashboard.view',
      'payments.view',
      'payments.confirm',
      'payments.refund',
      'payments.payout',
      'payments.manage',
      'projects.view',
      'homeowners.view',
      'contractors.view',
    ],
  },
  {
    key: MARKETING_CONTENT_ADMIN_ROLE_KEY,
    name: 'Marketing & Content Admin',
    description: 'Content, campaigns and approved marketing tools.',
    permissionKeys: [
      'dashboard.view',
      'content.view',
      'content.create',
      'content.edit',
      'content.publish',
      'content.delete',
      'emails.view',
      'emails.send',
      'opportunities.view',
    ],
  },
  {
    key: PARTNERSHIPS_ADMIN_ROLE_KEY,
    name: 'Partnerships Admin',
    description: 'Partnership/CRM-related tools and appropriate communication access.',
    permissionKeys: [
      'dashboard.view',
      'hr.view',
      'emails.view',
      'emails.send',
      'content.view',
      'opportunities.view',
      'opportunities.manage',
      'contractors.view',
    ],
  },
  {
    key: CUSTOMER_SUPPORT_ADMIN_ROLE_KEY,
    name: 'Customer Support Admin',
    description: 'Customer records and support operations without sensitive financial control.',
    permissionKeys: [
      'dashboard.view',
      'homeowners.view',
      'homeowners.contact',
      'contractors.view',
      'projects.view',
      'disputes.view',
      'emails.view',
      'emails.send',
    ],
  },
  {
    key: AUDITOR_READ_ONLY_ROLE_KEY,
    name: 'Auditor / Read Only',
    description: 'Inspect approved data but cannot change it.',
    permissionKeys: [
      'dashboard.view',
      'homeowners.view',
      'contractors.view',
      'projects.view',
      'verification.view',
      'disputes.view',
      'opportunities.view',
      'content.view',
      'emails.view',
      'hr.view',
      'payments.view',
      'admin_access.view',
      'tools.view',
    ],
  },
  {
    key: PDE_ROLE_KEY,
    name: 'Partnership Development Executive',
    description:
      'Partnership CRM and approved communications. No payroll, payments, or admin management.',
    permissionKeys: ['dashboard.view', 'hr.view', 'emails.view', 'emails.send', 'content.view'],
  },
];

export const ACCESS_RELATIONSHIPS = [
  'employee',
  'consultant',
  'executive',
  'external',
  'auditor',
  'technical_partner',
  'service_account',
  'test_account',
] as const;

export type AccessRelationship = (typeof ACCESS_RELATIONSHIPS)[number];

export const ACCESS_STATUSES = [
  'invited',
  'active',
  'suspended',
  'revoked',
  'expired',
] as const;

export type AccessStatus = (typeof ACCESS_STATUSES)[number];

/** Sidebar route → permission required to see the nav item. */
export const NAV_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/homeowners': 'homeowners.view',
  '/contractors': 'contractors.view',
  '/projects': 'projects.view',
  '/verification': 'verification.view',
  '/disputes': 'disputes.view',
  '/opportunities': 'opportunities.view',
  '/tools': 'tools.view',
  '/articles': 'content.view',
  '/emails': 'emails.view',
  '/people': 'hr.view',
  '/admin-access': 'admin_access.view',
};

export const CANDIDATE_STAGES = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'paid_pilot',
  'reference_check',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
] as const;

export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

export const ONBOARDING_TASK_TEMPLATES = [
  { key: 'contract_signed', title: 'Contract signed' },
  { key: 'identity_verified', title: 'Identity verified' },
  { key: 'department_assigned', title: 'Department assigned' },
  { key: 'position_assigned', title: 'Position assigned' },
  { key: 'manager_assigned', title: 'Manager assigned' },
  { key: 'company_account_created', title: 'Company account created' },
  { key: 'permissions_approved', title: 'Permissions approved' },
  { key: 'orientation_completed', title: 'Orientation completed' },
  { key: 'role_expectations_reviewed', title: 'Role expectations reviewed' },
  { key: 'kpi_scorecard_assigned', title: 'KPI scorecard assigned' },
  { key: 'probation_objectives_created', title: 'Probation objectives created' },
] as const;

export const HR_EMAIL_TEMPLATES: Record<string, { subject: string; bodyText: string }> = {
  application_received: {
    subject: 'We received your application — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nThank you for applying for {{position}}. Our team will review your application and follow up soon.\n\n— BuildMyHouse People Team',
  },
  interview_invitation: {
    subject: 'Interview invitation — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nWe would like to invite you to an interview for {{position}}. Please reply with your availability.\n\n— BuildMyHouse People Team',
  },
  assessment_invitation: {
    subject: 'Assessment invitation — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nPlease complete the assessment for {{position}}. Instructions will follow in this thread.\n\n— BuildMyHouse People Team',
  },
  paid_pilot_invitation: {
    subject: 'Paid pilot invitation — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nWe would like to invite you to a paid pilot for {{position}}.\n\n— BuildMyHouse People Team',
  },
  offer: {
    subject: 'Offer — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nWe are pleased to extend an offer for {{position}}. Our HR team will share details shortly.\n\n— BuildMyHouse People Team',
  },
  rejection: {
    subject: 'Update on your application — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nThank you for your interest in {{position}}. We will not be moving forward at this time.\n\n— BuildMyHouse People Team',
  },
  contract_renewal: {
    subject: 'Contract renewal — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nPlease review your upcoming contract renewal details.\n\n— BuildMyHouse People Team',
  },
  probation_review_reminder: {
    subject: 'Probation review reminder — BuildMyHouse',
    bodyText:
      'Hi {{name}},\n\nYour probation review is approaching. Please prepare your updates.\n\n— BuildMyHouse People Team',
  },
};
