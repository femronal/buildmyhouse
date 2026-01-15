import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gcService, AcceptRequestData } from '../services/gcService';

export function usePendingRequests() {
  return useQuery({
    queryKey: ['pendingRequests'],
    queryFn: gcService.getPendingRequests,
    refetchInterval: 30000, // Refetch every 30 seconds
    // Don't refetch on window focus if we have data (reduces unnecessary calls)
    refetchOnWindowFocus: false,
    // Don't refetch on reconnect
    refetchOnReconnect: false,
  });
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: AcceptRequestData }) =>
      gcService.acceptRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['activeProjects'] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: string) => gcService.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    },
  });
}



