import { PriceCheckerCatalogueService } from './price-checker-catalogue.service';

describe('PriceCheckerCatalogueService', () => {
  const prismaMock = {
    priceAlias: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const service = new PriceCheckerCatalogueService(prismaMock as any);

  it('searches the Stage 2 catalogue for cement', async () => {
    const results = await service.search('Dangote cement');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.key === 'cement')).toBe(true);
  });

  it('returns product-specific clarifying questions', () => {
    const preview = service.questionsPreview('cement', 'product', {});
    expect(preview.familyKey).toBe('cement');
    expect(preview.questions.length).toBeGreaterThan(0);
    expect(preview.estimatedRemaining).toBeGreaterThan(0);
  });

  it('allows unknown brand and continues with remaining required questions', () => {
    const preview = service.questionsPreview('cement', 'product', { brand: 'unknown' });
    expect(preview.contradictions).toEqual([]);
    // Brand answered as unknown; other required fields may still be missing.
    expect(preview.missingRequiredIds).not.toContain('brand');
  });

  it('lists Nigerian locations for the picker', () => {
    const locations = service.locations();
    expect(locations.some((l) => /lagos/i.test(l.label))).toBe(true);
    expect(locations.every((l) => l.type !== 'market')).toBe(true);
  });
});
