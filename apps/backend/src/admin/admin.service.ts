import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractorsService } from '../contractors/contractors.service';
import { NotificationsService } from '../notifications/notifications.service';

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
  type: 'stalled_project' | 'failed_payments' | 'gcs_pending_verification';
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
    return undefined;
  }
}
