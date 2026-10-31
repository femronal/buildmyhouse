import { formatContractorRating } from '@buildmyhouse/shared-utils';

describe('formatContractorRating', () => {
  it('shows New when there are no reviews', () => {
    expect(formatContractorRating(5, 0)).toEqual({ isNew: true, label: 'New' });
  });

  it('shows one decimal and a plural review count', () => {
    expect(formatContractorRating(4.73, 3)).toEqual({
      isNew: false,
      label: '4.7',
      reviewsLabel: '3 reviews',
    });
  });

  it('uses the singular review label for one review', () => {
    expect(formatContractorRating(4.1, 1)).toEqual({
      isNew: false,
      label: '4.1',
      reviewsLabel: '1 review',
    });
  });
});
