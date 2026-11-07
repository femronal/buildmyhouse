'use client';

import PartnerProgramNav from '@/components/growth/PartnerProgramNav';
import { usePartnerPerformance } from '@/hooks/useReferrals';
import { naira } from '@/lib/referrals';

export default function PartnerPerformancePage() {
  const query = usePartnerPerformance();
  const data = query.data;
  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        The number that matters is completed projects whose controlling fee was received and attributed to a partner.
      </p>
      <div className="mt-4">
        <PartnerProgramNav />
      </div>
      <section className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4 lg:grid-cols-4">
        <Stat label="Completed paid projects" value={String(data?.northStar ?? 0)} accent />
        <Stat label="Commission" value={naira(data?.commissionAmount)} />
        <Stat label="Controlling fee" value={naira(data?.controllingFeeAmount)} />
        <Stat label="Commission / fee" value={`${data?.commissionShareOfControllingFee ?? 0}%`} />
        <Stat label="Awaiting or in review" value={naira(data?.awaitingAmount)} />
        <Stat label="Approved, not paid" value={naira(data?.approvedAmount)} />
        <Stat label="Paid" value={naira(data?.paidAmount)} />
        <Stat label="Repeat homeowners" value={String(data?.repeatHomeowners ?? 0)} />
        <Stat label="Approved affiliates" value={String(data?.activeAffiliates ?? 0)} />
        <Stat label="Locked homeowners" value={String(data?.lockedHomeowners ?? 0)} />
        <Stat label="Clicks" value={String(data?.clicks ?? 0)} />
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? 'text-[#22c55e]' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
