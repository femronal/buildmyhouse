import { Global, Module } from '@nestjs/common';
import { AdminAccessModule } from '../admin-access/admin-access.module';
import { AuthModule } from '../auth/auth.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { ListingFeedbackPublicController } from './listing-feedback-public.controller';
import { ListingFeedbackService } from './listing-feedback.service';
import { ListingReviewsAdminController } from './listing-reviews-admin.controller';
import { ScamReportsAdminController } from './scam-reports-admin.controller';

@Global()
@Module({
  imports: [AuthModule, AdminAccessModule, WebSocketModule],
  controllers: [ListingFeedbackPublicController, ListingReviewsAdminController, ScamReportsAdminController],
  providers: [ListingFeedbackService],
  exports: [ListingFeedbackService],
})
export class ListingFeedbackModule {}
