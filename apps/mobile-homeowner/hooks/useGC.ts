import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gcService, AcceptRequestData } from '@/services/gcService';

/**
 * Get pending project requests for GC
 */
export function usePendingRequests() {
  return useQuery({
    queryKey: ['gc', 'pending-requests'],
    queryFn: () => gcService.getPendingRequests(),
  });
}

/**
 * Accept a project request
 */
export function useAcceptRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: AcceptRequestData }) =>
      gcService.acceptRequest(requestId, data),
    onSuccess: () => {
      // Invalidate pending requests to refresh the list
      queryClient.invalidateQueries({ queryKey: ['gc', 'pending-requests'] });
    },
  });
}

/**
 * Reject a project request
 */
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      gcService.rejectRequest(requestId, reason),
    onSuccess: () => {
      // Invalidate pending requests to refresh the list
      queryClient.invalidateQueries({ queryKey: ['gc', 'pending-requests'] });
    },
  });
}


