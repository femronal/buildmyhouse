/**
 * Stage 4 STEP 1–8 — live research pipeline (pure orchestration).
 *
 * Ties AI product-understanding + retrieval providers together with the
 * DETERMINISTIC processing modules (validation, unit conversion, dedup,
 * independence, result building). Providers are injected, so this whole flow
 * is unit-testable with fakes and never fabricates: a price only survives if
 * (a) the retriever actually fetched the page and (b) the deterministic
 * validator grounds it in that page's content.
 *
 * Persistence is NOT done here — the pipeline returns validated observations
 * and diagnostics; a Nest service maps them onto the Stage 3 append-only
 * tables.
 */
import {
  SearchProvider,
  PageRetriever,
  BrowserRetriever,
  ObservationExtractor,
  RetrievedPage,
  RetrievalOutcome,
} from './providers/types';
import { ResearchConfig } from './research.config';
import { PlanTarget, PlannerOutput } from './planner';
import { validateExtractedObservation, ExtractedObservation, isComparableFullPrice } from './extraction-schema';
import { computeIndependence, IndependenceInput } from './independence';
import { buildResult, PriceResult, PricePoint } from './result';
import { CostAccumulator, ModelPricing } from './cost';
import { canBrowserFallback } from './source-registry';
import { convertPrice, isConversionFailure } from '../taxonomy/units';
import { matchLocation } from '../taxonomy/locations';
import { observationFingerprint } from '../observations/observations';

export interface Planner {
  plan(target: PlanTarget, signal?: AbortSignal): Promise<PlannerOutput>;
}

/** Real step boundaries + evidence counters, for truthful consumer progress. */
export interface PipelineProgress {
  stage: 'planning_search' | 'searching_sources' | 'reading_listings' | 'matching_specifications';
  discoveredUrlCount: number;
  retrievedPageCount: number;
  acceptedObservationCount: number;
}

export interface PipelineDeps {
  planner: Planner;
  searchProvider: SearchProvider;
  pageRetriever: PageRetriever;
  extractor: ObservationExtractor;
  browserRetriever?: BrowserRetriever;
  config: ResearchConfig;
  pricing?: Record<string, ModelPricing>;
  /** Deterministic clock for tests. */
  nowIso?: string;
  /** Optional Stage 6 hook — reports REAL progress only; never fabricated counts. */
  onProgress?: (progress: PipelineProgress) => void;
}

export interface AcceptedObservation {
  extraction: ExtractedObservation;
  normalizedPrice: number | null;
  normalizedUnit: string | null;
  conversionFormula: string | null;
  conversionFactorSource: string | null;
  duplicateFingerprint: string;
  locationMatchLevel: string;
  specMatchLevel: 'exact' | 'close' | 'partial';
  independentGroupId: string;
  /** Usable as a full-price data point: full price, right currency, spec ≥ close. */
  comparable: boolean;
  /** Why an observation was kept as evidence but excluded from the range. */
  comparabilityNotes: string[];
}

export interface RetrievalDiagnostic {
  url: string;
  finalUrl: string;
  outcome: RetrievalOutcome;
  usedBrowserFallback: boolean;
  restrictionReason?: string;
}

export type ItemOutcome = 'successful' | 'insufficient_data' | 'failed';

export interface ResearchItemResult {
  requestItemId: string;
  outcome: ItemOutcome;
  result: PriceResult;
  acceptedObservations: AcceptedObservation[];
  retrievalDiagnostics: RetrievalDiagnostic[];
  searchQueries: string[];
  discoveredUrls: string[];
  rejectedExtractions: { url: string; errors: string[] }[];
  cost: ReturnType<CostAccumulator['summary']>;
  reasons: string[];
}

const RETRIEVAL_USABLE: RetrievalOutcome[] = ['fetched_successfully', 'structured_data_found', 'readable_text_found'];

function structuredText(page: RetrievedPage): string {
  return JSON.stringify(page.structured);
}

export async function researchItem(
  target: PlanTarget & {
    requestedLocationCode: string;
    matchedFamilyId: string | null;
    preferredComparisonUnit: string | null;
    requiredAttributes: string[];
    researchRunId: string;
  },
  deps: PipelineDeps,
  signal?: AbortSignal,
): Promise<ResearchItemResult> {
  const cost = new CostAccumulator(deps.pricing ?? {});
  const reasons: string[] = [];
  const nowIso = deps.nowIso ?? new Date().toISOString();

  // STEP 2 — search planning
  deps.onProgress?.({ stage: 'planning_search', discoveredUrlCount: 0, retrievedPageCount: 0, acceptedObservationCount: 0 });
  const planOut = await deps.planner.plan(target, signal);
  cost.record('planning_call', planOut.usage);
  if (!planOut.plan) {
    return failed(target.requestItemId, cost, ['Search planning failed: ' + planOut.errors.join('; ')]);
  }
  const searchQueries = planOut.plan.queries.map((q) => q.query);

  // STEP 3 — source discovery
  deps.onProgress?.({ stage: 'searching_sources', discoveredUrlCount: 0, retrievedPageCount: 0, acceptedObservationCount: 0 });
  const search = await deps.searchProvider.search(planOut.plan.queries, signal);
  cost.record('search_call', search.usage);
  const seenUrl = new Set<string>();
  const seenDomain = new Map<string, number>();
  const candidates = [] as typeof search.results;
  for (const r of search.results) {
    if (seenUrl.has(r.url)) continue;
    const domainCount = seenDomain.get(r.sourceDomain) ?? 0;
    if (domainCount >= 3) continue; // cap per-domain to encourage source diversity
    seenUrl.add(r.url);
    seenDomain.set(r.sourceDomain, domainCount + 1);
    candidates.push(r);
    if (candidates.length >= deps.config.maxSourcesPerItem) break;
  }
  const discoveredUrls = candidates.map((c) => c.url);

  // STEP 4 + 5 — retrieval then extraction
  const retrievalDiagnostics: RetrievalDiagnostic[] = [];
  const rejectedExtractions: { url: string; errors: string[] }[] = [];
  const accepted: AcceptedObservation[] = [];

  for (const candidate of candidates) {
    deps.onProgress?.({
      stage: 'reading_listings',
      discoveredUrlCount: discoveredUrls.length,
      retrievedPageCount: retrievalDiagnostics.length,
      acceptedObservationCount: accepted.length,
    });
    let page = await deps.pageRetriever.retrieve(candidate.url, signal);
    cost.record('page_retrieval', null, 1);
    let usedBrowser = false;

    // Optional browser fallback — only when normal fetch is demonstrably insufficient.
    if (
      page.outcome === 'dynamic_rendering_required' &&
      deps.config.browserFallbackEnabled &&
      deps.browserRetriever &&
      canBrowserFallback(candidate.url).allowed
    ) {
      page = await deps.browserRetriever.retrieve(candidate.url, signal);
      cost.record('browser_fallback', null, 1);
      usedBrowser = true;
    }

    retrievalDiagnostics.push({
      url: candidate.url,
      finalUrl: page.finalUrl,
      outcome: page.outcome,
      usedBrowserFallback: usedBrowser,
      restrictionReason: page.restrictionReason,
    });

    if (!RETRIEVAL_USABLE.includes(page.outcome)) continue;

    // STEP 5 — extraction (bounded: one retry with validation feedback)
    const extractionContext = {
      requestItemId: target.requestItemId,
      researchRunId: target.researchRunId,
      matrixSummary: {
        canonicalProductName: target.canonicalProductName,
        matchedFamilyId: target.matchedFamilyId,
        requiredAttributes: target.requiredAttributes,
        preferredComparisonUnit: target.preferredComparisonUnit,
        isService: target.isService,
      },
    };
    let extraction = await deps.extractor.extract(page, extractionContext, signal);
    cost.record('extraction_call', extraction.usage);

    // STEP 6 — deterministic validation + normalisation
    const pageEvidence = {
      finalUrl: page.finalUrl,
      url: page.url,
      readableText: page.readableText,
      structuredText: structuredText(page),
    };
    let pageAccepted: ExtractedObservation[] = [];
    let pageErrors: string[] = [];
    const validateBatch = (raws: unknown[]) => {
      pageAccepted = [];
      pageErrors = [];
      for (const raw of raws) {
        const validation = validateExtractedObservation(raw, pageEvidence);
        if (validation.valid) pageAccepted.push(raw as ExtractedObservation);
        else pageErrors.push(...validation.errors);
      }
    };
    validateBatch(extraction.rawObservations);

    // Malformed output is retried ONCE with the exact validator feedback.
    if (extraction.rawObservations.length > 0 && pageAccepted.length === 0 && pageErrors.length > 0) {
      extraction = await deps.extractor.extract(
        page,
        { ...extractionContext, feedback: [...new Set(pageErrors)].slice(0, 12) },
        signal,
      );
      cost.record('retry', extraction.usage);
      validateBatch(extraction.rawObservations);
    }

    if (pageErrors.length > 0) {
      rejectedExtractions.push({ url: candidate.url, errors: [...new Set(pageErrors)] });
    }
    for (const obs of pageAccepted) {
      accepted.push(normalizeObservation(obs, page, target));
    }
  }

  deps.onProgress?.({
    stage: 'matching_specifications',
    discoveredUrlCount: discoveredUrls.length,
    retrievedPageCount: retrievalDiagnostics.length,
    acceptedObservationCount: accepted.length,
  });

  // STEP 6 — independence
  const independenceInputs: IndependenceInput[] = accepted.map((a, i) => ({
    observationId: `${target.requestItemId}:${i}`,
    sourceDomain: a.extraction.sourceDomain,
    sellerNameNormalized: a.extraction.sellerName ? a.extraction.sellerName.trim().toLowerCase() : null,
    descriptionNormalized: (a.extraction.rawDescription ?? a.extraction.rawProductTitle).trim().toLowerCase(),
    underlyingDistributor: a.extraction.brand ? a.extraction.brand.trim().toLowerCase() : null,
  }));
  const independence = computeIndependence(independenceInputs);
  accepted.forEach((a, i) => {
    a.independentGroupId = independence.groupByObservation[`${target.requestItemId}:${i}`];
  });

  // STEP 8 — deterministic result
  const points: PricePoint[] = accepted
    .filter((a) => a.comparable && a.normalizedPrice !== null && a.normalizedUnit !== null)
    .map((a) => ({
      independentGroupId: a.independentGroupId,
      normalizedPrice: a.normalizedPrice as number,
      normalizedUnit: a.normalizedUnit as string,
      sourceTier: tierFor(a.extraction.sourceDomain),
      checkedAtIso: a.extraction.dateChecked,
      locationMatchLevel: a.locationMatchLevel,
      specMatchLevel: a.specMatchLevel,
    }));

  const result = buildResult({ points, nowIso });
  reasons.push(...result.reasons);

  const outcome: ItemOutcome = result.outcome === 'priced' ? 'successful' : 'insufficient_data';

  return {
    requestItemId: target.requestItemId,
    outcome,
    result,
    acceptedObservations: accepted,
    retrievalDiagnostics,
    searchQueries,
    discoveredUrls,
    rejectedExtractions,
    cost: cost.summary(),
    reasons,
  };
}

/** Currency the report compares in. No registered FX conversion exists, so
 *  foreign-currency listings stay stored as evidence but never enter the range. */
const REPORT_CURRENCY = 'NGN';

function normalizeObservation(
  obs: ExtractedObservation,
  page: RetrievedPage,
  target: { requestedLocationCode: string; preferredComparisonUnit: string | null; requiredAttributes: string[] },
): AcceptedObservation {
  let normalizedPrice: number | null = obs.originalPrice;
  let normalizedUnit: string | null = obs.originalUnit;
  let conversionFormula: string | null = null;
  let conversionFactorSource: string | null = null;

  if (
    obs.originalPrice !== null &&
    obs.originalUnit &&
    target.preferredComparisonUnit &&
    obs.originalUnit !== target.preferredComparisonUnit
  ) {
    // unitsPerFrom may be supplied by the extractor only via an explicit attribute;
    // otherwise fixed-factor rules still convert deterministically.
    const perFrom = Number(obs.extractedAttributes?.unitsPerFrom);
    const conv = convertPrice({
      fromUnit: obs.originalUnit,
      toUnit: target.preferredComparisonUnit,
      price: obs.originalPrice,
      unitsPerFrom: Number.isFinite(perFrom) && perFrom > 0 ? perFrom : undefined,
    });
    if (!isConversionFailure(conv)) {
      normalizedPrice = conv.normalizedPrice;
      normalizedUnit = conv.normalizedUnit;
      conversionFormula = conv.formula;
      conversionFactorSource = conv.factorSource;
    }
    // On failure we keep original unit; comparison stays within same-unit points.
  }

  const locationCode = resolveObservationLocation(obs.sellerLocation);
  const locMatch = locationCode ? matchLocation(target.requestedLocationCode, locationCode) : { level: 'national' as const };

  const fingerprint = observationFingerprint({
    familyKey: obs.productFamilyMatch ?? 'custom',
    sourceCode: obs.sourceDomain,
    sellerName: obs.sellerName,
    originalWording: obs.rawProductTitle,
    originalPrice: obs.originalPrice ?? 0,
    originalUnitCode: obs.originalUnit ?? 'unknown',
    listingDate: obs.listingDate,
  });

  const spec = specMatchLevel(obs, target.requiredAttributes);
  const comparabilityNotes: string[] = [];
  let comparable = isComparableFullPrice(obs);
  if (!comparable && obs.originalPrice !== null) {
    comparabilityNotes.push('not a comparable full purchase price (bundle/accessory/used/rental/instalment/deposit)');
  }
  // Currency gate: no registered FX conversion — foreign prices never enter a ₦ range.
  if (comparable && obs.currency && obs.currency.trim().toUpperCase() !== REPORT_CURRENCY) {
    comparable = false;
    comparabilityNotes.push(`listed in ${obs.currency}, not ${REPORT_CURRENCY}; kept as evidence only`);
  }
  // Spec gate: an observation matching <50% of price-changing attributes is a
  // different scope/product — related evidence, never a price point.
  if (comparable && spec === 'partial') {
    comparable = false;
    comparabilityNotes.push('specification match too weak (<50% of required attributes); excluded from range');
  }

  return {
    extraction: obs,
    normalizedPrice,
    normalizedUnit,
    conversionFormula,
    conversionFactorSource,
    duplicateFingerprint: fingerprint,
    locationMatchLevel: locMatch.level,
    specMatchLevel: spec,
    independentGroupId: '',
    comparable,
    comparabilityNotes,
  };
}

/** Best-effort resolution of free-text seller location to a known code (deterministic, no AI). */
function resolveObservationLocation(text: string | null): string | null {
  if (!text) return null;
  // Kept intentionally conservative: exact code passthrough only. Fuzzy
  // label mapping is added in Stage 5 with the full gazetteer.
  return /^ng[-a-z0-9]*$/i.test(text.trim()) ? text.trim().toLowerCase() : null;
}

function tierFor(_domain: string): number {
  // Tier is looked up from the source registry by the persistence layer; the
  // pipeline uses a neutral tier so result maths stay provider-agnostic here.
  return 3;
}

function specMatchLevel(obs: ExtractedObservation, required: string[]): 'exact' | 'close' | 'partial' {
  if (required.length === 0) return 'close';
  const have = required.filter((k) => obs.extractedAttributes && obs.extractedAttributes[k]);
  const ratio = have.length / required.length;
  if (ratio >= 1) return 'exact';
  if (ratio >= 0.5) return 'close';
  return 'partial';
}

function failed(requestItemId: string, cost: CostAccumulator, reasons: string[]): ResearchItemResult {
  return {
    requestItemId,
    outcome: 'failed',
    result: {
      outcome: 'insufficient_data',
      confidence: 'insufficient_data',
      confidenceScore: 0,
      independentSourceCount: 0,
      usedSourceCount: 0,
      rangeLow: null,
      rangeHigh: null,
      median: null,
      typical: null,
      unit: null,
      excludedOutliers: 0,
      reasons,
    },
    acceptedObservations: [],
    retrievalDiagnostics: [],
    searchQueries: [],
    discoveredUrls: [],
    rejectedExtractions: [],
    cost: cost.summary(),
    reasons,
  };
}
