'use client';

import type { ReactNode } from 'react';
import PartnerProgramNav from '@/components/growth/PartnerProgramNav';
import { usePartnerAttribution } from '@/hooks/useReferrals';
import { formatLagosDate } from '@/lib/referrals';

export default function AttributionPage() {
  const query = usePartnerAttribution();
  const locks = query.data?.locks || [];
  const clicks = query.data?.clicks || [];
  const conflicts = query.data?.conflicts || [];
  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Attribution</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        A click expires. The customer lock does not. The first valid partner keeps later projects from that homeowner.
      </p>
      <div className="mt-4">
        <PartnerProgramNav />
      </div>
      <Section title="Needs a decision">
        {conflicts.length === 0 ? <Empty>No self-referrals or contractor conflicts are waiting.</Empty> : null}
        {conflicts.map((row) => (
          <p key={row.id} className="border-b border-gray-100 py-2 text-sm last:border-0">
            {row.referrer?.name} · {row.project?.name} · {row.reviewReasons}
          </p>
        ))}
      </Section>
      <Section title="Locked homeowners">
        {locks.length === 0 ? <Empty>No homeowners are locked to a partner yet.</Empty> : null}
        {locks.map((row) => (
          <p key={row.id} className="border-b border-gray-100 py-2 text-sm last:border-0">
            {row.user?.fullName} · {row.referrer?.name} ({row.referrer?.code}) · {row.source} · {formatLagosDate(row.lockedAt)}
          </p>
        ))}
      </Section>
      <Section title="Recent clicks">
        {clicks.length === 0 ? <Empty>No referral clicks have been recorded.</Empty> : null}
        {clicks.map((row) => (
          <p key={row.id} className="border-b border-gray-100 py-2 text-sm last:border-0">
            {row.referrer?.code} · {row.landingPath}
            {row.campaignSlug ? ` · ${row.campaignSlug}` : ''} · {formatLagosDate(row.clickedAt)}
          </p>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}
