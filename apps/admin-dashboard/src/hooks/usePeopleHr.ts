'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  HrAuditItem,
  HrCandidate,
  HrDashboard,
  HrDepartment,
  HrDocument,
  HrPolicy,
  HrPosition,
  HrRole,
  HrStaff,
} from '@/lib/people/types';

const keys = {
  dashboard: ['hr', 'dashboard'] as const,
  people: (q?: string) => ['hr', 'people', q || ''] as const,
  person: (id: string) => ['hr', 'people', id] as const,
  candidates: ['hr', 'candidates'] as const,
  candidate: (id: string) => ['hr', 'candidates', id] as const,
  departments: ['hr', 'departments'] as const,
  positions: ['hr', 'positions'] as const,
  roles: ['hr', 'roles'] as const,
  permissions: ['hr', 'permissions'] as const,
  documents: ['hr', 'documents'] as const,
  policies: ['hr', 'policies'] as const,
  communications: ['hr', 'communications'] as const,
  templates: ['hr', 'templates'] as const,
  audit: ['hr', 'audit'] as const,
  me: ['hr', 'me-permissions'] as const,
};

export function useHrDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => api.get<HrDashboard>('/admin/hr/dashboard'),
  });
}

export function useHrPeople(q?: string) {
  return useQuery({
    queryKey: keys.people(q),
    queryFn: () =>
      api.get<HrStaff[]>(`/admin/hr/people${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });
}

export function useHrPerson(id: string | null) {
  return useQuery({
    queryKey: keys.person(id || ''),
    queryFn: () => api.get<HrStaff>(`/admin/hr/people/${id}`),
    enabled: !!id,
  });
}

export function useHrCandidates() {
  return useQuery({
    queryKey: keys.candidates,
    queryFn: () => api.get<HrCandidate[]>('/admin/hr/candidates'),
  });
}

export function useHrCandidate(id: string | null) {
  return useQuery({
    queryKey: keys.candidate(id || ''),
    queryFn: () => api.get<HrCandidate>(`/admin/hr/candidates/${id}`),
    enabled: !!id,
  });
}

export function useHrDepartments() {
  return useQuery({
    queryKey: keys.departments,
    queryFn: () => api.get<HrDepartment[]>('/admin/hr/departments'),
  });
}

export function useHrPositions() {
  return useQuery({
    queryKey: keys.positions,
    queryFn: () => api.get<HrPosition[]>('/admin/hr/positions'),
  });
}

export function useHrRoles() {
  return useQuery({
    queryKey: keys.roles,
    queryFn: () => api.get<HrRole[]>('/admin/hr/roles'),
  });
}

export function useHrPermissionCatalog() {
  return useQuery({
    queryKey: keys.permissions,
    queryFn: () =>
      api.get<Array<{ id: string; key: string; groupLabel: string; description?: string }>>(
        '/admin/hr/permissions',
      ),
  });
}

export function useHrDocuments() {
  return useQuery({
    queryKey: keys.documents,
    queryFn: () => api.get<HrDocument[]>('/admin/hr/documents'),
  });
}

export function useHrPolicies() {
  return useQuery({
    queryKey: keys.policies,
    queryFn: () => api.get<HrPolicy[]>('/admin/hr/policies'),
  });
}

export function useHrCommunications() {
  return useQuery({
    queryKey: keys.communications,
    queryFn: () => api.get<any[]>('/admin/hr/communications'),
  });
}

export function useHrTemplates() {
  return useQuery({
    queryKey: keys.templates,
    queryFn: () =>
      api.get<Array<{ key: string; subject: string; bodyText: string }>>(
        '/admin/hr/communications/templates',
      ),
  });
}

export function useHrAudit() {
  return useQuery({
    queryKey: keys.audit,
    queryFn: () => api.get<HrAuditItem[]>('/admin/hr/audit-log?limit=100'),
  });
}

function useInvalidateHr() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['hr'] });
  };
}

export function useCreateCandidate() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<HrCandidate>('/admin/hr/candidates', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCandidate() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch<HrCandidate>(`/admin/hr/candidates/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useChangeCandidateStage() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: ({ id, stage, note }: { id: string; stage: string; note?: string }) =>
      api.patch<HrCandidate>(`/admin/hr/candidates/${id}/stage`, { stage, note }),
    onSuccess: invalidate,
  });
}

export function useHireCandidate() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.post<HrStaff>(`/admin/hr/candidates/${id}/hire`, payload),
    onSuccess: invalidate,
  });
}

export function useCreateStaff() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<HrStaff>('/admin/hr/people', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateStaff() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch<HrStaff>(`/admin/hr/people/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useOffboardStaff() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.post(`/admin/hr/people/${id}/offboard`, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateOnboardingTask() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: ({
      staffId,
      taskId,
      status,
    }: {
      staffId: string;
      taskId: string;
      status: string;
    }) => api.patch(`/admin/hr/people/${staffId}/onboarding/${taskId}`, { status }),
    onSuccess: invalidate,
  });
}

export function useCreateDepartment() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/hr/departments', payload),
    onSuccess: invalidate,
  });
}

export function useCreatePosition() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/hr/positions', payload),
    onSuccess: invalidate,
  });
}

export function useCreateDocument() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/hr/documents', payload),
    onSuccess: invalidate,
  });
}

export function useCreatePolicy() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/hr/policies', payload),
    onSuccess: invalidate,
  });
}

export function useSendHrCommunication() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/hr/communications/send', payload),
    onSuccess: invalidate,
  });
}

export function useUpsertHrRole() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/admin/hr/roles', payload),
    onSuccess: invalidate,
  });
}

export function useAssignStaffRole() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: ({ staffId, roleId }: { staffId: string; roleId: string }) =>
      api.post(`/admin/hr/people/${staffId}/roles`, { roleId }),
    onSuccess: invalidate,
  });
}

export function useCreatePerformanceGoal() {
  const invalidate = useInvalidateHr();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/admin/hr/performance', payload),
    onSuccess: invalidate,
  });
}
