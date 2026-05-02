import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PendingDesignDoc = {
  id: string;
  name: string;
  description?: string | null;
  planType?: 'homebuilding' | 'renovation' | 'interior_design';
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
  adminApprovalStatus: 'pending' | 'approved' | 'rejected';
  adminReviewReason?: string | null;
  createdAt: string;
  createdById: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  images: Array<{
    id: string;
    url: string;
    label?: string | null;
    order: number;
  }>;
};

export function usePendingProjectDocs() {
  return useQuery({
    queryKey: ['admin-pending-project-docs'],
    queryFn: () => api.get<PendingDesignDoc[]>('/designs/admin/pending'),
  });
}

export function useGoLiveDesignPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (designId: string) => api.patch(`/designs/admin/${designId}/go-live`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-project-docs'] });
    },
  });
}

export function useRejectDesignPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ designId, reason }: { designId: string; reason: string }) =>
      api.patch(`/designs/admin/${designId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-project-docs'] });
    },
  });
}

export type UpdateDesignPlanPayload = Partial<{
  name: string;
  description: string;
  planType: 'homebuilding' | 'renovation' | 'interior_design';
  projectTypeTag: 'repair' | 'upgrades' | 'renovation' | 'full_builds';
  projectTypeFilter: string | null;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  estimatedCost: number;
  floors: number | null;
  estimatedDuration: string | null;
  rooms: string;
  materials: string;
  features: string;
  constructionPhases: string;
}>;

export function useUpdateDesignPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ designId, data }: { designId: string; data: UpdateDesignPlanPayload }) =>
      api.patch(`/designs/${designId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-project-docs'] });
    },
  });
}
