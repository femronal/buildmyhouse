import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService, SearchParams } from '@/services/marketplaceService';

export function useMaterials(params: SearchParams = {}) {
  return useQuery({
    queryKey: ['materials', params],
    queryFn: () => marketplaceService.getMaterials(params),
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ['material', id],
    queryFn: () => marketplaceService.getMaterial(id),
    enabled: !!id,
  });
}

export function useContractors(params: SearchParams = {}) {
  return useQuery({
    queryKey: ['contractors', params],
    queryFn: () => marketplaceService.getContractors(params),
  });
}

export function useContractor(id: string) {
  return useQuery({
    queryKey: ['contractor', id],
    queryFn: () => marketplaceService.getContractor(id),
    enabled: !!id,
  });
}

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => marketplaceService.search(params),
    enabled: !!params.query && params.query.length > 0,
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => marketplaceService.getSearchSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 60000, // 1 minute
  });
}

export function usePopularItems() {
  return useQuery({
    queryKey: ['popular-items'],
    queryFn: () => marketplaceService.getPopularItems(),
    staleTime: 300000, // 5 minutes
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      materialId?: string;
      contractorId?: string;
      rating: number;
      comment?: string;
    }) => marketplaceService.createReview(data),
    onSuccess: (_, variables) => {
      if (variables.materialId) {
        queryClient.invalidateQueries({ queryKey: ['material', variables.materialId] });
        queryClient.invalidateQueries({ queryKey: ['material-reviews', variables.materialId] });
      }
      if (variables.contractorId) {
        queryClient.invalidateQueries({ queryKey: ['contractor', variables.contractorId] });
        queryClient.invalidateQueries({ queryKey: ['contractor-reviews', variables.contractorId] });
      }
    },
  });
}

export function useMaterialReviews(materialId: string, page: number = 1) {
  return useQuery({
    queryKey: ['material-reviews', materialId, page],
    queryFn: () => marketplaceService.getMaterialReviews(materialId, page),
    enabled: !!materialId,
  });
}

export function useContractorReviews(contractorId: string, page: number = 1) {
  return useQuery({
    queryKey: ['contractor-reviews', contractorId, page],
    queryFn: () => marketplaceService.getContractorReviews(contractorId, page),
    enabled: !!contractorId,
  });
}
