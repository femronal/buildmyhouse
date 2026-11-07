'use client';

import Link from 'next/link';
import { useState } from 'react';
import PartnerProgramNav from '@/components/growth/PartnerProgramNav';
import { usePartnerCommissions } from '@/hooks/useReferrals';
import { api } from '@/lib/api';
import { commissionStatusLabel, naira, type CommissionRow } from '@/lib/referrals';

export default function CommissionsPage() {
  const query = usePartnerCommissions();
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');

  const act = async (row: CommissionRow, action: 'approve' | 'pay' | 'reverse') => {
    setMessage('');
    try {
      if (action === 'approve') {
        await api.post(`/admin/referrals/commissions/${row.id}/approve`, {
          override: row.status === 'needs_review',
          note: note || undefined,
        });
      } else if (action === 'pay') {
        await api.post(`/admin/referrals/commissions/${row.id}/pay`, { paymentReference: reference });
      } else {
        await api.post(`/admin/referrals/commissions/${row.id}/reverse`, { reason: note });
      }
      setMessage('Saved. No bank transfer was sent.');
      await query.refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update.');
    }
  };

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        A row appears after the project is completed through stage approval and the controlling fee has been received. Approve it here, then record the transfer reference when you pay it.
      </p>
      <div className="mt-4">
        <PartnerProgramNav />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <input className="rounded-lg border bg-white px-3 py-2 text-sm" placeholder="Decision or reversal note" value={note} onChange={(event) => setNote(event.target.value)} />
        <input className="rounded-lg border bg-white px-3 py-2 text-sm" placeholder="Bank transfer reference" value={reference} onChange={(event) => setReference(event.target.value)} />
      </div>
      {message ? <p className="mb-3 text-sm text-gray-700">{message}</p> : null}
      <div className="space-y-3">
        {(query.data || []).map((row) => (
          <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">{row.referrer?.name || 'Partner'}</p>
                <p className="text-sm text-gray-600">
                  {row.homeowner?.fullName || 'Homeowner'} · {row.project?.name || 'Project'}
                </p>
                {row.project?.id ? (
                  <Link href={`/projects/${row.project.id}`} className="text-xs text-gray-500 underline">
                    Open project
                  </Link>
                ) : null}
              </div>
              <p className="text-lg font-semibold">{naira(row.amount)}</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-gray-500">Contractor amount</dt>
                <dd>{naira(row.eligibleContractorAmount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Rate</dt>
                <dd>{row.rateBps / 100}%</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Controlling fee</dt>
                <dd>{naira(row.controllingFeeAmount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Contingency excluded</dt>
                <dd>{naira(row.contingencyAmount)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-gray-500">
              {commissionStatusLabel(row.status)}
              {row.paymentReference ? ` · ${row.paymentReference}` : ''}
              {row.reviewReasons ? ` · ${row.reviewReasons}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {row.status === 'awaiting_checks' || row.status === 'needs_review' ? (
                <button type="button" className="rounded-lg bg-black px-3 py-1.5 text-sm text-white" onClick={() => act(row, 'approve')}>
                  Approve
                </button>
              ) : null}
              {row.status === 'approved' ? (
                <button type="button" className="rounded-lg bg-black px-3 py-1.5 text-sm text-white" onClick={() => act(row, 'pay')}>
                  Mark paid
                </button>
              ) : null}
              {row.status !== 'reversed' ? (
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => act(row, 'reverse')}>
                  Reverse
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {!query.isLoading && (query.data || []).length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">No commissions yet.</p>
        ) : null}
      </div>
    </div>
  );
}
