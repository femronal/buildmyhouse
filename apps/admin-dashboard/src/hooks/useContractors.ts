import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ContractorListItem = {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  location?: string | null;
  experienceYears?: number | null;
  rating: number;
  projects: number;
  verified: boolean;
  imageUrl?: string | null;
  pictureUrl?: string | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    pictureUrl?: string | null;
  };
};

export function useContractors() {
  return useQuery({
    queryKey: ['admin-contractors'],
    queryFn: () => api.get<ContractorListItem[]>('/contractors/admin/list'),
  });
}
