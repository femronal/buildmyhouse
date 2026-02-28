import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RentalImage {
  id?: string;
  url: string;
  label?: string;
  order?: number;
}

export interface RentalListing {
  id: string;
  title: string;
  description?: string | null;
  propertyType: string;
  location: string;
  annualRent: number;
  serviceCharge: number;
  cautionDeposit: number;
  legalFeePercent: number;
  agencyFeePercent: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  furnishing?: string | null;
  paymentPattern?: string | null;
  power?: string | null;
  water?: string | null;
  internet?: string | null;
  parking?: string | null;
  security?: string | null;
  rules?: string | null;
  inspectionWindow?: string | null;
  proximity: string[];
  verificationDocs: string[];
  isActive: boolean;
  createdAt: string;
  images: RentalImage[];
}

export interface CreateRentalPayload {
  title: string;
  description?: string;
  propertyType: string;
  location: string;
  annualRent: number;
  serviceCharge: number;
  cautionDeposit: number;
  legalFeePercent: number;
  agencyFeePercent?: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  furnishing?: string;
  paymentPattern?: string;
  power?: string;
  water?: string;
  internet?: string;
  parking?: string;
  security?: string;
  rules?: string;
  inspectionWindow?: string;
  proximity?: string[];
  verificationDocs?: string[];
  images: { url: string; label?: string; order?: number }[];
}

export function useRentals() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rentals', 'admin'],
    queryFn: () => api.get<RentalListing[]>('/rentals/admin/list'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateRentalPayload) =>
      api.post<RentalListing>('/rentals', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals', 'admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rentals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals', 'admin'] });
    },
  });

  return {
    rentals: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createRental: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteRental: deleteMutation.mutateAsync,
  };
}

