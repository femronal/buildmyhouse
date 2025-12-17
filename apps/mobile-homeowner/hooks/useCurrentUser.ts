import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  fullName: string;
  pictureUrl?: string | null;
  role: string;
  verified: boolean;
  phone?: string | null;
  createdAt: string;
}

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return api.get('/auth/me');
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

