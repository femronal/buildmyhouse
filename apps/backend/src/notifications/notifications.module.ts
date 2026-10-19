import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { GCVerificationReminderScheduler } from './gc-verification-reminder.scheduler';
import { StageApprovalReminderScheduler } from './stage-approval-reminder.scheduler';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, GCVerificationReminderScheduler, StageApprovalReminderScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
