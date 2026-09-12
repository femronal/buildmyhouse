'use client';

import { Waypoints } from 'lucide-react';
import GrowthModuleCard from '@/components/growth/GrowthModuleCard';
import { GROWTH_MODULES } from '@/lib/growth-modules';

export default function GrowthOverviewPage() {
  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gray-900 p-2 text-white">
            <Waypoints className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              BuildMyHouse Growth
            </p>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Growth</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Manage the channels and relationships that help BuildMyHouse acquire customers, build
              strategic relationships and expand distribution.
            </p>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              The future home for partnerships, referrals, affiliates, leads, campaigns and growth
              performance.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
          Foundation Stage
        </span>
      </header>

      <section
        className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        aria-labelledby="growth-systems-heading"
      >
        <h2 id="growth-systems-heading" className="text-base font-semibold text-gray-900">
          Growth systems are being built around real operating behaviour.
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Partnership workflows are currently being validated manually before automation. The
          modules below will become active as those systems are validated.
        </p>
      </section>

      <section aria-labelledby="growth-modules-heading">
        <h2 id="growth-modules-heading" className="sr-only">
          Planned Growth modules
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GROWTH_MODULES.map((module) => (
            <GrowthModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <section
        className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        aria-labelledby="growth-purpose-heading"
      >
        <h2 id="growth-purpose-heading" className="text-base font-semibold text-gray-900">
          One growth system. Multiple acquisition channels.
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          BuildMyHouse Growth will bring partnership development, referrals, affiliate
          distribution, lead management and campaign performance into one operating layer.
        </p>
      </section>

      <aside className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm leading-6 text-gray-600">
        Partnership development is currently being tested outside the admin system before the
        workflow is digitised.
      </aside>
    </div>
  );
}
