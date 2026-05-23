import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  pictureUrl?: string | null;
  phone?: string;
  role: string;
  verified: boolean;
  profileSetupCompleted?: boolean;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  homeownerTermsAcceptedAt?: string | null;
  gcTermsAcceptedAt?: string | null;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/me');
        return response;
      } catch (error: any) {
        console.error('Error fetching current user:', error);
        return null;
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}


