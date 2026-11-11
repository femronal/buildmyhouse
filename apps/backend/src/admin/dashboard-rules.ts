import { ON_SITE_RADIUS_METERS } from '../stages/stage-media-provenance';

export const NUDGE_DAYS = 7;
export const DORMANT_DAYS = 28;
export const APPROVAL_OVERDUE_DAYS = 2;

export type AttentionReason =
  | 'no_update'
  | 'high_risk'
  | 'open_dispute'
  | 'approval_overdue'
  | 'flagged_photo'
  | 'extra_monitoring';

export type DashboardMedia = {
  id?: string;
  createdAt?: Date | string | null;
  duplicateOfMediaId?: string | null;
  distanceFromSiteMeters?: number | null;
  source?: string | null;
};

export type DashboardMaterial = {
  status?: string | null;
  payeeKind?: string | null;
  totalPrice?: number | null;
  quantity?: number | null;
  unitPrice?: number | null;
  updatedAt?: Date | string | null;
  paidAt?: Date | string | null;
};

export type DashboardTeamMember = {
  payStatus?: string | null;
  paidBy?: string | null;
  paidAmount?: number | null;
  dailyRate?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  updatedAt?: Date | string | null;
  paidAt?: Date | string | null;
};

export type DashboardStage = {
  id: string;
  name?: string | null;
  status?: string | null;
  order?: number | null;
  updatedAt?: Date | string | null;
  submittedForApprovalAt?: Date | string | null;
  approvalReminderCount?: number | null;
  estimatedCost?: number | null;
  materials?: DashboardMaterial[] | null;
  teamMembers?: DashboardTeamMember[] | null;
  media?: DashboardMedia[] | null;
};

export type DashboardPayment = {
  id?: string | null;
  amount?: number | null;
  status?: string | null;
  method?: string | null;
  createdAt?: Date | string | null;
};

export type DashboardDispute = {
  id: string;
  status?: string | null;
  createdAt?: Date | string | null;
  stageId?: string | null;
  reasons?: string[] | null;
};

export type DashboardChangeRequest = {
  id: string;
  status?: string | null;
  additionalAmount?: number | null;
  additionalDurationDays?: number | null;
  createdAt?: Date | string | null;
  stageId?: string | null;
  stage?: { id?: string; name?: string | null } | null;
};

export type DashboardProject = {
  id: string;
  name: string;
  status?: string | null;
  archivedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  budget?: number | null;
  riskLevel?: string | null;
  needsExtraMonitoring?: boolean | null;
  generalContractorId?: string | null;
  paymentConfirmationStatus?: string | null;
  paymentDeclaredAt?: Date | string | null;
  homeowner?: { fullName?: string | null } | null;
  generalContractor?: { fullName?: string | null } | null;
  stages?: DashboardStage[] | null;
  payments?: DashboardPayment[] | null;
  disputes?: DashboardDispute[] | null;
  stageChangeRequests?: DashboardChangeRequest[] | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function timeOf(value?: Date | string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function lastActivityAt(project: DashboardProject): Date {
  let latest = 0;
  const consider = (value?: Date | string | null) => {
    const time = timeOf(value);
    if (time != null && time > latest) latest = time;
  };
  consider(project.updatedAt);
  for (const stage of project.stages || []) {
    consider(stage.updatedAt);
    for (const media of stage.media || []) consider(media.createdAt);
  }
  return new Date(latest);
}

export function hasConfirmedMoney(project: DashboardProject): boolean {
  if (project.paymentConfirmationStatus === 'confirmed') return true;
  return (project.payments || []).some((payment) => payment.status === 'completed');
}

export function isDormant(project: DashboardProject, now: Date): boolean {
  if (hasConfirmedMoney(project)) return false;
  if (!project.generalContractorId) return true;
  const ageDays = (now.getTime() - lastActivityAt(project).getTime()) / DAY_MS;
  return ageDays >= DORMANT_DAYS;
}

export function isLiveJob(project: DashboardProject, now: Date): boolean {
  return project.status === 'active' && !project.archivedAt && !isDormant(project, now);
}

function stageIsFlagged(stage: DashboardStage): boolean {
  if (stage.status === 'completed') return false;
  return (stage.media || []).some((media) => {
    if (media.duplicateOfMediaId) return true;
    const distance = Number(media.distanceFromSiteMeters);
    return media.distanceFromSiteMeters != null && Number.isFinite(distance) && distance > ON_SITE_RADIUS_METERS;
  });
}

export function attentionReasons(project: DashboardProject, now: Date): AttentionReason[] {
  if (!isLiveJob(project, now)) return [];
  const reasons: AttentionReason[] = [];
  const openDispute = (project.disputes || []).some(
    (dispute) => dispute.status === 'open' || dispute.status === 'in_review',
  );
  if (openDispute) reasons.push('open_dispute');
  const approvalOverdue = (project.stages || []).some((stage) => {
    if (stage.status !== 'pending_homeowner_approval' || !stage.submittedForApprovalAt) return false;
    const ageDays = (now.getTime() - new Date(stage.submittedForApprovalAt).getTime()) / DAY_MS;
    return ageDays >= APPROVAL_OVERDUE_DAYS;
  });
  if (approvalOverdue) reasons.push('approval_overdue');
  if ((project.stages || []).some(stageIsFlagged)) reasons.push('flagged_photo');
  const quietDays = (now.getTime() - lastActivityAt(project).getTime()) / DAY_MS;
  if (quietDays >= NUDGE_DAYS) reasons.push('no_update');
  if (project.riskLevel === 'high') reasons.push('high_risk');
  if (project.needsExtraMonitoring === true) reasons.push('extra_monitoring');
  return reasons;
}

export function ageInDays(from: Date | string | null | undefined, now: Date): number | null {
  const time = timeOf(from);
  if (time == null) return null;
  const age = now.getTime() - time;
  if (age < 0) return 0;
  return Math.floor(age / DAY_MS);
}
