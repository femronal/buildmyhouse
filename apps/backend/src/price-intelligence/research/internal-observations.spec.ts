import {
  assessInternalSufficiency,
  filterByBrandHint,
  independentGroupForInternal,
  mergeScoringObservations,
  tierForInternalObservation,
  toInternalScoringObservation,
  StoredObservationRow,
} from './internal-observations';
import { ScoringObservation } from '../reports/confidence';

function row(partial: Partial<StoredObservationRow> & { id: string }): StoredObservationRow {
  return {
    familyId: 'fam-1',
    sourceId: 'src-1',
    originalWording: 'Dangote cement 50kg',
    originalPrice: 10000,
    currencyCode: 'NGN',
    originalUnitCode: 'bag_50kg',
    normalizedPrice: 10000,
    normalizedUnitCode: 'bag_50kg',
    checkedDate: new Date(),
    listingDate: null,
    collectionMethod: 'merchant_feed',
    evidenceClass: 'merchant_confirmed',
    condition: 'new',
    deliveryIncluded: 'unknown',
    installationIncluded: 'unknown',
    vatIncluded: 'unknown',
    source: { id: 'src-1', code: 'merchant-whatsapp', tier: 3, name: 'Merchant feed' },
    ...partial,
  };
}

function score(partial: Partial<ScoringObservation> & { observationId: string; independentGroupId: string }): ScoringObservation {
  return {
    sourceUrl: 'internal://merchant-price-list/x',
    sourceDomain: 'internal.merchant-price-list',
    sourceTier: 3,
    sellerName: 'Shop',
    originalPrice: 10000,
    currency: 'NGN',
    originalUnit: 'bag_50kg',
    normalizedPrice: 10000,
    normalizedUnit: 'bag_50kg',
    checkedAtIso: new Date().toISOString(),
    listingDateIso: null,
    specMatch: 'close',
    locationMatch: 'unknown',
    condition: 'new',
    comparable: true,
    comparabilityNotes: [],
    deliveryState: 'unknown',
    installationState: 'unknown',
    vatState: 'unknown',
    retailOrWholesale: 'retail',
    negotiable: 'unknown',
    ...partial,
  };
}

describe('internal-observations', () => {
  it('groups merchant observations by merchantId', () => {
    const r = row({ id: 'o1' });
    expect(independentGroupForInternal(r, { observationId: 'o1', merchantId: 'm1', businessName: 'A', sourceTier: 3 })).toBe(
      'merchant:m1',
    );
    expect(independentGroupForInternal(r, undefined)).toBe('merchant-source:src-1');
  });

  it('treats admin entries as independent per observation', () => {
    const r = row({ id: 'a1', collectionMethod: 'admin_entry', source: { id: 's', code: 'admin-manual', tier: 2, name: 'Admin' } });
    expect(independentGroupForInternal(r, undefined)).toBe('admin:a1');
    expect(tierForInternalObservation(r, undefined)).toBe(2);
  });

  it('maps to scoring observations with internal source URLs', () => {
    const obs = toInternalScoringObservation(row({ id: 'o9' }), {
      observationId: 'o9',
      merchantId: 'm9',
      businessName: 'Lagos Blocks Ltd',
      sourceTier: 2,
    });
    expect(obs.sourceUrl).toContain('internal://merchant-price-list/o9');
    expect(obs.sellerName).toBe('Lagos Blocks Ltd');
    expect(obs.sourceTier).toBe(2);
    expect(obs.comparable).toBe(true);
  });

  it('skips live research when ≥2 independent internal groups exist', () => {
    const result = assessInternalSufficiency([
      score({ observationId: '1', independentGroupId: 'merchant:a' }),
      score({ observationId: '2', independentGroupId: 'merchant:b' }),
    ]);
    expect(result.sufficientForRange).toBe(true);
    expect(result.skipLiveResearch).toBe(true);
  });

  it('does not skip live research for a single merchant', () => {
    const result = assessInternalSufficiency([
      score({ observationId: '1', independentGroupId: 'merchant:a' }),
      score({ observationId: '2', independentGroupId: 'merchant:a' }),
    ]);
    expect(result.independentGroupCount).toBe(1);
    expect(result.skipLiveResearch).toBe(false);
  });

  it('merges internal + live without duplicate ids', () => {
    const merged = mergeScoringObservations(
      [score({ observationId: 'same', independentGroupId: 'm1' })],
      [
        score({ observationId: 'same', independentGroupId: 'm1' }),
        score({ observationId: 'live', independentGroupId: 'web1', sourceUrl: 'https://example.com' }),
      ],
    );
    expect(merged).toHaveLength(2);
  });

  it('soft-filters by brand but falls back when nothing matches', () => {
    const rows = [row({ id: '1', originalWording: 'BUA cement' }), row({ id: '2', originalWording: 'Elephant' })];
    expect(filterByBrandHint(rows, 'BUA')).toHaveLength(1);
    expect(filterByBrandHint(rows, 'Dangote')).toHaveLength(2);
  });
});
