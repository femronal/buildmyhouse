import { useMutation, useQuery } from '@tanstack/react-query';
import { planService, UploadPlanData } from '@/services/planService';

/**
 * Upload plan with AI processing
 */
export function useUploadPlan() {
  return useMutation({
    mutationFn: ({ planData, pdfFile }: { planData: UploadPlanData; pdfFile: any }) =>
      planService.uploadPlan(planData, pdfFile),
  });
}

/**
 * Get project AI analysis
 */
export function useProjectAnalysis(projectId: string | null) {
  return useQuery({
    queryKey: ['projects', projectId, 'analysis'],
    queryFn: () => planService.getProjectAnalysis(projectId!),
    enabled: !!projectId,
    retry: 3, // Retry 3 times if it fails
    retryDelay: 2000, // Wait 2 seconds between retries
    staleTime: 10000, // Consider data fresh for 10 seconds (allows refetch when GC accepts)
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling once we have aiAnalysis
      if (data?.aiAnalysis) {
        return false; // Stop polling - we have the analysis
      }
      // Only poll if we have a projectId and no analysis yet
      if (projectId && !data?.aiAnalysis) {
        return 5000; // Poll every 5 seconds
      }
      return false; // Default: stop polling
    },
    // Refetch on window focus to catch GC updates
    refetchOnWindowFocus: true,
    // Refetch on reconnect to catch GC updates
    refetchOnReconnect: true,
    // Always refetch on mount to get latest data
    refetchOnMount: true,
  });
}


