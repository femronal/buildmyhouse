import type { ApiProject, ProjectView, StageView } from './types';

export const TAB_ORDER = ['needs_attention', 'active', 'paused', 'completed', 'drafts_and_tests', 'archived', 'all'] as const;
export type ProjectTab = (typeof TAB_ORDER)[number];

export const TAB_LABELS: Record<ProjectTab, string> = {
  needs_attention: 'Needs attention',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  drafts_and_tests: 'Drafts and tests',
  archived: 'Archived',
  all: 'All',
};

export const PAYMENT_LABELS: Record<string, string> = {
  not_declared: 'Not declared',
  declared: 'Receipt to confirm',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
};

export const REASON_LABELS: Record<string, string> = {
  no_update: 'No update N days',
  high_risk: 'high risk',
  open_dispute: 'Dispute open',
  approval_overdue: 'Homeowner approval N days',
  flagged_photo: 'Photo flagged',
  extra_monitoring: 'Extra monitoring',
  payment_to_confirm: 'Receipt to confirm',
  payment_not_declared: 'Payment not declared',
  no_gc: 'No GC matched',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatUpdatedAt(updatedAt?: string) {
  if (!updatedAt) return '—';
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDateShort(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

export function computeNextMilestone(project: ApiProject) {
  if (project.currentStage) return project.currentStage;
  const stages = project.stages || [];
  const next = [...stages]
    .sort((a, b) => a.order - b.order)
    .find((s) => s.status !== 'completed');
  return next?.name || '—';
}

export function computeDisplayStatus(project: ApiProject): string {
  if (project.status === 'completed' || Number(project.progress || 0) >= 100) {
    return 'completed';
  }
  return project.status;
}

export function computeRisk(project: ApiProject): ProjectView['risk'] {
  if (project.riskLevel === 'low' || project.riskLevel === 'medium' || project.riskLevel === 'high') {
    return project.riskLevel;
  }
  if (project.paymentConfirmationStatus === 'declared' || project.status === 'pending_payment') return 'high';
  if (project.status === 'paused') return 'medium';
  return 'low';
}

export function cycleRisk(current: ProjectView['risk']): ProjectView['risk'] {
  if (current === 'low') return 'medium';
  if (current === 'medium') return 'high';
  return 'low';
}

export function displayWhenSet(value?: string | null): string {
  if (!value || value === formatUpdatedAt()) return 'Not set';
  return value;
}

export function quietDaysSince(iso?: string | null, now = new Date()): number {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return 0;
  const age = now.getTime() - time;
  if (age < 0) return 0;
  return Math.floor(age / DAY_MS);
}

export function approvalAgeDays(stages?: StageView[] | null, now = new Date()): number | null {
  const times = (stages || [])
    .filter((stage) => stage.status === 'pending_homeowner_approval' && stage.submittedForApprovalAt)
    .map((stage) => new Date(stage.submittedForApprovalAt as string).getTime())
    .filter((time) => Number.isFinite(time));
  if (!times.length) return null;
  return Math.max(0, Math.floor((now.getTime() - Math.min(...times)) / DAY_MS));
}

export function locationOf(project: ApiProject): string {
  const place = [project.city, project.state].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
  return place || String(project.address || '').trim();
}

export function pageReasons(view: Pick<ProjectView, 'archivedAt' | 'rawStatus' | 'paymentConfirmationStatus' | 'dormant' | 'hasConfirmedMoney' | 'generalContractorId' | 'quietDays'> & { attentionReasons: string[] }): string[] {
  const reasons = [...view.attentionReasons];
  const archived = Boolean(view.archivedAt);
  if (!archived && view.paymentConfirmationStatus === 'declared') reasons.push('payment_to_confirm');
  if (
    view.rawStatus === 'active' &&
    !archived &&
    !view.dormant &&
    !view.hasConfirmedMoney &&
    (view.paymentConfirmationStatus === 'not_declared' || view.paymentConfirmationStatus === 'rejected')
  ) {
    reasons.push('payment_not_declared');
  }
  if (
    !archived &&
    !view.generalContractorId &&
    view.rawStatus !== 'draft' &&
    view.rawStatus !== 'completed' &&
    view.rawStatus !== 'cancelled' &&
    view.quietDays < 28
  ) {
    reasons.push('no_gc');
  }
  return reasons;
}

export function toProjectView(p: ApiProject, now = new Date()): ProjectView {
  const lastActivityAt = p.attention?.lastActivityAt || p.updatedAt || '';
  const quietDays = quietDaysSince(lastActivityAt, now);
  const requestGc = p.projectRequests?.[0]?.contractor;
  const gcVerified = Boolean(
    p.generalContractor?.contractorProfile?.verified ?? requestGc?.contractorProfile?.verified ?? false,
  );
  const base = {
    id: p.id,
    name: p.name,
    address: p.address,
    location: locationOf(p),
    city: p.city ?? null,
    state: p.state ?? null,
    homeowner: p.homeowner?.fullName || '',
    homeownerEmail: p.homeowner?.email ?? null,
    gc: p.generalContractor?.fullName || '',
    gcEmail: p.generalContractor?.email ?? null,
    generalContractorId: p.generalContractorId ?? null,
    status: computeDisplayStatus(p),
    rawStatus: p.status,
    risk: computeRisk(p),
    progress: p.progress ?? 0,
    budget: p.budget ?? 0,
    spent: p.spent ?? 0,
    lastUpdate: formatUpdatedAt(lastActivityAt),
    lastActivityAt,
    quietDays,
    dormant: Boolean(p.attention?.dormant),
    hasConfirmedMoney: Boolean(p.attention?.hasConfirmedMoney),
    gcVerified,
    needsExtraMonitoring: Boolean(p.needsExtraMonitoring),
    nextMilestone: computeNextMilestone(p),
    projectType: p.projectType ?? null,
    externalPaymentLink: p.externalPaymentLink ?? null,
    paymentConfirmationStatus: p.paymentConfirmationStatus ?? null,
    paymentRef: p.paymentRef,
    archivedAt: p.archivedAt ?? null,
    managedByAdmin: p.managedByAdmin ?? false,
    stages: p.stages ?? null,
    planRequestStep: p.planRequestStep ?? null,
    fundingReference: p.aiAnalysis?.fundingInvoice?.reference ?? null,
    fundingReceiptUrl: p.aiAnalysis?.fundingInvoice?.receipt?.url ?? null,
    attentionReasons: p.attention?.reasons || [],
  };
  const { attentionReasons, ...view } = base;
  return { ...view, reasons: pageReasons({ ...base, attentionReasons }) };
}

export function inNeedsAttention(project: ProjectView) {
  return !project.archivedAt && project.reasons.length > 0;
}

export function inActive(project: ProjectView) {
  return !project.archivedAt && !project.dormant && ['active', 'pending_payment', 'pending_admin_review'].includes(project.rawStatus);
}

export function inPaused(project: ProjectView) {
  return !project.archivedAt && project.rawStatus === 'paused';
}

export function inCompleted(project: ProjectView) {
  return !project.archivedAt && (project.status === 'completed' || project.rawStatus === 'cancelled');
}

export function inDraftsAndTests(project: ProjectView) {
  if (project.archivedAt || project.hasConfirmedMoney) return false;
  if (project.status === 'completed' || project.rawStatus === 'cancelled') return false;
  if (!(project.dormant || project.rawStatus === 'draft')) return false;
  if (project.reasons.includes('no_gc') || project.reasons.includes('payment_to_confirm')) return false;
  return true;
}

export function inArchived(project: ProjectView) {
  return Boolean(project.archivedAt);
}

export function inTab(project: ProjectView, tab: ProjectTab) {
  if (tab === 'needs_attention') return inNeedsAttention(project);
  if (tab === 'active') return inActive(project);
  if (tab === 'paused') return inPaused(project);
  if (tab === 'completed') return inCompleted(project);
  if (tab === 'drafts_and_tests') return inDraftsAndTests(project);
  if (tab === 'archived') return inArchived(project);
  return true;
}

export function reasonLabel(code: string, project: ProjectView): string {
  if (code === 'no_update') return `No update ${project.quietDays} days`;
  if (code === 'approval_overdue') {
    const days = approvalAgeDays(project.stages);
    return days == null ? 'Homeowner approval due' : `Homeowner approval ${days} days`;
  }
  return REASON_LABELS[code] || code.replace(/_/g, ' ');
}

export function reasonTone(code: string): string {
  if (code === 'extra_monitoring') return 'bg-blue-100 text-blue-800';
  if (code === 'approval_overdue' || code === 'payment_not_declared') return 'bg-amber-100 text-amber-800';
  if (code === 'payment_to_confirm' || code === 'no_update' || code === 'high_risk' || code === 'open_dispute' || code === 'flagged_photo' || code === 'no_gc') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
}

export function paymentTone(status?: string | null): string {
  if (status === 'confirmed') return 'bg-green-100 text-green-800';
  if (status === 'declared') return 'bg-amber-100 text-amber-800';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

export function outstandingOf(budget: number, spent: number) {
  return Math.max(budget - spent, 0);
}

export function moneyText(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function sortProjects(list: ProjectView[], sortBy: string): ProjectView[] {
  const timeOf = (project: ProjectView) => {
    const time = new Date(project.lastActivityAt).getTime();
    return Number.isFinite(time) ? time : 0;
  };
  return [...list].sort((a, b) => {
    if (sortBy === 'updated') return timeOf(b) - timeOf(a);
    if (sortBy === 'stalest') return timeOf(a) - timeOf(b);
    if (sortBy === 'progress') return b.progress - a.progress;
    if (sortBy === 'budget') return b.budget - a.budget;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return b.reasons.length - a.reasons.length || timeOf(a) - timeOf(b);
  });
}

export type ProjectFilters = {
  q: string;
  risk: string;
  gc: string;
  pay: string;
  show: string;
};

export function projectMatches(project: ProjectView, filters: ProjectFilters): boolean {
  const query = filters.q.trim().toLowerCase();
  if (query) {
    const haystack = [project.name, project.homeowner, project.homeownerEmail, project.gc, project.gcEmail, project.address, project.city, project.state, project.id, project.paymentRef]
      .map((value) => String(value || '').toLowerCase())
      .join(' ');
    if (!haystack.includes(query)) return false;
  }
  if (filters.risk && project.risk !== filters.risk) return false;
  if (filters.gc === '__unmatched__' && project.generalContractorId) return false;
  if (filters.gc && filters.gc !== '__unmatched__' && project.gc !== filters.gc) return false;
  if (filters.pay) {
    const status = project.paymentConfirmationStatus || 'not_declared';
    if (status !== filters.pay) return false;
  }
  if (filters.show === 'extra' && !project.needsExtraMonitoring) return false;
  if (filters.show === 'approval' && !(project.stages || []).some((stage) => stage.status === 'pending_homeowner_approval')) return false;
  if (filters.show === 'managed' && !project.managedByAdmin) return false;
  return true;
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function toCsv(list: ProjectView[]): string {
  const header = ['Project', 'BMH ref', 'Location', 'Homeowner', 'GC', 'Status', 'Risk', 'Progress %', 'Budget', 'Spent', 'Outstanding', 'Payment', 'Last activity', 'Reasons'];
  const rows = list.map((project) => [
    project.name,
    project.paymentRef || '',
    project.location,
    project.homeowner,
    project.gc,
    project.archivedAt ? 'archived' : project.rawStatus.replace(/_/g, ' '),
    project.risk,
    project.progress,
    project.budget,
    project.spent,
    outstandingOf(project.budget, project.spent),
    PAYMENT_LABELS[project.paymentConfirmationStatus || 'not_declared'] || '',
    project.lastActivityAt,
    project.reasons.map((code) => reasonLabel(code, project)).join('; '),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function mailtoFor(email: string | null | undefined, projectName: string) {
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(`BuildMyHouse: ${projectName}`)}`;
}

export function canActivateProject(project: ProjectView) {
  return !project.archivedAt && (project.rawStatus === 'pending_payment' || project.rawStatus === 'paused');
}

export function canDeactivateProject(project: ProjectView) {
  return !project.archivedAt && project.rawStatus === 'active';
}

export function stagesDone(project: ProjectView) {
  const stages = project.stages || [];
  return { done: stages.filter((stage) => stage.status === 'completed').length, total: stages.length };
}
