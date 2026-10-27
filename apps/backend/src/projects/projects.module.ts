import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { WebSocketModule } from '../websocket/websocket.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProjectAccessModule } from '../project-access/project-access.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { OpenAIModule } from '../openai/openai.module';
import { FundingModule } from '../funding/funding.module';

@Module({
  imports: [WebSocketModule, AuthModule, PaymentsModule, ProjectAccessModule, ReferralsModule, OpenAIModule, FundingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
