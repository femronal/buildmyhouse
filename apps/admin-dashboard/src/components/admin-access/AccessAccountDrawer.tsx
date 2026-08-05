'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import {
  useAccessAccount,
  useAccessPermissions,
  useAccessRoles,
  useAssignAccessRole,
  useExtendAccess,
  useRemovePermissionOverride,
  useRestoreAccess,
  useRevokeAccess,
  useRevokeAccessSessions,
  useSetPermissionOverride,
  useSuspendAccess,
} from '@/hooks/useAdminAccess';
import { useHrConfirm, useHrFeedback } from '@/components/people/HrDialogs';
import { CriticalBadge, RoleBadge, StatusBadge } from './AccessBadges';

function groupKeys(keys: string[]) {
  const groups = new Map<string, string[]>();
  for (const key of keys) {
    const group = key.split('.')[0] || 'other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(key);
  }
  return Array.from(groups.entries());
}

export default function AccessAccountDrawer({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { data, isLoading, error, refetch } = useAccessAccount(userId);
  const { data: roles = [] } = useAccessRoles();
  const { data: catalog = [] } = useAccessPermissions();
  const assignRole = useAssignAccessRole();
  const suspend = useSuspendAccess();
  const revoke = useRevokeAccess();
  const restore = useRestoreAccess();
  const revokeSessions = useRevokeAccessSessions();
  const extend = useExtendAccess();
  const setOverride = useSetPermissionOverride();
  const removeOverride = useRemovePermissionOverride();
  const { notify, feedbackModal } = useHrFeedback();
  const { askConfirm, confirmModal } = useHrConfirm();
  const [roleKey, setRoleKey] = useState('');
  const [overrideKey, setOverrideKey] = useState('');
  const [overrideEffect, setOverrideEffect] = useState<'grant' | 'deny'>('grant');
  const [expiry, setExpiry] = useState('');

  const criticalKeys = useMemo(
    () => new Set(catalog.filter((p) => p.isCritical).map((p) => p.key)),
    [catalog],
  );

  const applyRole = async () => {
    if (!roleKey) return;
    try {
      await assignRole.mutateAsync({ userId, roleKey });
      notify('success', 'Role updated', 'The system role was changed.');
      await refetch();
    } catch (err: any) {
      notify('error', 'Role change failed', err?.message || 'Please try again.');
    }
  };

  const [reasonDraft, setReasonDraft] = useState('');
  const [pendingAction, setPendingAction] = useState<null | 'suspend' | 'revoke' | 'restore'>(null);

  const runPending = async () => {
    if (!pendingAction || !reasonDraft.trim()) return;
    try {
      if (pendingAction === 'suspend') {
        await suspend.mutateAsync({ userId, reason: reasonDraft.trim() });
      } else if (pendingAction === 'revoke') {
        await revoke.mutateAsync({ userId, reason: reasonDraft.trim() });
      } else {
        await restore.mutateAsync({ userId, reason: reasonDraft.trim() });
      }
      notify('success', 'Access updated', `Access ${pendingAction} completed.`);
      setPendingAction(null);
      setReasonDraft('');
      await refetch();
    } catch (err: any) {
      notify('error', 'Action failed', err?.message || 'Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Access profile
            </p>
            <h2 className="text-xl font-bold text-gray-900">
              {data?.identity.fullName || 'Loading…'}
            </h2>
            <p className="text-sm text-gray-500">{data?.identity.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
          {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
          {data && (
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Identity</h3>
                <div className="rounded-xl border bg-gray-50 p-3 text-sm">
                  <p>
                    Relationship:{' '}
                    <span className="capitalize">
                      {data.accessProfile?.accessRelationship || 'external'}
                    </span>
                  </p>
                  {data.staffProfile ? (
                    <>
                      <p>
                        Linked staff: {data.staffProfile.fullName} ·{' '}
                        {data.staffProfile.position?.name || 'No position'} ·{' '}
                        {data.staffProfile.department?.name || 'No department'}
                      </p>
                      <Link
                        href={`/people/directory/${data.staffProfile.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View HR Profile
                      </Link>
                    </>
                  ) : (
                    <p>Access relationship: External (no StaffProfile)</p>
                  )}
                  {data.accessProfile?.organisation && (
                    <p>Organisation: {data.accessProfile.organisation}</p>
                  )}
                  {data.accessProfile?.accessReason && (
                    <p>Reason: {data.accessProfile.accessReason}</p>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Access</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={data.accessProfile?.status} />
                  {data.roles.map((assignment: any) => (
                    <RoleBadge
                      key={assignment.id}
                      name={assignment.role.name}
                      isSuper={assignment.role.key === 'super_admin'}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Starts:{' '}
                  {data.accessProfile?.accessStartsAt
                    ? new Date(data.accessProfile.accessStartsAt).toLocaleString()
                    : '—'}{' '}
                  · Expires:{' '}
                  {data.accessProfile?.accessExpiresAt
                    ? new Date(data.accessProfile.accessExpiresAt).toLocaleString()
                    : 'Permanent'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border px-2 py-1.5 text-sm"
                    value={roleKey}
                    onChange={(e) => setRoleKey(e.target.value)}
                  >
                    <option value="">Change role…</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void applyRole()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
                  >
                    Apply role
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    className="rounded-lg border px-2 py-1.5 text-sm"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 text-sm"
                    onClick={async () => {
                      if (!expiry) return;
                      try {
                        await extend.mutateAsync({
                          userId,
                          accessExpiresAt: new Date(expiry).toISOString(),
                        });
                        notify('success', 'Access extended', 'Expiration updated.');
                        await refetch();
                      } catch (err: any) {
                        notify('error', 'Extend failed', err?.message || 'Please try again.');
                      }
                    }}
                  >
                    Extend / set expiry
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Effective permissions</h3>
                <p className="text-xs text-gray-500">
                  Priority: explicit deny → explicit grant → role → default deny
                </p>
                {data.effectivePermissions.isSuperAdmin ? (
                  <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                    Super Admin — full access (*)
                  </p>
                ) : (
                  <div className="space-y-3">
                    {groupKeys(data.effectivePermissions.permissions).map(([group, keys]) => (
                      <div key={group} className="rounded-lg border p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {group}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {keys.map((key) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                            >
                              {key}
                              {criticalKeys.has(key) && <CriticalBadge />}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {data.effectivePermissions.permissions.length === 0 && (
                      <p className="text-sm text-gray-500">No effective permissions.</p>
                    )}
                  </div>
                )}

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-medium">Permission override</p>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="min-w-[180px] flex-1 rounded-lg border px-2 py-1.5 text-sm"
                      value={overrideKey}
                      onChange={(e) => setOverrideKey(e.target.value)}
                    >
                      <option value="">Select permission…</option>
                      {catalog.map((p) => (
                        <option key={p.id} value={p.key}>
                          {p.key}
                          {p.isCritical ? ' (critical)' : ''}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border px-2 py-1.5 text-sm"
                      value={overrideEffect}
                      onChange={(e) => setOverrideEffect(e.target.value as 'grant' | 'deny')}
                    >
                      <option value="grant">Grant</option>
                      <option value="deny">Deny</option>
                    </select>
                    <button
                      type="button"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
                      onClick={() => {
                        if (!overrideKey) return;
                        const apply = async () => {
                          try {
                            await setOverride.mutateAsync({
                              userId,
                              permissionKey: overrideKey,
                              effect: overrideEffect,
                            });
                            notify('success', 'Override saved', `${overrideEffect} ${overrideKey}`);
                            await refetch();
                          } catch (err: any) {
                            notify('error', 'Override failed', err?.message || 'Please try again.');
                          }
                        };
                        if (criticalKeys.has(overrideKey) && overrideEffect === 'grant') {
                          askConfirm({
                            title: 'Assign critical permission?',
                            message:
                              'This permission allows the user to approve or control sensitive BuildMyHouse operations.',
                            confirmLabel: 'Grant critical permission',
                            danger: true,
                            onConfirm: apply,
                          });
                        } else {
                          void apply();
                        }
                      }}
                    >
                      Save override
                    </button>
                  </div>
                  {(data.overrides || []).length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs">
                      {data.overrides.map((o: any) => (
                        <li key={o.id} className="flex items-center justify-between gap-2">
                          <span>
                            {o.effect === 'deny' ? '−' : '+'} {o.permission.key}
                          </span>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={async () => {
                              try {
                                await removeOverride.mutateAsync({
                                  userId,
                                  permissionKey: o.permission.key,
                                  effect: o.effect,
                                });
                                await refetch();
                              } catch (err: any) {
                                notify('error', 'Remove failed', err?.message || 'Please try again.');
                              }
                            }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Security</h3>
                <div className="rounded-xl border p-3 text-sm text-gray-700">
                  <p>Login enabled: {data.security?.adminDashboardAccess ? 'Yes' : 'No'}</p>
                  <p>Force password reset: {data.security?.forcePasswordReset ? 'Yes' : 'No'}</p>
                  <p>
                    Last login:{' '}
                    {data.security?.lastLoginAt
                      ? new Date(String(data.security.lastLoginAt)).toLocaleString()
                      : '—'}
                  </p>
                  <p>
                    Last password change:{' '}
                    {data.security?.lastPasswordChangeAt
                      ? new Date(String(data.security.lastPasswordChangeAt)).toLocaleString()
                      : '—'}
                  </p>
                  <p>Failed logins: {String(data.security?.failedLoginCount ?? 0)}</p>
                  <p>Access version (sessions): {String(data.security?.adminAccessVersion ?? 0)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1.5 text-sm"
                  onClick={() =>
                    askConfirm({
                      title: 'Revoke all sessions?',
                      message:
                        'This invalidates existing JWTs for this admin. They must sign in again.',
                      confirmLabel: 'Revoke sessions',
                      danger: true,
                      onConfirm: async () => {
                        await revokeSessions.mutateAsync(userId);
                        notify('success', 'Sessions revoked', 'Existing tokens are no longer valid.');
                        await refetch();
                      },
                    })
                  }
                >
                  Revoke all active sessions
                </button>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Lifecycle</h3>
                {!pendingAction ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-orange-200 px-3 py-1.5 text-sm text-orange-700"
                      onClick={() => setPendingAction('suspend')}
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700"
                      onClick={() => setPendingAction('revoke')}
                    >
                      Revoke
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-green-200 px-3 py-1.5 text-sm text-green-700"
                      onClick={() => setPendingAction('restore')}
                    >
                      Restore
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border p-3">
                    <p className="text-sm font-medium capitalize">{pendingAction} access</p>
                    <textarea
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      rows={2}
                      placeholder="Reason (required)"
                      value={reasonDraft}
                      onChange={(e) => setReasonDraft(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border px-3 py-1.5 text-sm"
                        onClick={() => {
                          setPendingAction(null);
                          setReasonDraft('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
                        onClick={() => void runPending()}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
                <div className="divide-y rounded-xl border">
                  {(data.recentAudit || []).length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">No audit events yet.</p>
                  ) : (
                    data.recentAudit.map((entry: any) => (
                      <div key={entry.id} className="px-3 py-2 text-sm">
                        <p className="font-medium">{entry.action}</p>
                        <p className="text-xs text-gray-500">
                          {entry.summary || '—'} · {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
        {feedbackModal}
        {confirmModal}
      </aside>
    </div>
  );
}
