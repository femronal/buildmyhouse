import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface HouseImage {
  id?: string;
  url: string;
  label?: string;
  order?: number;
}

export interface HouseForSale {
  id: string;
  name: string;
  description?: string | null;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  squareMeters?: number | null;
  propertyType?: string | null;
  yearBuilt?: number | null;
  condition?: string | null;
  parking?: number | null;
  documents: string[];
  amenities: string[];
  nearbyFacilities: string[];
  contactName?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAt: string;
  images: HouseImage[];
}

export interface CreateHousePayload {
  name: string;
  description?: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  squareMeters?: number;
  propertyType?: string;
  yearBuilt?: number;
  condition?: string;
  parking?: number;
  documents?: string[];
  amenities?: string[];
  nearbyFacilities?: string[];
  contactName?: string;
  contactPhone?: string;
  images: { url: string; label?: string; order?: number }[];
}

export function useHouses() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['houses', 'admin'],
    queryFn: () => api.get<HouseForSale[]>('/houses/admin/list'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateHousePayload) => api.post<HouseForSale>('/houses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', 'admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/houses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', 'admin'] });
    },
  });

  return {
    houses: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createHouse: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteHouse: deleteMutation.mutateAsync,
  };
}
