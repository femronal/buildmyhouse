import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CmsResourceSection {
  id: string;
  key: string;
  label: string;
  hint: string;
  sortOrder: number;
  isActive: boolean;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UpsertResourceSectionPayload = {
  key: string;
  label: string;
  hint?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export function useResourceSections() {
  const queryClient = useQueryClient();
  const queryKey = ['cms-resource-sections', 'admin'];

  const query = useQuery({
    queryKey,
    queryFn: () => api.get<CmsResourceSection[]>('/resource-sections/admin/list'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: UpsertResourceSectionPayload) =>
      api.post<CmsResourceSection>('/resource-sections/admin', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertResourceSectionPayload }) =>
      api.patch<CmsResourceSection>(`/resource-sections/admin/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resource-sections/admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const activeSections = (query.data ?? []).filter((section) => section.isActive);

  return {
    sections: query.data ?? [],
    activeSections,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createSection: createMutation.mutateAsync,
    updateSection: updateMutation.mutateAsync,
    deleteSection: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
