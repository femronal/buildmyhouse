import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

/**
 * Get recommended GCs for a project
 */
export function useRecommendedGCs(projectId: string | null) {
  return useQuery({
    queryKey: ['projects', projectId, 'recommended-gcs'],
    queryFn: () => projectService.getRecommendedGCs(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Send requests to selected GCs
 */
export function useSendGCRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, contractorIds }: { projectId: string; contractorIds: string[] }) =>
      projectService.sendGCRequests(projectId, contractorIds),
    onSuccess: (_, variables) => {
      // Invalidate all project-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Specifically invalidate GC acceptance check for this project
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'gc-acceptance'] });
      console.log('🔄 [useSendGCRequests] Queries invalidated for project:', variables.projectId);
    },
  });
}

/**
 * Check GC acceptance status
 */
export function useCheckGCAcceptance(projectId: string | null, pollingInterval?: number) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['projects', projectId, 'gc-acceptance'],
    queryFn: () => projectService.checkGCAcceptance(projectId!),
    enabled: !!projectId,
    staleTime: 3000, // Consider data fresh for 3 seconds (shorter for faster updates)
    refetchInterval: (query) => {
      const hasAccepted = query.state.data?.hasAcceptedGC;
      
      // Stop polling if GC has already accepted
      if (hasAccepted) {
        // Invalidate analysis query to get updated data with GC edits
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'analysis'] });
        return false;
      }
      // Only poll if interval is provided and GC hasn't accepted yet
      return pollingInterval || false;
    },
    // Always refetch on window focus to catch updates
    refetchOnWindowFocus: true,
    // Always refetch on reconnect to catch updates
    refetchOnReconnect: true,
  });
}

/**
 * Activate project (start building)
 */
export function useActivateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.activateProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

