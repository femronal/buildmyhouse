import { BadRequestException, Injectable } from '@nestjs/common';
import { materialLineAmount, summarizeJobMoney, teamLineAmount } from '../projects/job-money';
import { ON_SITE_RADIUS_METERS } from '../stages/stage-media-provenance';
import { PrismaService } from '../prisma/prisma.service';
import { ContractorsService } from '../contractors/contractors.service';
import { PlanFileHealthService } from './plan-file-health.service';
import {
  hasConfirmedMoney,
  isDormant,
  isLiveJob,
  lastActivityAt,
  type DashboardProject,
} from './dashboard-rules';
import { addIsoDays, lagosDateLabel, lagosWeekFromIso, previousLagosWeek, type LagosWeek } from './lagos-week';
import { MONEY_LABELS, PENDING_APPROVAL_MONEY_LABELS } from './money-labels';

export const PHOTO_TRACKING_MIGRATION = '20261109180000_stage_media_provenance';
export const REPORT_TRACKING_MIGRATION = '20261111090000_weekly_report_tracking';

export type ReportLine = {
  key: string;
  label: string;
  value: number | null;
  unit: 'count' | 'naira' | 'days';
  status: 'ok' | 'partial' | 'not_tracked';
  note?: string;
  previous?: number | null;
};

export type WeeklyReportJob = {
  projectId: string;
  name: string;
  homeownerName: string | null;
  gcName: string | null;
  status: string;
  dormant: boolean;
  stagesApproved: number;
  photosAdded: number;
  photosOnSite: number;
  photosReused: number;
  moneyIn: number;
  sentToContractor: number;
  paidToShopsForMaterials: number;
  paidToTeamMembers: number;
  invoicedNotPaid: number;
  stillWithBuildMyHouse: number;
  openDisputes: number;
};

export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  sections: Array<{ key: 'north_star' | 'money' | 'problems' | 'trust' | 'growth'; title: string; lines: ReportLine[] }>;
  jobs: WeeklyReportJob[];
};

type Coverage = { status: 'ok' | 'partial' | 'not_tracked'; note?: string };

export function resolveWeeklyReportWeek(week: string | undefined, now = new Date()): LagosWeek {
  const resolved = week ? lagosWeekFromIso(week) : previousLagosWeek(now);
  if (resolved.end.getTime() > now.getTime()) {
    throw new BadRequestException('That week is not over yet.');
  }
  return resolved;
}

export function trackingCoverage(week: LagosWeek, startedAt: Date | null): Coverage {
  if (!startedAt) return { status: 'not_tracked', note: 'Not tracked yet' };
  const label = lagosDateLabel(startedAt);
  if (week.end.getTime() < startedAt.getTime()) return { status: 'not_tracked', note: `Not tracked before ${label}` };
  if (week.start.getTime() < startedAt.getTime()) return { status: 'partial', note: `Tracked from ${label}` };
  return { status: 'ok' };
}

function inWeek(value: Date | string | null | undefined, week: LagosWeek): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= week.start.getTime() && time <= week.end.getTime();
}

function range(week: LagosWeek) {
  return { gte: week.start, lte: week.end };
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value * 10) / 10;
}

function daysBetween(from: Date | string, to: Date): number {
  return (to.getTime() - new Date(from).getTime()) / (24 * 60 * 60 * 1000);
}

function asOfProject(project: DashboardProject, weekEnd: Date): DashboardProject {
  const clamp = (value?: Date | string | null) => {
    if (!value) return value ?? null;
    return new Date(value).getTime() <= weekEnd.getTime() ? value : null;
  };
  return {
    ...project,
    updatedAt: clamp(project.updatedAt),
    stages: (project.stages || []).map((stage) => ({
      ...stage,
      updatedAt: clamp(stage.updatedAt),
      media: (stage.media || []).map((media) => ({ ...media, createdAt: clamp(media.createdAt) })),
    })),
  };
}

function line(
  key: string,
  label: string,
  value: number | null,
  unit: ReportLine['unit'],
  extra?: Partial<ReportLine>,
): ReportLine {
  return { key, label, value, unit, status: 'ok', ...extra };
}

function applyTracking(row: ReportLine, coverage: Coverage): ReportLine {
  if (coverage.status === 'ok') return row;
  if (coverage.status === 'not_tracked') {
    return { ...row, value: null, status: 'not_tracked', note: coverage.note, previous: undefined };
  }
  return { ...row, status: 'partial', note: coverage.note };
}

@Injectable()
export class WeeklyReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contractorsService: ContractorsService,
    private readonly planFileHealthService: PlanFileHealthService,
  ) {}

  reportFor(week: string | undefined, now = new Date()) {
    return this.buildReport(resolveWeeklyReportWeek(week, now));
  }

  async buildReport(week: LagosWeek, now = new Date()): Promise<WeeklyReport> {
    const previous = previousLagosWeek(week.start);
    const [current, prior, photoStart, trackStart] = await Promise.all([
      this.collect(week),
      this.collect(previous),
      this.migrationFinishedAt(PHOTO_TRACKING_MIGRATION),
      this.migrationFinishedAt(REPORT_TRACKING_MIGRATION),
    ]);
    return this.compose(week, current, prior, photoStart, trackStart, now);
  }

  private async migrationFinishedAt(name: string): Promise<Date | null> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ finished_at: Date | null }>>(
      'SELECT finished_at FROM _prisma_migrations WHERE migration_name = $1 AND finished_at IS NOT NULL',
      name,
    );
    const finished = rows?.[0]?.finished_at;
    return finished ? new Date(finished) : null;
  }

  private async collect(week: LagosWeek) {
    const span = range(week);
    const [
      projects,
      payments,
      materials,
      team,
      approvedStages,
      photos,
      openedDisputes,
      resolvedDisputes,
      openDisputes,
      changeRequests,
      failedPayments,
      verifiedGcs,
      reviewsApproved,
      reviewsRejected,
      scamNew,
      scamUpheld,
      scamDismissed,
      signupsHomeowner,
      signupsGc,
      signupsVendor,
      projectsCreated,
      projectsGivenGc,
      newVendors,
      newArtisans,
      newProfessionals,
      archived,
      missingPlans,
      unverified,
      overdueStages,
    ] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          OR: [
            { status: 'active', archivedAt: null },
            { archivedAt: span },
            { createdAt: span },
            { payments: { some: { createdAt: span } } },
            { stages: { some: { OR: [{ approvedAt: span }, { media: { some: { createdAt: span } } }, { materials: { some: { paidAt: span } } }, { teamMembers: { some: { paidAt: span } } }] } } },
            { disputes: { some: { OR: [{ createdAt: span }, { resolvedAt: span }] } } },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
          budget: true,
          generalContractorId: true,
          paymentConfirmationStatus: true,
          homeowner: { select: { fullName: true } },
          generalContractor: { select: { fullName: true } },
          stages: {
            select: {
              id: true,
              name: true,
              status: true,
              order: true,
              updatedAt: true,
              approvedAt: true,
              submittedForApprovalAt: true,
              estimatedCost: true,
              materials: { select: { status: true, payeeKind: true, totalPrice: true, quantity: true, unitPrice: true, paidAt: true, invoicedAt: true } },
              teamMembers: { select: { payStatus: true, paidBy: true, paidAmount: true, dailyRate: true, startDate: true, endDate: true, paidAt: true, invoicedAt: true } },
              media: { select: { createdAt: true, source: true, distanceFromSiteMeters: true, duplicateOfMediaId: true } },
            },
          },
          payments: { select: { amount: true, status: true, createdAt: true } },
          disputes: { select: { id: true, status: true, createdAt: true, resolvedAt: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: { createdAt: span },
        select: { amount: true, status: true, createdAt: true, confirmedById: true, confirmedBy: { select: { fullName: true } } },
      }),
      this.prisma.stageMaterial.findMany({
        where: { paidAt: span },
        select: { payeeKind: true, status: true, totalPrice: true, quantity: true, unitPrice: true, paidAt: true },
      }),
      this.prisma.stageTeamMember.findMany({
        where: { paidAt: span },
        select: { payStatus: true, paidBy: true, paidAmount: true, dailyRate: true, startDate: true, endDate: true, paidAt: true },
      }),
      this.prisma.stage.findMany({
        where: { approvedAt: span },
        select: { approvalMethod: true, approvedAt: true, submittedForApprovalAt: true, media: { select: { createdAt: true } } },
      }),
      this.prisma.stageMedia.findMany({
        where: { createdAt: span },
        select: { createdAt: true, source: true, distanceFromSiteMeters: true, duplicateOfMediaId: true },
      }),
      this.prisma.projectStageDispute.count({ where: { createdAt: span } }),
      this.prisma.projectStageDispute.count({ where: { resolvedAt: span } }),
      this.prisma.projectStageDispute.findMany({
        where: { status: { in: ['open', 'in_review'] }, createdAt: { lte: week.end } },
        select: { createdAt: true },
      }),
      this.prisma.stageChangeRequest.findMany({
        where: { status: 'approved', reviewedAt: span },
        select: { additionalAmount: true },
      }),
      this.prisma.payment.count({ where: { status: 'failed', createdAt: span } }),
      this.prisma.contractor.count({ where: { verifiedAt: span } }),
      this.prisma.listingReview.count({ where: { status: 'approved', moderatedAt: span } }),
      this.prisma.listingReview.count({ where: { status: 'rejected', moderatedAt: span } }),
      this.prisma.scamReport.count({ where: { createdAt: span } }),
      this.prisma.scamReport.count({ where: { status: 'upheld', resolvedAt: span } }),
      this.prisma.scamReport.count({ where: { status: 'dismissed', resolvedAt: span } }),
      this.prisma.user.count({ where: { role: 'homeowner', createdAt: span } }),
      this.prisma.user.count({ where: { role: 'general_contractor', createdAt: span } }),
      this.prisma.user.count({ where: { role: 'vendor', createdAt: span } }),
      this.prisma.project.count({ where: { createdAt: span } }),
      this.prisma.project.count({ where: { createdAt: span, generalContractorId: { not: null } } }),
      this.prisma.vendorProfile.count({ where: { createdAt: span } }),
      this.prisma.artisanListing.count({ where: { createdAt: span } }),
      this.prisma.professionalListing.count({ where: { createdAt: span } }),
      this.prisma.project.count({ where: { archivedAt: span } }),
      this.planFileHealthService.scanMissingPlanFiles(120),
      this.contractorsService.adminListUnverifiedGCs(),
      this.prisma.stage.findMany({
        where: {
          status: 'pending_homeowner_approval',
          submittedForApprovalAt: { lte: new Date(week.end.getTime() - 3 * 24 * 60 * 60 * 1000) },
        },
        select: { approvalReminderCount: true },
      }),
    ]);

    const completedPayments = (payments || []).filter((payment) => payment.status === 'completed' && inWeek(payment.createdAt, week));
    const paidMaterials = (materials || []).filter((item) => item.status === 'paid' && inWeek(item.paidAt, week));
    const paidTeam = (team || []).filter((item) => item.payStatus === 'paid' && item.paidBy === 'bmh' && inWeek(item.paidAt, week));
    const weekPhotos = (photos || []).filter((photo) => inWeek(photo.createdAt, week));
    const jobs = this.jobsFor(projects || [], week);
    const live = (projects || []).filter((project) => this.liveAt(project, week));
    const dormant = (projects || []).filter((project) => this.dormantAt(project, week));
    const quiet = live.filter((project) => daysBetween(lastActivityAt(asOfProject(project, week.end)), week.end) >= 7);
    const invoiced = live.flatMap((project) => (project.stages || []).flatMap((stage) => [
      ...(stage.materials || []).filter((item) => item.status === 'invoiced').map((item) => ({ amount: materialLineAmount(item), invoicedAt: item.invoicedAt })),
      ...(stage.teamMembers || []).filter((item) => item.payStatus === 'invoiced').map((item) => ({ amount: teamLineAmount(item), invoicedAt: item.invoicedAt })),
    ]));
    const invoicedDates = invoiced.map((item) => item.invoicedAt).filter((value): value is Date => Boolean(value) && new Date(value as Date).getTime() <= week.end.getTime());
    const oldestInvoiced = invoicedDates.sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
    const names = new Map<string, number>();
    for (const payment of completedPayments) {
      if (!payment.confirmedById) continue;
      const name = payment.confirmedBy?.fullName?.trim() || 'Admin';
      names.set(name, (names.get(name) || 0) + 1);
    }
    const methods = new Map<string, number>();
    for (const stage of approvedStages || []) {
      if (!inWeek(stage.approvedAt, week)) continue;
      const method = stage.approvalMethod || 'unknown';
      methods.set(method, (methods.get(method) || 0) + 1);
    }
    const approvedInWeek = (approvedStages || []).filter((stage) => inWeek(stage.approvedAt, week));
    const withPhotos = approvedInWeek.filter((stage) => (stage.media || []).some((media) => media.createdAt && stage.approvedAt && new Date(media.createdAt).getTime() <= new Date(stage.approvedAt).getTime()));
    const durations = approvedInWeek
      .filter((stage) => stage.submittedForApprovalAt && stage.approvedAt)
      .map((stage) => daysBetween(stage.submittedForApprovalAt as Date, new Date(stage.approvedAt as Date)));
    const openRows = openDisputes || [];
    const oldestOpen = openRows.map((dispute) => dispute.createdAt).filter(Boolean).sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];

    return {
      liveJobs: live.length,
      paidLiveJobs: live.filter((project) => hasConfirmedMoney(project)).length,
      stagesApproved: approvedInWeek.length,
      approvalNote: [...methods.entries()].map(([method, count]) => `${method} ${count}`).join(', '),
      stagesApprovedWithPhotos: withPhotos.length,
      photosAdded: weekPhotos.length,
      photosOnSite: weekPhotos.filter((photo) => photo.distanceFromSiteMeters != null && Number(photo.distanceFromSiteMeters) <= ON_SITE_RADIUS_METERS).length,
      photosGallery: weekPhotos.filter((photo) => photo.source === 'gallery').length,
      photosNotChecked: weekPhotos.filter((photo) => photo.distanceFromSiteMeters == null && photo.source !== 'gallery').length,
      photosReused: weekPhotos.filter((photo) => photo.duplicateOfMediaId).length,
      medianDays: median(durations),
      moneyIn: completedPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
      moneyInCount: completedPayments.length,
      sentToContractor: paidMaterials.filter((item) => item.payeeKind === 'artisan').reduce((sum, item) => sum + materialLineAmount(item), 0),
      paidToShops: paidMaterials.filter((item) => item.payeeKind === 'shop').reduce((sum, item) => sum + materialLineAmount(item), 0),
      paidToTeam: paidTeam.reduce((sum, item) => sum + teamLineAmount(item), 0),
      invoicedNotPaid: invoiced.reduce((sum, item) => sum + item.amount, 0),
      invoicedCount: invoiced.length,
      oldestInvoicedDays: oldestInvoiced ? Math.floor(daysBetween(oldestInvoiced, week.end)) : null,
      stillWithBmh: live.reduce((sum, project) => sum + summarizeJobMoney({ budget: project.budget, stages: project.stages, payments: project.payments }).stillWithBuildMyHouse, 0),
      changeRequests: (changeRequests || []).length,
      changeAmount: (changeRequests || []).reduce((sum, request) => sum + (Number(request.additionalAmount) || 0), 0),
      failedPayments: failedPayments || 0,
      confirmedByCount: [...names.values()].reduce((sum, count) => sum + count, 0),
      confirmedByNote: [...names.entries()].map(([name, count]) => `${name} ${count}`).join(', '),
      disputesOpened: openedDisputes || 0,
      disputesResolved: resolvedDisputes || 0,
      disputesOpen: openRows.length,
      oldestDisputeDays: oldestOpen ? Math.floor(daysBetween(oldestOpen, week.end)) : null,
      approvalsOverdue: (overdueStages || []).length,
      reminders: (overdueStages || []).reduce((sum, stage) => sum + (stage.approvalReminderCount || 0), 0),
      noUpdateJobs: quiet.length,
      dormantJobs: dormant.length,
      archived: archived || 0,
      missingPlans: (missingPlans || []).length,
      gcsReady: (unverified || []).filter((gc: { hasUploadedAllVerificationDocuments?: boolean }) => gc.hasUploadedAllVerificationDocuments).length,
      gcsVerified: verifiedGcs || 0,
      reviewsApproved: reviewsApproved || 0,
      reviewsRejected: reviewsRejected || 0,
      scamNew: scamNew || 0,
      scamUpheld: scamUpheld || 0,
      scamDismissed: scamDismissed || 0,
      signupsHomeowner: signupsHomeowner || 0,
      signupsGc: signupsGc || 0,
      signupsVendor: signupsVendor || 0,
      projectsCreated: projectsCreated || 0,
      projectsGivenGc: projectsGivenGc || 0,
      newVendors: newVendors || 0,
      newArtisans: newArtisans || 0,
      newProfessionals: newProfessionals || 0,
      jobs,
    };
  }

  private liveAt(project: DashboardProject & { createdAt?: Date | string | null }, week: LagosWeek): boolean {
    if (project.createdAt && new Date(project.createdAt).getTime() > week.end.getTime()) return false;
    if (project.archivedAt && new Date(project.archivedAt).getTime() <= week.end.getTime()) return false;
    return isLiveJob(asOfProject({ ...project, archivedAt: null, status: project.status }, week.end), week.end);
  }

  private dormantAt(project: DashboardProject & { createdAt?: Date | string | null }, week: LagosWeek): boolean {
    if (project.status !== 'active') return false;
    if (project.createdAt && new Date(project.createdAt).getTime() > week.end.getTime()) return false;
    if (project.archivedAt && new Date(project.archivedAt).getTime() <= week.end.getTime()) return false;
    return isDormant(asOfProject(project, week.end), week.end);
  }

  private jobsFor(projects: Array<DashboardProject & { createdAt?: Date | string | null; homeowner?: { fullName?: string | null } | null; generalContractor?: { fullName?: string | null } | null }>, week: LagosWeek): WeeklyReportJob[] {
    return projects.flatMap((project) => {
      const stages = project.stages || [];
      const photos = stages.flatMap((stage) => stage.media || []).filter((media) => inWeek(media.createdAt, week));
      const moneyIn = (project.payments || []).filter((payment) => payment.status === 'completed' && inWeek(payment.createdAt, week)).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
      const sentToContractor = stages.flatMap((stage) => stage.materials || []).filter((item) => item.status === 'paid' && item.payeeKind === 'artisan' && inWeek(item.paidAt, week)).reduce((sum, item) => sum + materialLineAmount(item), 0);
      const paidToShops = stages.flatMap((stage) => stage.materials || []).filter((item) => item.status === 'paid' && item.payeeKind === 'shop' && inWeek(item.paidAt, week)).reduce((sum, item) => sum + materialLineAmount(item), 0);
      const paidToTeam = stages.flatMap((stage) => stage.teamMembers || []).filter((item) => item.payStatus === 'paid' && item.paidBy === 'bmh' && inWeek(item.paidAt, week)).reduce((sum, item) => sum + teamLineAmount(item), 0);
      const stagesApproved = stages.filter((stage) => inWeek((stage as { approvedAt?: Date | string | null }).approvedAt, week)).length;
      const disputeEvent = (project.disputes || []).some((dispute) => inWeek(dispute.createdAt, week) || inWeek((dispute as { resolvedAt?: Date | string | null }).resolvedAt, week));
      const live = this.liveAt(project, week);
      const event = moneyIn > 0 || sentToContractor > 0 || paidToShops > 0 || paidToTeam > 0 || stagesApproved > 0 || photos.length > 0 || disputeEvent;
      if (!live && !event) return [];
      const summary = summarizeJobMoney({ budget: project.budget, stages, payments: project.payments });
      const invoicedNotPaid = stages.reduce((sum, stage) => {
        const materials = (stage.materials || []).filter((item) => item.status === 'invoiced').reduce((inner, item) => inner + materialLineAmount(item), 0);
        const team = (stage.teamMembers || []).filter((item) => item.payStatus === 'invoiced').reduce((inner, item) => inner + teamLineAmount(item), 0);
        return sum + materials + team;
      }, 0);
      return [{
        projectId: project.id,
        name: project.name,
        homeownerName: project.homeowner?.fullName?.trim() || null,
        gcName: project.generalContractor?.fullName?.trim() || null,
        status: project.status || '',
        dormant: this.dormantAt(project, week),
        stagesApproved,
        photosAdded: photos.length,
        photosOnSite: photos.filter((photo) => photo.distanceFromSiteMeters != null && Number(photo.distanceFromSiteMeters) <= ON_SITE_RADIUS_METERS).length,
        photosReused: photos.filter((photo) => photo.duplicateOfMediaId).length,
        moneyIn,
        sentToContractor,
        paidToShopsForMaterials: paidToShops,
        paidToTeamMembers: paidToTeam,
        invoicedNotPaid,
        stillWithBuildMyHouse: summary.stillWithBuildMyHouse,
        openDisputes: (project.disputes || []).filter((dispute) => dispute.status === 'open' || dispute.status === 'in_review').length,
      }];
    });
  }

  private compose(week: LagosWeek, current: Awaited<ReturnType<WeeklyReportService['collect']>>, prior: Awaited<ReturnType<WeeklyReportService['collect']>>, photoStart: Date | null, trackStart: Date | null, now: Date): WeeklyReport {
    const photo = trackingCoverage(week, photoStart);
    const tracked = trackingCoverage(week, trackStart);
    const withPrevious = (row: ReportLine, previous: number | null) => row.status === 'not_tracked' ? row : { ...row, previous };
    const money = (row: ReportLine, previous: number | null) => withPrevious(row, previous);
    const photos = (row: ReportLine) => applyTracking(row, photo);
    return {
      weekStart: week.weekStartIso,
      weekEnd: addIsoDays(week.weekStartIso, 6),
      generatedAt: now.toISOString(),
      jobs: current.jobs,
      sections: [
        {
          key: 'north_star',
          title: 'North Star',
          lines: [
            line('live_jobs', 'Live jobs', current.liveJobs, 'count'),
            line('paid_live_jobs', 'Live jobs with confirmed money', current.paidLiveJobs, 'count'),
            line('stages_approved', 'Stages approved', current.stagesApproved, 'count', current.approvalNote ? { note: current.approvalNote } : undefined),
            line('stages_approved_with_photos', 'Stages approved with photos', current.stagesApprovedWithPhotos, 'count'),
            photos(line('photos_added', 'Stage photos added', current.photosAdded, 'count')),
            photos(line('photos_on_site', 'Taken on site', current.photosOnSite, 'count')),
            photos(line('photos_gallery', 'From gallery', current.photosGallery, 'count')),
            photos(line('photos_not_checked', 'Location not checked', current.photosNotChecked, 'count')),
            photos(line('photos_reused', 'Reused photos caught', current.photosReused, 'count')),
            line('median_days_to_approval', 'Median days to homeowner approval', current.stagesApproved ? current.medianDays : null, 'days', current.stagesApproved ? undefined : { note: 'No approvals this week' }),
          ],
        },
        {
          key: 'money',
          title: 'Money',
          lines: [
            money(line('money_in', PENDING_APPROVAL_MONEY_LABELS.moneyIn, current.moneyIn, 'naira', { note: `${current.moneyInCount} payment${current.moneyInCount === 1 ? '' : 's'}` }), prior.moneyIn),
            money(line('sent_to_contractor', MONEY_LABELS.sentToContractor, current.sentToContractor, 'naira'), prior.sentToContractor),
            money(line('paid_to_shops', MONEY_LABELS.paidToShopsForMaterials, current.paidToShops, 'naira'), prior.paidToShops),
            money(line('paid_to_team', MONEY_LABELS.paidToTeamMembers, current.paidToTeam, 'naira'), prior.paidToTeam),
            money(line('invoiced_not_paid', PENDING_APPROVAL_MONEY_LABELS.invoicedNotPaid, current.invoicedNotPaid, 'naira', { note: `${current.invoicedCount} line${current.invoicedCount === 1 ? '' : 's'}` }), prior.invoicedNotPaid),
            applyTracking(line('invoiced_oldest_days', 'Oldest invoiced line, days', current.oldestInvoicedDays, 'days', current.oldestInvoicedDays == null ? { note: 'No invoiced lines' } : undefined), tracked),
            money(line('still_with_bmh', MONEY_LABELS.stillWithBuildMyHouse, current.stillWithBmh, 'naira'), prior.stillWithBmh),
            money(line('change_requests_approved', 'Change requests approved', current.changeRequests, 'count', { note: `${current.changeAmount}` }), prior.changeRequests),
            money(line('failed_payments', 'Failed payments', current.failedPayments, 'count'), prior.failedPayments),
            applyTracking(line('payments_confirmed_by', 'Payments confirmed by an admin', current.confirmedByCount, 'count', current.confirmedByNote ? { note: current.confirmedByNote } : undefined), tracked),
          ],
        },
        {
          key: 'problems',
          title: 'Problems',
          lines: [
            money(line('disputes_opened', 'Disputes opened', current.disputesOpened, 'count'), prior.disputesOpened),
            money(line('disputes_resolved', 'Disputes resolved', current.disputesResolved, 'count'), prior.disputesResolved),
            money(line('disputes_open_at_week_end', 'Disputes open at week end', current.disputesOpen, 'count', current.oldestDisputeDays != null ? { note: `Oldest ${current.oldestDisputeDays} days` } : undefined), prior.disputesOpen),
            money(line('approvals_overdue', 'Stages needing homeowner approval 3+ days at week end', current.approvalsOverdue, 'count', { note: `${current.reminders} reminder${current.reminders === 1 ? '' : 's'} sent` }), prior.approvalsOverdue),
            money(line('no_update_jobs', 'Live jobs with no update in 7+ days', current.noUpdateJobs, 'count'), prior.noUpdateJobs),
            money(line('dormant_jobs', 'Dormant jobs', current.dormantJobs, 'count'), prior.dormantJobs),
            money(line('archived_this_week', 'Jobs archived', current.archived, 'count'), prior.archived),
            money(line('missing_plan_files', 'Missing plan files', current.missingPlans, 'count', { note: `As of ${lagosDateLabel(now)}` }), prior.missingPlans),
          ],
        },
        {
          key: 'trust',
          title: 'Trust',
          lines: [
            line('gcs_ready', 'GCs ready for verification at report time', current.gcsReady, 'count'),
            applyTracking(line('gcs_verified', 'GCs verified', current.gcsVerified, 'count'), tracked),
            line('listing_reviews_approved', 'Listing reviews approved', current.reviewsApproved, 'count'),
            line('listing_reviews_rejected', 'Listing reviews rejected', current.reviewsRejected, 'count'),
            line('scam_reports_new', 'Scam reports new', current.scamNew, 'count'),
            line('scam_reports_upheld', 'Scam reports upheld', current.scamUpheld, 'count'),
            line('scam_reports_dismissed', 'Scam reports dismissed', current.scamDismissed, 'count'),
          ],
        },
        {
          key: 'growth',
          title: 'Growth',
          lines: [
            line('signups_homeowner', 'Homeowner signups', current.signupsHomeowner, 'count'),
            line('signups_gc', 'GC signups', current.signupsGc, 'count'),
            line('signups_vendor', 'Vendor signups', current.signupsVendor, 'count'),
            line('projects_created', 'Projects created', current.projectsCreated, 'count'),
            line('projects_given_gc', 'Projects given a GC', current.projectsGivenGc, 'count'),
            line('new_vendors', 'New vendors', current.newVendors, 'count'),
            line('new_artisans', 'New artisans', current.newArtisans, 'count'),
            line('new_professionals', 'New professionals', current.newProfessionals, 'count'),
          ],
        },
      ],
    };
  }
}
