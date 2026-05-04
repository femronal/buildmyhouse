'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { Search, ShieldCheck, ShieldOff } from 'lucide-react';
import {
  useAdminAccessAccounts,
  useCreateAdminAccount,
  useSetAdminDashboardAccess,
  type AdminAccessAccount,
} from '@/hooks/useAdminAccess';

function toDateLabel(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminAccessPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newAdminForm, setNewAdminForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const { data, isLoading, error } = useAdminAccessAccounts();
  const setAccessMutation = useSetAdminDashboardAccess();
  const createAdminMutation = useCreateAdminAccount();

  const accounts = data ?? [];

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return accounts;
    }

    return accounts.filter((account) => {
      const fullName = String(account.fullName || '').toLowerCase();
      const email = String(account.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [accounts, searchQuery]);

  const handleSetAccess = async (account: AdminAccessAccount, enabled: boolean) => {
    try {
      await setAccessMutation.mutateAsync({
        adminUserId: account.id,
        enabled,
      });
    } catch (mutationError: any) {
      window.alert(
        mutationError?.message || 'Failed to update admin dashboard access. Please try again.',
      );
    }
  };

  const handleCreateAdmin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createAdminMutation.mutateAsync({
        fullName: newAdminForm.fullName.trim(),
        email: newAdminForm.email.trim().toLowerCase(),
        password: newAdminForm.password,
      });
      setNewAdminForm({
        fullName: '',
        email: '',
        password: '',
      });
    } catch (mutationError: any) {
      window.alert(mutationError?.message || 'Failed to create admin account.');
    }
  };

  const enabledCount = accounts.filter((account) => account.hasDashboardAllowlistAccess).length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Admin Access Control</h1>
        <p className="text-gray-500 mt-1">
          Grant or revoke who can sign in to the admin dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">Total Admin Accounts</p>
          <p className="text-2xl font-semibold mt-2">{accounts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">Dashboard Access Enabled</p>
          <p className="text-2xl font-semibold mt-2">{enabledCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500">Access Revoked</p>
          <p className="text-2xl font-semibold mt-2">{Math.max(accounts.length - enabledCount, 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search admin by name or email..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <form onSubmit={handleCreateAdmin} className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Add new admin account</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Full name"
            value={newAdminForm.fullName}
            onChange={(event) =>
              setNewAdminForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Email address"
            value={newAdminForm.email}
            onChange={(event) =>
              setNewAdminForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Temporary password"
            value={newAdminForm.password}
            onChange={(event) =>
              setNewAdminForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            minLength={6}
            required
          />
        </div>
        <div className="mt-3">
          <button
            type="submit"
            disabled={createAdminMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {createAdminMutation.isPending ? 'Creating admin...' : 'Create admin'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dashboard Access</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading admin accounts...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                  Failed to load admin accounts. Please try again.
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              filteredAccounts.map((account) => {
                const hasAccess = Boolean(account.hasDashboardAllowlistAccess);
                const isUpdating =
                  setAccessMutation.isPending &&
                  setAccessMutation.variables?.adminUserId === account.id;

                return (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{account.fullName || 'Admin user'}</div>
                        <div className="text-sm text-gray-500">{account.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {account.verified ? (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{toDateLabel(account.updatedAt)}</td>
                    <td className="px-6 py-4">
                      {hasAccess ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          <ShieldCheck className="w-3 h-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          <ShieldOff className="w-3 h-3" />
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {hasAccess ? (
                        <button
                          onClick={() => handleSetAccess(account, false)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-lg disabled:opacity-60"
                        >
                          {isUpdating ? 'Removing...' : 'Remove access'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetAccess(account, true)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg disabled:opacity-60"
                        >
                          {isUpdating ? 'Adding...' : 'Grant access'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            {!isLoading && !error && filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No admin accounts match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
