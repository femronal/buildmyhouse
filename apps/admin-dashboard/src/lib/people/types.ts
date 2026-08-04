export type HrDashboard = {
  cards: {
    activeStaff: number;
    activeConsultants: number;
    candidatesInRecruitment: number;
    candidatesAwaitingInterview: number;
    peopleOnProbation: number;
    contractsExpiringSoon: number;
    missingDocuments: number;
    pendingReviews: number;
    openRoles: number;
  };
  pipelineSummary: Array<{ stage: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    summary?: string | null;
    createdAt: string;
    actor?: { fullName?: string | null } | null;
  }>;
  alerts: Array<{ type: string; message: string }>;
};

export type HrDepartment = {
  id: string;
  name: string;
  description?: string | null;
  headUserId?: string | null;
  _count?: { staff: number; positions: number };
};

export type HrPosition = {
  id: string;
  departmentId: string;
  name: string;
  description?: string | null;
  purpose?: string | null;
  responsibilities: string[];
  kpiDefinitions?: unknown;
  active: boolean;
  department?: { id: string; name: string };
  _count?: { staff: number; candidates: number };
};

export type HrCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  cvUrl?: string | null;
  stage: string;
  applicationDate: string;
  source?: string | null;
  interviewDate?: string | null;
  interviewNotes?: string | null;
  interviewScore?: number | null;
  assessmentInstructions?: string | null;
  assessmentSubmission?: string | null;
  assessmentScore?: number | null;
  pilotNotes?: string | null;
  referenceCheckNotes?: string | null;
  offerDetails?: string | null;
  rejectionReason?: string | null;
  internalNotes?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
  hiredStaff?: { id: string } | null;
  stageEvents?: Array<{
    id: string;
    fromStage?: string | null;
    toStage: string;
    note?: string | null;
    createdAt: string;
  }>;
  communications?: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: string;
  }>;
};

export type HrStaff = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  pictureUrl?: string | null;
  workforceType: string;
  employmentStatus: string;
  departmentId?: string | null;
  positionId?: string | null;
  startDate?: string | null;
  probationEndDate?: string | null;
  workLocation?: string | null;
  baseCompensation?: string | number | null;
  compensationRestricted?: boolean;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
  manager?: { id: string; fullName: string } | null;
  user?: { id: string; adminDashboardAccess: boolean } | null;
  onboardingTasks?: Array<{
    id: string;
    key: string;
    title: string;
    status: string;
  }>;
  roleAssignments?: Array<{
    id: string;
    role: { id: string; key: string; name: string };
  }>;
  documents?: Array<{ id: string; category: string; fileUrl: string; createdAt: string }>;
  performanceGoals?: Array<{
    id: string;
    kpi: string;
    target: string;
    period: string;
    actualResult?: string | null;
    status: string;
  }>;
  notes?: string | null;
};

export type HrPolicy = {
  id: string;
  title: string;
  category: string;
  content: string;
  version: string;
  status: string;
  acknowledgementSummary?: { acknowledged: number; required: number; label: string };
  _count?: { acknowledgements: number };
};

export type HrDocument = {
  id: string;
  category: string;
  fileUrl: string;
  fileName?: string | null;
  expiryDate?: string | null;
  signatureStatus: string;
  staffProfile?: { id: string; fullName: string } | null;
  candidate?: { id: string; fullName: string } | null;
  createdAt: string;
};

export type HrRole = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  permissions: Array<{ permission: { key: string; groupLabel: string } }>;
};

export type HrAuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  createdAt: string;
  actor?: { fullName?: string | null } | null;
};

export const CANDIDATE_STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  assessment: 'Assessment',
  paid_pilot: 'Paid Pilot',
  reference_check: 'Reference Check',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const PIPELINE_STAGES = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'paid_pilot',
  'reference_check',
  'offer',
  'hired',
] as const;
