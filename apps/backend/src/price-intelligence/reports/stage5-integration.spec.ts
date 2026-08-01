/**
 * Stage 5 integration test — the full path the founder specified:
 *
 *   stored Stage 4 observations → validation → deduplication → normalisation
 *   → outlier handling → range and median → confidence score → report
 *   generation → persisted report snapshot
 *
 * Uses realistic AcceptedObservation fixtures (the persisted Stage 4 shape);
 * no live AI or web calls.
 */
import { AcceptedObservation } from '../research/pipeline';
import { ExtractedObservation } from '../research/extraction-schema';
import { toScoringObservations, scoringTierForSource, mapLocationLevel } from './bridge';
import { generateReport, renderReportText } from './report';

const NOW = '2026-07-30T12:00:00.000Z';

function daysAgo(n: number): string {
  return new Date(new Date(NOW).getTime() - n * 86_400_000).toISOString();
}

function extraction(over: Partial<ExtractedObservation>): ExtractedObservation {
  return {
    schemaVersion: 1,
    sourceUrl: 'https://example.ng/product',
    sourceDomain: 'example.ng',
    pageTitle: 'Product page',
    sellerName: 'Example Seller',
    sellerType: 'retailer',
    sellerLocation: 'Lagos',
    rawProductTitle: 'Dangote Cement 42.5R 50kg',
    rawDescription: null,
    canonicalProductMatch: 'cement-42-5',
    productFamilyMatch: 'cement',
    brand: 'Dangote',
    model: null,
    extractedAttributes: { grade: '42.5R' },
    missingAttributes: [],
    originalPrice: 100_000,
    currency: 'NGN',
    originalQuantity: 1,
    originalUnit: 'bag',
    minimumOrderQuantity: null,
    priceKind: 'full_purchase_price',
    retailOrWholesale: 'retail',
    condition: 'new',
    availabilityStatement: null,
    negotiable: 'unknown',
    deliveryState: 'unknown',
    installationState: 'not_applicable',
    vatState: 'unknown',
    accessoriesState: 'not_applicable',
    warrantyInfo: null,
    listingDate: null,
    sourceUpdateDate: null,
    dateChecked: daysAgo(3),
    productOnlyOrBundle: 'product_only',
    bundleContents: [],
    accessoryOnly: false,
    rental: false,
    depositPrice: false,
    mismatchFlags: [],
    extractionConfidence: 0.9,
    supportingTextSpans: ['₦100,000 per bag'],
    unresolvedQuestions: [],
    ...over,
  };
}

function accepted(over: {
  extraction?: Partial<ExtractedObservation>;
  normalizedPrice?: number | null;
  normalizedUnit?: string | null;
  specMatchLevel?: 'exact' | 'close' | 'partial';
  locationMatchLevel?: string;
  independentGroupId?: string;
  comparable?: boolean;
  comparabilityNotes?: string[];
}): AcceptedObservation {
  const e = extraction(over.extraction ?? {});
  return {
    extraction: e,
    normalizedPrice: over.normalizedPrice !== undefined ? over.normalizedPrice : e.originalPrice,
    normalizedUnit: over.normalizedUnit !== undefined ? over.normalizedUnit : 'bag',
    conversionFormula: null,
    conversionFactorSource: null,
    duplicateFingerprint: `${e.sourceDomain}|${e.originalPrice}`,
    locationMatchLevel: over.locationMatchLevel ?? 'same_city',
    specMatchLevel: over.specMatchLevel ?? 'exact',
    independentGroupId: over.independentGroupId ?? e.sourceDomain,
    comparable: over.comparable ?? true,
    comparabilityNotes: over.comparabilityNotes ?? [],
  };
}

describe('Stage 5 full path: stored observations → persisted report snapshot', () => {
  const stored: AcceptedObservation[] = [
    accepted({
      extraction: {
        sourceUrl: 'https://shop-a.example.ng/cement',
        sourceDomain: 'shop-a.example.ng',
        sellerName: 'Shop A',
        originalPrice: 100_000,
        supportingTextSpans: ['₦100,000'],
      },
      independentGroupId: 'shop-a',
    }),
    accepted({
      extraction: {
        sourceUrl: 'https://shop-b.example.ng/cement',
        sourceDomain: 'shop-b.example.ng',
        sellerName: 'Shop B',
        originalPrice: 104_000,
        supportingTextSpans: ['₦104,000'],
      },
      independentGroupId: 'shop-b',
      normalizedPrice: 104_000,
    }),
    // Duplicate: second URL from Shop B — must not count as independent.
    accepted({
      extraction: {
        sourceUrl: 'https://shop-b.example.ng/cement-promo',
        sourceDomain: 'shop-b.example.ng',
        sellerName: 'Shop B',
        originalPrice: 103_000,
        supportingTextSpans: ['₦103,000'],
      },
      independentGroupId: 'shop-b',
      normalizedPrice: 103_000,
    }),
    accepted({
      extraction: {
        sourceUrl: 'https://shop-c.example.ng/cement',
        sourceDomain: 'shop-c.example.ng',
        sellerName: 'Shop C',
        originalPrice: 98_000,
        supportingTextSpans: ['₦98,000'],
      },
      independentGroupId: 'shop-c',
      normalizedPrice: 98_000,
    }),
    accepted({
      extraction: {
        sourceUrl: 'https://shop-d.example.ng/cement',
        sourceDomain: 'shop-d.example.ng',
        sellerName: 'Shop D',
        originalPrice: 101_000,
        supportingTextSpans: ['₦101,000'],
      },
      independentGroupId: 'shop-d',
      normalizedPrice: 101_000,
    }),
    // Statistical outlier.
    accepted({
      extraction: {
        sourceUrl: 'https://shop-e.example.ng/cement',
        sourceDomain: 'shop-e.example.ng',
        sellerName: 'Shop E',
        originalPrice: 900_000,
        supportingTextSpans: ['₦900,000'],
      },
      independentGroupId: 'shop-e',
      normalizedPrice: 900_000,
    }),
    // Not comparable (deposit) — kept as evidence, excluded from the range.
    accepted({
      extraction: {
        sourceUrl: 'https://shop-f.example.ng/cement',
        sourceDomain: 'shop-f.example.ng',
        sellerName: 'Shop F',
        originalPrice: 20_000,
        priceKind: 'deposit',
        supportingTextSpans: ['₦20,000 deposit'],
      },
      independentGroupId: 'shop-f',
      comparable: false,
      normalizedPrice: null,
      normalizedUnit: null,
      comparabilityNotes: ['deposit, not full purchase price'],
    }),
  ];

  const scoringObservations = toScoringObservations(stored, 'itest');
  const reportRequest = {
    reportId: 'itest-report',
    productName: 'Dangote Cement 42.5R 50kg',
    brand: 'Dangote',
    specification: { grade: '42.5R', bagSizeKg: 50 },
    requestedUnit: 'bag',
    requestedLocationLabel: 'Lagos',
    requestedCondition: 'new' as const,
    generatedAtIso: NOW,
  };

  it('deduplicates, excludes the outlier and non-comparable, and prices the rest', () => {
    const report = generateReport(reportRequest, scoringObservations);
    expect(report.status).toBe('complete');
    // 4 independent sources: shop-a/b/c/d (shop-e outlier, shop-f deposit).
    expect(report.pricing.independentSourceCount).toBe(4);
    expect(report.pricing.observedLow).toBe(98_000);
    expect(report.pricing.observedHigh).toBe(104_000);
    expect(report.pricing.typicalPrice).toBe(100_500);

    const rules = report.confidence.excludedObservations.map((e) => e.rule);
    expect(rules).toContain('duplicate_seller_listing');
    expect(rules).toContain('statistical_outlier');
    expect(rules).toContain('not_comparable_full_price');
  });

  it('every accepted price in the report traces back to a stored source URL and check date', () => {
    const report = generateReport(reportRequest, scoringObservations);
    const storedUrls = new Set(stored.map((s) => s.extraction.sourceUrl));
    for (const source of report.sources) {
      expect(storedUrls.has(source.sourceUrl)).toBe(true);
      expect(source.dateChecked).toBeTruthy();
    }
  });

  it('the snapshot payload survives persistence round-trip and stays reproducible', () => {
    const report = generateReport(reportRequest, scoringObservations);
    // What PriceReportItem.payload would store.
    const persisted = JSON.parse(JSON.stringify(report));
    // Regenerate from the same stored observations: identical result + hash.
    const regenerated = generateReport(reportRequest, toScoringObservations(stored, 'itest'));
    expect(JSON.parse(JSON.stringify(regenerated))).toEqual(persisted);
    expect(regenerated.reproducibility.reportInputHash).toBe(report.reproducibility.reportInputHash);
  });

  it('renders the full consumer text without ungrounded claims', () => {
    const report = generateReport(reportRequest, scoringObservations);
    const text = renderReportText(report);
    expect(text).toContain('LATEST OBSERVED RANGE');
    expect(text).toContain('shop-a.example.ng');
    expect(text).not.toContain('shop-e.example.ng'); // excluded outlier not shown as a source
    expect(text).toContain('Delivery not stated');
  });
});

describe('Bridge mappings', () => {
  it('maps Stage 4 location levels onto Stage 5 classes', () => {
    expect(mapLocationLevel('exact_local_area')).toBe('exact_city');
    expect(mapLocationLevel('same_city')).toBe('exact_city');
    expect(mapLocationLevel('same_state')).toBe('same_state');
    expect(mapLocationLevel('nearby_state')).toBe('nearby_market');
    expect(mapLocationLevel('national')).toBe('national_supplier');
    expect(mapLocationLevel('insufficient')).toBe('unknown');
  });

  it('derives deterministic scoring tiers for unregistered domains from seller type', () => {
    expect(scoringTierForSource('https://unknown-shop.ng/x', 'manufacturer')).toBe(2);
    expect(scoringTierForSource('https://unknown-shop.ng/x', 'retailer')).toBe(3);
    expect(scoringTierForSource('https://unknown-shop.ng/x', 'marketplace_seller')).toBe(3);
    expect(scoringTierForSource('https://unknown-shop.ng/x', 'unknown')).toBe(4);
  });
});
