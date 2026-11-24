import { BMH_POST_PLATFORMS, validPostUrl } from './bmh-post-platforms';

describe('BMH post platforms', () => {
  it('accepts an Instagram link only for Instagram, and only over https', () => {
    expect(validPostUrl('instagram', 'https://www.instagram.com/p/abc')).toBe(true);
    expect(validPostUrl('tiktok', 'https://www.instagram.com/p/abc')).toBe(false);
    expect(validPostUrl('instagram', 'http://www.instagram.com/p/abc')).toBe(false);
  });

  it('accepts each Google Business Profile host', () => {
    const google = BMH_POST_PLATFORMS.find((item) => item.key === 'google_business');
    for (const host of google?.hosts || []) {
      expect(validPostUrl('google_business', `https://${host}/place`)).toBe(true);
    }
    expect(validPostUrl('google_business', 'https://instagram.com/p/abc')).toBe(false);
  });
});
