export function formatContractorRating(
  rating: number | null | undefined,
  reviews: number | null | undefined,
): { isNew: boolean; label: string; reviewsLabel?: string } {
  const count = Number(reviews || 0);
  if (!Number.isFinite(count) || count <= 0) {
    return { isNew: true, label: 'New' };
  }
  const value = Number(rating || 0);
  const rounded = Math.round(value * 10) / 10;
  return {
    isNew: false,
    label: rounded.toFixed(1),
    reviewsLabel: `${count} review${count === 1 ? '' : 's'}`,
  };
}
