import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { AdminAccessController, AdminAccessPublicController } from './admin-access.controller';
import { AdminAccessService } from './admin-access.service';
import { AdminAccessPermissionsService } from './admin-access-permissions.service';
import { AdminAccessAuditService } from './admin-access-audit.service';
import { AdminAccessGateService } from './admin-access-gate.service';
import { AdminSessionGuard } from './admin-session.guard';

@Module({
  imports: [forwardRef(() => AuthModule), EmailModule],
  controllers: [AdminAccessController, AdminAccessPublicController],
  providers: [
    AdminAccessService,
    AdminAccessPermissionsService,
    AdminAccessAuditService,
    AdminAccessGateService,
    AdminSessionGuard,
    PermissionsGuard,
  ],
  exports: [
    AdminAccessService,
    AdminAccessPermissionsService,
    AdminAccessGateService,
    AdminAccessAuditService,
    AdminSessionGuard,
    PermissionsGuard,
  ],
})
export class AdminAccessModule {}
