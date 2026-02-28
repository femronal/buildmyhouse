import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useHomePurchases() {
  return useQuery({
    queryKey: ['home-purchases'],
    queryFn: () => api.get<any[]>('/houses/me/purchases'),
  });
}

export function useLandPurchases() {
  return useQuery({
    queryKey: ['land-purchases'],
    queryFn: () => api.get<any[]>('/lands/me/purchases'),
  });
}

export function useRentalPurchases() {
  return useQuery({
    queryKey: ['rental-purchases'],
    queryFn: () => api.get<any[]>('/rentals/me/purchases'),
  });
}
