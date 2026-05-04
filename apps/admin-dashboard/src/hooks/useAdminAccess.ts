import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AdminAccessAccount = {
  id: string;
  email: string;
  fullName: string | null;
  verified: boolean;
  adminDashboardAccess: boolean;
  hasDashboardAllowlistAccess: boolean;
  createdAt: string;
  updatedAt: string;
};

export const useAdminAccessAccounts = () =>
  useQuery({
    queryKey: ['admin-access-accounts'],
    queryFn: () => api.get<AdminAccessAccount[]>('/admin/access/full-admins'),
  });

export const useSetAdminDashboardAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adminUserId, enabled }: { adminUserId: string; enabled: boolean }) =>
      api.patch(`/admin/access/full-admins/${adminUserId}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-accounts'] });
    },
  });
};

export const useCreateAdminAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string; fullName: string }) =>
      api.post('/admin/access/full-admins', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-accounts'] });
    },
  });
};
