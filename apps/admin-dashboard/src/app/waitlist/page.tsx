'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type WaitlistSignup = {
  id: string;
  productKey: string;
  email: string;
  fullName: string | null;
  sourcePath: string | null;
  createdAt: string;
};

type WaitlistResponse = {
  count: number;
  items: WaitlistSignup[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WaitlistAdminPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['waitlist-signups'],
    queryFn: () => api.get<WaitlistResponse>('/waitlist/admin'),
  });

  const items = data?.items ?? [];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Waitlist</h1>
          <p className="text-sm text-gray-600 mt-1">
            Email signups for upcoming BuildMyHouse tools (starting with the Land Verification Checker).
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {isLoading ? <p className="text-sm text-gray-500">Loading waitlist…</p> : null}
      {error ? (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load waitlist'}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <>
          <p className="text-sm text-gray-700 mb-4">
            <span className="font-semibold">{data?.count ?? 0}</span> signup
            {(data?.count ?? 0) === 1 ? '' : 's'}
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No waitlist signups yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-900">{item.email}</td>
                      <td className="px-4 py-3 text-gray-700">{item.fullName || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{item.productKey}</td>
                      <td className="px-4 py-3 text-gray-700">{item.sourcePath || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
