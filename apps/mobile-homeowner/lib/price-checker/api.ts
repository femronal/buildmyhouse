/**
 * Stage 6 — Price Checker API layer.
 *
 * Every call goes through the real BuildMyHouse backend. The anonymous
 * session id travels in the `x-price-session` header; the JWT (when signed
 * in) travels in the Authorization header as everywhere else in the app.
 */
import { API_BASE_URL } from '../api';
import { getAuthToken } from '../auth';
import { getPriceCheckerSessionId } from './session';
import {
  CatalogueSearchResult,
  ConsumerLocation,
  ConsumerReportDto,
  PaidBatchDto,
  PaidBatchStartResponse,
  PaymentInitializeResponse,
  PaymentStatusDto,
  PriceCheckPaymentQuote,
  QuestionsPreview,
  ResearchStatusDto,
  UsageStatusDto,
} from './types';

export class PriceCheckerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = 'PriceCheckerApiError';
  }
}

async function headers(): Promise<Record<string, string>> {
  const [token, sessionId] = await Promise.all([getAuthToken(), getPriceCheckerSessionId()]);
  return {
    'Content-Type': 'application/json',
    'x-price-session': sessionId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: { method?: 'GET' | 'POST'; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: await headers(),
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init?.signal,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message: string =
      (payload && (payload.message?.message || payload.message)) || `Request failed (${response.status})`;
    const code: string | null = (payload && (payload.message?.code || payload.code)) ?? null;
    throw new PriceCheckerApiError(typeof message === 'string' ? message : 'Request failed', response.status, code);
  }
  return response.json();
}

export const priceCheckerApi = {
  searchCatalogue: (q: string, signal?: AbortSignal) =>
    request<{ results: CatalogueSearchResult[] }>(`/price-checker/catalogue/search?q=${encodeURIComponent(q)}`, { signal }),

  locations: () => request<{ locations: ConsumerLocation[] }>(`/price-checker/locations`),

  questionsPreview: (familyKey: string, kind: 'product' | 'service', answers: Record<string, string>) =>
    request<QuestionsPreview>(`/price-checker/questions/preview`, {
      method: 'POST',
      body: { familyKey, kind, answers },
    }),

  usage: () => request<UsageStatusDto>(`/price-checker/usage`),

  startResearch: (body: {
    familyKey: string;
    kind: 'product' | 'service';
    answers: Record<string, string>;
    locationKey: string;
    rawProductName: string;
  }) => request<{ requestId: string }>(`/price-checker/research`, { method: 'POST', body }),

  researchStatus: (requestId: string, signal?: AbortSignal) =>
    request<ResearchStatusDto>(`/price-checker/research/${requestId}/status`, { signal }),

  cancelResearch: (requestId: string) =>
    request<{ cancelled: boolean }>(`/price-checker/research/${requestId}/cancel`, { method: 'POST' }),

  getReport: (reportId: string, token: string | null) =>
    request<ConsumerReportDto>(
      `/price-checker/reports/${reportId}${token ? `?token=${encodeURIComponent(token)}` : ''}`,
    ),

  saveReport: (reportId: string, token: string | null) =>
    request<{ saved: boolean }>(
      `/price-checker/reports/${reportId}/save${token ? `?token=${encodeURIComponent(token)}` : ''}`,
      { method: 'POST', body: {} },
    ),

  pdfUrl: (reportId: string, token: string | null) =>
    `${API_BASE_URL}/price-checker/reports/${reportId}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`,

  reportPath: (reportId: string, token: string | null) =>
    `/tools/price-checker/reports/${reportId}${token ? `?token=${encodeURIComponent(token)}` : ''}`,

  // ----- Stage 7 guest payment (server owns all amounts) -----

  createPaymentQuote: (body: {
    items: Array<{
      familyKey: string;
      kind: 'product' | 'service';
      answers: Record<string, string>;
      locationKey: string;
      rawProductName: string;
      productLabel: string;
    }>;
  }) => request<PriceCheckPaymentQuote>(`/price-checker/payment-quotes`, { method: 'POST', body }),

  initializePayment: (body: { quoteId: string; email: string }) =>
    request<PaymentInitializeResponse>(`/price-checker/payments/initialize`, { method: 'POST', body }),

  paymentStatus: (paymentOrderId: string, signal?: AbortSignal) =>
    request<PaymentStatusDto>(`/price-checker/payments/${paymentOrderId}/status`, { signal }),

  verifyPayment: (body: { reference: string }) =>
    request<PaymentStatusDto>(`/price-checker/payments/verify`, { method: 'POST', body }),

  startPaidBatch: (paymentOrderId: string) =>
    request<PaidBatchStartResponse>(`/price-checker/paid-batches/${paymentOrderId}/start`, {
      method: 'POST',
      body: {},
    }),

  paidBatch: (paymentOrderId: string, signal?: AbortSignal) =>
    request<PaidBatchDto>(`/price-checker/paid-batches/${paymentOrderId}`, { signal }),
};

/** Format server kobo amounts for display. Never invent a unit price in the UI. */
export function formatNairaFromKobo(kobo: number): string {
  const naira = Math.round(kobo) / 100;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(naira);
  } catch {
    return `₦${naira.toLocaleString('en-NG')}`;
  }
}

export function isValidGuestEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
