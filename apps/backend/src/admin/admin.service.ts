import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractorsService } from '../contractors/contractors.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlanFileHealthService } from './plan-file-health.service';
import { EmailService } from '../email/email.service';
import type { EmailHealthReport } from '../email/email.service';
import { AdminEmailAudience, SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { buildDashboard, type RecentActivityItem } from './dashboard-build';
import { lagosWeekContaining } from './lagos-week';
import * as bcrypt from 'bcryptjs';

export type { RecentActivityItem };

const ACTIVITY_TYPES = new Set([
  'stage_media_added',
  'stage_pending_approval',
  'stage_approved',
  'stage_approved_on_behalf',
  'stage_change_request_submitted',
  'manual_payment_declared',
  'manual_payment_confirmed',
  'stage_funded',
  'stage_funding_requested',
  'new_dispute',
  'dispute_status_update',
  'payment_failed',
  'new_user_signup',
  'gc_accepted',
  'project_completed',
  'scam_report',
  'listing_review',
]);

export type FullAdminAccessAccount = {
  id: string;
  email: string;
  fullName: string | null;
  verified: boolean;
  adminDashboardAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasDashboardAllowlistAccess: boolean;
};

export type ContractorReviewReasonCount = {
  reason: string;
  count: number;
};

export type ContractorReviewSpecialtyInsight = {
  category: string;
  label: string;
  totalReviews: number;
  averageRating: number;
  lowReasons: ContractorReviewReasonCount[];
  highReasons: ContractorReviewReasonCount[];
};

export type ContractorReviewInsights = {
  generatedAt: string;
  totalReviews: number;
  averageRating: number;
  specialties: ContractorReviewSpecialtyInsight[];
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contractorsService: ContractorsService,
    private readonly notificationsService: NotificationsService,
    private readonly planFileHealthService: PlanFileHealthService,
    private readonly emailService: EmailService,
  ) {}

  async getDashboard(adminUserId: string) {
    const now = new Date();
    const week = lagosWeekContaining(now);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const paidInWeek = { gte: week.start, lte: week.end };

    const [
      projects,
      weekPayments,
      weekMaterials,
      weekTeam,
      failedPayments,
      missingPlanFiles,
      unverifiedGcs,
      scamReports,
      listingReviews,
      gcPlans,
      vendorClaims,
      professionalClaims,
      artisanClaims,
      activity,
    ] = await Promise.all([
      this.prisma.project.findMany({
        where: { archivedAt: null },
        select: {
          id: true,
          name: true,
          status: true,
          archivedAt: true,
          updatedAt: true,
          budget: true,
          riskLevel: true,
          needsExtraMonitoring: true,
          generalContractorId: true,
          paymentConfirmationStatus: true,
          paymentDeclaredAt: true,
          homeowner: { select: { fullName: true } },
          generalContractor: { select: { fullName: true } },
          stages: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true,
              status: true,
              order: true,
              updatedAt: true,
              submittedForApprovalAt: true,
              approvalReminderCount: true,
              estimatedCost: true,
              materials: {
                select: { status: true, payeeKind: true, totalPrice: true, quantity: true, unitPrice: true, updatedAt: true },
              },
              teamMembers: {
                select: {
                  payStatus: true,
                  paidBy: true,
                  paidAmount: true,
                  dailyRate: true,
                  startDate: true,
                  endDate: true,
                  updatedAt: true,
                },
              },
              media: {
                select: { id: true, createdAt: true, duplicateOfMediaId: true, distanceFromSiteMeters: true, source: true },
              },
            },
          },
          payments: { select: { id: true, amount: true, status: true, method: true, createdAt: true } },
          disputes: {
            where: { status: { in: ['open', 'in_review'] } },
            select: { id: true, status: true, createdAt: true, stageId: true, reasons: true },
          },
          stageChangeRequests: {
            where: { status: 'pending' },
            select: {
              id: true,
              status: true,
              additionalAmount: true,
              additionalDurationDays: true,
              createdAt: true,
              stageId: true,
              stage: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: { status: 'completed', createdAt: paidInWeek },
        select: { amount: true, status: true, createdAt: true },
      }),
      this.prisma.stageMaterial.findMany({
        where: { status: 'paid', paidAt: paidInWeek },
        select: { payeeKind: true, status: true, totalPrice: true, quantity: true, unitPrice: true, paidAt: true },
      }),
      this.prisma.stageTeamMember.findMany({
        where: { payStatus: 'paid', paidAt: paidInWeek },
        select: { payStatus: true, paidBy: true, paidAmount: true, dailyRate: true, startDate: true, endDate: true, paidAt: true },
      }),
      this.prisma.payment.findMany({
        where: { status: 'failed', createdAt: { gte: dayAgo } },
        select: { createdAt: true },
      }),
      this.planFileHealthService.scanMissingPlanFiles(120),
      this.contractorsService.adminListUnverifiedGCs(),
      this.prisma.scamReport.count({ where: { status: 'new' } }),
      this.prisma.listingReview.count({ where: { status: 'pending' } }),
      this.prisma.design.count({ where: { adminApprovalStatus: 'pending' } }),
      this.prisma.vendorProfile.count({ where: { claimStatus: 'claim_pending_admin' } }),
      this.prisma.professionalClaimRequest.count({ where: { status: 'pending' } }),
      this.prisma.artisanClaimRequest.count({ where: { status: 'pending' } }),
      this.getRecentActivity(adminUserId),
    ]);

    const gcsReady = (unverifiedGcs || []).filter((gc: { hasUploadedAllVerificationDocuments?: boolean }) => gc.hasUploadedAllVerificationDocuments).length;

    return buildDashboard({
      now,
      projects,
      weekPayments,
      weekMaterials,
      weekTeam,
      failedPayments,
      missingPlanFiles,
      gcsReady,
      trustCounts: {
        scamReports,
        listingReviews,
        gcPlans,
        vendorClaims,
        professionalClaims,
        artisanClaims,
      },
      activity,
    });
  }

  async getContractorReviewInsights(): Promise<ContractorReviewInsights> {
    const specialtyLabelMap: Record<string, string> = {
      repairer: 'Repairer',
      upgrader: 'Upgrader',
      renovator: 'Renovator',
      general_contractor: 'General Contractor',
      unknown: 'General Contractor',
    };

    const normalizeSpecialty = (value?: string | null) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === 'repairer') return 'repairer';
      if (normalized === 'upgrader') return 'upgrader';
      if (normalized === 'renovator') return 'renovator';
      if (normalized === 'general_contractor') return 'general_contractor';
      return 'unknown';
    };

    const reviews = await this.prisma.review.findMany({
      where: {
        contractorId: { not: null },
      },
      select: {
        rating: true,
        reasons: true,
        contractor: {
          select: {
            specialtyCategory: true,
          },
        },
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) /
              totalReviews) *
              10,
          ) / 10
        : 0;

    const bucketBySpecialty = new Map<
      string,
      {
        ratings: number[];
        lowReasons: Map<string, number>;
        highReasons: Map<string, number>;
      }
    >();

    for (const review of reviews) {
      const category = normalizeSpecialty(review?.contractor?.specialtyCategory);
      if (!bucketBySpecialty.has(category)) {
        bucketBySpecialty.set(category, {
          ratings: [],
          lowReasons: new Map<string, number>(),
          highReasons: new Map<string, number>(),
        });
      }
      const bucket = bucketBySpecialty.get(category)!;
      const rating = Number(review.rating || 0);
      bucket.ratings.push(rating);

      const reasons = Array.isArray(review.reasons)
        ? review.reasons
            .map((reason: any) => String(reason || '').trim())
            .filter(Boolean)
        : [];
      const reasonMap = rating <= 3 ? bucket.lowReasons : bucket.highReasons;
      for (const reason of reasons) {
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      }
    }

    const toRankedArray = (map: Map<string, number>): ContractorReviewReasonCount[] =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([reason, count]) => ({ reason, count }));

    const specialties: ContractorReviewSpecialtyInsight[] = Array.from(bucketBySpecialty.entries())
      .map(([category, bucket]) => {
        const ratingsTotal = bucket.ratings.reduce((sum, rating) => sum + rating, 0);
        const specialtyAverage =
          bucket.ratings.length > 0
            ? Math.round((ratingsTotal / bucket.ratings.length) * 10) / 10
            : 0;

        return {
          category,
          label: specialtyLabelMap[category] || 'General Contractor',
          totalReviews: bucket.ratings.length,
          averageRating: specialtyAverage,
          lowReasons: toRankedArray(bucket.lowReasons),
          highReasons: toRankedArray(bucket.highReasons),
        };
      })
      .sort((a, b) => b.totalReviews - a.totalReviews);

    return {
      generatedAt: new Date().toISOString(),
      totalReviews,
      averageRating,
      specialties,
    };
  }

  async getEmailHealth(): Promise<EmailHealthReport> {
    return this.emailService.getHealthReport();
  }

  async getFullAdminAccessAccounts(): Promise<FullAdminAccessAccount[]> {
    await this.bootstrapAdminAccessFromEnvIfNeeded();

    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        fullName: true,
        verified: true,
        adminDashboardAccess: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dbEnabledEmails = new Set(
      admins
        .filter((admin) => admin.adminDashboardAccess)
        .map((admin) => String(admin.email || '').trim().toLowerCase()),
    );
    const usingDatabaseAccessList = dbEnabledEmails.size > 0;
    const envAllowlist = this.getAdminDashboardAllowlist();

    return admins.map((admin) => ({
      ...admin,
      hasDashboardAllowlistAccess: usingDatabaseAccessList
        ? dbEnabledEmails.has(String(admin.email || '').trim().toLowerCase())
        : envAllowlist.size > 0
          ? envAllowlist.has(String(admin.email || '').trim().toLowerCase())
          : true,
    }));
  }

  async setAdminDashboardAccess(params: {
    actorUserId: string;
    targetUserId: string;
    enabled: boolean;
  }) {
    await this.bootstrapAdminAccessFromEnvIfNeeded();

    const actor = await this.prisma.user.findUnique({
      where: { id: params.actorUserId },
      select: { id: true, role: true, email: true },
    });
    if (!actor || actor.role !== 'admin') {
      throw new BadRequestException('Only admins can manage dashboard access.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: params.targetUserId },
      select: {
        id: true,
        role: true,
        email: true,
        adminDashboardAccess: true,
      },
    });
    if (!target || target.role !== 'admin') {
      throw new BadRequestException('Target account must be an admin user.');
    }

    if (!params.enabled) {
      if (target.id === actor.id) {
        throw new BadRequestException('You cannot remove your own dashboard access.');
      }

      const otherEnabledCount = await this.prisma.user.count({
        where: {
          role: 'admin',
          adminDashboardAccess: true,
          id: { not: target.id },
        },
      });
      if (otherEnabledCount === 0) {
        throw new BadRequestException('At least one admin must keep dashboard access.');
      }
    }

    await this.prisma.user.update({
      where: { id: target.id },
      data: { adminDashboardAccess: params.enabled },
    });

    return this.getFullAdminAccessAccounts();
  }

  async createAdminAccount(params: {
    actorUserId: string;
    email: string;
    password: string;
    fullName: string;
  }) {
    const actor = await this.prisma.user.findUnique({
      where: { id: params.actorUserId },
      select: { id: true, role: true },
    });
    if (!actor || actor.role !== 'admin') {
      throw new BadRequestException('Only admins can create admin accounts.');
    }

    const email = String(params.email || '').trim().toLowerCase();
    const password = String(params.password || '');
    const fullName = String(params.fullName || '').trim();

    if (!email) {
      throw new BadRequestException('Admin email is required.');
    }
    if (password.length < 6) {
      throw new BadRequestException('Admin password must be at least 6 characters.');
    }
    if (!fullName) {
      throw new BadRequestException('Admin full name is required.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'admin',
        verified: true,
        adminDashboardAccess: true,
      },
    });

    return this.getFullAdminAccessAccounts();
  }

  private async getRecentActivity(adminUserId: string): Promise<RecentActivityItem[]> {
    const { items } = await this.notificationsService.getMyNotifications(adminUserId);
    return (items || [])
      .filter((item) => ACTIVITY_TYPES.has(String(item.type)))
      .slice(0, 5)
      .map((item) => ({
        id: String(item.id || `${item.type}:${item.createdAt}`),
        type: item.type,
        label: item.title,
        detail: item.message,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
        link: this.getActivityLink(item),
        data: item.data as Record<string, unknown> | undefined,
      }));
  }

  private getActivityLink(notification: { type?: string; data?: unknown }): string | undefined {
    const data = (notification.data || null) as Record<string, unknown> | null;
    if (data?.stageId && data?.projectId) return `/projects/${data.projectId}/stages/${data.stageId}`;
    if (data?.projectId) return `/projects/${data.projectId}`;
    if (!data) return undefined;
    if (data.interestId || data.rentalListingId) return '/rentals';
    if (notification.type === 'new_user_signup') return '/users';
    return undefined;
  }

  async sendBulkEmail(adminUserId: string, dto: SendBulkEmailDto) {
    const subject = String(dto.subject || '').trim();
    if (!subject) {
      throw new BadRequestException('Email subject is required');
    }

    const html = String(dto.html || '').trim();
    const text = String(dto.text || '').trim();
    if (!html && !text) {
      throw new BadRequestException('Provide at least HTML or text email content');
    }

    const recipients = await this.resolveRecipients(dto);
    if (recipients.length === 0) {
      throw new BadRequestException('No recipient emails found for selected audience');
    }

    const htmlBody = html || this.wrapTextInHtml(text);
    const textBody = text || this.stripHtml(html);

    // Keep throughput below Resend free-tier API rate limits (~5 req/sec).
    const concurrency = 4;
    let sent = 0;
    let failed = 0;
    const failedRecipients: string[] = [];

    for (let i = 0; i < recipients.length; i += concurrency) {
      const chunk = recipients.slice(i, i + concurrency);
      const batch = await Promise.all(
        chunk.map(async (to) => {
          const ok = await this.sendWithRetry({
            to,
            subject,
            html: htmlBody,
            text: textBody,
          });
          return { to, ok };
        }),
      );

      for (const result of batch) {
        if (result.ok) {
          sent += 1;
        } else {
          failed += 1;
          if (failedRecipients.length < 20) {
            failedRecipients.push(result.to);
          }
        }
      }

      // Throttle chunk bursts to stay under provider rate limit.
      if (i + concurrency < recipients.length) {
        await this.sleep(1100);
      }
    }

    // Record admin operation in in-app notifications for audit trail.
    await this.notificationsService.createForUser(adminUserId, {
      type: 'admin_bulk_email_sent',
      title: 'Bulk email campaign completed',
      message: `Audience: ${dto.audience}. Sent: ${sent}. Failed: ${failed}.`,
      data: {
        audience: dto.audience,
        totalRecipients: recipients.length,
        sent,
        failed,
      },
    });

    return {
      audience: dto.audience,
      totalRecipients: recipients.length,
      sent,
      failed,
      failedRecipients,
    };
  }

  private async sendWithRetry(options: { to: string; subject: string; html: string; text?: string }, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const ok = await this.emailService.send(options);
      if (ok) return true;
      if (attempt < maxAttempts) {
        // Exponential backoff for transient provider throttling.
        await this.sleep(500 * Math.pow(2, attempt - 1));
      }
    }
    return false;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getBulkEmailAudienceCounts() {
    const [allUsers, allGcs, allHomeowners] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          role: 'general_contractor',
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'homeowner',
        },
      }),
    ]);

    return {
      allUsers,
      allGcs,
      allHomeowners,
    };
  }

  async notifyHomeownersForMissingPlanFiles(params?: { projectIds?: string[]; limit?: number }) {
    const limit = Number.isFinite(Number(params?.limit))
      ? Math.max(20, Math.min(Number(params?.limit), 1000))
      : 300;
    const requestedIds = Array.from(
      new Set((params?.projectIds || []).map((x) => String(x || '').trim()).filter(Boolean)),
    );

    const missing = await this.planFileHealthService.scanMissingPlanFiles(limit);
    const targetMissing =
      requestedIds.length > 0 ? missing.filter((item) => requestedIds.includes(item.projectId)) : missing;
    if (targetMissing.length === 0) {
      return {
        targetCount: 0,
        notified: 0,
        skippedNoEmail: 0,
        skippedAlreadyNotified: 0,
        projectIds: [],
      };
    }

    const projects = await this.prisma.project.findMany({
      where: { id: { in: targetMissing.map((m) => m.projectId) } },
      select: {
        id: true,
        name: true,
        homeownerId: true,
        homeowner: {
          select: { email: true, fullName: true },
        },
      },
    });

    let notified = 0;
    let skippedNoEmail = 0;
    let skippedAlreadyNotified = 0;
    const notifiedProjectIds: string[] = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const project of projects) {
      if (!project.homeowner?.email) {
        skippedNoEmail += 1;
        continue;
      }

      const recentNotifs = await this.prisma.notification.findMany({
        where: {
          userId: project.homeownerId,
          type: 'missing_plan_file_action_required',
          createdAt: { gte: oneDayAgo },
        },
        select: { data: true },
        take: 20,
      });
      const alreadyNotified = recentNotifs.some(
        (n: any) => String((n?.data as any)?.projectId || '') === project.id,
      );
      if (alreadyNotified) {
        skippedAlreadyNotified += 1;
        continue;
      }

      await this.notificationsService.createForUser(project.homeownerId, {
        type: 'missing_plan_file_action_required',
        title: 'Action required: re-upload your project plan',
        message:
          'We could not locate your uploaded plan file for this project. Please open your project and re-upload the plan PDF so contractors can access it.',
        data: {
          projectId: project.id,
          projectName: project.name,
        },
      });
      notified += 1;
      if (notifiedProjectIds.length < 200) {
        notifiedProjectIds.push(project.id);
      }
    }

    return {
      targetCount: targetMissing.length,
      notified,
      skippedNoEmail,
      skippedAlreadyNotified,
      projectIds: targetMissing.map((x) => x.projectId),
      notifiedProjectIds,
    };
  }

  private async resolveRecipients(dto: SendBulkEmailDto): Promise<string[]> {
    if (dto.audience === AdminEmailAudience.SPECIFIC_USERS) {
      const emails = (dto.recipients || []).map((email) => String(email || '').trim().toLowerCase()).filter(Boolean);
      return Array.from(new Set(emails));
    }

    const where: any = {};

    if (dto.audience === AdminEmailAudience.ALL_GCS) {
      where.role = 'general_contractor';
    }
    if (dto.audience === AdminEmailAudience.ALL_HOMEOWNERS) {
      where.role = 'homeowner';
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { email: true },
    });

    return Array.from(
      new Set(
        users
          .map((user) => String(user.email || '').trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  private wrapTextInHtml(text: string) {
    const escaped = this.escapeHtml(text).replace(/\n/g, '<br>');
    return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <div style="max-width: 640px; margin: 20px auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      ${escaped}
    </div>
  </body>
</html>`.trim();
  }

  private stripHtml(html: string) {
    return String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private escapeHtml(text: string) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private getAdminDashboardAllowlist() {
    const raw =
      process.env.ADMIN_DASHBOARD_ALLOWED_EMAILS ||
      process.env.ADMIN_ALLOWED_EMAILS ||
      '';

    return new Set(
      raw
        .split(',')
        .map((email) => String(email || '').trim().toLowerCase())
        .filter(Boolean),
    );
  }

  private async bootstrapAdminAccessFromEnvIfNeeded() {
    const enabledCount = await this.prisma.user.count({
      where: { role: 'admin', adminDashboardAccess: true },
    });
    if (enabledCount > 0) {
      return;
    }

    const envAllowlist = this.getAdminDashboardAllowlist();
    if (envAllowlist.size === 0) {
      return;
    }

    await this.prisma.user.updateMany({
      where: {
        role: 'admin',
        email: { in: Array.from(envAllowlist) },
      },
      data: { adminDashboardAccess: true },
    });
  }
}
