import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../services/stripe.service';
import { PaymentsService } from '../services/payments.service';

@Controller('payments/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      return { received: false, error: 'Missing signature' };
    }

    try {
      // Verify webhook signature
      const event = this.stripeService.verifyWebhookSignature(
        req.rawBody,
        signature,
      );

      this.logger.log(`Received webhook event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event);
          break;

        case 'payout.paid':
          await this.handlePayoutPaid(event);
          break;

        case 'payout.failed':
          await this.handlePayoutFailed(event);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      return { received: false, error: error.message };
    }
  }

  private async handlePaymentIntentSucceeded(event: any) {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    await this.paymentsService.handlePaymentSuccess(paymentIntent.id);
  }

  private async handlePaymentIntentFailed(event: any) {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment intent failed: ${paymentIntent.id}`);
    await this.paymentsService.handlePaymentFailure(paymentIntent.id);
  }

  private async handlePaymentIntentCanceled(event: any) {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment intent canceled: ${paymentIntent.id}`);
    // Handle cancellation if needed
  }

  private async handlePayoutPaid(event: any) {
    const payout = event.data.object;
    this.logger.log(`Payout paid: ${payout.id}`);
    // Update payout status in database if needed
  }

  private async handlePayoutFailed(event: any) {
    const payout = event.data.object;
    this.logger.log(`Payout failed: ${payout.id}`);
    // Handle failed payout
  }

  private async handleChargeRefunded(event: any) {
    const charge = event.data.object;
    this.logger.log(`Charge refunded: ${charge.id}`);
    // Handle refund - update payment status to 'refunded'
    // This would require finding the payment by transactionId
  }
}


