export const RATING_PRIOR_MEAN = 4.7;
export const RATING_PRIOR_WEIGHT = 8;

export function bayesianContractorRating(starValues: number[]): number {
  if (!starValues.length) return 0;
  const total = starValues.reduce((sum, value) => sum + value, 0);
  const weighted = (total + RATING_PRIOR_MEAN * RATING_PRIOR_WEIGHT) / (starValues.length + RATING_PRIOR_WEIGHT);
  const bounded = Math.max(1, Math.min(5, weighted));
  return Math.round(bounded * 10) / 10;
}

export function effectiveRatingForRanking(
  rating: number | null | undefined,
  reviews: number | null | undefined,
): number {
  if (!reviews) return RATING_PRIOR_MEAN;
  return typeof rating === 'number' && Number.isFinite(rating) ? rating : RATING_PRIOR_MEAN;
}

export function isFinishedBmhJob(project: { status?: string | null; progress?: number | null }): boolean {
  if (project.status === 'completed') return true;
  return Number(project.progress || 0) >= 100 && project.status !== 'cancelled';
}
