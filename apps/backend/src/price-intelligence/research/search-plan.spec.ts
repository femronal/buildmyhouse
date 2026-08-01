import { validateSearchPlan, boundSearchPlan, SearchPlan, SEARCH_PLAN_SCHEMA_VERSION } from './search-plan';

const validPlan: SearchPlan = {
  requestItemId: 'item-1',
  schemaVersion: SEARCH_PLAN_SCHEMA_VERSION,
  queries: [
    { query: 'Dangote 50kg cement Lagos price', intent: 'exact spec + location', targetSourceTypes: ['marketplace'] },
    { query: 'cement 50kg Nigeria price 2026', intent: 'exact spec + Nigeria', targetSourceTypes: ['ecommerce'] },
  ],
  sourceTypePriority: ['manufacturer', 'classified_marketplace'],
  notes: 'ok',
};

describe('validateSearchPlan', () => {
  it('accepts a well-formed plan', () => {
    expect(validateSearchPlan(validPlan).valid).toBe(true);
  });

  it('rejects a non-object', () => {
    expect(validateSearchPlan(null).valid).toBe(false);
    expect(validateSearchPlan([]).valid).toBe(false);
  });

  it('rejects an empty query list', () => {
    const r = validateSearchPlan({ ...validPlan, queries: [] });
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toMatch(/non-empty/);
  });

  it('rejects the wrong schema version', () => {
    expect(validateSearchPlan({ ...validPlan, schemaVersion: 99 }).valid).toBe(false);
  });

  it('rejects a query missing its text', () => {
    const r = validateSearchPlan({ ...validPlan, queries: [{ intent: 'x', targetSourceTypes: [] }] });
    expect(r.valid).toBe(false);
  });
});

describe('boundSearchPlan', () => {
  it('dedupes case-insensitively and clamps to maxQueries', () => {
    const plan: SearchPlan = {
      ...validPlan,
      queries: [
        { query: 'A query', intent: 'i', targetSourceTypes: [] },
        { query: 'a QUERY', intent: 'i', targetSourceTypes: [] }, // dup
        { query: 'B query', intent: 'i', targetSourceTypes: [] },
        { query: 'C query', intent: 'i', targetSourceTypes: [] },
      ],
    };
    const bounded = boundSearchPlan(plan, 2);
    expect(bounded.queries).toHaveLength(2);
    expect(bounded.queries[0].query).toBe('A query');
    expect(bounded.queries[1].query).toBe('B query');
  });

  it('never returns zero queries even if maxQueries is 0', () => {
    expect(boundSearchPlan(validPlan, 0).queries.length).toBeGreaterThanOrEqual(1);
  });
});
