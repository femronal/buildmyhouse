import { CEMENT, GRANITE_AGGREGATES } from './families/structural.data';
import { SANITARY_WARES } from './families/finishes.data';
import { findContradictions, missingRequiredQuestions, resolveUnknownOutcome, selectVisibleQuestions, UNKNOWN_ANSWER } from './questions';

describe('required-question selection', () => {
  it('shows always-required questions with no answers yet', () => {
    const visible = selectVisibleQuestions(CEMENT, {});
    const ids = visible.map((q) => q.id);
    expect(ids).toContain('brand');
    expect(ids).toContain('quantity');
    expect(ids).toContain('delivery_needed');
  });

  it('never shows admin-only or professional-review questions to users', () => {
    for (const family of [CEMENT, SANITARY_WARES]) {
      const visible = selectVisibleQuestions(family, {});
      expect(visible.every((q) => q.requirement !== 'admin_only' && q.requirement !== 'professional_review')).toBe(true);
    }
  });

  it('reports unanswered required questions', () => {
    const missing = missingRequiredQuestions(CEMENT, { brand: 'Dangote' });
    const ids = missing.map((q) => q.id);
    expect(ids).toContain('purchase_type');
    expect(ids).not.toContain('brand');
  });

  it('rejects "I don\'t know" on questions that require an answer', () => {
    const missing = missingRequiredQuestions(CEMENT, {
      brand: 'Dangote',
      purchase_type: UNKNOWN_ANSWER, // allowUnknown: false
      quantity: '50 bags',
      delivery_needed: 'yes',
    });
    expect(missing.map((q) => q.id)).toContain('purchase_type');
  });
});

describe('conditional-question logic', () => {
  it('hides conditional questions until the dependency is satisfied', () => {
    const before = selectVisibleQuestions(GRANITE_AGGREGATES, {});
    expect(before.map((q) => q.id)).not.toContain('stone_size');

    const after = selectVisibleQuestions(GRANITE_AGGREGATES, { stone_type: 'Granite' });
    expect(after.map((q) => q.id)).toContain('stone_size');
  });

  it('progressively reveals nested conditionals (sanitary item → mounting)', () => {
    const step1 = selectVisibleQuestions(SANITARY_WARES, { item_or_set: 'Single item' });
    expect(step1.map((q) => q.id)).toContain('which_item');

    const step2 = selectVisibleQuestions(SANITARY_WARES, { item_or_set: 'Single item', which_item: 'WC (toilet)' });
    expect(step2.map((q) => q.id)).toContain('mounting');
  });

  it('detects contradictions when an earlier answer changes', () => {
    const contradictions = findContradictions(GRANITE_AGGREGATES, {
      stone_type: 'Gravel',
      stone_size: '3/4', // answered while dependency (Granite) no longer holds
    });
    expect(contradictions).toContain('stone_size');
  });
});

describe('"I don\'t know" outcomes', () => {
  const brandQuestion = CEMENT.questions.find((q) => q.id === 'brand');
  if (!brandQuestion) throw new Error('cement brand question missing');

  it('prefers quotation extraction when a quotation is attached', () => {
    expect(resolveUnknownOutcome(brandQuestion, { hasPhoto: true, hasQuotation: true, unknownCount: 1 })).toBe('quotation_extraction');
  });

  it('falls back to photo identification when only a photo exists', () => {
    expect(resolveUnknownOutcome(brandQuestion, { hasPhoto: true, hasQuotation: false, unknownCount: 1 })).toBe('photo_identification');
  });

  it('routes to admin clarification after repeated unknowns', () => {
    expect(resolveUnknownOutcome(brandQuestion, { hasPhoto: false, hasQuotation: false, unknownCount: 3 })).toBe('admin_clarification');
  });

  it('broadens research (low confidence) for a single unknown', () => {
    expect(resolveUnknownOutcome(brandQuestion, { hasPhoto: false, hasQuotation: false, unknownCount: 1 })).toBe('broadened_low_confidence_research');
  });

  it('marks insufficient specification when unknown is not allowed', () => {
    const purchaseType = CEMENT.questions.find((q) => q.id === 'purchase_type');
    if (!purchaseType) throw new Error('cement purchase_type question missing');
    expect(resolveUnknownOutcome(purchaseType, { hasPhoto: false, hasQuotation: false, unknownCount: 1 })).toBe('insufficient_specification');
  });
});
