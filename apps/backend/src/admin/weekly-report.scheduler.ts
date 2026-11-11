import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminAccessPermissionsService } from '../admin-access/admin-access-permissions.service';
import { previousLagosWeek } from './lagos-week';
import { WeeklyReportService } from './weekly-report.service';
import { buildAdminWeeklyReportEmail } from '../email/templates/admin-weekly-report.template';

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002');
}

@Injectable()
export class WeeklyReportScheduler {
  private readonly logger = new Logger(WeeklyReportScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: WeeklyReportService,
    private readonly emailService: EmailService,
    private readonly permissions: AdminAccessPermissionsService,
  ) {}

  @Cron('0 8-23 * * 1', { timeZone: 'Africa/Lagos' })
  async sendMondayReport() {
    await this.run();
  }

  async run(now = new Date()) {
    const week = previousLagosWeek(now);
    const send = await this.claimSend(week.start);
    if (!send || send.status === 'sent') {
      this.logger.log(`Weekly report ${week.weekStartIso}: already sent`);
      return { weekStart: week.weekStartIso, recipientCount: 0, sentCount: 0, failedCount: 0, skipped: true };
    }

    const report = await this.reports.buildReport(week, now);
    const reportUrl = `${this.emailService.getAdminAppUrl()}/reports/weekly?week=${week.weekStartIso}`;
    const users = await this.prisma.user.findMany({
      where: { role: 'admin', adminDashboardAccess: true },
      select: { id: true, email: true, fullName: true },
    });
    const recipients = [];
    for (const user of users) {
      const email = String(user.email || '').trim();
      if (!email) continue;
      const access = await this.permissions.getEffectivePermissions(user.id);
      const allowed = access.accessAllowed && (access.permissions.includes('dashboard.view') || access.permissions.includes('*'));
      if (!allowed) continue;
      recipients.push({ ...user, email });
    }

    for (const recipient of recipients) {
      try {
        await this.prisma.weeklyReportRecipient.create({
          data: { sendId: send.id, userId: recipient.id, email: recipient.email, status: 'sending' },
        });
      } catch (error) {
        if (isUniqueConflict(error)) continue;
        throw error;
      }
      try {
        const message = buildAdminWeeklyReportEmail({
          report,
          reportUrl,
          recipientName: recipient.fullName,
        });
        const sent = await this.emailService.send({ to: recipient.email, subject: message.subject, html: message.html, text: message.text });
        await this.prisma.weeklyReportRecipient.updateMany({
          where: { sendId: send.id, userId: recipient.id },
          data: { status: sent ? 'sent' : 'failed' },
        });
      } catch (error) {
        await this.prisma.weeklyReportRecipient.updateMany({
          where: { sendId: send.id, userId: recipient.id },
          data: { status: 'failed' },
        }).catch(() => undefined);
        this.logger.warn(`Weekly report email failed for ${recipient.email}: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }

    const rows = await this.prisma.weeklyReportRecipient.findMany({ where: { sendId: send.id }, select: { status: true } });
    const finished = await this.prisma.weeklyReportSend.update({
      where: { id: send.id },
      data: {
        status: 'sent',
        recipientCount: rows.length,
        sentCount: rows.filter((row) => row.status === 'sent').length,
        failedCount: rows.filter((row) => row.status === 'failed').length,
        finishedAt: now,
      },
    });
    this.logger.log(`Weekly report ${week.weekStartIso}: recipients ${finished.recipientCount}, sent ${finished.sentCount}, failed ${finished.failedCount}`);
    return { weekStart: week.weekStartIso, recipientCount: finished.recipientCount, sentCount: finished.sentCount, failedCount: finished.failedCount, skipped: false };
  }

  private async claimSend(weekStart: Date) {
    try {
      return await this.prisma.weeklyReportSend.create({
        data: { weekStart, status: 'sending' },
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      return this.prisma.weeklyReportSend.findUnique({ where: { weekStart } });
    }
  }
}
