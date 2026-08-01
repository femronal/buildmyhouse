import {
  canTransition,
  assertTransition,
  isTerminal,
  allowedTransitions,
  isReviewStatus,
} from './review-state-machine';

describe('review-state-machine', () => {
  it('allows open → assigned → in_review → corrected → resolved → closed', () => {
    expect(canTransition('open', 'assigned')).toBe(true);
    expect(canTransition('assigned', 'in_review')).toBe(true);
    expect(canTransition('in_review', 'corrected')).toBe(true);
    expect(canTransition('corrected', 'resolved')).toBe(true);
    expect(canTransition('resolved', 'closed')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('open', 'corrected')).toBe(false);
    expect(canTransition('closed', 'approved')).toBe(false);
    expect(canTransition('approved', 'rejected')).toBe(false);
    expect(() => assertTransition('open', 'corrected')).toThrow(/Invalid review transition/);
  });

  it('allows reopen from closed/resolved/approved/rejected', () => {
    expect(canTransition('closed', 'reopened')).toBe(true);
    expect(canTransition('resolved', 'reopened')).toBe(true);
    expect(canTransition('approved', 'reopened')).toBe(true);
    expect(canTransition('rejected', 'reopened')).toBe(true);
  });

  it('isTerminal only for closed', () => {
    expect(isTerminal('closed')).toBe(true);
    expect(isTerminal('resolved')).toBe(false);
  });

  it('assertTransition validates status names', () => {
    expect(() => assertTransition('nope', 'open')).toThrow(/Invalid review status/);
    expect(isReviewStatus('in_review')).toBe(true);
    expect(allowedTransitions('open')).toContain('assigned');
  });
});
