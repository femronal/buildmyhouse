import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
export function useDesignCatalog(params: {
  tab: string;
  q?: string;
  location?: string;
  tag?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['designs', 'catalog', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      designService.listCatalog({
        page: pageParam,
        limit: 16,
        tab: params.tab,
        q: params.q,
        location: params.location,
        tag: params.tag,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export function useDesign(designId: string | null | undefined) {
  return useQuery({
    queryKey: ['designs', designId],
    queryFn: () => designService.getDesignById(designId!),
    enabled: !!designId,
  });
}

