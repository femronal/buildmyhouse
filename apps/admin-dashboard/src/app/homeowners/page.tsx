'use client';

import { useState } from 'react';
import { Filter, MessageSquare, Search, UserCog } from 'lucide-react';
import { useHomeowners } from '@/hooks/useHomeowners';
import { HomeownerViewModal } from '@/components/HomeownerViewModal';

export default function HomeownersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const { data, isLoading, error } = useHomeowners(1, 50, {
    search: searchQuery || undefined,
    status: statusFilter,
  });

  const homeowners = data?.data ?? [];
  const summary = data?.summary;

  const metrics = {
    total: summary?.total ?? 0,
    active: summary?.active ?? 0,
    pending: summary?.pending ?? 0,
    suspended: summary?.suspended ?? 0,
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Homeowners</h1>
        <p className="text-gray-500 mt-1">Manage homeowners across the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Homeowners', value: metrics.total },
          { label: 'Active', value: metrics.active },
          { label: 'Pending', value: metrics.pending },
          { label: 'Suspended', value: metrics.suspended },
        ].map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">{metric.label}</p>
            <p className="text-2xl font-semibold mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search homeowners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Homeowner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  Loading homeowners…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-red-500">
                  Failed to load homeowners. Please try again.
                </td>
              </tr>
            )}
            {!isLoading && !error && homeowners.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">{user.location || '—'}</div>
                  </div>
                </td>
                <td className="px-6 py-4">{user.projects}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.lastActive}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewUserId(user.id)}
                      className="px-3 py-1 text-xs border rounded-lg flex items-center gap-1"
                    >
                      <UserCog className="w-3 h-3" />
                      View
                    </button>
                    <a
                      href={`mailto:${user.email}`}
                      className="px-3 py-1 text-xs border rounded-lg flex items-center gap-1 inline-flex w-fit"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Message
                    </a>
                    {user.status !== 'suspended' && (
                      <button className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg">
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !error && homeowners.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No homeowners match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewUserId && (
        <HomeownerViewModal
          userId={viewUserId}
          onClose={() => setViewUserId(null)}
        />
      )}
    </div>
  );
}
