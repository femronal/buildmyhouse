'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ClipboardList,
  Clock,
  FileWarning,
  Inbox,
  ShieldAlert,
  ShoppingBag,
  Siren,
  Store,
} from 'lucide-react';
import PiPageHeader from '@/components/price-intelligence/PiPageHeader';
import PiStatCard from '@/components/price-intelligence/PiStatCard';
import PiEmptyState from '@/components/price-intelligence/PiEmptyState';
import { usePiOverview } from '@/hooks/usePriceIntelligence';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function PriceIntelligenceOverviewPage() {
  const { data, isLoading, isError, error } = usePiOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PiPageHeader
          title="Price Intelligence"
          description="Operations overview — live counts from the review queue and intake pipelines."
        />
        <p className="text-sm text-gray-500">Loading overview…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PiPageHeader title="Price Intelligence" />
        <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
          Failed to load overview: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Open cases',
      value: data.queue.openCases,
      href: '/price-intelligence/review-queue',
      icon: ClipboardList,
      tone: 'default' as const,
    },
    {
      label: 'Overdue',
      value: data.queue.overdueCases,
      href: '/price-intelligence/review-queue?overdueOnly=true',
      icon: Clock,
      tone: 'red' as const,
    },
    {
      label: 'Critical',
      value: data.queue.criticalOpen,
      href: '/price-intelligence/review-queue?priority=critical',
      icon: Siren,
      tone: 'red' as const,
    },
    {
      label: 'Low confidence',
      value: data.queue.lowConfidenceOpen,
      href: '/price-intelligence/review-queue?caseType=low_confidence',
      icon: AlertTriangle,
      tone: 'amber' as const,
    },
    {
      label: 'Manual pending',
      value: data.intake.manualPendingReview,
      href: '/price-intelligence/manual-entry',
      icon: Inbox,
      tone: 'amber' as const,
    },
    {
      label: 'Merchant pending',
      value: data.intake.merchantPendingReview,
      href: '/price-intelligence/merchant-submissions',
      icon: Store,
      tone: 'amber' as const,
    },
    {
      label: 'Sources failing',
      value: data.sources.failingOrDegraded,
      href: '/price-intelligence/sources',
      icon: ShieldAlert,
      tone: 'red' as const,
    },
    {
      label: 'Reports 24h',
      value: data.delivery24h.reports,
      href: '/price-intelligence/reports',
      icon: ShoppingBag,
      tone: 'green' as const,
    },
    {
      label: 'Insufficient data 24h',
      value: data.delivery24h.insufficientDataItems,
      href: '/price-intelligence/reports?outcome=insufficient_data',
      icon: FileWarning,
      tone: 'amber' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PiPageHeader
        title="Price Intelligence"
        description="Ops cockpit for review queue, intake, sources, and delivery quality."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <PiStatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent audit activity</h2>
          <Link
            href="/price-intelligence/audit"
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            View all
          </Link>
        </div>
        {data.recentAudit.length === 0 ? (
          <PiEmptyState
            title="No recent audit events"
            description="Actions on review cases, catalogue, and sources will appear here."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recentAudit.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{row.action}</p>
                  <p className="truncate text-xs text-gray-500">
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
                    {row.reason ? ` · ${row.reason}` : ''}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-gray-400">{formatTime(row.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Generated {formatTime(data.generatedAt)} · counts refresh every 30s
      </p>
    </div>
  );
}
