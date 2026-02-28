import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RentalViewingInterestItem {
  id: string;
  isRead: boolean;
  createdAt: string;
  outcomeStatus: 'abandoned' | 'purchased';
  purchaseAmount?: number | null;
  purchaseMarkedAt?: string | null;
  rentalListing: {
    id: string;
    title: string;
    location: string;
    annualRent: number;
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

interface RentalViewingInterestResponse {
  unreadCount: number;
  items: RentalViewingInterestItem[];
}

export function useRentalViewingInterests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rental-viewing-interests'],
    queryFn: () => api.get<RentalViewingInterestResponse>('/rentals/admin/viewing-interests'),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.patch('/rentals/admin/viewing-interests/read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-viewing-interests'] });
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
      api.patch(`/rentals/admin/viewing-interests/${interestId}/outcome`, {
        outcomeStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-viewing-interests'] });
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

