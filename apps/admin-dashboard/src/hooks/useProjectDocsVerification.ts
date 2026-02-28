import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PendingDesignDoc = {
  id: string;
  name: string;
  description?: string | null;
  planType?: 'homebuilding' | 'renovation' | 'interior_design';
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  estimatedCost: number;
  floors?: number | null;
  estimatedDuration?: string | null;
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
