'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReferralSummary, ReferrerListItem } from '@/lib/referrals';

export function useReferralList(params: { type?: string; q?: string; includeArchived?: boolean }) {
  const search = new URLSearchParams();
  if (params.type) search.set('type', params.type);
  if (params.q) search.set('q', params.q);
  if (params.includeArchived) search.set('includeArchived', 'true');
  const query = search.toString();
  return useQuery({
    queryKey: ['admin-referrals', query],
    queryFn: () => api.get<ReferrerListItem[]>(`/admin/referrals${query ? `?${query}` : ''}`),
  });
}

export function useReferralSummary() {
  return useQuery({
    queryKey: ['admin-referrals-summary'],
    queryFn: () => api.get<ReferralSummary>('/admin/referrals/summary'),
  });
}

export function useReferral(id: string) {
  return useQuery({
    queryKey: ['admin-referral', id],
    queryFn: () => api.get<any>(`/admin/referrals/${id}`),
    enabled: !!id,
  });
}

export function useReferralMutations() {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['admin-referrals'] });
    await client.invalidateQueries({ queryKey: ['admin-referrals-summary'] });
    await client.invalidateQueries({ queryKey: ['admin-referral'] });
  };
  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) => api.post('/admin/referrals', body),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        api.patch(`/admin/referrals/${id}`, body),
      onSuccess: refresh,
    }),
    attach: useMutation({
      mutationFn: (body: { targetType: string; targetId: string; referrerId: string | null }) =>
        api.patch('/admin/referrals/attach', body),
      onSuccess: refresh,
    }),
  };
}
