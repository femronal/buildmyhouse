import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface HouseForSaleImage {
  id: string;
  url: string;
  label?: string | null;
  order: number;
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
  images: HouseForSaleImage[];
}

export function useHousesForSale() {
  return useQuery({
    queryKey: ['houses-for-sale'],
    queryFn: () => api.get<HouseForSale[]>('/houses'),
  });
}

export function useHouseForSale(id: string | null) {
  return useQuery({
    queryKey: ['house-for-sale', id],
    queryFn: () => api.get<HouseForSale>(`/houses/${id}`),
    enabled: !!id,
  });
}
