import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface HouseViewingInterestItem {
  id: string;
  isRead: boolean;
  createdAt: string;
  outcomeStatus: 'abandoned' | 'purchased';
  purchaseAmount?: number | null;
  purchaseMarkedAt?: string | null;
  houseForSale: {
    id: string;
    name: string;
    location: string;
    price: number;
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

interface HouseViewingInterestResponse {
  unreadCount: number;
  items: HouseViewingInterestItem[];
}

export function useHouseViewingInterests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['house-viewing-interests'],
    queryFn: () =>
      api.get<HouseViewingInterestResponse>('/houses/admin/viewing-interests'),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.patch('/houses/admin/viewing-interests/read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-viewing-interests'] });
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
      api.patch(`/houses/admin/viewing-interests/${interestId}/outcome`, {
        outcomeStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-viewing-interests'] });
    },
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    interests: query.data?.items ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    markAllRead: markReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    updateOutcome: updateOutcomeMutation.mutateAsync,
    isUpdatingOutcome: updateOutcomeMutation.isPending,
  };
}
