import { researchItem, Planner, PipelineDeps } from './pipeline';
import {
  SearchProvider,
  SearchProviderResult,
  PageRetriever,
  RetrievedPage,
  ObservationExtractor,
  ExtractionProviderResult,
  ExtractionContext,
} from './providers/types';
import { loadResearchConfig } from './research.config';
import { EXTRACTION_SCHEMA_VERSION } from './extraction-schema';

const config = loadResearchConfig({} as NodeJS.ProcessEnv);
const NOW = '2026-07-30T00:00:00.000Z';

const target = {
  requestItemId: 'item-1',
  researchRunId: 'run-1',
  canonicalProductName: 'Dangote 50kg cement',
  aliases: ['dangote cement'],
  brand: 'Dangote',
  model: null,
  specification: { grade: '42.5R' },
  locationLabel: 'Lagos',
  requestedLocationCode: 'ng-lagos',
  matchedFamilyId: 'cement',
  preferredComparisonUnit: 'bag_50kg',
  requiredAttributes: ['grade'],
  isService: false,
  currentYear: 2026,
};

class FakePlanner implements Planner {
  constructor(private readonly ok = true) {}
  async plan() {
    if (!this.ok) return { plan: null, usage: null, responseId: null, errors: ['planning failed'] };
    return {
      plan: {
        requestItemId: 'item-1',
        schemaVersion: 1,
        queries: [{ query: 'dangote cement 50kg lagos', intent: 'x', targetSourceTypes: ['marketplace'] }],
        sourceTypePriority: ['classified_marketplace'],
        notes: '',
      },
      usage: null,
      responseId: 'plan-1',
      errors: [],
    };
  }
}

class FakeSearch implements SearchProvider {
  readonly name = 'fake_search';
  constructor(private readonly urls: string[]) {}
  async search(): Promise<SearchProviderResult> {
    return {
      provider: this.name,
      results: this.urls.map((url) => ({
        url,
        title: 'listing',
        snippet: null,
        sourceDomain: new URL(url).hostname.replace(/^www\./, ''),
        fromQuery: 'q',
      })),
      usage: null,
      responseId: 'search-1',
    };
  }
}

function page(url: string, text: string, outcome: RetrievedPage['outcome'] = 'readable_text_found'): RetrievedPage {
  return {
    url,
    finalUrl: url,
    sourceDomain: new URL(url).hostname.replace(/^www\./, ''),
    outcome,
    httpStatus: outcome === 'readable_text_found' ? 200 : 403,
    contentType: 'text/html',
    title: 'listing',
    readableText: text,
    structured: { jsonLd: [], openGraph: {}, microdata: {} },
    fetchedAt: '2026-07-29T00:00:00.000Z',
    bytes: text.length,
  };
}

class FakeRetriever implements PageRetriever {
  readonly name = 'fake_retriever';
  constructor(private readonly pages: Record<string, RetrievedPage>) {}
  async retrieve(url: string): Promise<RetrievedPage> {
    return this.pages[url] ?? page(url, '', 'fetch_failed');
  }
}

class FakeExtractor implements ObservationExtractor {
  readonly name = 'fake_extractor';
  constructor(private readonly byUrl: Record<string, unknown[]>) {}
  async extract(pg: RetrievedPage, _ctx: ExtractionContext): Promise<ExtractionProviderResult> {
    return {
      provider: this.name,
      model: 'fake',
      responseId: 'ex-1',
      rawObservations: this.byUrl[pg.finalUrl] ?? [],
      usage: null,
    };
  }
}

function obs(url: string, price: number, span: string, over: Record<string, unknown> = {}) {
  const domain = new URL(url).hostname.replace(/^www\./, '');
  return {
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    sourceUrl: url,
    sourceDomain: domain,
    pageTitle: 'listing',
    sellerName: over.sellerName ?? `seller-${domain}`,
    sellerType: 'marketplace_seller',
    sellerLocation: 'Lagos',
    rawProductTitle: 'Dangote 3X Cement 42.5R',
    rawDescription: `dangote cement ${domain}`,
    canonicalProductMatch: 'Dangote 50kg cement',
    productFamilyMatch: 'cement',
    brand: 'Dangote',
    model: null,
    extractedAttributes: { grade: '42.5R' },
    missingAttributes: [],
    originalPrice: price,
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
    dateChecked: '2026-07-29T00:00:00.000Z',
    productOnlyOrBundle: 'product_only',
    accessoryOnly: false,
    rental: false,
    depositPrice: false,
    bundleContents: [],
    mismatchFlags: [],
    extractionConfidence: 0.9,
    supportingTextSpans: [span],
    unresolvedQuestions: [],
    ...over,
  };
}

function deps(over: Partial<PipelineDeps>): PipelineDeps {
  return {
    planner: new FakePlanner(),
    searchProvider: new FakeSearch([]),
    pageRetriever: new FakeRetriever({}),
    extractor: new FakeExtractor({}),
    config,
    nowIso: NOW,
    ...over,
  };
}

describe('researchItem pipeline', () => {
  it('produces a priced result from 3 independent grounded sources and rejects fabrications', async () => {
    const urls = [
      'https://jiji.ng/a',
      'https://jumia.com.ng/b',
      'https://buildersmart.example/c',
      'https://jiji.ng/d', // fabricated source url
      'https://konga.com/e', // policy-blocked
      'https://jiji.ng/f', // ungrounded price
    ];
    const pages: Record<string, RetrievedPage> = {
      'https://jiji.ng/a': page('https://jiji.ng/a', 'Dangote cement. Price: NGN 9,500 per bag.'),
      'https://jumia.com.ng/b': page('https://jumia.com.ng/b', 'Dangote cement now ₦9,800 per bag.'),
      'https://buildersmart.example/c': page('https://buildersmart.example/c', 'Dangote 42.5R N9,700 per bag.'),
      'https://jiji.ng/d': page('https://jiji.ng/d', 'Dangote cement N9,600 per bag.'),
      'https://konga.com/e': page('https://konga.com/e', '', 'robots_or_policy_restricted'),
      'https://jiji.ng/f': page('https://jiji.ng/f', 'Dangote cement, contact seller.'),
    };
    const extractions: Record<string, unknown[]> = {
      'https://jiji.ng/a': [obs('https://jiji.ng/a', 9500, 'Price: NGN 9,500 per bag', { sellerName: 'alpha' })],
      'https://jumia.com.ng/b': [obs('https://jumia.com.ng/b', 9800, '₦9,800 per bag', { sellerName: 'beta' })],
      'https://buildersmart.example/c': [obs('https://buildersmart.example/c', 9700, 'N9,700 per bag', { sellerName: 'gamma' })],
      // fabricated source URL (points elsewhere) -> must be rejected
      'https://jiji.ng/d': [obs('https://evil.example/x', 9600, 'N9,600 per bag', { sellerName: 'delta' })],
      // ungrounded: span/price not on page -> must be rejected
      'https://jiji.ng/f': [obs('https://jiji.ng/f', 12000, 'Price: NGN 12,000 per bag', { sellerName: 'eps' })],
    };

    const res = await researchItem(
      target,
      deps({
        searchProvider: new FakeSearch(urls),
        pageRetriever: new FakeRetriever(pages),
        extractor: new FakeExtractor(extractions),
      }),
    );

    expect(res.outcome).toBe('successful');
    expect(res.result.independentSourceCount).toBe(3);
    expect(res.result.rangeLow).toBe(9500);
    expect(res.result.rangeHigh).toBe(9800);
    expect(res.acceptedObservations).toHaveLength(3);
    // fabricated + ungrounded rejected
    expect(res.rejectedExtractions.length).toBe(2);
    // policy-blocked konga produced a diagnostic but no observation
    const konga = res.retrievalDiagnostics.find((d) => d.url === 'https://konga.com/e');
    expect(konga?.outcome).toBe('robots_or_policy_restricted');
    // every accepted observation carries a source URL + check date
    for (const a of res.acceptedObservations) {
      expect(a.extraction.sourceUrl).toMatch(/^https?:\/\//);
      expect(a.extraction.dateChecked).toBeTruthy();
    }
  });

  it('returns insufficient_data (not a fabricated price) when nothing is found', async () => {
    const res = await researchItem(target, deps({ searchProvider: new FakeSearch([]) }));
    expect(res.outcome).toBe('insufficient_data');
    expect(res.result.rangeLow).toBeNull();
    expect(res.result.confidence).toBe('insufficient_data');
  });

  it('returns failed when search planning fails', async () => {
    const res = await researchItem(target, deps({ planner: new FakePlanner(false) }));
    expect(res.outcome).toBe('failed');
  });

  it('excludes foreign-currency prices from the range (kept as evidence only)', async () => {
    const urls = ['https://jiji.ng/a', 'https://made-in-china.example/b'];
    const pages: Record<string, RetrievedPage> = {
      'https://jiji.ng/a': page('https://jiji.ng/a', 'Dangote cement. Price: NGN 9,500 per bag.'),
      'https://made-in-china.example/b': page('https://made-in-china.example/b', 'Wooden product USD 1,700 per piece.'),
    };
    const extractions: Record<string, unknown[]> = {
      'https://jiji.ng/a': [obs('https://jiji.ng/a', 9500, 'Price: NGN 9,500 per bag', { sellerName: 'alpha' })],
      'https://made-in-china.example/b': [
        obs('https://made-in-china.example/b', 1700, 'USD 1,700 per piece', { sellerName: 'factory', currency: 'USD' }),
      ],
    };
    const res = await researchItem(
      target,
      deps({ searchProvider: new FakeSearch(urls), pageRetriever: new FakeRetriever(pages), extractor: new FakeExtractor(extractions) }),
    );
    expect(res.acceptedObservations).toHaveLength(2);
    const usd = res.acceptedObservations.find((a) => a.extraction.currency === 'USD');
    expect(usd?.comparable).toBe(false);
    expect(usd?.comparabilityNotes.join()).toMatch(/USD/);
    expect(res.result.independentSourceCount).toBe(1); // only the NGN point priced
    expect(res.result.rangeHigh).toBe(9500);
  });

  it('excludes weak spec matches (<50% required attributes) from the range', async () => {
    const urls = ['https://jiji.ng/a'];
    const pages: Record<string, RetrievedPage> = {
      'https://jiji.ng/a': page('https://jiji.ng/a', 'Some cement product. Price: NGN 9,500 per bag.'),
    };
    const extractions: Record<string, unknown[]> = {
      'https://jiji.ng/a': [
        obs('https://jiji.ng/a', 9500, 'Price: NGN 9,500 per bag', { sellerName: 'alpha', extractedAttributes: {} }),
      ],
    };
    const res = await researchItem(
      target,
      deps({ searchProvider: new FakeSearch(urls), pageRetriever: new FakeRetriever(pages), extractor: new FakeExtractor(extractions) }),
    );
    expect(res.acceptedObservations[0].specMatchLevel).toBe('partial');
    expect(res.acceptedObservations[0].comparable).toBe(false);
    expect(res.outcome).toBe('insufficient_data');
  });

  it('does not use browser fallback when disabled', async () => {
    const urls = ['https://jiji.ng/spa'];
    const pages = { 'https://jiji.ng/spa': page('https://jiji.ng/spa', '', 'dynamic_rendering_required') };
    const res = await researchItem(
      target,
      deps({ searchProvider: new FakeSearch(urls), pageRetriever: new FakeRetriever(pages) }),
    );
    expect(res.retrievalDiagnostics[0].usedBrowserFallback).toBe(false);
    expect(res.outcome).toBe('insufficient_data');
  });
});
