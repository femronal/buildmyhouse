import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });
}


