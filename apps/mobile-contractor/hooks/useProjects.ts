import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { requestService } from '@/services/requestService';

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

/**
 * Update stage status
 */
export function useUpdateStageStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, stageId, status }: { projectId: string; stageId: string; status: 'not_started' | 'in_progress' | 'completed' | 'blocked' }) =>
      projectService.updateStageStatus(projectId, stageId, status),
    onSuccess: (_, variables) => {
      // Invalidate project queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['gc-projects', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects', 'all'] });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-projects', 'unpaid'] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects', 'all'] });
    },
  });
}

