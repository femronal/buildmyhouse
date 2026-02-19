import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LandViewingInterestItem {
  id: string;
  isRead: boolean;
  createdAt: string;
  outcomeStatus: 'abandoned' | 'purchased';
  purchaseAmount?: number | null;
  purchaseMarkedAt?: string | null;
  landForSale: {
    id: string;
    name: string;
    location: string;
    price: number;
    sizeSqm: number;
    images: { url: string; label?: string | null }[];
  };
  homeowner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    pictureUrl?: string | null;
  };
}

interface LandViewingInterestResponse {
  unreadCount: number;
  items: LandViewingInterestItem[];
}

export function useLandViewingInterests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['land-viewing-interests'],
    queryFn: () => api.get<LandViewingInterestResponse>('/lands/admin/viewing-interests'),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.patch('/lands/admin/viewing-interests/read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-viewing-interests'] });
    },
  });

  const updateOutcomeMutation = useMutation({
    mutationFn: ({
      interestId,
      outcomeStatus,
    }: {
      interestId: string;
      outcomeStatus: 'abandoned' | 'purchased';
    }) =>
      api.patch(`/lands/admin/viewing-interests/${interestId}/outcome`, {
        outcomeStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-viewing-interests'] });
    },
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    interests: query.data?.items ?? [],
    markAllRead: markReadMutation.mutateAsync,
    updateOutcome: updateOutcomeMutation.mutateAsync,
    isUpdatingOutcome: updateOutcomeMutation.isPending,
  };
}
