import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

/**
 * Get all projects for the logged-in GC
 */
export function useMyProjects() {
  return useQuery({
    queryKey: ['gc-projects', 'all'],
    queryFn: projectService.getMyProjects,
  });
}

/**
 * Get active projects (paid projects with status 'active')
 */
export function useActiveProjects() {
  return useQuery({
    queryKey: ['gc-projects', 'active'],
    queryFn: projectService.getActiveProjects,
  });
}

/**
 * Get unpaid projects (projects that haven't been paid, status !== 'active')
 */
export function useUnpaidProjects() {
  return useQuery({
    queryKey: ['gc-projects', 'unpaid'],
    queryFn: projectService.getUnpaidProjects,
  });
}

/**
 * Get a single project by ID
 */
export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: ['gc-projects', projectId],
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,
  });
}

