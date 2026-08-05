import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { HrAuditService } from './hr-audit.service';
import { HrPermissionsService } from './permissions/hr-permissions.service';
import { PermissionsGuard } from './permissions/permissions.guard';

@Module({
  imports: [AuthModule, EmailModule, forwardRef(() => AdminAccessModule)],
  controllers: [HrController],
  providers: [HrService, HrAuditService, HrPermissionsService, PermissionsGuard],
  exports: [HrPermissionsService, PermissionsGuard],
})
export class HrModule {}
