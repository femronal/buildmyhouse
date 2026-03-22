import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useUsers = (page: number = 1, limit: number = 20, filters?: { search?: string; role?: string; verified?: boolean }) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.role && { role: filters.role }),
    ...(filters?.verified !== undefined && { verified: filters.verified.toString() }),
  });

  return useQuery({
    queryKey: ['users', page, limit, filters],
    queryFn: () => api.get(`/users?${queryParams}`),
  });
};

export type UserDetail = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  pictureUrl?: string | null;
  role: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
  projects: number;
  lastActive: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status: string;
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<UserDetail>(`/users/${id}`),
    enabled: !!id,
  });
};

export const useVerifyUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}/verification`, { verified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['homeowners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contractors'] });
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
};

export const useSetUserVerified = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      try {
        return await api.patch(`/users/${userId}/verification`, { verified });
      } catch (error: any) {
        const message = String(error?.message || '');
        const endpointMissing =
          message.includes('Cannot PATCH') || message.includes('404');

        if (endpointMissing) {
          try {
            // Older backend compatibility: some builds expose PATCH /users/:id.
            return await api.patch(`/users/${userId}`, { verified });
          } catch {
            // Continue to next fallback below.
          }
        }

        if (endpointMissing && verified) {
          // GC-only fallback supported by older backend.
          return api.post(`/contractors/admin/${userId}/verify`, {});
        }

        if (endpointMissing && !verified) {
          throw new Error(
            'Unverify requires the latest backend version. Deploy backend updates and try again.',
          );
        }

        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['homeowners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contractors'] });
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/users/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};



