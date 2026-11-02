import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildListingReviewJsonLd,
  canSubmitScamReport,
  listingReviewSummaryLine,
} from './listing-feedback.ts';

const reviews = [
  {
    rating: 5,
    comment: 'Clear quote and the repair was finished.',
    label: 'Community review',
    reviewerName: 'Ada O.',
    dateLabel: 'October 2026',
    publishedAt: '2026-10-02',
  },
  {
    rating: 4,
    comment: 'Came back to fix the leak.',
    label: 'Verified BMH job',
    reviewerName: 'Bola A.',
    dateLabel: 'September 2026',
    publishedAt: '2026-09-11',
  },
];

test('zero approved reviews stay new and carry no rating markup', () => {
  assert.equal(listingReviewSummaryLine({ average: null, count: 0 }), 'New. No reviews yet.');
  assert.equal(
    buildListingReviewJsonLd({
      type: 'ProfessionalService',
      name: 'Ada Law',
      url: 'https://buildmyhouse.app/professionals/ada-law',
      summary: { average: null, count: 0 },
      reviews: [],
    }),
    null,
  );
});

test('approved reviews publish the average and count', () => {
  assert.equal(listingReviewSummaryLine({ average: 4.3, count: 6 }), '4.3 from 6 reviews');
  const markup = buildListingReviewJsonLd({
    type: 'LocalBusiness',
    name: 'Acme Blocks',
    url: 'https://buildmyhouse.app/vendors/acme-blocks',
    summary: { average: 4.5, count: 2 },
    reviews,
  });
  assert.equal(markup?.aggregateRating.ratingValue, '4.5');
  assert.equal(markup?.aggregateRating.reviewCount, 2);
  assert.equal(markup?.review.length, 2);
  assert.equal(markup?.['@type'], 'LocalBusiness');
  assert.equal(JSON.stringify(markup).includes('scam'), false);
});

test('a scam report cannot be submitted without consent', () => {
  const ready = {
    whatHappened: 'I paid for materials and the person stopped answering after collecting the money.',
    phone: '08030000001',
  };
  assert.equal(canSubmitScamReport({ ...ready, consent: false }), false);
  assert.equal(canSubmitScamReport({ ...ready, consent: true }), true);
});
