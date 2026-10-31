import {
  bayesianContractorRating,
  effectiveRatingForRanking,
  isFinishedBmhJob,
} from './contractor-rating-policy';

describe('contractor rating policy', () => {
  it('returns 0 when there are no stars', () => {
    expect(bayesianContractorRating([])).toBe(0);
  });

  it('pulls a single 5 toward 4.7', () => {
    expect(bayesianContractorRating([5])).toBe(4.7);
  });

  it('pulls three 1s toward 3.7 and stays inside 1 to 5', () => {
    const rating = bayesianContractorRating([1, 1, 1]);
    expect(rating).toBe(3.7);
    expect(rating).toBeGreaterThanOrEqual(1);
    expect(rating).toBeLessThanOrEqual(5);
  });

  it('ranks a contractor with no reviews at 4.7 and keeps a real rating', () => {
    expect(effectiveRatingForRanking(5, 0)).toBe(4.7);
    expect(effectiveRatingForRanking(3.9, 4)).toBe(3.9);
  });

  it('treats completed and fully progressed jobs as finished, and cancelled jobs as unfinished', () => {
    expect(isFinishedBmhJob({ status: 'completed', progress: 40 })).toBe(true);
    expect(isFinishedBmhJob({ status: 'active', progress: 100 })).toBe(true);
    expect(isFinishedBmhJob({ status: 'cancelled', progress: 100 })).toBe(false);
    expect(isFinishedBmhJob({ status: 'active', progress: 99 })).toBe(false);
  });
});
