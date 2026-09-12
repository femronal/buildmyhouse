import {
  Handshake,
  LineChart,
  Link2,
  Megaphone,
  Share2,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import {
  GROWTH_STATUS_LABEL,
  type GrowthModule,
  type GrowthModuleIcon,
} from '@/lib/growth-modules';

const MODULE_ICONS: Record<GrowthModuleIcon, LucideIcon> = {
  partnerships: Handshake,
  referrals: Share2,
  affiliates: Link2,
  leads: UserPlus,
  campaigns: Megaphone,
  dashboard: LineChart,
};

type GrowthModuleCardProps = {
  module: GrowthModule;
};

/** Inactive preview card — not a link, button, or focus target. */
export default function GrowthModuleCard({ module }: GrowthModuleCardProps) {
  const Icon = MODULE_ICONS[module.icon];

  return (
    <article
      data-testid={`growth-module-${module.id}`}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="inline-flex shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
          {GROWTH_STATUS_LABEL}
        </span>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">{module.title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{module.description}</p>
      <p className="mt-3 text-xs leading-5 text-gray-500">{module.futureHint}</p>
    </article>
  );
}
