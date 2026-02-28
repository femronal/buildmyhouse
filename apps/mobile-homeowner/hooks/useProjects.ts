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
    staleTime: 2000, // Consider data fresh for 2 seconds (shorter for faster updates)
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasAccepted = data?.hasAcceptedGC && (data.acceptedRequestsCount > 0 || false);
      const hasPending = data?.hasPendingRequest || false;
      
      // Stop polling if GC has actually accepted (with confirmed accepted request)
      if (hasAccepted) {
        // Invalidate analysis query to get updated data with GC edits
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'analysis'] });
        return false;
      }
      
      // Continue polling if there's a pending request or if we're waiting for a response
      // Only poll if interval is provided and we haven't accepted yet
      if (pollingInterval && (hasPending || !data)) {
        return pollingInterval;
      }
      
      return false;
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
    onSuccess: (_, projectId) => {
      // Invalidate all project-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

/**
 * Save project for later (pending payment)
 */
export function useSaveProjectForLater() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, projectData }: { projectId: string; projectData: any }) =>
      projectService.saveProjectForLater(projectId, projectData),
    onSuccess: (_, variables) => {
      // Invalidate all project-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
    },
  });
}

/**
 * Get pending projects
 */
export function usePendingProjects() {
  return useQuery({
    queryKey: ['projects', 'pending'],
    queryFn: () => projectService.getPendingProjects(),
    // Refetch when window/app comes into focus to catch updates
    refetchOnWindowFocus: true,
    // Refetch on mount to ensure fresh data
    refetchOnMount: true,
    // Consider data stale after 30 seconds to allow refetching
    staleTime: 30000,
  });
}

/**
 * Get paused projects (paused by admin)
 */
export function usePausedProjects() {
  return useQuery({
    queryKey: ['projects', 'paused'],
    queryFn: () => projectService.getPausedProjects(),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000,
  });
}

/**
 * Get active projects
 */
export function useActiveProjects() {
  return useQuery({
    queryKey: ['projects', 'active'],
    queryFn: () => projectService.getActiveProjects(),
    // Refetch when window/app comes into focus to catch GC updates
    refetchOnWindowFocus: true,
    // Refetch on mount to ensure fresh data
    refetchOnMount: true,
    // Consider data stale after 30 seconds to allow refetching
    staleTime: 30000,
  });
}

/**
 * Get homeowner invoice/receipt files uploaded by GC
 */
export function useMyInvoiceFiles() {
  return useQuery({
    queryKey: ['projects', 'my-invoice-files'],
    queryFn: () => projectService.getMyInvoiceFiles(),
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Delete pending project
 */
export function useDeletePendingProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.deletePendingProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
    },
  });
}

/**
 * Create project from design and send request to GC
 */
export function useCreateProjectFromDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      designId: string;
      address: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    }) => projectService.createProjectFromDesign(data),
    onSuccess: (project) => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', project.id, 'gc-acceptance'] });
    },
  });
}
