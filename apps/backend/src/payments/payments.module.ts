import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { PaymentsService } from './services/payments.service';
import { StripeService } from './services/stripe.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { AuthModule } from '../auth/auth.module';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { FundingModule } from '../funding/funding.module';

@Module({
  imports: [WebSocketModule, AuthModule, AdminAccessModule, FundingModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, StripeService],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}



