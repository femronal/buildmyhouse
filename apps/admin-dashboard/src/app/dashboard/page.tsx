'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { lagosDateLabel } from '@/components/dashboard/format';
import StatusStrip from '@/components/dashboard/StatusStrip';
import ActionQueue from '@/components/dashboard/ActionQueue';
import LiveJobs from '@/components/dashboard/LiveJobs';
import MoneyThisWeek from '@/components/dashboard/MoneyThisWeek';
import TrustQueue from '@/components/dashboard/TrustQueue';
import ActivityList from '@/components/dashboard/ActivityList';

export default function DashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();
  const total = data?.strip.needsYou.total ?? 0;
  const queueCount = (data?.queue.money.length || 0) + (data?.queue.jobs.length || 0);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Today</h1>
          <p className="text-sm text-gray-500">{lagosDateLabel()} · {total} things need you</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <NotificationBell />
          </div>
          <Link href="/reports/weekly" className="inline-flex min-h-11 items-center rounded-full bg-gray-950 px-4 text-sm font-medium text-white">
            Weekly report
          </Link>
        </div>
      </header>

      <nav className="sticky top-16 z-20 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-gray-100 px-4 py-2 md:hidden">
        <Chip href="#queue" label="Queue" count={queueCount} />
        <Chip href="#jobs" label="Jobs" count={data?.liveJobs.length || 0} />
        <Chip href="#money" label="Money" count={data?.queue.money.length || 0} />
        <Chip href="#trust" label="Trust" count={data?.strip.needsYou.trust || 0} />
      </nav>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      ) : error || !data ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Failed to load dashboard. Please try again.</div>
      ) : (
        <div className="space-y-4">
          <StatusStrip strip={data.strip} />
          <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
            <div className="contents md:flex md:flex-col md:gap-4">
              <ActionQueue money={data.queue.money} jobs={data.queue.jobs} dormantCount={data.dormant.count} dormantExamples={data.dormant.examples} />
              <LiveJobs jobs={data.liveJobs} />
            </div>
            <div className="contents md:flex md:flex-col md:gap-4">
              <MoneyThisWeek money={data.moneyThisWeek} />
              <TrustQueue items={data.trust} />
              <ActivityList items={data.activity} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <a href={href} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800">
      {label}
      {count > 0 ? <span className="rounded-full bg-gray-950 px-1.5 text-xs text-white">{count}</span> : null}
    </a>
  );
}
