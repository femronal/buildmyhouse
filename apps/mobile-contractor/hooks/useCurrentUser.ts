import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  verified: boolean;
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


