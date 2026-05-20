import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type StageChangeRequestRecord = {
  id: string;
  projectId: string;
  stageId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestTypes: string[];
  additionalAmount?: number | null;
  additionalDurationDays?: number | null;
  requestedSiteChange: boolean;
  siteChangeDetails?: string | null;
  reason: string;
  evidence?: Array<{ url: string; type: string; label?: string }>;
  adminReviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
  stage: {
    id: string;
    name: string;
    estimatedCost?: number;
    estimatedDuration?: string;
  };
  requestedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

export function useStageChangeRequests(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['stage-change-requests', status],
    queryFn: () =>
      api.get<StageChangeRequestRecord[]>(
        `/projects/stage-change-requests${status === 'all' ? '' : `?status=${status}`}`,
      ),
  });
}

export function useReviewStageChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      decision,
      adminReviewNote,
    }: {
      requestId: string;
      decision: 'approved' | 'rejected';
      adminReviewNote?: string;
    }) =>
      api.patch(`/projects/stage-change-requests/${requestId}/review`, {
        decision,
        adminReviewNote,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
