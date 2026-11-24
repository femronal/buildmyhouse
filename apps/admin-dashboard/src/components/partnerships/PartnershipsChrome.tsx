'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import PartnershipsNav from '@/components/growth/PartnershipsNav';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { usePartnershipOwners } from '@/hooks/usePartnerships';
import { CATEGORY_LABEL, formatLagosDayDate } from '@/lib/partnerships';
import AddLeadDialog from '@/components/partnerships/AddLeadDialog';

export default function PartnershipsChrome({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useMyPermissions();
  const owners = usePartnershipOwners();
  const [adding, setAdding] = useState(false);
  const ownerId = params.get('ownerId') || '';
  const category = params.get('category') || '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const path = window.location.pathname;
    router.replace(next.toString() ? `${path}?${next}` : path);
  };

  return (
    <div className="min-h-full bg-[#f6f7f9] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950">Partnerships</h1>
          <p className="mt-1 text-sm text-gray-600">Partner leads, follow-ups and meetings. Today is {formatLagosDayDate(new Date())} (Lagos).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Owner" value={ownerId} onChange={(event) => setFilter('ownerId', event.target.value)} className="min-h-11 rounded-full border bg-white px-3 text-sm">
            <option value="">Owner: All</option>
            {(owners.data || []).map((owner) => <option key={owner.id} value={owner.id}>{owner.fullName}</option>)}
          </select>
          <select aria-label="Category" value={category} onChange={(event) => setFilter('category', event.target.value)} className="min-h-11 rounded-full border bg-white px-3 text-sm">
            <option value="">Category: All</option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {hasPermission('partnerships.edit') ? (
            <button type="button" onClick={() => setAdding(true)} className="min-h-11 rounded-full bg-gray-950 px-4 text-sm text-white">+ Add lead</button>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <PartnershipsNav />
      </div>
      {children}
      {adding ? <AddLeadDialog onClose={() => setAdding(false)} /> : null}
    </div>
  );
}
