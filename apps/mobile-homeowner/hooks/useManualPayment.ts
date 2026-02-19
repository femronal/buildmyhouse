import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

/**
 * Homebuilding manual payment flow: homeowner declares they have paid
 */
export function useDeclareManualPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.declareManualPayment(projectId),
    onSuccess: (_, projectId) => {
      // Refresh project lists + specific project
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

