import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ListingKind, ListingReviewSummary, PublicListingReview } from '@/lib/listing-feedback';

export type PublicListingReviews = {
  reviews: PublicListingReview[];
  summary: ListingReviewSummary;
  page: number;
};

export function usePublicListingReviews(kind: ListingKind, slug: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['listing-reviews', kind, slug, page],
    enabled: enabled && !!slug && slug !== '__missing__',
    queryFn: () => api.get(`/listing-feedback/${kind}/${encodeURIComponent(slug)}/reviews?page=${page}`) as Promise<PublicListingReviews>,
  });
}

export type MyListingReview = {
  rating: number;
  title?: string | null;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  label: string;
} | null;

export function useMyListingReview(kind: ListingKind, slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ['my-listing-review', kind, slug],
    enabled,
    queryFn: () => api.get(`/listing-feedback/${kind}/${encodeURIComponent(slug)}/my-review`) as Promise<MyListingReview>,
  });
}
