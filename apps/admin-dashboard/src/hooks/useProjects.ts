import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useProjects = (
  page: number = 1, 
  limit: number = 20, 
  filters?: { 
    status?: string; 
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.status && filters.status !== 'all' && { status: filters.status }),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.sortBy && { sortBy: filters.sortBy }),
    ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
  });

  return useQuery({
    queryKey: ['projects', page, limit, filters],
    queryFn: () => api.get(`/projects?${queryParams}`),
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`),
    enabled: !!id,
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: string }) =>
      api.patch(`/projects/${projectId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};



