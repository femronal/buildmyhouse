export const FUNDING_ACCOUNT_SETTING_KEY = 'funding_payment_account';

export const FUND_INVOICE_LINE =
  'The invoice is in your email, and you should reply with your receipt.';

export type FundingAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type FundingReceipt = {
  fileName: string;
  url: string;
  from: string;
  receivedAt: string;
  confirmedAt?: string | null;
};

export type FundingInvoice = {
  reference: string;
  amount: number;
  sentAt: string | null;
  account: FundingAccount | null;
  receipt: FundingReceipt | null;
  receipts?: FundingReceipt[];
};

export function paymentReference(projectId: string): string {
  const compact = String(projectId || '').replace(/-/g, '').toUpperCase();
  return `BMH-PAY-${compact.slice(0, 8) || 'PROJECT'}`;
}

export function referenceFromText(value: string): string | null {
  const match = String(value || '').toUpperCase().match(/BMH-PAY-[A-Z0-9]{8}/);
  return match ? match[0] : null;
}

export function parseFundingAccount(value: unknown): FundingAccount | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const bankName = String(row.bankName || '').trim();
  const accountNumber = String(row.accountNumber || '').replace(/\s+/g, '');
  const accountName = String(row.accountName || '').trim();
  if (bankName.length < 2 || !/^\d{10}$/.test(accountNumber) || accountName.length < 2) return null;
  return { bankName, accountNumber, accountName };
}

function readReceipt(value: unknown): FundingReceipt | null {
  if (!value || typeof value !== 'object') return null;
  const receiptRow = value as Record<string, unknown>;
  const url = String(receiptRow.url || '').trim();
  const fileName = String(receiptRow.fileName || '').trim();
  if (!url || !fileName) return null;
  return {
    fileName,
    url,
    from: String(receiptRow.from || '').trim(),
    receivedAt: String(receiptRow.receivedAt || ''),
    confirmedAt: receiptRow.confirmedAt ? String(receiptRow.confirmedAt) : null,
  };
}

export function readFundingInvoice(analysis: unknown): FundingInvoice | null {
  if (!analysis || typeof analysis !== 'object') return null;
  const raw = (analysis as Record<string, unknown>).fundingInvoice;
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const reference = referenceFromText(String(row.reference || ''));
  if (!reference) return null;
  const amount = Number(row.amount);
  const account = parseFundingAccount(row.account);
  const receipt = readReceipt(row.receipt);
  const receipts = Array.isArray(row.receipts)
    ? row.receipts.map((item) => readReceipt(item)).filter((item): item is FundingReceipt => !!item)
    : [];
  return {
    reference,
    amount: Number.isFinite(amount) ? amount : 0,
    sentAt: row.sentAt ? String(row.sentAt) : null,
    account,
    receipt,
    receipts,
  };
}

export function withFundingInvoice(analysis: unknown, invoice: FundingInvoice): Record<string, unknown> {
  const base = analysis && typeof analysis === 'object' ? { ...(analysis as Record<string, unknown>) } : {};
  return { ...base, fundingInvoice: invoice };
}

export function confirmAllReceipts(analysis: unknown, confirmedAt: string): Record<string, unknown> {
  const invoice = readFundingInvoice(analysis);
  const base = analysis && typeof analysis === 'object' ? { ...(analysis as Record<string, unknown>) } : {};
  if (!invoice) return base;
  const source = invoice.receipts?.length ? invoice.receipts : invoice.receipt ? [invoice.receipt] : [];
  const list = source.map((item) => ({ ...item, confirmedAt: item.confirmedAt || confirmedAt }));
  return withFundingInvoice(base, {
    ...invoice,
    receipt: list[list.length - 1] || null,
    receipts: list,
  });
}

export function confirmPendingReceipt(analysis: unknown, confirmedAt: string): Record<string, unknown> {
  const invoice = readFundingInvoice(analysis);
  const base = analysis && typeof analysis === 'object' ? { ...(analysis as Record<string, unknown>) } : {};
  if (!invoice) return base;
  const list = invoice.receipts?.length ? [...invoice.receipts] : invoice.receipt ? [{ ...invoice.receipt }] : [];
  const index = list.findIndex((item) => !item.confirmedAt);
  if (index >= 0) list[index] = { ...list[index], confirmedAt };
  const pending = list.find((item) => !item.confirmedAt) || null;
  return withFundingInvoice(base, {
    ...invoice,
    receipt: pending || list[list.length - 1] || null,
    receipts: list,
  });
}

export function payableFromRequest(request: {
  gcNotes?: string | null;
  totalQuoteAmount?: number | null;
} | null | undefined): number {
  if (!request) return 0;
  try {
    const parsed = JSON.parse(String(request.gcNotes || ''));
    const total = Number(parsed?.totalPayable);
    if (parsed?.kind === 'plan_quote' && Number.isFinite(total) && total > 0) return total;
  } catch {
    // Notes are not a stored quote.
  }
  const stored = Number(request.totalQuoteAmount);
  return Number.isFinite(stored) && stored > 0 ? stored : 0;
}

export function activationAmount(project: { budget?: number | null; aiAnalysis?: unknown } | null): number {
  const invoice = readFundingInvoice(project?.aiAnalysis);
  if (invoice && invoice.amount > 0) return invoice.amount;
  const budget = Number(project?.budget);
  return Number.isFinite(budget) && budget > 0 ? budget : 0;
}
