import { computeIndependence, IndependenceInput } from './independence';

function input(over: Partial<IndependenceInput> & { observationId: string }): IndependenceInput {
  return {
    sourceDomain: 'jiji.ng',
    sellerNameNormalized: null,
    descriptionNormalized: 'some product description here for shingling',
    ...over,
  };
}

describe('computeIndependence', () => {
  it('counts distinct domains/sellers as independent', () => {
    const r = computeIndependence([
      input({ observationId: 'a', sourceDomain: 'jiji.ng', sellerNameNormalized: 'alpha' }),
      input({ observationId: 'b', sourceDomain: 'jumia.com.ng', sellerNameNormalized: 'beta' }),
      input({ observationId: 'c', sourceDomain: 'buildersmart.ng', sellerNameNormalized: 'gamma' }),
    ]);
    expect(r.rawSourceCount).toBe(3);
    expect(r.independentSourceCount).toBe(3);
  });

  it('collapses the same seller on the same domain', () => {
    const r = computeIndependence([
      input({ observationId: 'a', sourceDomain: 'jiji.ng', sellerNameNormalized: 'alpha traders' }),
      input({ observationId: 'b', sourceDomain: 'jiji.ng', sellerNameNormalized: 'alpha traders' }),
    ]);
    expect(r.rawSourceCount).toBe(2);
    expect(r.independentSourceCount).toBe(1);
  });

  it('collapses the same private identifier across domains', () => {
    const r = computeIndependence([
      input({ observationId: 'a', sourceDomain: 'jiji.ng', sellerIdentifier: '+2348012345678' }),
      input({ observationId: 'b', sourceDomain: 'jumia.com.ng', sellerIdentifier: '+2348012345678' }),
    ]);
    expect(r.independentSourceCount).toBe(1);
  });

  it('collapses near-duplicate (syndicated) descriptions on the same domain', () => {
    const desc = 'brand new dangote cement 50kg bag grade 42.5r available for delivery in lagos today';
    const r = computeIndependence([
      input({ observationId: 'a', sourceDomain: 'jiji.ng', descriptionNormalized: desc, sellerNameNormalized: 's1' }),
      input({ observationId: 'b', sourceDomain: 'jiji.ng', descriptionNormalized: desc + ' now', sellerNameNormalized: 's2' }),
    ]);
    expect(r.independentSourceCount).toBe(1);
  });

  it('collapses same underlying distributor with duplicated description', () => {
    const desc = 'authorised dangote distributor bulk cement supply nationwide delivery available';
    const r = computeIndependence([
      input({ observationId: 'a', sourceDomain: 'siteA.ng', descriptionNormalized: desc, underlyingDistributor: 'dangote' }),
      input({ observationId: 'b', sourceDomain: 'siteB.ng', descriptionNormalized: desc, underlyingDistributor: 'dangote' }),
    ]);
    expect(r.independentSourceCount).toBe(1);
  });
});
