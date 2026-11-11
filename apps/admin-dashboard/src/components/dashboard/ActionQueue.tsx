import Link from 'next/link';
import { formatNaira } from './format';
import type { QueueItem } from '@/hooks/useAdminDashboard';

export default function ActionQueue({
  money,
  jobs,
  dormantCount,
  dormantExamples,
}: {
  money: QueueItem[];
  jobs: QueueItem[];
  dormantCount: number;
  dormantExamples: Array<{ id: string; name: string; homeownerName: string | null }>;
}) {
  const names = dormantExamples
    .map((item) => (item.homeownerName ? `${item.name} (${item.homeownerName})` : item.name))
    .filter(Boolean);

  return (
    <section id="queue" className="rounded-2xl border border-gray-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-950">Action queue</h2>
        <p className="text-xs text-gray-400">Oldest first</p>
      </header>
      <Group label="Money" items={money} />
      <Group label="Jobs" items={jobs} />
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex min-h-14 items-start gap-3">
          <span className="mt-0.5 flex h-8 min-w-8 items-center justify-center rounded-lg bg-gray-100 px-2 text-sm font-semibold text-gray-600">{dormantCount}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">{dormantCount} dormant jobs, hidden from this list</p>
            <p className="text-sm text-gray-500">No confirmed money and no update in 28+ days, or no GC.</p>
            {names.length > 0 ? <p className="text-sm text-gray-500">Includes {names.join(', ')}.</p> : null}
            <Link href="/projects" className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-green-700">Review and archive</Link>
            <p className="text-xs text-gray-400">Archive stale tests on the Projects page clears most of these. Open any other job to archive it on its own.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Group({ label, items }: { label: string; items: QueueItem[] }) {
  return (
    <div className="border-b border-gray-100 px-4 py-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {items.length === 0 ? <p className="min-h-14 text-sm text-green-700">Clear</p> : items.map((item) => <QueueRow key={item.id} item={item} />)}
    </div>
  );
}

function QueueRow({ item }: { item: QueueItem }) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-t border-gray-50 py-2 first:border-t-0">
      <span className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold ${item.kind === 'open_dispute' || item.kind === 'scam_reports' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{item.count}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-950">{item.title}</p>
        <p className="text-sm text-gray-500">
          <Detail item={item} />
          {typeof item.amount === 'number' ? <span> · {formatNaira(item.amount)}</span> : null}
        </p>
      </div>
      <Link href={item.href} className="shrink-0 text-sm font-medium text-green-700">{item.actionLabel}</Link>
    </div>
  );
}

function Detail({ item }: { item: QueueItem }) {
  if (item.jobHref && item.projectName && item.detail.includes(item.projectName)) {
    const [before, after] = splitOnce(item.detail, item.projectName);
    return (
      <>
        {before}
        <Link href={item.jobHref} className="text-gray-700 underline">{item.projectName}</Link>
        {after}
      </>
    );
  }
  return <>{item.detail}</>;
}

function splitOnce(value: string, token: string): [string, string] {
  const index = value.indexOf(token);
  if (index < 0) return [value, ''];
  return [value.slice(0, index), value.slice(index + token.length)];
}
