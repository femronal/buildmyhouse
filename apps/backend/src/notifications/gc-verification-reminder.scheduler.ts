import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { GC_VERIFICATION_REQUIRED_DOCUMENTS } from '../contractors/constants/gc-verification-documents';

type PendingGC = {
  userId: string;
  uploadedRequiredCount: number;
  missingRequiredTitles: string[];
};

@Injectable()
export class GCVerificationReminderScheduler {
  private readonly logger = new Logger(GCVerificationReminderScheduler.name);
  private readonly requiredDocTypes = GC_VERIFICATION_REQUIRED_DOCUMENTS.map((doc) => doc.type);
  private readonly requiredDocTitleByType = new Map(
    GC_VERIFICATION_REQUIRED_DOCUMENTS.map((doc) => [doc.type, doc.title]),
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Every Monday at 09:00 UTC (weekly reminder cycle).
  @Cron('0 9 * * 1')
  async sendWeeklyVerificationReminders() {
    const remindable = await this.getRemindableGCsWithIncompleteDocs();
    if (remindable.length === 0) {
      return;
    }

    let sentCount = 0;
    for (const gc of remindable) {
      try {
        await this.notificationsService.createForUser(gc.userId, {
          type: 'gc_verification_weekly_reminder',
          title: 'Add proof when you\'re ready',
          message:
            'Adding proof helps homeowners trust you faster. Nothing is required, and you can add it any time from your profile.',
          data: {
            uploadedRequiredDocuments: gc.uploadedRequiredCount,
            totalRequiredDocuments: this.requiredDocTypes.length,
            missingDocuments: gc.missingRequiredTitles,
          },
        });
        sentCount += 1;
      } catch (error: any) {
        this.logger.warn(
          `Failed to send GC verification reminder to ${gc.userId}: ${error?.message || 'unknown error'}`,
        );
      }
    }

    this.logger.log(
      `GC weekly verification reminders sent: ${sentCount}/${remindable.length}`,
    );
  }

  private async getRemindableGCsWithIncompleteDocs(): Promise<PendingGC[]> {
    const gcs = await this.prisma.contractor.findMany({
      where: {
        type: 'general_contractor',
        user: {
          is: {
            role: 'general_contractor',
          },
        },
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (gcs.length === 0) {
      return [];
    }

    const contractorIds = gcs.map((gc) => gc.id);
    const userIds = gcs.map((gc) => gc.userId);

    const docs = await this.prisma.contractorCertification.findMany({
      where: {
        contractorId: { in: contractorIds },
        documentType: { in: this.requiredDocTypes },
      },
      select: {
        contractorId: true,
        documentType: true,
      },
    });

    const answers = await this.prisma.contractorDocumentAnswer.findMany({
      where: {
        contractorId: { in: contractorIds },
        answer: { in: ['not_have', 'not_applicable'] },
      },
      select: { contractorId: true, documentType: true },
    });

    const uploadedByContractor = new Map<string, Set<string>>();
    for (const doc of docs) {
      if (!doc.documentType) continue;
      if (!uploadedByContractor.has(doc.contractorId)) {
        uploadedByContractor.set(doc.contractorId, new Set());
      }
      uploadedByContractor.get(doc.contractorId)!.add(doc.documentType);
    }
    const handledByContractor = new Map<string, Set<string>>();
    for (const answer of answers) {
      if (!handledByContractor.has(answer.contractorId)) {
        handledByContractor.set(answer.contractorId, new Set());
      }
      handledByContractor.get(answer.contractorId)!.add(answer.documentType);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReminderRows = await this.prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        type: 'gc_verification_weekly_reminder',
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        userId: true,
      },
    });
    const usersRemindedRecently = new Set(recentReminderRows.map((row) => row.userId));

    const pending: PendingGC[] = [];
    for (const gc of gcs) {
      if (usersRemindedRecently.has(gc.userId)) {
        continue;
      }

      const uploadedSet = uploadedByContractor.get(gc.id) ?? new Set<string>();
      const handledSet = handledByContractor.get(gc.id) ?? new Set<string>();
      const missingRequiredTitles = this.requiredDocTypes
        .filter((type) => !uploadedSet.has(type) && !handledSet.has(type))
        .map((type) => this.requiredDocTitleByType.get(type) || type);

      if (missingRequiredTitles.length === 0) {
        continue;
      }

      pending.push({
        userId: gc.userId,
        uploadedRequiredCount: uploadedSet.size,
        missingRequiredTitles,
      });
    }

    return pending;
  }
}

