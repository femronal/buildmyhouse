/**
 * Stage 7 — Paystack provider (server-side only).
 * Secret key never leaves the server. Test mode first.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export interface PaystackInitializeInput {
  email: string;
  amountKobo: number;
  currency: 'NGN';
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface PaystackInitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerifyResult {
  status: 'success' | 'failed' | 'abandoned' | 'pending' | 'unknown';
  reference: string;
  amountKobo: number;
  currency: string;
  paidAt: string | null;
  transactionId: string | null;
  gatewayResponse: string | null;
  rawStatus: string;
}

export interface PaystackRefundInput {
  reference: string;
  amountKobo?: number;
}

export interface PaystackRefundResult {
  status: string;
  providerRefundId: string | null;
  amountKobo: number | null;
}

/** Swappable payment provider interface. */
export interface PriceCheckerPaymentProvider {
  initialize(input: PaystackInitializeInput): Promise<PaystackInitializeResult>;
  verify(reference: string): Promise<PaystackVerifyResult>;
  refund(input: PaystackRefundInput): Promise<PaystackRefundResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean;
}

export function verifyPaystackSignature(args: {
  rawBody: string;
  signatureHeader: string | undefined;
  secret: string;
}): boolean {
  if (!args.signatureHeader || !args.secret || !args.rawBody) return false;
  const expected = createHmac('sha512', args.secret).update(args.rawBody).digest('hex');
  const provided = args.signatureHeader.trim();
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function mapVerifyStatus(raw: string): PaystackVerifyResult['status'] {
  const s = (raw || '').toLowerCase();
  if (s === 'success') return 'success';
  if (s === 'failed') return 'failed';
  if (s === 'abandoned') return 'abandoned';
  if (s === 'ongoing' || s === 'pending' || s === 'processing' || s === 'queued') return 'pending';
  return 'unknown';
}

@Injectable()
export class PaystackProvider implements PriceCheckerPaymentProvider {
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly baseUrl = 'https://api.paystack.co';

  private secretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!key) {
      throw new ServiceUnavailableException('Payment provider is not configured.');
    }
    return key;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const secret = this.secretKey();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      message?: string;
      data?: T;
    };
    if (!res.ok || json.status === false) {
      this.logger.warn(`Paystack ${method} ${path} failed: ${json.message ?? res.status}`);
      throw new ServiceUnavailableException('Unable to reach the payment provider. Please try again.');
    }
    return json.data as T;
  }

  async initialize(input: PaystackInitializeInput): Promise<PaystackInitializeResult> {
    if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) {
      throw new ServiceUnavailableException('Invalid payment amount.');
    }
    const data = await this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('POST', '/transaction/initialize', {
      email: input.email,
      amount: input.amountKobo,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    });
    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: data.reference,
    };
  }

  async verify(reference: string): Promise<PaystackVerifyResult> {
    const data = await this.request<{
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at?: string | null;
      id?: number | string;
      gateway_response?: string;
    }>('GET', `/transaction/verify/${encodeURIComponent(reference)}`);

    return {
      status: mapVerifyStatus(data.status),
      reference: data.reference,
      amountKobo: Math.floor(Number(data.amount) || 0),
      currency: (data.currency || '').toUpperCase(),
      paidAt: data.paid_at ?? null,
      transactionId: data.id != null ? String(data.id) : null,
      gatewayResponse: data.gateway_response ?? null,
      rawStatus: data.status,
    };
  }

  async refund(input: PaystackRefundInput): Promise<PaystackRefundResult> {
    const body: Record<string, unknown> = { transaction: input.reference };
    if (input.amountKobo !== undefined) {
      if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) {
        throw new ServiceUnavailableException('Invalid refund amount.');
      }
      body.amount = input.amountKobo;
    }
    const data = await this.request<{
      status?: string;
      id?: number | string;
      amount?: number;
    }>('POST', '/refund', body);
    return {
      status: data.status ?? 'unknown',
      providerRefundId: data.id != null ? String(data.id) : null,
      amountKobo: data.amount != null ? Math.floor(Number(data.amount)) : null,
    };
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    return verifyPaystackSignature({
      rawBody,
      signatureHeader,
      secret: process.env.PAYSTACK_SECRET_KEY?.trim() ?? '',
    });
  }
}

/** DI token for swappable provider. */
export const PRICE_CHECKER_PAYMENT_PROVIDER = 'PRICE_CHECKER_PAYMENT_PROVIDER';
