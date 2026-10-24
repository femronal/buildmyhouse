import { readReviewWidgetId } from './review-widgets';

describe('readReviewWidgetId', () => {
  it('accepts a plain widget id', () => {
    expect(readReviewWidgetId('abc123XYZ')).toBe('abc123XYZ');
  });

  it('rejects an id that could break the script url', () => {
    expect(readReviewWidgetId('abc"><script>')).toBeNull();
    expect(readReviewWidgetId('')).toBeNull();
    expect(readReviewWidgetId(null)).toBeNull();
  });
});
