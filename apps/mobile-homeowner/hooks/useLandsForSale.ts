import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LandForSaleImage {
  id: string;
  url: string;
  label?: string | null;
  order: number;
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
  images: LandForSaleImage[];
}

export function useLandsForSale() {
  return useQuery({
    queryKey: ['lands-for-sale'],
    queryFn: () => api.get<LandForSale[]>('/lands'),
  });
}

export function useLandForSale(id: string | null) {
  return useQuery({
    queryKey: ['land-for-sale', id],
    queryFn: () => api.get<LandForSale>(`/lands/${id}`),
    enabled: !!id,
  });
}
