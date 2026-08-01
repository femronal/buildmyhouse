import { formatElapsed } from './useElapsedTimer';

describe('formatElapsed', () => {
  it('formats mm:ss without inventing an ETA', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(47)).toBe('00:47');
    expect(formatElapsed(125)).toBe('02:05');
    expect(formatElapsed(-3)).toBe('00:00');
  });
});
