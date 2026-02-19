import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LandImage {
  id?: string;
  url: string;
  label?: string;
  order?: number;
}

export interface LandForSale {
  id: string;
  name: string;
  description?: string | null;
  location: string;
  price: number;
  sizeSqm: number;
  titleDocument?: string | null;
  zoningType?: string | null;
  topography?: string | null;
  roadAccess?: string | null;
  ownershipType?: string | null;
  documents: string[];
  nearbyLandmarks: string[];
  restrictions: string[];
  contactName?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAt: string;
  images: LandImage[];
}

export interface CreateLandPayload {
  name: string;
  description?: string;
  location: string;
  price: number;
  sizeSqm: number;
  titleDocument?: string;
  zoningType?: string;
  topography?: string;
  roadAccess?: string;
  ownershipType?: string;
  documents?: string[];
  nearbyLandmarks?: string[];
  restrictions?: string[];
  contactName?: string;
  contactPhone?: string;
  images: { url: string; label?: string; order?: number }[];
}

export function useLands() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['lands', 'admin'],
    queryFn: () => api.get<LandForSale[]>('/lands/admin/list'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateLandPayload) => api.post<LandForSale>('/lands', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands', 'admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/lands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands', 'admin'] });
    },
  });

  return {
    lands: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createLand: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteLand: deleteMutation.mutateAsync,
  };
}
