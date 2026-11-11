import { materialLineAmount, summarizeJobMoney, teamLineAmount } from '../projects/job-money';
import { ON_SITE_RADIUS_METERS } from '../stages/stage-media-provenance';
import {
  ageInDays,
  attentionReasons,
  isDormant,
  isLiveJob,
  lastActivityAt,
  type AttentionReason,
  type DashboardMaterial,
  type DashboardProject,
  type DashboardStage,
  type DashboardTeamMember,
} from './dashboard-rules';
import { addIsoDays, lagosWeekContaining } from './lagos-week';
import { MONEY_LABELS, PENDING_APPROVAL_MONEY_LABELS } from './money-labels';

export type QueueItem = {
  id: string;
  group: 'money' | 'jobs' | 'trust';
  kind: string;
  title: string;
  detail: string;
  count: number;
  projectId?: string;
  projectName?: string;
  homeownerName?: string;
  stageId?: string;
  stageName?: string;
  amount?: number;
  since: string | null;
  href: string;
  jobHref?: string;
  actionLabel: string;
};

export type LiveJob = {
  id: string;
  name: string;
  homeownerName: string | null;
  gcName: string | null;
  stageNumber: number | null;
  stageCount: number;
  stageName: string | null;
  stageStatus: string | null;
  attention: AttentionReason[];
  moneyMoved: number;
  fullJobPrice: number;
  lastActivityAt: string;
  photos: { onSite: number; fromGallery: number; notChecked: number; reused: number };
  href: string;
};

export type RecentActivityItem = {
  id: string;
  type: string;
  label: string;
  detail: string;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
};

export type DashboardResponse = {
  generatedAt: string;
  strip: {
    needsYou: { total: number; jobs: number; money: number; trust: number };
    liveJobs: { count: number; needAttention: number };
    moneyIn: { label: string; amount: number; count: number };
    openDisputes: { count: number; oldestDays: number | null };
  };
  queue: { money: QueueItem[]; jobs: QueueItem[] };
  dormant: { count: number; examples: Array<{ id: string; name: string; homeownerName: string | null }> };
  liveJobs: LiveJob[];
  moneyThisWeek: { weekStart: string; weekEnd: string; lines: Array<{ key: string; label: string; amount: number }> };
  trust: QueueItem[];
  activity: RecentActivityItem[];
};

type WeekMoneyLine = {
  payeeKind?: string | null;
  status?: string | null;
  totalPrice?: number | null;
  quantity?: number | null;
  unitPrice?: number | null;
  paidAt?: Date | string | null;
};

type WeekTeamLine = {
  payStatus?: string | null;
  paidBy?: string | null;
  paidAmount?: number | null;
  dailyRate?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  paidAt?: Date | string | null;
};

export type DashboardBuildInput = {
  now: Date;
  projects: DashboardProject[];
  weekPayments: Array<{ amount?: number | null; status?: string | null; createdAt?: Date | string | null }>;
  weekMaterials: WeekMoneyLine[];
  weekTeam: WeekTeamLine[];
  failedPayments: Array<{ createdAt?: Date | string | null }>;
  missingPlanFiles: Array<{ projectId: string }>;
  gcsReady: number;
  trustCounts: {
    scamReports: number;
    listingReviews: number;
    gcPlans: number;
    vendorClaims: number;
    professionalClaims: number;
    artisanClaims: number;
  };
  activity: RecentActivityItem[];
};

function iso(value?: Date | string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function homeownerName(project: DashboardProject): string | null {
  const name = project.homeowner?.fullName?.trim();
  return name || null;
}

function named(project: DashboardProject): string {
  const owner = homeownerName(project);
  return owner ? `${project.name} · ${owner}` : project.name;
}

function bySince(left: QueueItem, right: QueueItem): number {
  if (!left.since && !right.since) return 0;
  if (!left.since) return 1;
  if (!right.since) return -1;
  return left.since < right.since ? -1 : left.since > right.since ? 1 : 0;
}

function orderedStages(project: DashboardProject): DashboardStage[] {
  return [...(project.stages || [])].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

function currentStage(project: DashboardProject): { stage: DashboardStage | null; number: number | null; count: number } {
  const stages = orderedStages(project);
  if (stages.length === 0) return { stage: null, number: null, count: 0 };
  const index = stages.findIndex((stage) => stage.status !== 'completed');
  const chosen = index >= 0 ? index : stages.length - 1;
  return { stage: stages[chosen], number: chosen + 1, count: stages.length };
}

function photoCounts(stage: DashboardStage | null): LiveJob['photos'] {
  const photos = { onSite: 0, fromGallery: 0, notChecked: 0, reused: 0 };
  for (const media of stage?.media || []) {
    if (media.duplicateOfMediaId) photos.reused += 1;
    if (media.source === 'gallery') {
      photos.fromGallery += 1;
      continue;
    }
    const distance = Number(media.distanceFromSiteMeters);
    if (media.distanceFromSiteMeters != null && Number.isFinite(distance) && distance <= ON_SITE_RADIUS_METERS) {
      photos.onSite += 1;
    } else if (media.distanceFromSiteMeters == null) {
      photos.notChecked += 1;
    }
  }
  return photos;
}

function invoicedLines(stage: DashboardStage): Array<{ amount: number; updatedAt: string | null }> {
  const lines: Array<{ amount: number; updatedAt: string | null }> = [];
  for (const material of stage.materials || []) {
    if (material.status !== 'invoiced') continue;
    lines.push({ amount: materialLineAmount(material), updatedAt: iso(material.updatedAt) });
  }
  for (const member of stage.teamMembers || []) {
    if (member.payStatus !== 'invoiced') continue;
    lines.push({ amount: teamLineAmount(member), updatedAt: iso(member.updatedAt) });
  }
  return lines;
}

function oldestIso(values: Array<string | null>): string | null {
  const present = values.filter((value): value is string => Boolean(value)).sort();
  return present[0] || null;
}

function moneyQueue(projects: DashboardProject[], failedPayments: DashboardBuildInput['failedPayments'], now: Date): QueueItem[] {
  const items: QueueItem[] = [];
  for (const project of projects) {
    if (isDormant(project, now)) continue;
    if (project.paymentConfirmationStatus === 'declared') {
      const declaredDays = ageInDays(project.paymentDeclaredAt, now);
      const when = declaredDays == null ? '' : declaredDays === 0 ? ' · declared today' : ` · declared ${declaredDays} day${declaredDays === 1 ? '' : 's'} ago`;
      const item: QueueItem = {
        id: `declared:${project.id}`,
        group: 'money',
        kind: 'payment_declared',
        title: 'Payment declared, confirm receipt',
        detail: `${named(project)}${when}`,
        count: 1,
        projectId: project.id,
        projectName: project.name,
        homeownerName: homeownerName(project) || undefined,
        since: iso(project.paymentDeclaredAt),
        href: `/projects/${project.id}`,
        actionLabel: 'Confirm',
      };
      items.push(item);
    }
    for (const stage of project.stages || []) {
      const lines = invoicedLines(stage);
      if (lines.length === 0) continue;
      const amount = lines.reduce((sum, line) => sum + line.amount, 0);
      items.push({
        id: `invoiced:${stage.id}`,
        group: 'money',
        kind: 'invoiced_not_paid',
        title: PENDING_APPROVAL_MONEY_LABELS.invoicedNotPaid,
        detail: `${named(project)} · ${stage.name || 'Stage'} · ${lines.length} line${lines.length === 1 ? '' : 's'}`,
        count: lines.length,
        projectId: project.id,
        projectName: project.name,
        homeownerName: homeownerName(project) || undefined,
        stageId: stage.id,
        stageName: stage.name || undefined,
        amount,
        since: oldestIso(lines.map((line) => line.updatedAt)),
        href: `/projects/${project.id}/stages/${stage.id}`,
        jobHref: `/projects/${project.id}`,
        actionLabel: 'Review',
      });
    }
  }
  if (failedPayments.length > 0) {
    items.push({
      id: 'failed-payments',
      group: 'money',
      kind: 'failed_payments',
      title: `${failedPayments.length} payment${failedPayments.length === 1 ? '' : 's'} failed in the last 24 hours`,
      detail: 'Open the job\'s payment records',
      count: failedPayments.length,
      since: oldestIso(failedPayments.map((payment) => iso(payment.createdAt))),
      href: '/projects',
      actionLabel: 'Open',
    });
  }
  return items.sort(bySince);
}

function jobsQueue(projects: DashboardProject[], missingPlanFiles: Array<{ projectId: string }>, now: Date): QueueItem[] {
  const items: QueueItem[] = [];
  for (const project of projects) {
    if (isDormant(project, now)) continue;
    const owner = homeownerName(project);
    for (const stage of project.stages || []) {
      if (stage.status !== 'pending_homeowner_approval' || !stage.submittedForApprovalAt) continue;
      const days = ageInDays(stage.submittedForApprovalAt, now);
      if (days == null || days < 2) continue;
      const reminders = stage.approvalReminderCount || 0;
      items.push({
        id: `approval:${stage.id}`,
        group: 'jobs',
        kind: 'approval_overdue',
        title: `Stage needs homeowner approval for ${days} day${days === 1 ? '' : 's'}`,
        detail: `${named(project)} · ${stage.name || 'Stage'} · ${reminders} reminder${reminders === 1 ? '' : 's'} sent`,
        count: 1,
        projectId: project.id,
        projectName: project.name,
        homeownerName: owner || undefined,
        stageId: stage.id,
        stageName: stage.name || undefined,
        since: iso(stage.submittedForApprovalAt),
        href: `/projects/${project.id}/stages/${stage.id}`,
        jobHref: `/projects/${project.id}`,
        actionLabel: 'Open stage',
      });
    }
    for (const request of project.stageChangeRequests || []) {
      if (request.status && request.status !== 'pending') continue;
      const bits = [named(project)];
      if (request.stage?.name) bits.push(request.stage.name);
      if (request.additionalAmount != null) bits.push(`+₦${Number(request.additionalAmount).toLocaleString('en-NG')}`);
      if (request.additionalDurationDays != null) bits.push(`+${request.additionalDurationDays} days`);
      items.push({
        id: `change:${request.id}`,
        group: 'jobs',
        kind: 'change_request',
        title: 'Change request to review',
        detail: bits.join(' · '),
        count: 1,
        projectId: project.id,
        projectName: project.name,
        homeownerName: owner || undefined,
        stageId: request.stageId || request.stage?.id,
        stageName: request.stage?.name || undefined,
        amount: request.additionalAmount ?? undefined,
        since: iso(request.createdAt),
        href: '/verification',
        jobHref: `/projects/${project.id}`,
        actionLabel: 'Review',
      });
    }
    for (const dispute of project.disputes || []) {
      if (dispute.status !== 'open' && dispute.status !== 'in_review') continue;
      const stage = (project.stages || []).find((item) => item.id === dispute.stageId);
      const days = ageInDays(dispute.createdAt, now);
      const bits = [named(project)];
      if (stage?.name) bits.push(stage.name);
      const reasons = (dispute.reasons || []).map((reason) => reason.replace(/_/g, ' ')).filter(Boolean);
      if (reasons.length) bits.push(reasons.join(', '));
      if (days != null) bits.push(`${days} day${days === 1 ? '' : 's'}`);
      items.push({
        id: `dispute:${dispute.id}`,
        group: 'jobs',
        kind: 'open_dispute',
        title: 'Dispute open',
        detail: bits.join(' · '),
        count: 1,
        projectId: project.id,
        projectName: project.name,
        homeownerName: owner || undefined,
        stageId: dispute.stageId || undefined,
        stageName: stage?.name || undefined,
        since: iso(dispute.createdAt),
        href: '/disputes',
        jobHref: `/projects/${project.id}`,
        actionLabel: 'Open',
      });
    }
    const reasons = attentionReasons(project, now);
    if (reasons.includes('no_update')) {
      const days = ageInDays(lastActivityAt(project), now) || 0;
      const gc = project.generalContractor?.fullName?.trim();
      const bits = [named(project)];
      if (gc) bits.push(`GC: ${gc}`);
      items.push({
        id: `no-update:${project.id}`,
        group: 'jobs',
        kind: 'no_update',
        title: `No update in ${days} days`,
        detail: bits.join(' · '),
        count: 1,
        projectId: project.id,
        projectName: project.name,
        homeownerName: owner || undefined,
        since: lastActivityAt(project).toISOString(),
        href: `/projects/${project.id}`,
        actionLabel: 'Open job',
      });
    }
    for (const stage of project.stages || []) {
      if (stage.status === 'completed') continue;
      const media = stage.media || [];
      const reused = media.filter((item) => item.duplicateOfMediaId).length;
      const far = media.filter((item) => {
        const distance = Number(item.distanceFromSiteMeters);
        return item.distanceFromSiteMeters != null && Number.isFinite(distance) && distance > ON_SITE_RADIUS_METERS;
      }).length;
      if (reused === 0 && far === 0) continue;
      const bits = [named(project), stage.name || 'Stage'];
      if (reused) bits.push(`${reused} reused`);
      if (far) bits.push(`${far} far from the site`);
      items.push({
        id: `flagged:${stage.id}`,
        group: 'jobs',
        kind: 'flagged_photo',
        title: 'Photo check',
        detail: bits.join(' · '),
        count: reused + far,
        projectId: project.id,
        projectName: project.name,
        homeownerName: owner || undefined,
        stageId: stage.id,
        stageName: stage.name || undefined,
        since: oldestIso(media.map((item) => iso(item.createdAt))),
        href: `/projects/${project.id}/stages/${stage.id}`,
        jobHref: `/projects/${project.id}`,
        actionLabel: 'Open stage',
      });
    }
  }
  if (missingPlanFiles.length > 0) {
    items.push({
      id: 'missing-plans',
      group: 'jobs',
      kind: 'missing_plan_files',
      title: `${missingPlanFiles.length} project plan file${missingPlanFiles.length === 1 ? ' is' : 's are'} missing`,
      detail: 'Some project plans cannot be downloaded.',
      count: missingPlanFiles.length,
      since: null,
      href: '/projects',
      actionLabel: 'Open',
    });
  }
  return items.sort(bySince);
}

function trustQueue(input: DashboardBuildInput): QueueItem[] {
  const rows: Array<Omit<QueueItem, 'group' | 'since'> & { since?: string | null }> = [];
  const add = (item: Omit<QueueItem, 'group' | 'since'>) => {
    if (item.count <= 0) return;
    rows.push(item);
  };
  add({
    id: 'scam-reports',
    kind: 'scam_reports',
    title: 'Scam report, new',
    detail: 'New private reports',
    count: input.trustCounts.scamReports,
    href: '/scam-reports',
    actionLabel: 'Open',
  });
  add({
    id: 'gc-verification',
    kind: 'gcs_ready',
    title: 'GCs ready for verification',
    detail: 'All documents uploaded',
    count: input.gcsReady,
    href: '/verification',
    actionLabel: 'Review',
  });
  add({
    id: 'listing-reviews',
    kind: 'listing_reviews',
    title: 'Listing reviews to approve',
    detail: 'Pending review',
    count: input.trustCounts.listingReviews,
    href: '/listing-reviews',
    actionLabel: 'Review',
  });
  add({
    id: 'gc-plans',
    kind: 'gc_plans',
    title: 'GC plans to approve',
    detail: 'Project docs pending',
    count: input.trustCounts.gcPlans,
    href: '/verification',
    actionLabel: 'Review',
  });
  add({
    id: 'vendor-claims',
    kind: 'vendor_claims',
    title: 'Vendor claims to approve',
    detail: 'Vendors',
    count: input.trustCounts.vendorClaims,
    href: '/vendors',
    actionLabel: 'Review',
  });
  add({
    id: 'professional-claims',
    kind: 'professional_claims',
    title: 'Professional claims to approve',
    detail: 'Professionals',
    count: input.trustCounts.professionalClaims,
    href: '/professionals',
    actionLabel: 'Review',
  });
  add({
    id: 'artisan-claims',
    kind: 'artisan_claims',
    title: 'Artisan claims to approve',
    detail: 'Artisans',
    count: input.trustCounts.artisanClaims,
    href: '/artisans',
    actionLabel: 'Review',
  });
  return rows.map((item) => ({ ...item, group: 'trust' as const, since: null }));
}

function liveJobs(projects: DashboardProject[], now: Date): LiveJob[] {
  return projects
    .filter((project) => isLiveJob(project, now))
    .map((project) => {
      const current = currentStage(project);
      const money = summarizeJobMoney({
        budget: project.budget,
        stages: project.stages || [],
        payments: project.payments || [],
      });
      return {
        id: project.id,
        name: project.name,
        homeownerName: homeownerName(project),
        gcName: project.generalContractor?.fullName?.trim() || null,
        stageNumber: current.number,
        stageCount: current.count,
        stageName: current.stage?.name || null,
        stageStatus: current.stage?.status || null,
        attention: attentionReasons(project, now),
        moneyMoved: money.moneyMoved,
        fullJobPrice: money.fullJobPrice,
        lastActivityAt: lastActivityAt(project).toISOString(),
        photos: photoCounts(current.stage),
        href: `/projects/${project.id}`,
      };
    })
    .sort((left, right) => {
      const leftAttention = left.attention.length > 0 ? 0 : 1;
      const rightAttention = right.attention.length > 0 ? 0 : 1;
      if (leftAttention !== rightAttention) return leftAttention - rightAttention;
      return left.lastActivityAt < right.lastActivityAt ? -1 : left.lastActivityAt > right.lastActivityAt ? 1 : 0;
    });
}

function invoicedNow(projects: DashboardProject[], now: Date): number {
  let total = 0;
  for (const project of projects) {
    if (!isLiveJob(project, now)) continue;
    for (const stage of project.stages || []) {
      for (const line of invoicedLines(stage)) total += line.amount;
    }
  }
  return total;
}

function stillWithBuildMyHouse(projects: DashboardProject[], now: Date): number {
  return projects.reduce((sum, project) => {
    if (!isLiveJob(project, now)) return sum;
    const money = summarizeJobMoney({
      budget: project.budget,
      stages: project.stages || [],
      payments: project.payments || [],
    });
    return sum + money.stillWithBuildMyHouse;
  }, 0);
}

function paidAmount(lines: WeekMoneyLine[], kind: string): number {
  return lines.reduce((sum, line) => {
    if (line.payeeKind !== kind) return sum;
    return sum + materialLineAmount(line as DashboardMaterial);
  }, 0);
}

export function buildDashboard(input: DashboardBuildInput): DashboardResponse {
  const now = input.now;
  const week = lagosWeekContaining(now);
  const active = input.projects.filter((project) => project.status === 'active' && !project.archivedAt);
  const dormantProjects = active.filter((project) => isDormant(project, now));
  const jobs = liveJobs(input.projects, now);
  const money = moneyQueue(input.projects, input.failedPayments, now);
  const jobItems = jobsQueue(input.projects, input.missingPlanFiles, now);
  const trust = trustQueue(input);
  const openDisputes = input.projects.flatMap((project) =>
    (project.disputes || []).filter((dispute) => dispute.status === 'open' || dispute.status === 'in_review'),
  );
  const oldestDispute = openDisputes
    .map((dispute) => ageInDays(dispute.createdAt, now))
    .filter((days): days is number => days != null)
    .sort((left, right) => right - left)[0];
  const moneyInAmount = input.weekPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const trustTotal = trust.reduce((sum, item) => sum + item.count, 0);
  const needAttention = jobs.filter((job) => job.attention.length > 0).length;

  return {
    generatedAt: now.toISOString(),
    strip: {
      needsYou: {
        money: money.length,
        jobs: jobItems.length,
        trust: trustTotal,
        total: money.length + jobItems.length + trustTotal,
      },
      liveJobs: { count: jobs.length, needAttention },
      moneyIn: {
        label: `${PENDING_APPROVAL_MONEY_LABELS.moneyIn} this week`,
        amount: moneyInAmount,
        count: input.weekPayments.length,
      },
      openDisputes: {
        count: openDisputes.length,
        oldestDays: openDisputes.length ? oldestDispute ?? null : null,
      },
    },
    queue: { money, jobs: jobItems },
    dormant: {
      count: dormantProjects.length,
      examples: dormantProjects
        .map((project) => ({
          id: project.id,
          name: project.name,
          homeownerName: homeownerName(project),
          at: lastActivityAt(project).toISOString(),
        }))
        .sort((left, right) => (left.at < right.at ? -1 : 1))
        .slice(0, 5)
        .map(({ id, name, homeownerName: owner }) => ({ id, name, homeownerName: owner })),
    },
    liveJobs: jobs,
    moneyThisWeek: {
      weekStart: week.weekStartIso,
      weekEnd: addIsoDays(week.weekStartIso, 6),
      lines: [
        { key: 'moneyIn', label: PENDING_APPROVAL_MONEY_LABELS.moneyIn, amount: moneyInAmount },
        { key: 'sentToContractor', label: MONEY_LABELS.sentToContractor, amount: paidAmount(input.weekMaterials, 'artisan') },
        { key: 'paidToShopsForMaterials', label: MONEY_LABELS.paidToShopsForMaterials, amount: paidAmount(input.weekMaterials, 'shop') },
        {
          key: 'paidToTeamMembers',
          label: MONEY_LABELS.paidToTeamMembers,
          amount: input.weekTeam.reduce((sum, line) => {
            if (line.paidBy !== 'bmh') return sum;
            return sum + teamLineAmount(line as DashboardTeamMember);
          }, 0),
        },
        { key: 'invoicedNotPaid', label: PENDING_APPROVAL_MONEY_LABELS.invoicedNotPaid, amount: invoicedNow(input.projects, now) },
        { key: 'stillWithBuildMyHouse', label: MONEY_LABELS.stillWithBuildMyHouse, amount: stillWithBuildMyHouse(input.projects, now) },
      ],
    },
    trust,
    activity: input.activity.slice(0, 5),
  };
}
