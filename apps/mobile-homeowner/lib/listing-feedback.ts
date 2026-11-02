export type ListingKind = 'professional' | 'vendor' | 'artisan';

export type ListingReviewSummary = {
  average: number | null;
  count: number;
};

export type PublicListingReview = {
  rating: number;
  title?: string | null;
  comment: string;
  label: string;
  reviewerName: string;
  dateLabel: string;
  publishedAt: string;
};

export function listingPublicPath(kind: ListingKind, slug: string) {
  const segment = kind === 'professional' ? 'professionals' : kind === 'vendor' ? 'vendors' : 'artisans';
  return `/${segment}/${slug}`;
}

export function listingReviewSummaryLine(summary?: ListingReviewSummary | null) {
  const count = Number(summary?.count || 0);
  if (!count || summary?.average == null) return 'New. No reviews yet.';
  const noun = count === 1 ? 'review' : 'reviews';
  return `${Number(summary.average).toFixed(1)} from ${count} ${noun}`;
}

export function listingReviewStatusLabel(status?: string | null) {
  if (status === 'approved') return 'Published';
  if (status === 'rejected') return 'Not published';
  return 'Pending review by BMH';
}

export const SCAM_REPORT_MIN_CHARS = 50;

export function scamReportSubmitBlock(input: { consent: boolean; whatHappened: string; phone: string }) {
  const story = input.whatHappened.trim();
  if (story.length < SCAM_REPORT_MIN_CHARS) {
    if (!story.length) return 'Write at least 50 characters about what happened.';
    return `${story.length} of ${SCAM_REPORT_MIN_CHARS} characters. Add a few more words about what happened.`;
  }
  if (!input.phone.trim()) return 'Add a phone number so BMH can contact you about this report.';
  if (input.consent !== true) return 'Please agree that BMH can contact you about this report.';
  return null;
}

export function canSubmitScamReport(input: { consent: boolean; whatHappened: string; phone: string }) {
  return scamReportSubmitBlock(input) === null;
}

export function buildListingReviewJsonLd(input: {
  type: 'LocalBusiness' | 'ProfessionalService';
  name: string;
  url: string;
  summary?: ListingReviewSummary | null;
  reviews?: PublicListingReview[];
}) {
  const count = Number(input.summary?.count || 0);
  if (count < 1 || input.summary?.average == null) return null;
  const reviews = (input.reviews || []).slice(0, 5).map((review) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: review.reviewerName },
    datePublished: review.publishedAt,
    reviewBody: review.comment,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
  }));
  return {
    '@type': input.type,
    name: input.name,
    url: input.url,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(input.summary.average).toFixed(1),
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews,
  };
}

export function listingNoticeFrom(profile: object | null | undefined): { text: string; date: string } | null {
  if (!profile || typeof profile !== 'object' || !('bmhNotice' in profile)) return null;
  const notice = (profile as { bmhNotice?: { text?: string; date?: string } | null }).bmhNotice;
  const text = String(notice?.text || '').trim();
  if (!text) return null;
  return { text, date: String(notice?.date || '') };
}
