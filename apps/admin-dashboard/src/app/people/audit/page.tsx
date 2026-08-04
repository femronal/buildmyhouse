'use client';

import { useHrAudit } from '@/hooks/usePeopleHr';

export default function AuditPage() {
  const { data: items = [], isLoading, error } = useHrAudit();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Activity / Audit Log</h2>
        <p className="text-sm text-gray-500">
          Sensitive values are summarized, not dumped into general logs.
        </p>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {items.length === 0 && !isLoading ? (
          <p className="p-8 text-center text-gray-500">No audit events yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{item.actor?.fullName || 'System'}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs">{item.action}</code>
                  </td>
                  <td className="px-4 py-3">{item.summary || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
