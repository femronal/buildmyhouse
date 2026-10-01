'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useArtisans(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    search.set(key, String(value));
  });
  return useQuery({
    queryKey: ['admin-artisans', search.toString()],
    queryFn: () => api.get(`/admin/artisans?${search.toString()}`),
  });
}

export function useArtisan(id: string) {
  return useQuery({
    queryKey: ['admin-artisan', id],
    queryFn: () => api.get(`/admin/artisans/${id}`),
    enabled: !!id,
  });
}

export function useCreateArtisan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/admin/artisans', body),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-artisans'] }),
  });
}

export function usePatchArtisan(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/artisans/${id}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-artisan', id] }),
  });
}
