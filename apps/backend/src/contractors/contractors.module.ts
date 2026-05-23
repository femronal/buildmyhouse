import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { ContractorMatcherService } from './contractor-matcher.service';
import { AuthModule } from '../auth/auth.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { PaymentsModule } from '../payments/payments.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [AuthModule, WebSocketModule, PaymentsModule, OpenAIModule],
  controllers: [ContractorsController],
  providers: [ContractorsService, ContractorMatcherService],
  exports: [ContractorsService],
})
export class ContractorsModule {}


