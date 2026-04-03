import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlanFileHealthService } from './plan-file-health.service';

@Injectable()
export class PlanFileHealthScheduler {
  private readonly logger = new Logger(PlanFileHealthScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly planFileHealthService: PlanFileHealthService,
  ) {}

  // Every 6 hours
  @Cron('0 */6 * * *')
  async scanAndNotifyAdmins() {
    const repairResult = await this.planFileHealthService.repairMissingPlanFiles(200);
    const missing = await this.planFileHealthService.scanMissingPlanFiles(160);
    if (missing.length === 0) {
      if (repairResult.repairedToS3 > 0 || repairResult.normalizedUrlFixes > 0) {
        this.logger.log(
          `Plan file auto-repair completed. Repaired to S3: ${repairResult.repairedToS3}, normalized URLs: ${repairResult.normalizedUrlFixes}`,
        );
      }
      return;
    }

    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });
    if (admins.length === 0) {
      return;
    }

    const sampleNames = missing.slice(0, 3).map((x) => x.projectName);
    const sampleIds = missing.slice(0, 20).map((x) => x.projectId);
    const alertFingerprint = this.buildAlertFingerprint(missing.map((x) => x.projectId));

    let sent = 0;
    for (const admin of admins) {
      const latestAlert = await this.prisma.notification.findFirst({
        where: {
          userId: admin.id,
          type: 'plan_file_health_alert',
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, data: true },
      });
      const lastFingerprint = String((latestAlert?.data as any)?.alertFingerprint || '').trim();
      if (lastFingerprint && lastFingerprint === alertFingerprint) {
        // Same missing-plan set as last alert; avoid repetitive admin spam.
        continue;
      }

      await this.notificationsService.createForUser(admin.id, {
        type: 'plan_file_health_alert',
        title: `Plan file health alert: ${missing.length} missing file${missing.length !== 1 ? 's' : ''}`,
        message:
          sampleNames.length > 0
            ? `Missing project plan files detected. Examples: ${sampleNames.join(', ')}. Auto-repaired: ${repairResult.repairedToS3}.`
            : 'Missing project plan files detected. Please audit projects.',
        data: {
          missingCount: missing.length,
          projectIds: sampleIds,
          autoRepairedCount: repairResult.repairedToS3,
          normalizedUrlFixes: repairResult.normalizedUrlFixes,
          alertFingerprint,
        },
      });
      sent += 1;
    }

    this.logger.log(
      `Plan file health alerts sent to ${sent} admin(s). Missing files: ${missing.length}, auto-repaired: ${repairResult.repairedToS3}`,
    );
  }

  private buildAlertFingerprint(projectIds: string[]) {
    const normalized = Array.from(new Set((projectIds || []).map((x) => String(x || '').trim()).filter(Boolean))).sort();
    return normalized.join('|');
  }
}

