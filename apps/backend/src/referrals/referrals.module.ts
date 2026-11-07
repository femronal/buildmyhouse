import { Module } from '@nestjs/common';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { AuthModule } from '../auth/auth.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { PartnerController } from './partner.controller';
import { PartnerProgramService } from './partner-program.service';
import { ReferralsAdminController } from './referrals-admin.controller';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [AuthModule, AdminAccessModule, WebSocketModule],
  controllers: [ReferralsAdminController, ReferralsController, PartnerController],
  providers: [ReferralsService, PartnerProgramService],
  exports: [ReferralsService, PartnerProgramService],
})
export class ReferralsModule {}
