import {
  observationFingerprint,
  parseInclusionState,
  planObservationIngest,
  isLegalStatusTransition,
  ExistingObservationSummary,
} from './observations';

describe('parseInclusionState (tri-state inclusions)', () => {
  it('accepts the four explicit states', () => {
    expect(parseInclusionState('included')).toBe('included');
    expect(parseInclusionState('excluded')).toBe('excluded');
    expect(parseInclusionState('unknown')).toBe('unknown');
    expect(parseInclusionState('not_applicable')).toBe('not_applicable');
  });

  it('a missing value NEVER silently means excluded', () => {
    expect(parseInclusionState(undefined)).toBe('unknown');
    expect(parseInclusionState(null)).toBe('unknown');
    expect(parseInclusionState('')).toBe('unknown');
    expect(parseInclusionState('garbage')).toBe('unknown');
  });

  it('maps explicit legacy booleans only', () => {
    expect(parseInclusionState(true)).toBe('included');
    expect(parseInclusionState(false)).toBe('excluded');
  });
});

describe('observationFingerprint', () => {
  const base = {
    familyKey: 'cement',
    sourceCode: 'jiji-ng',
    sellerName: 'BuildMart Ltd',
    originalWording: 'Dangote 3X Cement 42.5R — ₦9,500 per bag',
    originalPrice: '9500.00',
    originalUnitCode: 'bag_50kg',
    listingDate: '2026-07-20',
  };

  it('is deterministic for identical evidence', () => {
    expect(observationFingerprint(base)).toBe(observationFingerprint({ ...base }));
  });

  it('normalises whitespace and case, so cosmetic differences match', () => {
    expect(
      observationFingerprint({ ...base, sellerName: '  buildmart   LTD ' }),
    ).toBe(observationFingerprint(base));
  });

  it('differs when the price differs', () => {
    expect(observationFingerprint({ ...base, originalPrice: '9600.00' })).not.toBe(
      observationFingerprint(base),
    );
  });

  it('differs when the seller wording differs', () => {
    expect(
      observationFingerprint({ ...base, originalWording: 'BUA Cement 42.5' }),
    ).not.toBe(observationFingerprint(base));
  });
});

describe('planObservationIngest (append-only lifecycle)', () => {
  const existingActive: ExistingObservationSummary = {
    id: 'obs-1',
    status: 'active',
    duplicateFingerprint: 'fp-1',
    sellerId: 'seller-1',
    sourceId: 'source-1',
    familyId: 'family-1',
    normalizedUnitCode: 'bag_50kg',
    checkedDate: new Date('2026-07-01'),
  };

  it('marks an identical fingerprint as duplicate of the original', () => {
    const action = planObservationIngest(
      {
        duplicateFingerprint: 'fp-1',
        sellerId: 'seller-1',
        sourceId: 'source-1',
        familyId: 'family-1',
        normalizedUnitCode: 'bag_50kg',
        checkedDate: new Date('2026-07-15'),
      },
      [existingActive],
    );
    expect(action).toEqual({ kind: 'reject_duplicate', duplicateOfObservationId: 'obs-1' });
  });

  it('supersedes prior ACTIVE same-seller rows instead of deleting them', () => {
    const action = planObservationIngest(
      {
        duplicateFingerprint: 'fp-2',
        sellerId: 'seller-1',
        sourceId: 'source-1',
        familyId: 'family-1',
        normalizedUnitCode: 'bag_50kg',
        checkedDate: new Date('2026-07-15'),
      },
      [existingActive],
    );
    expect(action).toEqual({ kind: 'insert_and_supersede', supersedeObservationIds: ['obs-1'] });
  });

  it('does not supersede rows from a different seller', () => {
    const action = planObservationIngest(
      {
        duplicateFingerprint: 'fp-2',
        sellerId: 'seller-OTHER',
        sourceId: 'source-1',
        familyId: 'family-1',
        normalizedUnitCode: 'bag_50kg',
        checkedDate: new Date('2026-07-15'),
      },
      [existingActive],
    );
    expect(action).toEqual({ kind: 'insert' });
  });

  it('does not supersede when the seller is unknown (anonymous listings coexist)', () => {
    const anonymous = { ...existingActive, id: 'obs-2', sellerId: null };
    const action = planObservationIngest(
      {
        duplicateFingerprint: 'fp-3',
        sellerId: null,
        sourceId: 'source-1',
        familyId: 'family-1',
        normalizedUnitCode: 'bag_50kg',
        checkedDate: new Date('2026-07-15'),
      },
      [anonymous],
    );
    expect(action).toEqual({ kind: 'insert' });
  });

  it('does not supersede already superseded/rejected history', () => {
    const superseded = { ...existingActive, id: 'obs-3', status: 'superseded' as const };
    const action = planObservationIngest(
      {
        duplicateFingerprint: 'fp-4',
        sellerId: 'seller-1',
        sourceId: 'source-1',
        familyId: 'family-1',
        normalizedUnitCode: 'bag_50kg',
        checkedDate: new Date('2026-07-15'),
      },
      [superseded],
    );
    expect(action).toEqual({ kind: 'insert' });
  });

  it('never supersedes newer evidence with older evidence', () => {
    const action = planObservationIngest(
      {
        duplicateFingerprint: 'fp-5',
        sellerId: 'seller-1',
        sourceId: 'source-1',
        familyId: 'family-1',
        normalizedUnitCode: 'bag_50kg',
        checkedDate: new Date('2026-06-01'), // OLDER than existing
      },
      [existingActive],
    );
    expect(action).toEqual({ kind: 'insert' });
  });
});

describe('status transitions (history preserved, terminal states final)', () => {
  it('active rows may demote to stale/superseded/rejected/duplicate', () => {
    expect(isLegalStatusTransition('active', 'stale')).toBe(true);
    expect(isLegalStatusTransition('active', 'superseded')).toBe(true);
    expect(isLegalStatusTransition('active', 'rejected')).toBe(true);
    expect(isLegalStatusTransition('active', 'duplicate')).toBe(true);
  });

  it('stale rows may still be superseded or rejected', () => {
    expect(isLegalStatusTransition('stale', 'superseded')).toBe(true);
    expect(isLegalStatusTransition('stale', 'rejected')).toBe(true);
  });

  it('terminal states never reactivate (no history rewriting)', () => {
    expect(isLegalStatusTransition('superseded', 'active')).toBe(false);
    expect(isLegalStatusTransition('rejected', 'active')).toBe(false);
    expect(isLegalStatusTransition('duplicate', 'active')).toBe(false);
    expect(isLegalStatusTransition('superseded', 'stale')).toBe(false);
  });
});
