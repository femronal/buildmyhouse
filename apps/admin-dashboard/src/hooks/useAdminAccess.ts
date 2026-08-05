import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AccessStats = {
  total: number;
  active: number;
  limited: number;
  superAdmins: number;
  suspended: number;
  revoked: number;
  expiringSoon: number;
};

export type AccessAccountListItem = {
  id: string;
  email: string;
  fullName: string | null;
  verified: boolean;
  adminDashboardAccess: boolean;
  adminAccessVersion: number;
  forcePasswordReset: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  staffProfile: {
    id: string;
    fullName: string;
    employmentStatus: string;
    department: { id: string; name: string } | null;
    position: { id: string; name: string } | null;
  } | null;
  accessProfile: {
    id: string;
    status: string;
    accessRelationship: string;
    organisation: string | null;
    accessReason: string | null;
    accessStartsAt: string | null;
    accessExpiresAt: string | null;
    suspendedAt: string | null;
    suspendedUntil: string | null;
    revokedAt: string | null;
    roleAssignments: Array<{ role: { id: string; key: string; name: string } }>;
  } | null;
  roleKeys: string[];
  isSuperAdmin: boolean;
  accessAllowed: boolean;
  permissionCount: number | null;
};

export type AccessAccountDetail = {
  identity: {
    id: string;
    email: string;
    fullName: string;
    verified: boolean;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  staffProfile: any;
  accessProfile: any;
  roles: any[];
  overrides: any[];
  invitations: any[];
  effectivePermissions: {
    isSuperAdmin: boolean;
    permissions: string[];
    roleKeys: string[];
    rolePermissionKeys: string[];
    grantedOverrides: string[];
    deniedOverrides: string[];
    accessAllowed: boolean;
    accessStatus: string | null;
    accessBlockedReason: string | null;
  };
  security: Record<string, unknown>;
  recentAudit: any[];
};

export type AccessRole = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{ key: string; groupLabel: string; description: string | null; isCritical?: boolean }>;
  permissionKeys?: string[];
};

export type AccessPermission = {
  id: string;
  key: string;
  groupLabel: string;
  description: string | null;
  isCritical: boolean;
};

export type AccessAuditEntry = {
  id: string;
  action: string;
  summary: string | null;
  reason: string | null;
  createdAt: string;
  actor: { id: string; fullName: string; email: string } | null;
  target: { id: string; fullName: string; email: string } | null;
  previousValue?: unknown;
  newValue?: unknown;
};

export type AccessRequest = {
  id: string;
  permissionKey: string;
  businessReason: string;
  requestedDuration: string | null;
  status: string;
  decisionNotes: string | null;
  decidedAt: string | null;
  createdAt: string;
  requestingUser: { id: string; fullName: string; email: string };
  reviewer: { id: string; fullName: string; email: string } | null;
};

export type AccountFilters = {
  status?: string;
  roleKey?: string;
  q?: string;
  relationship?: string;
  /** Default false — revoked accounts are hidden unless explicitly requested. */
  includeRevoked?: boolean;
};

export type GrantAccessPayload = {
  mode: 'staff' | 'external';
  staffProfileId?: string;
  fullName?: string;
  email?: string;
  organisation?: string;
  accessRelationship: string;
  accessReason?: string;
  sponsorUserId?: string;
  roleKey: string;
  accessStartsAt?: string;
  accessExpiresAt?: string;
  temporaryDays?: number;
  sendInvite?: boolean;
  temporaryPassword?: string;
};

const invalidateAccess = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['admin-access'] });
};

export const useAccessStats = () =>
  useQuery({
    queryKey: ['admin-access', 'stats'],
    queryFn: () => api.get<AccessStats>('/admin/access/stats'),
  });

export const useAccessAccounts = (filters: AccountFilters = {}) =>
  useQuery({
    queryKey: ['admin-access', 'accounts', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.roleKey) params.set('roleKey', filters.roleKey);
      if (filters.q) params.set('q', filters.q);
      if (filters.relationship) params.set('relationship', filters.relationship);
      if (filters.includeRevoked) params.set('includeRevoked', 'true');
      const qs = params.toString();
      return api.get<AccessAccountListItem[]>(`/admin/access/accounts${qs ? `?${qs}` : ''}`);
    },
  });

export const useAccessAccount = (userId: string | null) =>
  useQuery({
    queryKey: ['admin-access', 'account', userId],
    queryFn: () => api.get<AccessAccountDetail>(`/admin/access/accounts/${userId}`),
    enabled: Boolean(userId),
  });

export const useAccessRoles = () =>
  useQuery({
    queryKey: ['admin-access', 'roles'],
    queryFn: () => api.get<AccessRole[]>('/admin/access/roles'),
  });

export const useAccessPermissions = () =>
  useQuery({
    queryKey: ['admin-access', 'permissions'],
    queryFn: () => api.get<AccessPermission[]>('/admin/access/permissions'),
  });

export const useAccessAudit = (params?: { targetUserId?: string; action?: string }) =>
  useQuery({
    queryKey: ['admin-access', 'audit', params],
    queryFn: () => {
      const search = new URLSearchParams();
      if (params?.targetUserId) search.set('targetUserId', params.targetUserId);
      if (params?.action) search.set('action', params.action);
      const qs = search.toString();
      return api.get<AccessAuditEntry[]>(`/admin/access/audit${qs ? `?${qs}` : ''}`);
    },
  });

export const useAccessRequests = (status?: string) =>
  useQuery({
    queryKey: ['admin-access', 'requests', status],
    queryFn: () =>
      api.get<AccessRequest[]>(
        `/admin/access/requests${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      ),
  });

export const useGrantAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GrantAccessPayload) => api.post('/admin/access/grant', payload),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useUpdateAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Record<string, unknown> }) =>
      api.patch(`/admin/access/accounts/${userId}`, payload),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useAssignAccessRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleKey }: { userId: string; roleKey: string }) =>
      api.post(`/admin/access/accounts/${userId}/assign-role`, { roleKey }),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useSuspendAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason, until }: { userId: string; reason: string; until?: string }) =>
      api.post(`/admin/access/accounts/${userId}/suspend`, { reason, until }),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useRevokeAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.post(`/admin/access/accounts/${userId}/revoke`, { reason }),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useRestoreAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.post(`/admin/access/accounts/${userId}/restore`, { reason }),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useRevokeAccessSessions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post(`/admin/access/accounts/${userId}/revoke-sessions`, {}),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useExtendAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, accessExpiresAt }: { userId: string; accessExpiresAt: string }) =>
      api.post(`/admin/access/accounts/${userId}/extend`, { accessExpiresAt }),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useSetPermissionOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permissionKey,
      effect,
      reason,
    }: {
      userId: string;
      permissionKey: string;
      effect: 'grant' | 'deny';
      reason?: string;
    }) => api.post(`/admin/access/accounts/${userId}/overrides`, { permissionKey, effect, reason }),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useRemovePermissionOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permissionKey,
      effect,
    }: {
      userId: string;
      permissionKey: string;
      effect: 'grant' | 'deny';
    }) =>
      api.post(`/admin/access/accounts/${userId}/overrides/remove`, {
        permissionKey,
        effect,
      }),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useUpsertAccessRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId?: string;
      payload: { key?: string; name: string; description?: string; permissionKeys: string[] };
    }) =>
      roleId
        ? api.patch(`/admin/access/roles/${roleId}`, payload)
        : api.post('/admin/access/roles', payload),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useCreateAccessRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      permissionKey: string;
      businessReason: string;
      requestedDuration?: string;
    }) => api.post('/admin/access/requests', payload),
    onSuccess: () => invalidateAccess(qc),
  });
};

export const useDecideAccessRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      notes,
    }: {
      id: string;
      decision: 'approved' | 'rejected';
      notes?: string;
    }) => api.post(`/admin/access/requests/${id}/decide`, { decision, notes }),
    onSuccess: () => invalidateAccess(qc),
  });
};

/** @deprecated Prefer useAccessAccounts — kept for transitional callers */
export type AdminAccessAccount = AccessAccountListItem & {
  hasDashboardAllowlistAccess?: boolean;
};

export const useAdminAccessAccounts = () =>
  useQuery({
    queryKey: ['admin-access-accounts'],
    queryFn: () => api.get<AdminAccessAccount[]>('/admin/access/full-admins'),
  });

export const useSetAdminDashboardAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ adminUserId, enabled }: { adminUserId: string; enabled: boolean }) =>
      api.patch(`/admin/access/full-admins/${adminUserId}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-accounts'] });
      invalidateAccess(queryClient);
    },
  });
};

export const useCreateAdminAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; fullName: string }) =>
      api.post('/admin/access/full-admins', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-accounts'] });
      invalidateAccess(queryClient);
    },
  });
};
