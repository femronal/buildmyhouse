import {
  validateExtractedObservation,
  isComparableFullPrice,
  ExtractedObservation,
  EXTRACTION_SCHEMA_VERSION,
} from './extraction-schema';

const PAGE = {
  url: 'https://jiji.ng/lagos/cement-dangote-9500',
  finalUrl: 'https://jiji.ng/lagos/cement-dangote-9500',
  readableText: 'Dangote 3X Cement 42.5R now available. Price: NGN 9,500 per bag. Delivery available on request.',
  structuredText: '{"jsonLd":[]}',
};

function baseObs(overrides: Partial<ExtractedObservation> = {}): ExtractedObservation {
  return {
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    sourceUrl: PAGE.finalUrl,
    sourceDomain: 'jiji.ng',
    pageTitle: 'Dangote cement',
    sellerName: 'BuildMart',
    sellerType: 'marketplace_seller',
    sellerLocation: 'Lagos',
    rawProductTitle: 'Dangote 3X Cement 42.5R',
    rawDescription: 'Dangote cement per bag',
    canonicalProductMatch: 'Dangote 50kg cement',
    productFamilyMatch: 'cement',
    brand: 'Dangote',
    model: null,
    extractedAttributes: { grade: '42.5R' },
    missingAttributes: [],
    originalPrice: 9500,
    currency: 'NGN',
    originalQuantity: 1,
    originalUnit: 'bag_50kg',
    minimumOrderQuantity: null,
    priceKind: 'full_purchase_price',
    retailOrWholesale: 'retail',
    condition: 'new',
    availabilityStatement: 'available',
    negotiable: 'unknown',
    deliveryState: 'unknown',
    installationState: 'not_applicable',
    vatState: 'unknown',
    accessoriesState: 'not_applicable',
    warrantyInfo: null,
    listingDate: null,
    sourceUpdateDate: null,
    dateChecked: '2026-07-30T00:00:00.000Z',
    productOnlyOrBundle: 'product_only',
    accessoryOnly: false,
    rental: false,
    depositPrice: false,
    bundleContents: [],
    mismatchFlags: [],
    extractionConfidence: 0.9,
    supportingTextSpans: ['Price: NGN 9,500 per bag'],
    unresolvedQuestions: [],
    ...overrides,
  };
}

describe('validateExtractedObservation — grounding & schema', () => {
  it('accepts a well-formed, grounded observation', () => {
    const r = validateExtractedObservation(baseObs(), PAGE);
    expect(r.valid).toBe(true);
  });

  it('rejects a source URL that is not the retrieved page (no invented sources)', () => {
    const r = validateExtractedObservation(baseObs({ sourceUrl: 'https://evil.example/other' }), PAGE);
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toMatch(/sourceUrl must equal/);
  });

  it('rejects a price whose supporting span is not on the page', () => {
    const r = validateExtractedObservation(
      baseObs({ originalPrice: 12000, supportingTextSpans: ['Price: NGN 12,000 per bag'] }),
      PAGE,
    );
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toMatch(/not found in retrieved page|does not appear/);
  });

  it('rejects a numeric price with no supporting spans', () => {
    const r = validateExtractedObservation(baseObs({ supportingTextSpans: [] }), PAGE);
    expect(r.valid).toBe(false);
  });
});

describe('validateExtractedObservation — "must not infer" rules', () => {
  it('rejects a numeric price on a contact_for_price listing', () => {
    const r = validateExtractedObservation(baseObs({ priceKind: 'contact_for_price' }), PAGE);
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toMatch(/contact_for_price/);
  });

  it('allows contact_for_price with a null price', () => {
    const r = validateExtractedObservation(
      baseObs({ priceKind: 'contact_for_price', originalPrice: null, currency: null, supportingTextSpans: [] }),
      PAGE,
    );
    expect(r.valid).toBe(true);
  });

  it('requires depositPrice=true when priceKind is deposit', () => {
    const r = validateExtractedObservation(baseObs({ priceKind: 'deposit', depositPrice: false }), PAGE);
    expect(r.valid).toBe(false);
  });

  it('flags an instalment price as non-comparable via a notice', () => {
    const r = validateExtractedObservation(baseObs({ priceKind: 'installment' }), PAGE);
    expect(r.valid).toBe(true);
    expect(r.notices.join()).toMatch(/instalment/);
  });

  it('rejects a bad tri-state inclusion value', () => {
    const r = validateExtractedObservation(baseObs({ deliveryState: 'maybe' as any }), PAGE);
    expect(r.valid).toBe(false);
  });

  it('rejects confidence out of range', () => {
    expect(validateExtractedObservation(baseObs({ extractionConfidence: 2 }), PAGE).valid).toBe(false);
  });

  it('rejects non-string values in nullable string fields (model type drift)', () => {
    expect(validateExtractedObservation(baseObs({ originalUnit: 50 as any }), PAGE).valid).toBe(false);
    expect(validateExtractedObservation(baseObs({ sellerName: { name: 'x' } as any }), PAGE).valid).toBe(false);
    expect(validateExtractedObservation(baseObs({ productFamilyMatch: 123 as any }), PAGE).valid).toBe(false);
  });

  it('rejects invalid enums and non-boolean flags', () => {
    expect(validateExtractedObservation(baseObs({ sellerType: 'shop' as any }), PAGE).valid).toBe(false);
    expect(validateExtractedObservation(baseObs({ condition: 'fairly used' as any }), PAGE).valid).toBe(false);
    expect(validateExtractedObservation(baseObs({ accessoryOnly: 'no' as any }), PAGE).valid).toBe(false);
  });
});

describe('isComparableFullPrice', () => {
  it('accepts a new full-price product-only observation', () => {
    expect(isComparableFullPrice(baseObs())).toBe(true);
  });
  it('rejects used, bundle, accessory, deposit, rental and instalment', () => {
    expect(isComparableFullPrice(baseObs({ condition: 'used' }))).toBe(false);
    expect(isComparableFullPrice(baseObs({ productOnlyOrBundle: 'bundle' }))).toBe(false);
    expect(isComparableFullPrice(baseObs({ accessoryOnly: true }))).toBe(false);
    expect(isComparableFullPrice(baseObs({ depositPrice: true, priceKind: 'deposit' }))).toBe(false);
    expect(isComparableFullPrice(baseObs({ rental: true }))).toBe(false);
    expect(isComparableFullPrice(baseObs({ priceKind: 'installment' }))).toBe(false);
  });
});
