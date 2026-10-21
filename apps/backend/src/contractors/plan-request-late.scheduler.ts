import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { notifyPlanRequestLate } from './plan-request-notify';

@Injectable()
export class PlanRequestLateScheduler {
  private readonly logger = new Logger(PlanRequestLateScheduler.name);
  private readonly prisma = new PrismaClient();

  constructor(private readonly emailService: EmailService) {}

  @Cron('15 * * * *')
  async notifyLatePlanRequests() {
    const requests = await this.prisma.projectRequest.findMany({
      where: { status: 'pending', stageId: null, project: { designId: { not: null } } },
      include: { project: { select: { id: true, name: true, designId: true } } },
      take: 200,
    });
    for (const request of requests) {
      try {
        await notifyPlanRequestLate({
          prisma: this.prisma,
          emailService: this.emailService,
          request,
          project: request.project,
        });
      } catch (error) {
        this.logger.warn(`late plan request check failed ${request.id}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }
}
