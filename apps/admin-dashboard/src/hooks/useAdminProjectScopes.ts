import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AdminProjectScope = {
  id: string;
  name: string;
  description?: string | null;
  planType: 'homebuilding' | 'renovation' | 'interior_design';
  projectTypeTag?: 'repair' | 'upgrades' | 'renovation' | 'full_builds' | null;
  projectTypeFilter?: string | null;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  estimatedCost: number;
  floors?: number | null;
  estimatedDuration?: string | null;
  rooms?: string[] | null;
  materials?: string[] | null;
  features?: string[] | null;
  constructionPhases?: unknown;
  isActive: boolean;
  adminApprovalStatus: 'pending' | 'approved' | 'rejected';
  adminReviewReason?: string | null;
  createdAt: string;
  updatedAt: string;
  images: Array<{
    id: string;
    url: string;
    label?: string | null;
    order?: number | null;
  }>;
  createdBy?: {
    id: string;
    fullName?: string;
    email?: string;
  };
};

export function useAdminProjectScopes(contractorUserId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['admin-project-scopes', contractorUserId],
    queryFn: () =>
      api.get<AdminProjectScope[]>(`/designs/admin/contractor/${encodeURIComponent(contractorUserId || '')}`),
    enabled: enabled && !!contractorUserId,
  });
}

export function useAdminUpdateProjectScope(contractorUserId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scopeId, data }: { scopeId: string; data: Record<string, unknown> }) =>
      api.patch(`/designs/${scopeId}`, data),
    onSuccess: () => {
      if (contractorUserId) {
        queryClient.invalidateQueries({
          queryKey: ['admin-project-scopes', contractorUserId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
}

export function useAdminPublishProjectScope(contractorUserId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scopeId: string) => api.patch(`/designs/admin/${scopeId}/go-live`, {}),
    onSuccess: () => {
      if (contractorUserId) {
        queryClient.invalidateQueries({
          queryKey: ['admin-project-scopes', contractorUserId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
}

export function useAdminDeleteProjectScope(contractorUserId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scopeId: string) => api.delete(`/designs/${scopeId}`),
    onSuccess: () => {
      if (contractorUserId) {
        queryClient.invalidateQueries({
          queryKey: ['admin-project-scopes', contractorUserId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
}
