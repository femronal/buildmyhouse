import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type DisputeStatus = 'open' | 'in_review' | 'resolved';

export interface DisputeItem {
  id: string;
  status: DisputeStatus;
  reasons: string[];
  otherReason?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  inReviewAt?: string | null;
  project: {
    id: string;
    name: string;
  };
  stage: {
    id: string;
    name: string;
  };
  homeowner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  generalContractor?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  } | null;
}

export function useDisputes(statusFilter: 'all' | DisputeStatus) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['disputes', statusFilter],
    queryFn: () =>
      api.get<DisputeItem[]>(
        statusFilter === 'all' ? '/projects/disputes' : `/projects/disputes?status=${statusFilter}`,
      ),
    refetchInterval: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      disputeId,
      status,
      resolutionNotes,
    }: {
      disputeId: string;
      status: DisputeStatus;
      resolutionNotes?: string;
    }) =>
      api.patch<DisputeItem>(`/projects/disputes/${disputeId}/status`, {
        status,
        resolutionNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });

  return {
    disputes: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateDisputeStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
