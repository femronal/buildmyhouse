import { formatNaira, weekRangeLabel } from './format';
import type { DashboardResponse } from '@/hooks/useAdminDashboard';

export default function MoneyThisWeek({ money }: { money: DashboardResponse['moneyThisWeek'] }) {
  return (
    <section id="money" className="rounded-2xl border border-gray-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-950">Money this week</h2>
        <p className="text-xs text-gray-400">{weekRangeLabel(money.weekStart, money.weekEnd)}</p>
      </header>
      <ul>
        {money.lines.map((line, index) => {
          const last = index === money.lines.length - 1;
          return (
            <li key={line.key} className={`flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-sm ${last ? 'bg-gray-50' : ''}`}>
              <span className={last ? 'font-medium text-gray-950' : 'text-gray-600'}>{line.label}</span>
              <span className="font-medium text-gray-950">
                <span className="md:hidden">{formatNaira(line.amount, true)}</span>
                <span className="hidden md:inline">{formatNaira(line.amount)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
