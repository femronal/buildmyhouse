import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type Homeowner = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  verified: boolean;
  projects: number;
  lastActive: string;
  location: string | null;
  status: 'active' | 'pending' | 'suspended';
};

type PaginatedResponse = {
  data: Homeowner[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
};

export const useHomeowners = (
  page: number = 1,
  limit: number = 20,
  filters?: { search?: string; status?: string }
) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    role: 'homeowner',
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && filters.status !== 'all' && { status: filters.status }),
  });

  return useQuery({
    queryKey: ['homeowners', page, limit, filters],
    queryFn: () => api.get<PaginatedResponse>(`/users?${queryParams}`),
  });
};
