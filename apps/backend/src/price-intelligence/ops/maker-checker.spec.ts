import { evaluateMakerChecker, assertMakerChecker } from './maker-checker';

describe('maker-checker', () => {
  it('allows different reviewer', () => {
    expect(
      evaluateMakerChecker({
        creatorAdminId: 'a',
        reviewerAdminId: 'b',
        reviewerPermissions: ['REVIEW', 'ENTRY'],
      }).allowed,
    ).toBe(true);
  });

  it('blocks self-approval without SUPER_ADMIN', () => {
    const r = evaluateMakerChecker({
      creatorAdminId: 'a',
      reviewerAdminId: 'a',
      reviewerPermissions: ['REVIEW', 'ENTRY'],
    });
    expect(r.allowed).toBe(false);
    expect(() =>
      assertMakerChecker({
        creatorAdminId: 'a',
        reviewerAdminId: 'a',
        reviewerPermissions: ['REVIEW'],
      }),
    ).toThrow(/maker-checker/i);
  });

  it('allows SUPER_ADMIN self-approval', () => {
    expect(
      evaluateMakerChecker({
        creatorAdminId: 'a',
        reviewerAdminId: 'a',
        reviewerPermissions: ['SUPER_ADMIN'],
      }).allowed,
    ).toBe(true);
  });

  it('empty permissions = all, so self-approval allowed (backward compatible)', () => {
    expect(
      evaluateMakerChecker({
        creatorAdminId: 'a',
        reviewerAdminId: 'a',
        reviewerPermissions: [],
      }).allowed,
    ).toBe(true);
  });
});
