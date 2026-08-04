'use client';

import Link from 'next/link';
import { useHrDashboard } from '@/hooks/usePeopleHr';
import { CANDIDATE_STAGE_LABELS } from '@/lib/people/types';

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function PeopleOverviewPage() {
  const { data, isLoading, error } = useHrDashboard();

  if (isLoading) {
    return <div className="text-gray-500">Loading People & HR overview…</div>;
  }
  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-red-700">
        {(error as Error).message || 'Failed to load HR dashboard'}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Card label="Active staff" value={data.cards.activeStaff} />
        <Card label="Active consultants" value={data.cards.activeConsultants} />
        <Card label="Candidates in recruitment" value={data.cards.candidatesInRecruitment} />
        <Card label="Awaiting interview" value={data.cards.candidatesAwaitingInterview} />
        <Card label="On probation" value={data.cards.peopleOnProbation} />
        <Card label="Contracts expiring soon" value={data.cards.contractsExpiringSoon} />
        <Card label="Missing documents" value={data.cards.missingDocuments} />
        <Card label="Pending reviews" value={data.cards.pendingReviews} />
        <Card label="Open roles" value={data.cards.openRoles} />
      </div>

      {data.alerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Alerts</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {data.alerts.map((alert) => (
              <li key={alert.type + alert.message}>{alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recruitment pipeline</h2>
            <Link href="/people/recruitment" className="text-sm text-blue-600 hover:underline">
              Open recruitment
            </Link>
          </div>
          <div className="space-y-2">
            {data.pipelineSummary.map((row) => (
              <div key={row.stage} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {CANDIDATE_STAGE_LABELS[row.stage] || row.stage}
                </span>
                <span className="font-semibold text-gray-900">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <Link href="/people/audit" className="text-sm text-blue-600 hover:underline">
              Full audit log
            </Link>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No HR activity yet.</p>
          ) : (
            <div className="divide-y">
              {data.recentActivity.map((item) => (
                <div key={item.id} className="py-2 text-sm">
                  <p className="font-medium text-gray-900">{item.summary || item.action}</p>
                  <p className="text-xs text-gray-500">
                    {item.actor?.fullName || 'System'} ·{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
