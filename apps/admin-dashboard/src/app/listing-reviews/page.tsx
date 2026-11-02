'use client';

import { useState } from 'react';
import { useListingReviews, useReviewDecision, type ListingReviewStatus } from '@/hooks/useListingReviews';

const TABS: Array<{ id: ListingReviewStatus; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ListingReviewsPage() {
  const [status, setStatus] = useState<ListingReviewStatus>('pending');
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const query = useListingReviews({ status, page: 1 });
  const decision = useReviewDecision();
  const rows = query.data?.data || [];

  const act = async (id: string, action: 'approve' | 'reject') => {
    setError('');
    try {
      await decision.mutateAsync({ id, action, reason });
      setReasonFor(null);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this review.');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-4">
      <h1 className="text-2xl font-bold font-poppins">Listing reviews</h1>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatus(tab.id)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium ${status === tab.id ? 'bg-gray-950 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {query.isLoading ? <p className="text-sm text-gray-500">Loading reviews...</p> : null}
      {!query.isLoading && rows.length === 0 ? <p className="text-sm text-gray-500">No reviews in this tab.</p> : null}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">Listing</th>
              <th className="px-3 py-2 font-medium">Kind</th>
              <th className="px-3 py-2 font-medium">Reviewer</th>
              <th className="px-3 py-2 font-medium">Rating</th>
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 align-top">
                <td className="px-3 py-3">
                  <a className="font-medium text-gray-950 underline" href={`https://buildmyhouse.app${row.listingPath}`} target="_blank" rel="noreferrer">
                    {row.listingName}
                  </a>
                  <p className="mt-1 max-w-xs text-gray-600">{row.comment}</p>
                </td>
                <td className="px-3 py-3 capitalize">{row.listingKind}</td>
                <td className="px-3 py-3">
                  <div>{row.reviewerName}</div>
                  <div className="text-gray-500">{row.reviewerEmail}</div>
                </td>
                <td className="px-3 py-3">{row.rating}</td>
                <td className="px-3 py-3">{row.label}</td>
                <td className="px-3 py-3">{new Date(row.createdAt).toLocaleDateString('en-GB')}</td>
                <td className="px-3 py-3">
                  {row.status === 'pending' ? (
                    <div className="flex flex-col gap-2">
                      <button type="button" className="min-h-10 rounded-lg bg-gray-950 px-3 text-white" onClick={() => act(row.id, 'approve')} disabled={decision.isPending}>
                        Approve
                      </button>
                      {reasonFor === row.id ? (
                        <>
                          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="min-h-20 rounded-lg border border-gray-300 p-2" />
                          <button type="button" className="min-h-10 rounded-lg border border-gray-300 px-3" onClick={() => act(row.id, 'reject')} disabled={decision.isPending || reason.trim().length < 1}>
                            Confirm reject
                          </button>
                        </>
                      ) : (
                        <button type="button" className="min-h-10 rounded-lg border border-gray-300 px-3" onClick={() => { setReasonFor(row.id); setReason(''); }}>
                          Reject
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="capitalize text-gray-500">{row.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
