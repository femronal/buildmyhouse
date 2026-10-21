import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { ContractorMatcherService } from './contractor-matcher.service';
import { PlanRequestLateScheduler } from './plan-request-late.scheduler';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { PaymentsModule } from '../payments/payments.module';
import { OpenAIModule } from '../openai/openai.module';
import { FundingModule } from '../funding/funding.module';

@Module({
  imports: [AuthModule, AdminAccessModule, WebSocketModule, PaymentsModule, OpenAIModule, EmailModule, FundingModule],
  controllers: [ContractorsController],
  providers: [ContractorsService, ContractorMatcherService, PlanRequestLateScheduler],
  exports: [ContractorsService],
})
export class ContractorsModule {}


