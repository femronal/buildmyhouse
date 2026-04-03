import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractorsService } from '../contractors/contractors.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlanFileHealthService } from './plan-file-health.service';
import { EmailService } from '../email/email.service';
import { AdminEmailAudience, SendBulkEmailDto } from './dto/send-bulk-email.dto';

const STALLED_DAYS = 7;
const RECENT_ACTIVITY_LIMIT = 10;

export type DashboardStats = {
  totalUsers: number;
  verifiedPercent: number;
  activeBuilds: number;
  atRiskCount: number;
  paymentsThisMonth: number;
  paymentsSuccessPercent: number;
  openDisputes: number;
  urgentDisputes: number;
};

export type CriticalAlert = {
  type: 'stalled_project' | 'failed_payments' | 'gcs_pending_verification' | 'missing_plan_files';
  title: string;
  detail: string;
  tone: 'amber' | 'red' | 'blue';
  link?: string;
  data?: Record<string, unknown>;
};

export type RecentActivityItem = {
  type: string;
  label: string;
  detail: string;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
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
    const [stats, criticalAlerts, recentActivity] = await Promise.all([
      this.getStats(),
      this.getCriticalAlerts(),
      this.getRecentActivity(adminUserId),
    ]);

    return { stats, criticalAlerts, recentActivity };
  }

  private async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      userCounts,
      verifiedCount,
      projects,
      paymentsThisMonth,
      disputes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { verified: true } }),
      this.prisma.project.findMany({
        where: { status: 'active' },
        select: { id: true, riskLevel: true },
      }),
      this.prisma.payment.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { status: true, amount: true },
      }),
      this.prisma.projectStageDispute.findMany({
        where: { status: { in: ['open', 'in_review'] } },
        select: { reasons: true },
      }),
    ]);

    const activeBuilds = projects.length;
    const atRiskCount = projects.filter((p) => (p as any).riskLevel === 'high').length;

    const completedPayments = paymentsThisMonth.filter((p: any) => p.status === 'completed');
    const totalPaymentsAmount = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const paymentsSuccessPercent =
      paymentsThisMonth.length > 0
        ? Math.round((completedPayments.length / paymentsThisMonth.length) * 100)
        : 100;

    const openDisputes = disputes.length;
    const urgentDisputes = disputes.filter((d: any) => (d.reasons as string[])?.includes('payment_mismatch')).length;

    const verifiedPercent = userCounts > 0 ? Math.round((verifiedCount / userCounts) * 100) : 0;

    return {
      totalUsers: userCounts,
      verifiedPercent,
      activeBuilds,
      atRiskCount,
      paymentsThisMonth: Math.round(totalPaymentsAmount * 100) / 100,
      paymentsSuccessPercent,
      openDisputes,
      urgentDisputes,
    };
  }

  private async getCriticalAlerts(): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const stalledThreshold = new Date(now.getTime() - STALLED_DAYS * 24 * 60 * 60 * 1000);

    // 1. Stalled projects: active projects with no stage update in STALLED_DAYS
    const activeProjects = await this.prisma.project.findMany({
      where: { status: 'active' },
      include: {
        generalContractor: { select: { id: true, fullName: true } },
        stages: { orderBy: { updatedAt: 'desc' }, take: 1, select: { updatedAt: true } },
      },
    });

    for (const p of activeProjects) {
      const lastStageUpdate = (p as any).stages?.[0]?.updatedAt;
      const lastUpdate = lastStageUpdate ?? p.updatedAt;
      if (lastUpdate < stalledThreshold) {
        const gcName = (p as any).generalContractor?.fullName ?? 'No GC assigned';
        const daysStalled = Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / (24 * 60 * 60 * 1000));
        alerts.push({
          type: 'stalled_project',
          title: `Project "${p.name}" flagged for stalled progress`,
          detail: `No updates for ${daysStalled} days • GC: ${gcName}`,
          tone: 'amber',
          link: '/projects',
          data: { projectId: p.id },
        });
      }
    }

    // 2. Failed payments in last 24h
    const failedPayments = await this.prisma.payment.count({
      where: {
        status: 'failed',
        createdAt: { gte: oneDayAgo },
      },
    });
    if (failedPayments > 0) {
      alerts.push({
        type: 'failed_payments',
        title: `${failedPayments} payment attempt${failedPayments !== 1 ? 's' : ''} failed in the last 24h`,
        detail: 'Check Stripe webhook status and retry queue',
        tone: 'red',
        link: '/projects',
      });
    }

    // 3. GCs pending verification
    const unverifiedGCs = await this.contractorsService.adminListUnverifiedGCs();
    const gcsWithDocs = unverifiedGCs.filter((g: any) => g.hasUploadedAllVerificationDocuments);
    if (gcsWithDocs.length > 0) {
      alerts.push({
        type: 'gcs_pending_verification',
        title: `${gcsWithDocs.length} GC${gcsWithDocs.length !== 1 ? 's' : ''} pending verification`,
        detail: 'Licenses uploaded • awaiting admin review',
        tone: 'blue',
        link: '/verification',
      });
    }

    // 4. Missing project plan files (detect before GC/homeowner download failures)
    const missingPlanFiles = await this.planFileHealthService.scanMissingPlanFiles(120);
    if (missingPlanFiles.length > 0) {
      alerts.push({
        type: 'missing_plan_files',
        title: `${missingPlanFiles.length} project plan file${missingPlanFiles.length !== 1 ? 's are' : ' is'} missing`,
        detail: 'Some project plans cannot be downloaded. Audit projects and request re-upload where needed.',
        tone: 'red',
        link: '/projects',
        data: { projectIds: missingPlanFiles.slice(0, 20).map((item) => item.projectId) },
      });
    }

    return alerts;
  }

  private async getRecentActivity(adminUserId: string): Promise<RecentActivityItem[]> {
    const { items } = await this.notificationsService.getMyNotifications(adminUserId);
    return items.slice(0, RECENT_ACTIVITY_LIMIT).map((n: any) => ({
      type: n.type,
      label: n.title,
      detail: n.message,
      createdAt: n.createdAt,
      link: this.getActivityLink(n),
      data: n.data,
    }));
  }

  private getActivityLink(notification: any): string | undefined {
    const data = notification.data as Record<string, unknown> | null;
    if (!data) return undefined;
    if (data.disputeId || (data.projectId && String(notification.type).includes('dispute'))) return '/disputes';
    if (data.projectId) return '/projects';
    if (data.interestId || data.rentalListingId) return '/rentals';
    if (notification.type === 'manual_payment_declared') return '/projects';
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
}
