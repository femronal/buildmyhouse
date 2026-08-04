'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building, Home, LandPlot } from 'lucide-react';
import HousesAdminPanel from '@/components/opportunity/HousesAdminPanel';
import LandAdminPanel from '@/components/opportunity/LandAdminPanel';
import RentalsAdminPanel from '@/components/opportunity/RentalsAdminPanel';

export type OpportunityTab = 'houses' | 'land' | 'rentals';

const TABS: Array<{
  id: OpportunityTab;
  label: string;
  description: string;
  icon: typeof Home;
}> = [
  {
    id: 'rentals',
    label: 'Rentals',
    description: 'Upload and manage rental listings.',
    icon: Building,
  },
  {
    id: 'land',
    label: 'Land',
    description: 'Upload and manage land listings.',
    icon: LandPlot,
  },
  {
    id: 'houses',
    label: 'Houses for sale',
    description: 'Upload and manage house listings.',
    icon: Home,
  },
];

function parseTab(value: string | null): OpportunityTab {
  if (value === 'land' || value === 'rentals' || value === 'houses') return value;
  return 'rentals';
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams]);

  const setTab = useCallback(
    (tab: OpportunityTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const activeMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-poppins">Opportunities</h1>
        <p className="mt-1 text-gray-600">
          Manage rentals, land, and houses for sale from one place.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2" aria-label="Opportunity types">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <p className="text-sm text-gray-500">{activeMeta.description}</p>

      {activeTab === 'houses' ? <HousesAdminPanel /> : null}
      {activeTab === 'land' ? <LandAdminPanel /> : null}
      {activeTab === 'rentals' ? <RentalsAdminPanel /> : null}
    </div>
  );
}
