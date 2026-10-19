import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReferralsAdminController } from './referrals-admin.controller';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [AuthModule],
  controllers: [ReferralsAdminController, ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
