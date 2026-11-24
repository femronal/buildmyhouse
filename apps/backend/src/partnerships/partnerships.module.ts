import { Module } from '@nestjs/common';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { AuthModule } from '../auth/auth.module';
import { PartnershipsAdminController } from './partnerships-admin.controller';
import { PartnershipsService } from './partnerships.service';

@Module({
  imports: [AuthModule, AdminAccessModule],
  controllers: [PartnershipsAdminController],
  providers: [PartnershipsService],
  exports: [PartnershipsService],
})
export class PartnershipsModule {}
