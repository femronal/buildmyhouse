import {
  resultCacheKey,
  freshnessStatus,
  quantityClass,
  ResultCacheIdentity,
} from './cache';

const base: ResultCacheIdentity = {
  productFamilyId: 'cement',
  canonicalProductName: 'Dangote 50kg cement',
  specification: { grade: '42.5R', brand: 'dangote' },
  locationCode: 'ng-lagos',
  quantityClass: 'single',
  condition: 'new',
  deliveryRequired: false,
  installationRequired: false,
};

describe('resultCacheKey', () => {
  it('is stable regardless of specification key order', () => {
    const a = resultCacheKey(base);
    const b = resultCacheKey({ ...base, specification: { brand: 'dangote', grade: '42.5R' } });
    expect(a).toBe(b);
  });

  it('changes when the specification changes (no cross-spec cache reuse)', () => {
    expect(resultCacheKey(base)).not.toBe(resultCacheKey({ ...base, specification: { grade: '52.5R' } }));
  });

  it('changes when location changes', () => {
    expect(resultCacheKey(base)).not.toBe(resultCacheKey({ ...base, locationCode: 'ng-fct' }));
  });

  it('changes when delivery/installation requirement changes', () => {
    expect(resultCacheKey(base)).not.toBe(resultCacheKey({ ...base, deliveryRequired: true }));
    expect(resultCacheKey(base)).not.toBe(resultCacheKey({ ...base, installationRequired: true }));
  });
});

describe('freshnessStatus', () => {
  it('is a miss when the entry does not exist', () => {
    expect(freshnessStatus(false, 1, 72)).toBe('cache_miss');
  });
  it('is a hit when fresh', () => {
    expect(freshnessStatus(true, 10, 72)).toBe('cache_hit');
  });
  it('is stale when older than the TTL', () => {
    expect(freshnessStatus(true, 100, 72)).toBe('stale_cache');
  });
});

describe('quantityClass', () => {
  it('buckets quantities', () => {
    expect(quantityClass(1)).toBe('single');
    expect(quantityClass(5)).toBe('single');
    expect(quantityClass(50)).toBe('small');
    expect(quantityClass(500)).toBe('bulk');
    expect(quantityClass(0)).toBe('unknown');
  });
});
