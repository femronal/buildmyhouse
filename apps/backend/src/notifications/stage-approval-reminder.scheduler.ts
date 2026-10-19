import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_CAP = 7;
const REMINDER_COPY =
  'The general contractor has marked this stage of your project as complete. Please review the evidence in the app and click Approve.';

@Injectable()
export class StageApprovalReminderScheduler {
  private readonly logger = new Logger(StageApprovalReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Once a day at 09:00 Africa/Lagos. Stops after 7 reminders per stage.
  @Cron('0 9 * * *', { timeZone: 'Africa/Lagos' })
  async sendDailyApprovalReminders() {
    await this.run();
  }

  async run(now = new Date()) {
    const cutoff = new Date(now.getTime() - DAY_MS);
    const stages = await this.prisma.stage.findMany({
      where: {
        status: 'pending_homeowner_approval',
        submittedForApprovalAt: { lte: cutoff },
        approvalReminderCount: { lt: REMINDER_CAP },
        OR: [{ lastApprovalReminderAt: null }, { lastApprovalReminderAt: { lte: cutoff } }],
      },
      include: {
        project: {
          include: {
            homeowner: { select: { id: true, email: true, fullName: true } },
          },
        },
      },
    });

    let sent = 0;
    for (const stage of stages) {
      try {
        const homeowner = stage.project?.homeowner;
        if (!homeowner?.id) continue;
        const stageUrl = `${this.homeownerAppUrl()}/stage-detail?stageId=${encodeURIComponent(stage.id)}&projectId=${encodeURIComponent(stage.projectId)}`;
        await this.prisma.notification.create({
          data: {
            userId: homeowner.id,
            type: 'stage_approval_reminder',
            title: 'Review stage evidence',
            message: REMINDER_COPY,
            data: { projectId: stage.projectId, stageId: stage.id, ctaUrl: stageUrl, ctaLabel: 'Review evidence' },
          },
        });
        const email = String(homeowner.email || '').trim();
        if (email) {
          await this.emailService.sendNotificationEmail({
            to: email,
            recipientName: homeowner.fullName || undefined,
            notificationType: 'stage_approval_reminder',
            title: 'Review stage evidence',
            message: REMINDER_COPY,
            data: { projectId: stage.projectId, stageId: stage.id, ctaUrl: stageUrl, ctaLabel: 'Review evidence' },
          });
        }
        await this.prisma.stage.update({
          where: { id: stage.id },
          data: {
            lastApprovalReminderAt: now,
            approvalReminderCount: { increment: 1 },
          },
        });
        sent += 1;
      } catch (error) {
        this.logger.error(
          `stage approval reminder failed stageId=${stage.id} message=${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
    this.logger.log(`stage approval reminders sent=${sent} considered=${stages.length}`);
    return { sent, considered: stages.length };
  }

  private homeownerAppUrl() {
    return String(this.configService.get<string>('HOMEOWNER_APP_URL') || 'https://buildmyhouse.app')
      .trim()
      .replace(/\/+$/, '');
  }
}
