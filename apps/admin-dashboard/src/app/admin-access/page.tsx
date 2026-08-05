'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import AccessAccountDrawer from '@/components/admin-access/AccessAccountDrawer';
import AccessRestricted from '@/components/admin-access/AccessRestricted';
import { CriticalBadge, RoleBadge, StatusBadge } from '@/components/admin-access/AccessBadges';
import GrantAccessModal from '@/components/admin-access/GrantAccessModal';
import { useHrFeedback } from '@/components/people/HrDialogs';
import {
  useAccessAccounts,
  useAccessAudit,
  useAccessPermissions,
  useAccessRequests,
  useAccessRoles,
  useAccessStats,
  useDecideAccessRequest,
  useGrantAccess,
  useUpsertAccessRole,
  type AccountFilters,
} from '@/hooks/useAdminAccess';
import { useMyPermissions } from '@/hooks/useMyPermissions';

const TABS = [
  { id: 'accounts', label: 'Access Accounts' },
  { id: 'roles', label: 'Roles' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'requests', label: 'Access Requests' },
  { id: 'audit', label: 'Activity Log' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function toDateLabel(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, isSuperAdmin } = useMyPermissions();
  const canView = isSuperAdmin || hasPermission('admin_access.view');
  const canGrant = isSuperAdmin || hasPermission('admin_access.grant');

  const initialTab = (searchParams.get('tab') as TabId) || 'accounts';
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'accounts',
  );
  const [filters, setFilters] = useState<AccountFilters>({});
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    searchParams.get('user'),
  );
  const [showGrant, setShowGrant] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { notify, feedbackModal } = useHrFeedback();

  const { data: stats } = useAccessStats();
  const { data: accounts = [], isLoading, error } = useAccessAccounts({
    ...filters,
    q: search || undefined,
  });
  const { data: roles = [] } = useAccessRoles();
  const { data: permissions = [] } = useAccessPermissions();
  const { data: requests = [] } = useAccessRequests();
  const { data: audit = [] } = useAccessAudit();
  const grantAccess = useGrantAccess();
  const upsertRole = useUpsertAccessRole();
  const decideRequest = useDecideAccessRequest();
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [rolePermissionKeys, setRolePermissionKeys] = useState<string[]>([]);

  useEffect(() => {
    const user = searchParams.get('user');
    if (user) setSelectedUserId(user);
    const nextTab = searchParams.get('tab') as TabId | null;
    if (nextTab && TABS.some((t) => t.id === nextTab)) setTab(nextTab);
  }, [searchParams]);

  const setTabAndUrl = (next: TabId) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`/admin-access?${params.toString()}`);
  };

  const openUser = (userId: string) => {
    setSelectedUserId(userId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('user', userId);
    router.replace(`/admin-access?${params.toString()}`);
  };

  const closeUser = () => {
    setSelectedUserId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('user');
    router.replace(`/admin-access?${params.toString()}`);
  };

  const cards = useMemo(
    () => [
      {
        key: 'total',
        label: 'Total Access Accounts',
        value: stats?.total ?? 0,
        onClick: () => setFilters({}),
      },
      {
        key: 'active',
        label: 'Active Accounts',
        value: stats?.active ?? 0,
        onClick: () => setFilters({ status: 'active' }),
      },
      {
        key: 'limited',
        label: 'Limited Access',
        value: stats?.limited ?? 0,
        onClick: () => setFilters({ status: 'active' }),
      },
      {
        key: 'super',
        label: 'Super Admins',
        value: stats?.superAdmins ?? 0,
        onClick: () => setFilters({ roleKey: 'super_admin', status: 'active' }),
      },
      {
        key: 'blocked',
        label: 'Suspended / Revoked',
        value: (stats?.suspended ?? 0) + (stats?.revoked ?? 0),
        onClick: () => setFilters({ status: 'suspended' }),
      },
      {
        key: 'expiring',
        label: 'Temporary Access Expiring Soon',
        value: stats?.expiringSoon ?? 0,
        onClick: () => setFilters({ status: 'active' }),
      },
    ],
    [stats],
  );

  const permissionsByGroup = useMemo(() => {
    const map = new Map<string, typeof permissions>();
    for (const perm of permissions) {
      if (!map.has(perm.groupLabel)) map.set(perm.groupLabel, []);
      map.get(perm.groupLabel)!.push(perm);
    }
    return Array.from(map.entries());
  }, [permissions]);

  if (!canView) {
    return <AccessRestricted />;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Access Control</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">
            Manage who can access BuildMyHouse&apos;s internal systems, what they can see, and what
            actions they are permitted to perform.
          </p>
        </div>
        {canGrant && (
          <button
            type="button"
            onClick={() => setShowGrant(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Grant Admin Access
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              card.onClick();
              setTabAndUrl('accounts');
            }}
            className="rounded-xl bg-white p-4 text-left shadow transition hover:ring-2 hover:ring-blue-200"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-4">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTabAndUrl(item.id)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                tab === item.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'accounts' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-xl border bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm"
              placeholder="Search by name, email, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow">
            {isLoading ? (
              <p className="p-6 text-gray-500">Loading access accounts…</p>
            ) : error ? (
              <p className="p-6 text-red-600">{(error as Error).message}</p>
            ) : accounts.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No access accounts match these filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Access type</th>
                      <th className="px-4 py-3">Linked staff</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last login</th>
                      <th className="px-4 py-3">Expires</th>
                      <th className="px-4 py-3">Permissions</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {accounts.map((account) => {
                      const roleName =
                        account.accessProfile?.roleAssignments?.[0]?.role?.name ||
                        (account.isSuperAdmin ? 'Super Admin' : '—');
                      return (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openUser(account.id)}
                              className="text-left"
                            >
                              <p className="font-medium text-gray-900">
                                {account.fullName || 'Unnamed'}
                              </p>
                              <p className="text-xs text-gray-500">{account.email}</p>
                            </button>
                          </td>
                          <td className="px-4 py-3 capitalize">
                            {account.accessProfile?.accessRelationship || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {account.staffProfile ? (
                              <div>
                                <p>{account.staffProfile.fullName}</p>
                                <p className="text-xs text-gray-500">
                                  {account.staffProfile.position?.name || '—'} ·{' '}
                                  {account.staffProfile.department?.name || '—'}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-500">External</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge name={roleName} isSuper={account.isSuperAdmin} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={account.accessProfile?.status} />
                          </td>
                          <td className="px-4 py-3">{toDateLabel(account.lastLoginAt)}</td>
                          <td className="px-4 py-3">
                            {account.accessProfile?.accessExpiresAt
                              ? toDateLabel(account.accessProfile.accessExpiresAt)
                              : 'Permanent'}
                          </td>
                          <td className="px-4 py-3">
                            {account.isSuperAdmin
                              ? 'All'
                              : `${account.permissionCount ?? 0} keys`}
                          </td>
                          <td className="relative px-4 py-3">
                            <button
                              type="button"
                              className="rounded-lg p-1.5 hover:bg-gray-100"
                              onClick={() =>
                                setOpenMenuId((id) => (id === account.id ? null : account.id))
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openMenuId === account.id && (
                              <div className="absolute right-4 z-10 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg">
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openUser(account.id);
                                  }}
                                >
                                  View access
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-4">
          {roles.map((role) => {
            const keys =
              role.permissionKeys ||
              (role.permissions || []).map((p: any) => p.permission?.key || p.key).filter(Boolean);
            const editing = editingRoleId === role.id;
            return (
              <div key={role.id} className="rounded-xl bg-white p-4 shadow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-500">{role.description}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {role.key}
                      {role.isSystem ? ' · system role' : ''} · {keys.length} permissions
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 text-sm"
                    onClick={() => {
                      if (editing) {
                        setEditingRoleId(null);
                      } else {
                        setEditingRoleId(role.id);
                        setRolePermissionKeys(keys);
                      }
                    }}
                  >
                    {editing ? 'Close' : 'Edit permissions'}
                  </button>
                </div>
                {editing && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {permissionsByGroup.map(([group, perms]) => (
                      <div key={group}>
                        <p className="mb-1 text-xs font-semibold uppercase text-gray-500">{group}</p>
                        <div className="grid gap-1 sm:grid-cols-2">
                          {perms.map((perm) => (
                            <label key={perm.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={rolePermissionKeys.includes(perm.key)}
                                onChange={(e) => {
                                  setRolePermissionKeys((prev) =>
                                    e.target.checked
                                      ? [...prev, perm.key]
                                      : prev.filter((k) => k !== perm.key),
                                  );
                                }}
                              />
                              <span>{perm.key}</span>
                              {perm.isCritical && <CriticalBadge />}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                      onClick={async () => {
                        try {
                          await upsertRole.mutateAsync({
                            roleId: role.id,
                            payload: {
                              name: role.name,
                              description: role.description || undefined,
                              permissionKeys: rolePermissionKeys,
                            },
                          });
                          notify('success', 'Role updated', `${role.name} permissions saved.`);
                          setEditingRoleId(null);
                        } catch (err: any) {
                          notify('error', 'Save failed', err?.message || 'Please try again.');
                        }
                      }}
                    >
                      Save role
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'permissions' && (
        <div className="space-y-4">
          {permissionsByGroup.map(([group, perms]) => (
            <div key={group} className="rounded-xl bg-white p-4 shadow">
              <h3 className="font-semibold text-gray-900">{group}</h3>
              <ul className="mt-3 divide-y">
                {perms.map((perm) => (
                  <li key={perm.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{perm.key}</p>
                      <p className="text-gray-500">{perm.description}</p>
                    </div>
                    {perm.isCritical && <CriticalBadge />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          {requests.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No access requests yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Permission</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{req.requestingUser.fullName}</p>
                      <p className="text-xs text-gray-500">{req.requestingUser.email}</p>
                    </td>
                    <td className="px-4 py-3">{req.permissionKey}</td>
                    <td className="px-4 py-3">{req.businessReason}</td>
                    <td className="px-4 py-3 capitalize">{req.status}</td>
                    <td className="px-4 py-3">
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-green-700 hover:underline"
                            onClick={async () => {
                              try {
                                await decideRequest.mutateAsync({
                                  id: req.id,
                                  decision: 'approved',
                                });
                                notify('success', 'Request approved', req.permissionKey);
                              } catch (err: any) {
                                notify('error', 'Decision failed', err?.message || 'Try again.');
                              }
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="text-red-700 hover:underline"
                            onClick={async () => {
                              try {
                                await decideRequest.mutateAsync({
                                  id: req.id,
                                  decision: 'rejected',
                                });
                                notify('success', 'Request rejected', req.permissionKey);
                              } catch (err: any) {
                                notify('error', 'Decision failed', err?.message || 'Try again.');
                              }
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          {audit.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No access audit events yet.</p>
          ) : (
            <div className="divide-y">
              {audit.map((entry) => (
                <div key={entry.id} className="px-4 py-3 text-sm">
                  <p className="font-medium text-gray-900">{entry.action}</p>
                  <p className="text-gray-600">{entry.summary || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {entry.actor?.fullName || 'System'} → {entry.target?.fullName || '—'} ·{' '}
                    {toDateLabel(entry.createdAt)}
                    {entry.reason ? ` · ${entry.reason}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedUserId && (
        <AccessAccountDrawer userId={selectedUserId} onClose={closeUser} />
      )}

      <GrantAccessModal
        open={showGrant}
        onClose={() => setShowGrant(false)}
        busy={grantAccess.isPending}
        onSubmit={async (payload) => {
          try {
            await grantAccess.mutateAsync(payload);
            notify(
              'success',
              'Access granted',
              payload.sendInvite !== false
                ? 'Invitation sent (or queued if email is unavailable).'
                : 'Admin access account created.',
            );
          } catch (err: any) {
            notify('error', 'Grant failed', err?.message || 'Could not grant access.');
            throw err;
          }
        }}
      />

      {feedbackModal}
    </div>
  );
}
