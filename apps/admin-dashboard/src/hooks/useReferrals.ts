'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReferralProgramSettings, ReferralSummary, ReferrerListItem } from '@/lib/referrals';

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

export function useReferralSettings() {
  return useQuery({
    queryKey: ['admin-referral-settings'],
    queryFn: () => api.get<ReferralProgramSettings>('/admin/referrals/settings'),
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

export function usePartnerRules() {
  return useQuery({
    queryKey: ['admin-partner-rules'],
    queryFn: () => api.get<{
      rules: Array<Record<string, unknown>>;
      example: {
        contractorAmount: number;
        contingencyAmount: number;
        controllingFeeAmount: number;
        commission: number;
        bmhRetainedControllingFee: number;
        rateBps: number;
      };
    }>('/admin/referrals/rules'),
  });
}

export function usePartnerCommissions() {
  return useQuery({
    queryKey: ['admin-partner-commissions'],
    queryFn: () => api.get<import('@/lib/referrals').CommissionRow[]>('/admin/referrals/commissions'),
  });
}

export function usePartnerAttribution() {
  return useQuery({
    queryKey: ['admin-partner-attribution'],
    queryFn: () => api.get<{
      locks: Array<Record<string, any>>;
      clicks: Array<Record<string, any>>;
      conflicts: Array<Record<string, any>>;
    }>('/admin/referrals/attribution'),
  });
}

export type PartnerLibraryItem = {
  id: string;
  slug: string;
  title: string;
  audience: string;
  problem: string;
  promise: string;
  caption: string;
  kind: 'tool' | 'post' | 'video' | 'image';
  assetUrl: string | null;
  destinationPath: string;
  status: 'draft' | 'approved';
};

export function usePartnerLibrary() {
  return useQuery({
    queryKey: ['admin-partner-library'],
    queryFn: () => api.get<PartnerLibraryItem[]>('/admin/referrals/library'),
  });
}

export function usePartnerPerformance() {
  return useQuery({
    queryKey: ['admin-partner-performance'],
    queryFn: () => api.get<Record<string, number>>('/admin/referrals/performance'),
  });
}

export function useReferralMutations() {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['admin-referrals'] });
    await client.invalidateQueries({ queryKey: ['admin-referrals-summary'] });
    await client.invalidateQueries({ queryKey: ['admin-referral'] });
    await client.invalidateQueries({ queryKey: ['admin-referral-settings'] });
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
