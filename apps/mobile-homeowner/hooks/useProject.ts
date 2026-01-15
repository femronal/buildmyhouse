import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
    // Refetch when window/app comes into focus to catch GC updates
    refetchOnWindowFocus: true,
    // Refetch on mount to ensure fresh data
    refetchOnMount: true,
    // Consider data stale after 30 seconds to allow refetching
    staleTime: 30000,
  });
}



