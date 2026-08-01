/**
 * Stage 4 provider abstractions. These interfaces separate the three concerns
 * the founder mandated:
 *   A. product understanding + extraction reasoning  -> ObservationExtractor
 *   B. information retrieval (search / fetch)         -> SearchProvider, PageRetriever, BrowserRetriever
 *   C. deterministic processing                       -> application code (NOT here)
 *
 * The initial, founder-approved implementations are OpenAI-first
 * (OpenAIWebSearchProvider, DirectPublicPageRetriever, OpenAIPriceObservationExtractor).
 * Optional external providers (Serper/SerpApi/Tavily/Firecrawl/ScrapingBee/
 * Apify/controlled browser) implement the same interfaces but are never
 * mandatory and are only wired in via env config + benchmark-justified,
 * founder-approved decisions.
 */

export interface TokenUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
}

// ---------------------------------------------------------------------------
// A. Search (source discovery)
// ---------------------------------------------------------------------------

export interface SearchQuerySpec {
  /** The exact query string issued to the search tool. */
  query: string;
  /** Why this query variation was generated (provenance/audit). */
  intent: string;
  /** Source types this query is aimed at (e.g. 'marketplace', 'manufacturer'). */
  targetSourceTypes: string[];
}

export interface SearchResult {
  url: string;
  title: string | null;
  snippet: string | null;
  sourceDomain: string;
  /** The query that surfaced this result (provenance). */
  fromQuery: string;
}

export interface SearchProviderResult {
  provider: string;
  results: SearchResult[];
  usage: TokenUsage | null;
  /** Raw response id for audit/reproducibility, where the provider returns one. */
  responseId: string | null;
}

export interface SearchProvider {
  readonly name: string;
  search(queries: SearchQuerySpec[], signal?: AbortSignal): Promise<SearchProviderResult>;
}

// ---------------------------------------------------------------------------
// B. Page retrieval
// ---------------------------------------------------------------------------

export type RetrievalOutcome =
  | 'fetched_successfully'
  | 'structured_data_found'
  | 'readable_text_found'
  | 'blocked_by_source'
  | 'login_required'
  | 'captcha_required'
  | 'robots_or_policy_restricted'
  | 'dynamic_rendering_required'
  | 'no_useful_content'
  | 'timeout'
  | 'unsafe_url_rejected'
  | 'unsupported_content'
  | 'fetch_failed';

export interface StructuredProductData {
  /** JSON-LD Product blocks, Open Graph product metadata, microdata, etc. */
  jsonLd: unknown[];
  openGraph: Record<string, string>;
  microdata: Record<string, string>;
}

export interface RetrievedPage {
  url: string;
  finalUrl: string;
  sourceDomain: string;
  outcome: RetrievalOutcome;
  httpStatus: number | null;
  contentType: string | null;
  title: string | null;
  /** Cleaned readable text (bounded). Empty when nothing useful retrieved. */
  readableText: string;
  structured: StructuredProductData;
  fetchedAt: string; // ISO datetime = the authoritative "date checked"
  bytes: number;
  /** Present when outcome indicates a restriction/failure. */
  restrictionReason?: string;
}

export interface PageRetriever {
  readonly name: string;
  retrieve(url: string, signal?: AbortSignal): Promise<RetrievedPage>;
}

/** Optional higher-cost fallback; disabled by default (env-gated). */
export interface BrowserRetriever {
  readonly name: string;
  retrieve(url: string, signal?: AbortSignal): Promise<RetrievedPage>;
}

// ---------------------------------------------------------------------------
// A/B. Extraction (reasoning over retrieved evidence only)
// ---------------------------------------------------------------------------

export interface ExtractionContext {
  requestItemId: string;
  researchRunId: string;
  /** Matrix summary the extractor must map the listing onto (never invent). */
  matrixSummary: {
    canonicalProductName: string;
    matchedFamilyId: string | null;
    requiredAttributes: string[];
    preferredComparisonUnit: string | null;
    isService: boolean;
  };
  /** Validation errors from a rejected previous attempt (bounded retry). */
  feedback?: string[];
}

export interface ObservationExtractor {
  readonly name: string;
  /**
   * Extract structured observation(s) from ONE retrieved page. The extractor
   * must only assert facts supported by `page` content; when the page is
   * silent it must return null/unknown, never a guess.
   */
  extract(
    page: RetrievedPage,
    context: ExtractionContext,
    signal?: AbortSignal,
  ): Promise<ExtractionProviderResult>;
}

export interface ExtractionProviderResult {
  provider: string;
  model: string | null;
  responseId: string | null;
  /** Raw (still-untrusted) extraction objects; validated deterministically later. */
  rawObservations: unknown[];
  usage: TokenUsage | null;
  /** Provider-level error, when the call failed or output was unusable. */
  error?: string;
}
