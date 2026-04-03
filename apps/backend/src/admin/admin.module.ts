import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ContractorsModule } from '../contractors/contractors.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlanFileHealthService } from './plan-file-health.service';
import { PlanFileHealthScheduler } from './plan-file-health.scheduler';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ContractorsModule,
    NotificationsModule,
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, PlanFileHealthService, PlanFileHealthScheduler],
})
export class AdminModule {}
