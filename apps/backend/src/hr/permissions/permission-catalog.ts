export type PermissionDef = {
  key: string;
  groupLabel: string;
  description: string;
};

/** Stable permission keys for internal admin access. */
export const HR_PERMISSION_CATALOG: PermissionDef[] = [
  { key: 'homeowners.view', groupLabel: 'Homeowners', description: 'View homeowner accounts' },
  { key: 'homeowners.edit', groupLabel: 'Homeowners', description: 'Edit homeowner accounts' },
  { key: 'homeowners.contact', groupLabel: 'Homeowners', description: 'Contact homeowners' },
  { key: 'contractors.view', groupLabel: 'Contractors', description: 'View contractors' },
  { key: 'contractors.edit', groupLabel: 'Contractors', description: 'Edit contractors' },
  { key: 'contractors.verify', groupLabel: 'Contractors', description: 'Verify contractors' },
  { key: 'projects.view', groupLabel: 'Projects', description: 'View projects' },
  { key: 'projects.edit', groupLabel: 'Projects', description: 'Edit projects' },
  { key: 'projects.activate', groupLabel: 'Projects', description: 'Activate projects' },
  { key: 'projects.pause', groupLabel: 'Projects', description: 'Pause projects' },
  { key: 'payments.view', groupLabel: 'Payments', description: 'View payments' },
  { key: 'payments.confirm', groupLabel: 'Payments', description: 'Confirm payments' },
  { key: 'payments.manage', groupLabel: 'Payments', description: 'Manage payments' },
  { key: 'content.view', groupLabel: 'Content', description: 'View content' },
  { key: 'content.create', groupLabel: 'Content', description: 'Create content' },
  { key: 'content.publish', groupLabel: 'Content', description: 'Publish content' },
  { key: 'emails.view', groupLabel: 'Email', description: 'View email tools' },
  { key: 'emails.send', groupLabel: 'Email', description: 'Send emails' },
  { key: 'hr.view', groupLabel: 'HR', description: 'View People & HR module' },
  { key: 'hr.candidates.manage', groupLabel: 'HR', description: 'Manage recruitment candidates' },
  { key: 'hr.people.manage', groupLabel: 'HR', description: 'Manage staff profiles' },
  { key: 'hr.compensation.view', groupLabel: 'HR', description: 'View compensation data' },
  { key: 'hr.documents.manage', groupLabel: 'HR', description: 'Manage HR documents' },
  { key: 'hr.performance.manage', groupLabel: 'HR', description: 'Manage performance records' },
  { key: 'hr.permissions.manage', groupLabel: 'HR', description: 'Manage HR roles and permissions' },
  { key: 'hr.policies.manage', groupLabel: 'HR', description: 'Manage company policies' },
  { key: 'admin.users.manage', groupLabel: 'Admin', description: 'Manage admin user accounts' },
  { key: 'admin.permissions.manage', groupLabel: 'Admin', description: 'Manage system permission roles' },
];

export const SUPER_ADMIN_ROLE_KEY = 'super_admin';
export const HR_MANAGER_ROLE_KEY = 'hr_manager';
export const PDE_ROLE_KEY = 'partnership_development_executive';

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

export const HR_EMAIL_TEMPLATES: Record<
  string,
  { subject: string; bodyText: string }
> = {
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
