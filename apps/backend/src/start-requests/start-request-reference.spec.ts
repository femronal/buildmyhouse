import { formatStartReference } from './start-request-reference';

describe('formatStartReference', () => {
  it('uses a path letter and four digits', () => {
    expect(formatStartReference('repair', 4821)).toBe('BMH-R-4821');
    expect(formatStartReference('upgrade', 7)).toBe('BMH-U-0007');
    expect(formatStartReference('build', 10000)).toBe('BMH-B-0000');
    expect(formatStartReference('interiors', 42)).toBe('BMH-I-0042');
  });
});
