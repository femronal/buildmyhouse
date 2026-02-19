import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type GCProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  pictureUrl?: string | null;
  verified: boolean;
  location?: string | null;
  specialty: string;
  experienceYears?: number | null;
  experience?: string | null;
  rating: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalEarnings: number;
  certifications?: Array<{ id: string; name: string; fileUrl: string; expiryYear?: string | null }>;
};

export function useGCProfile(userId: string | null) {
  return useQuery({
    queryKey: ['gc-profile', userId],
    queryFn: () => api.get<GCProfile>(`/contractors/admin/${userId}/profile`),
    enabled: !!userId,
  });
}
