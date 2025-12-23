import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not found. Stripe functionality will be disabled.');
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      metadata: params.metadata || {},
      description: params.description,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Create a payout to a connected account or external account
   */
  async createPayout(params: {
    amount: number;
    currency: string;
    destination?: string; // Stripe account ID or bank account
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Payout> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.payouts.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      destination: params.destination,
      description: params.description,
      metadata: params.metadata || {},
    });
  }

  /**
   * Create a transfer to a connected account (for marketplace)
   */
  async createTransfer(params: {
    amount: number;
    currency: string;
    destination: string; // Connected account ID
    transfer_group?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Transfer> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.transfers.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      destination: params.destination,
      transfer_group: params.transfer_group,
      metadata: params.metadata || {},
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get customer or create if doesn't exist
   */
  async getOrCreateCustomer(email: string, userId: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    // Try to find existing customer
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return this.stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });
  }

  /**
   * Create connected account for contractor (Stripe Connect)
   */
  async createConnectedAccount(email: string, contractorId: string): Promise<Stripe.Account> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.accounts.create({
      type: 'express',
      email,
      metadata: {
        contractorId,
      },
    });
  }

  /**
   * Create account link for onboarding
   */
  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<Stripe.AccountLink> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
  }
}


