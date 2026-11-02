'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ListingReviewStatus = 'pending' | 'approved' | 'rejected';

export type AdminListingReview = {
  id: string;
  status: ListingReviewStatus;
  listingKind: string;
  listingId: string;
  listingName: string;
  listingPath: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  title?: string | null;
  comment: string;
  label: string;
  createdAt: string;
};

export function useListingReviews(params: { status?: string; kind?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.kind) search.set('kind', params.kind);
  if (params.page) search.set('page', String(params.page));
  return useQuery({
    queryKey: ['admin-listing-reviews', search.toString()],
    queryFn: () => api.get<{ data: AdminListingReview[]; meta: { page: number; total: number } }>(`/admin/listing-reviews?${search.toString()}`),
  });
}

export function useFeedbackQueueCounts() {
  return useQuery({
    queryKey: ['admin-feedback-counts'],
    queryFn: () => api.get<{ pendingReviews: number; newReports: number }>('/admin/listing-reviews/counts'),
    retry: false,
  });
}

export function useReviewDecision() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      input.action === 'approve'
        ? api.patch(`/admin/listing-reviews/${input.id}/approve`, {})
        : api.patch(`/admin/listing-reviews/${input.id}/reject`, { reason: input.reason }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-listing-reviews'] });
      client.invalidateQueries({ queryKey: ['admin-feedback-counts'] });
    },
  });
}
