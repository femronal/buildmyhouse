import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, CreateProjectData } from '@/services/projectService';
import { Project } from '@buildmyhouse/shared-types';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectService.createProject(data),
    onSuccess: (newProject: Project) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Optionally add the new project to cache
      queryClient.setQueryData(['projects', newProject.id], newProject);
    },
  });
}




