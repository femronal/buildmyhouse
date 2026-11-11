import { formatNaira } from './format';
import type { DashboardResponse } from '@/hooks/useAdminDashboard';

export default function StatusStrip({ strip }: { strip: DashboardResponse['strip'] }) {
  const attention =
    strip.liveJobs.needAttention === 0
      ? 'All on track'
      : strip.liveJobs.needAttention === 1
        ? '1 needs attention'
        : `${strip.liveJobs.needAttention} need attention`;
  const disputes =
    strip.openDisputes.count === 0 || strip.openDisputes.oldestDays == null
      ? 'None open'
      : strip.openDisputes.oldestDays === 1
        ? 'Oldest 1 day'
        : `Oldest ${strip.openDisputes.oldestDays} days`;

  return (
    <section className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
      <Tile label="Needs you" value={String(strip.needsYou.total)} detail={`${strip.needsYou.jobs} on jobs · ${strip.needsYou.money} money · ${strip.needsYou.trust} trust`} />
      <Tile label="Live jobs" value={String(strip.liveJobs.count)} detail={attention} detailClass={strip.liveJobs.needAttention ? 'text-amber-700' : 'text-gray-500'} />
      <Tile label={strip.moneyIn.label} value={formatNaira(strip.moneyIn.amount)} detail={`${strip.moneyIn.count} payment${strip.moneyIn.count === 1 ? '' : 's'} confirmed`} />
      <Tile label="Open disputes" value={String(strip.openDisputes.count)} detail={disputes} detailClass={strip.openDisputes.count ? 'text-red-600' : 'text-gray-500'} />
    </section>
  );
}

function Tile({ label, value, detail, detailClass = 'text-gray-500' }: { label: string; value: string; detail: string; detailClass?: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">{value}</p>
      <p className={`mt-1 text-sm ${detailClass}`}>{detail}</p>
    </article>
  );
}
