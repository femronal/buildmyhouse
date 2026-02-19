import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type PaginatedResponse<T = any> = {
  data?: T[];
  pagination?: { total?: number };
};

type PaymentsResponse<T = any> = {
  data?: T[];
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Fetch dashboard stats - using actual backend endpoints
      const [users, projects, payments, materials] = await Promise.all([
        // TODO: Create these endpoints in backend
        api.get<PaginatedResponse>('/users?limit=1').catch(() => ({ pagination: { total: 0 } } as PaginatedResponse)),
        api
          .get<PaginatedResponse>('/projects?limit=1')
          .catch(() => ({ pagination: { total: 0 }, data: [] } as PaginatedResponse)),
        api.get<PaymentsResponse>('/payments/my').catch(() => ({ data: [] } as PaymentsResponse)),
        api
          .get<PaginatedResponse>('/marketplace/materials?limit=1')
          .catch(() => ({ pagination: { total: 0 } } as PaginatedResponse)),
      ]);

      return {
        users: { total: users.pagination?.total || 0, verified: 0, pending: 0 },
        projects: { 
          total: projects.pagination?.total || 0, 
          active: projects.data?.filter((p: any) => p.status === 'active').length || 0,
          completed: projects.data?.filter((p: any) => p.status === 'completed').length || 0
        },
        payments: { 
          total: payments.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
          pending: payments.data?.filter((p: any) => p.status === 'pending').length || 0,
          completed: payments.data?.filter((p: any) => p.status === 'completed').length || 0
        },
        materials: { total: materials.pagination?.total || 0 },
      };
    },
  });
};



