import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private readonly apiVersion: Stripe.LatestApiVersion;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not found. Stripe functionality will be disabled.');
    } else {
      // Keep this version in sync with both:
      // - Stripe SDK initialization
      // - Ephemeral key creation (Stripe requires an explicit version header there)
      this.apiVersion = '2025-11-17.clover';
      this.stripe = new Stripe(secretKey, {
        apiVersion: this.apiVersion,
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
   * Create and confirm an off-session PaymentIntent and route funds to a Connect account.
   * Used for automatic stage funding on stage commencement.
   */
  async createOffSessionDestinationCharge(params: {
    amount: number; // dollars
    currency: string;
    customerId: string;
    paymentMethodId: string;
    destinationAccountId: string;
    transferGroup?: string;
    metadata?: Record<string, string>;
    description?: string;
    idempotencyKey?: string;
  }): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const data: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      customer: params.customerId,
      payment_method: params.paymentMethodId,
      off_session: true,
      confirm: true,
      description: params.description,
      metadata: params.metadata || {},
      transfer_group: params.transferGroup,
      transfer_data: {
        destination: params.destinationAccountId,
      },
    };

    const options: Stripe.RequestOptions | undefined = params.idempotencyKey
      ? { idempotencyKey: params.idempotencyKey }
      : undefined;

    return this.stripe.paymentIntents.create(data, options);
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
   * Create a SetupIntent to save a card for future off-session payments.
   */
  async createSetupIntent(params: {
    customerId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.SetupIntent> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.setupIntents.create({
      customer: params.customerId,
      usage: 'off_session',
      payment_method_types: ['card'],
      metadata: params.metadata || {},
    });
  }

  /**
   * Create a Stripe Checkout Session (setup mode) to save a card.
   * This works across web + mobile because it's just a URL.
   */
  async createSetupCheckoutSession(params: {
    customerId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.checkout.sessions.create({
      mode: 'setup',
      customer: params.customerId,
      payment_method_types: ['card'],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      setup_intent_data: {
        metadata: params.metadata || {},
      },
    });
  }

  /**
   * Create an ephemeral key for Stripe mobile SDKs (PaymentSheet).
   */
  async createEphemeralKey(customerId: string): Promise<Stripe.EphemeralKey> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    // Stripe requires you to pin the API version for ephemeral keys.
    return this.stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: this.apiVersion },
    );
  }

  async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
    return this.stripe.paymentMethods.retrieve(paymentMethodId);
  }

  async attachPaymentMethodToCustomer(params: {
    paymentMethodId: string;
    customerId: string;
  }): Promise<Stripe.PaymentMethod> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
    return this.stripe.paymentMethods.attach(params.paymentMethodId, {
      customer: params.customerId,
    });
  }

  async setCustomerDefaultPaymentMethod(params: {
    customerId: string;
    paymentMethodId: string;
  }): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    return this.stripe.customers.update(params.customerId, {
      invoice_settings: {
        default_payment_method: params.paymentMethodId,
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

    const country = this.configService.get<string>('STRIPE_CONNECT_COUNTRY') || 'US';

    return this.stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        transfers: { requested: true },
      },
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

  /**
   * Retrieve Connect account details (onboarding status, capabilities, requirements, etc.)
   */
  async getAccount(accountId: string): Promise<Stripe.Account> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
    return this.stripe.accounts.retrieve(accountId);
  }
}



