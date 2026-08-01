'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type RevenueCards = {
  windowDays: number;
  successfulPayments: number;
  grossRevenueKobo: number;
  refundedKobo: number;
  netRevenueKobo: number;
  totalVariableCostKobo: number;
  estimatedGrossMarginKobo: number;
  averageGrossMarginBps: number | null;
  targetGrossMarginBps: number;
  checkoutEnabled: boolean;
  pricingVersion: string;
  unitPriceKobo: number | null;
};

type TransactionRow = {
  paymentOrderId: string;
  status: string;
  fulfilmentStatus: string;
  amountExpectedKobo: number;
  amountPaidKobo: number | null;
  refundedAmountKobo: number;
  providerReference: string;
  customerEmailMasked: string;
  paidAt: string | null;
  lineItemCount: number;
  lineItems: Array<{ free: boolean }>;
};

function naira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-900/60 bg-[#0A1628] p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function PriceCheckerRevenuePage() {
  const [cards, setCards] = useState<RevenueCards | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [alerts, setAlerts] = useState<Array<{ code: string; severity: string; message: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [revenue, tx, alertRes] = await Promise.all([
          api.get<RevenueCards>('/admin/price-payments/revenue?days=30'),
          api.get<{ transactions: TransactionRow[] }>('/admin/price-payments/transactions?take=50'),
          api.get<{ alerts: Array<{ code: string; severity: string; message: string }> }>(
            '/admin/price-payments/alerts',
          ),
        ]);
        if (cancelled) return;
        setCards(revenue);
        setTransactions(tx.transactions);
        setAlerts(alertRes.alerts ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load revenue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050B14] p-6 text-white">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/tools" className="text-gray-400 hover:text-white">
          ← Tools
        </Link>
        <span className="text-gray-600">/</span>
        <Link href="/price-intelligence" className="text-gray-400 hover:text-white">
          Price Checker
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Price Checker revenue</h1>
      <p className="mt-1 text-sm text-gray-400">
        Guest one-time payments — not a credit wallet. Margin figures are internal only.
      </p>

      {loading ? <p className="mt-8 text-gray-400">Loading…</p> : null}
      {error ? <p className="mt-8 text-red-400">{error}</p> : null}

      {alerts.length > 0 ? (
        <div className="mt-6 space-y-2">
          {alerts.map((a) => (
            <div
              key={a.code}
              className={`rounded-xl border px-4 py-3 text-sm ${
                a.severity === 'critical'
                  ? 'border-red-700 bg-red-950/40 text-red-200'
                  : a.severity === 'warning'
                    ? 'border-amber-700 bg-amber-950/40 text-amber-100'
                    : 'border-blue-800 bg-blue-950/40 text-blue-100'
              }`}
            >
              {a.message}
            </div>
          ))}
        </div>
      ) : null}

      {cards ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label={`Gross revenue (${cards.windowDays}d)`} value={naira(cards.grossRevenueKobo)} />
            <Card label="Net revenue" value={naira(cards.netRevenueKobo)} />
            <Card label="Successful payments" value={String(cards.successfulPayments)} />
            <Card label="Refunded" value={naira(cards.refundedKobo)} />
            <Card label="Variable cost" value={naira(cards.totalVariableCostKobo)} />
            <Card label="Est. gross margin" value={naira(cards.estimatedGrossMarginKobo)} />
            <Card
              label="Avg margin"
              value={
                cards.averageGrossMarginBps != null
                  ? `${(cards.averageGrossMarginBps / 100).toFixed(1)}%`
                  : '—'
              }
            />
            <Card
              label="Unit price / checkout"
              value={
                cards.checkoutEnabled && cards.unitPriceKobo != null
                  ? `${naira(cards.unitPriceKobo)} · ${cards.pricingVersion}`
                  : 'Checkout disabled'
              }
            />
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-blue-900/60">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#0A1628] text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Paid at</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Fulfilment</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No payments yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.paymentOrderId} className="border-t border-blue-900/40">
                      <td className="px-4 py-3 text-gray-300">
                        {t.paidAt ? new Date(t.paidAt).toLocaleString('en-NG') : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-300">{t.providerReference}</td>
                      <td className="px-4 py-3 text-gray-300">{t.customerEmailMasked}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {t.lineItemCount} (
                        {t.lineItems.filter((l) => !l.free).length} paid /{' '}
                        {t.lineItems.filter((l) => l.free).length} free)
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {naira(t.amountPaidKobo ?? t.amountExpectedKobo)}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{t.status}</td>
                      <td className="px-4 py-3 text-gray-300">{t.fulfilmentStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
