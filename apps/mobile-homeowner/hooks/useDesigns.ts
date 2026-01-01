import { useQuery } from '@tanstack/react-query';
import { designService } from '@/services/designService';

/**
 * Get all designs for explore page
 */
export function useDesigns() {
  return useQuery({
    queryKey: ['designs'],
    queryFn: () => designService.getAllDesigns(),
  });
}

/**
 * Get a single design by ID
 */
export function useDesign(designId: string | null | undefined) {
  return useQuery({
    queryKey: ['designs', designId],
    queryFn: () => designService.getDesignById(designId!),
    enabled: !!designId,
  });
}

