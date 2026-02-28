import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RentalListingImage {
  id: string;
  url: string;
  label?: string | null;
  order: number;
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
  images: RentalListingImage[];
}

export function useRentalsForLease() {
  return useQuery({
    queryKey: ['rentals-for-lease'],
    queryFn: () => api.get<RentalListing[]>('/rentals'),
  });
}

export function useRentalListing(id: string | null) {
  return useQuery({
    queryKey: ['rental-listing', id],
    queryFn: () => api.get<RentalListing>(`/rentals/${id}`),
    enabled: !!id,
  });
}

