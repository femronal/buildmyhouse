import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designService } from '@/services/designService';

/**
 * Get GC's designs
 */
export function useMyDesigns() {
  return useQuery({
    queryKey: ['designs', 'my-designs'],
    queryFn: () => designService.getMyDesigns(),
  });
}

/**
 * Delete a design
 */
export function useDeleteDesign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (designId: string) => designService.deleteDesign(designId),
    onSuccess: () => {
      // Invalidate both GC's designs and public designs list
      queryClient.invalidateQueries({ queryKey: ['designs', 'my-designs'] });
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      // Force refetch to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: ['designs'] });
      queryClient.refetchQueries({ queryKey: ['designs', 'my-designs'] });
    },
    onError: (error: any) => {
      console.error('❌ [useDeleteDesign] Delete failed:', error);
    },
  });
}

/**
 * Update a design
 */
export function useUpdateDesign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ designId, updateData }: { designId: string; updateData: any }) =>
      designService.updateDesign(designId, updateData),
    onSuccess: () => {
      // Invalidate both GC's designs and public designs list
      queryClient.invalidateQueries({ queryKey: ['designs', 'my-designs'] });
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      // Force refetch to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: ['designs'] });
      queryClient.refetchQueries({ queryKey: ['designs', 'my-designs'] });
    },
  });
}

