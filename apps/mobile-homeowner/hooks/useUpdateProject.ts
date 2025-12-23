import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, UpdateProjectData } from '@/services/projectService';
import { Project } from '@buildmyhouse/shared-types';

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectService.updateProject(id, data),
    onSuccess: (updatedProject: Project) => {
      // Update the specific project in cache
      queryClient.setQueryData(['projects', updatedProject.id], updatedProject);
      // Invalidate projects list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}


