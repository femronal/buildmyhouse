'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const LISTING_STATUS_LABELS = {
  draft: 'Draft',
  listed: 'Listed',
  hidden: 'Hidden',
  archived: 'Archived',
} as const;

export const VERIFICATION_STATUS_LABELS = {
  unverified: 'Unverified',
  pending: 'Pending',
  verified: 'Credential checked',
  rejected: 'Rejected',
  expired: 'Expired',
} as const;

export const PROCUREMENT_STATUS_LABELS = {
  not_assessed: 'Not assessed',
  reviewing: 'Reviewing',
  ready: 'Ready',
  hold: 'Hold',
  blocked: 'Blocked',
} as const;

export const OWNERSHIP_STATUS_LABELS = {
  unclaimed: 'Unclaimed',
  claim_pending: 'Claim pending',
  claimed: 'Claimed',
} as const;

export type ProfessionalSearchParams = {
  query?: string;
  listingStatus?: string;
  verificationStatus?: string;
  procurementStatus?: string;
  ownershipStatus?: string;
  profession?: string;
  state?: string;
  usedByBmh?: boolean;
  incomplete?: boolean;
  page?: number;
  limit?: number;
};

export type ProfessionalListItem = {
  id: string;
  slug: string;
  displayName: string;
  professionalType: 'individual' | 'firm';
  profession: { id: string; key: string; label: string; regulatorLabel?: string | null } | null;
  city: string | null;
  state: string | null;
  listingStatus: keyof typeof LISTING_STATUS_LABELS;
  ownershipStatus: keyof typeof OWNERSHIP_STATUS_LABELS;
  verificationStatus: keyof typeof VERIFICATION_STATUS_LABELS;
  procurementStatus: keyof typeof PROCUREMENT_STATUS_LABELS;
  usedByBmh: boolean;
  completenessScore: number;
  phone: string | null;
  email: string | null;
  updatedAt: string;
};

export function useProfessionals(params: ProfessionalSearchParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === false) return;
    search.set(key, String(value));
  });
  return useQuery({
    queryKey: ['admin-professionals', params],
    queryFn: () =>
      api.get<{
        data: ProfessionalListItem[];
        meta: { page: number; limit: number; total: number; totalPages: number };
        counts: Record<string, number>;
      }>(`/admin/professionals?${search.toString()}`),
  });
}

export function useProfessionalMeta() {
  return useQuery({
    queryKey: ['admin-professionals-meta'],
    queryFn: () => api.get<any>('/admin/professionals/meta'),
  });
}

export function useProfessional(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-professional', id],
    enabled: !!id,
    queryFn: () => api.get<any>(`/admin/professionals/${id}`),
  });
}

export function useCreateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<any>('/admin/professionals', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-professionals'] }),
  });
}

export function useUpdateProfessional(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<any>(`/admin/professionals/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-professionals'] });
      qc.invalidateQueries({ queryKey: ['admin-professional', id] });
    },
  });
}

export function useProfessionalAction(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-professionals'] });
    qc.invalidateQueries({ queryKey: ['admin-professional', id] });
  };
  return {
    setListingStatus: useMutation({
      mutationFn: (listingStatus: string) =>
        api.patch(`/admin/professionals/${id}/listing-status`, { listingStatus }),
      onSuccess: invalidate,
    }),
    setVerification: useMutation({
      mutationFn: (body: { verificationStatus: string; note?: string }) =>
        api.patch(`/admin/professionals/${id}/verification`, body),
      onSuccess: invalidate,
    }),
    saveProcurement: useMutation({
      mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/professionals/${id}/procurement`, body),
      onSuccess: invalidate,
    }),
    addCredential: useMutation({
      mutationFn: (body: Record<string, unknown>) => api.post(`/admin/professionals/${id}/credentials`, body),
      onSuccess: invalidate,
    }),
    updateCredential: useMutation({
      mutationFn: ({ credentialId, ...body }: Record<string, unknown> & { credentialId: string }) =>
        api.patch(`/admin/professionals/credentials/${credentialId}`, body),
      onSuccess: invalidate,
    }),
    addDocument: useMutation({
      mutationFn: ({ credentialId, ...body }: Record<string, unknown> & { credentialId: string }) =>
        api.post(`/admin/professionals/credentials/${credentialId}/documents`, body),
      onSuccess: invalidate,
    }),
    createEngagement: useMutation({
      mutationFn: (body: Record<string, unknown>) => api.post(`/admin/professionals/${id}/engagements`, body),
      onSuccess: invalidate,
    }),
    updateEngagement: useMutation({
      mutationFn: ({ engagementId, ...body }: Record<string, unknown> & { engagementId: string }) =>
        api.patch(`/admin/professionals/engagements/${engagementId}`, body),
      onSuccess: invalidate,
    }),
  };
}

export function useProfessionalInbox() {
  return {
    applications: useQuery({
      queryKey: ['admin-professional-applications'],
      queryFn: () => api.get<any[]>('/admin/professionals/applications'),
    }),
    claims: useQuery({
      queryKey: ['admin-professional-claims'],
      queryFn: () => api.get<any[]>('/admin/professionals/claims'),
    }),
    enquiries: useQuery({
      queryKey: ['admin-professional-enquiries'],
      queryFn: () => api.get<any[]>('/admin/professionals/enquiries'),
    }),
    reviewApplication: useMutation({
      mutationFn: ({ id, ...body }: { id: string; status: string; adminNotes?: string; createListing?: boolean }) =>
        api.patch(`/admin/professionals/applications/${id}`, body),
    }),
    reviewClaim: useMutation({
      mutationFn: ({ id, ...body }: { id: string; status: string; adminNotes?: string }) =>
        api.patch(`/admin/professionals/claims/${id}`, body),
    }),
  };
}
