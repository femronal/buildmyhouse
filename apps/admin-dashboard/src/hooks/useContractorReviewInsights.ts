import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ContractorReviewReasonCount = {
  reason: string;
  count: number;
};

export type ContractorReviewSpecialtyInsight = {
  category: string;
  label: string;
  totalReviews: number;
  averageRating: number;
  lowReasons: ContractorReviewReasonCount[];
  highReasons: ContractorReviewReasonCount[];
};

export type ContractorReviewInsightsResponse = {
  generatedAt: string;
  totalReviews: number;
  averageRating: number;
  specialties: ContractorReviewSpecialtyInsight[];
};

export function useContractorReviewInsights() {
  return useQuery({
    queryKey: ['admin-contractor-review-insights'],
    queryFn: () => api.get<ContractorReviewInsightsResponse>('/admin/contractor-review-insights'),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

