import Link from 'next/link';
import type { QueueItem } from '@/hooks/useAdminDashboard';

export default function TrustQueue({ items }: { items: QueueItem[] }) {
  return (
    <section id="trust" className="rounded-2xl border border-gray-200 bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-950">Trust queue</h2>
      </header>
      {items.length === 0 ? (
        <p className="min-h-14 px-4 py-3 text-sm text-green-700">Clear</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex min-h-14 items-center gap-3 border-t border-gray-50 px-4 py-2 first:border-t-0">
              <span className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold ${item.kind === 'scam_reports' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{item.count}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-950">{item.title}</p>
                <p className="text-sm text-gray-500">{item.detail}</p>
              </div>
              <Link href={item.href} className="shrink-0 text-sm font-medium text-green-700">{item.actionLabel}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
