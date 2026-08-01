/**
 * Stage 4 live-research configuration (env-driven, never hard-coded provider
 * names). Founder-approved OpenAI-first architecture: OpenAI web search for
 * discovery, a first-party SSRF-safe direct page retriever, and GPT-5.6 Sol
 * for reasoning/extraction. External search/extraction providers are optional
 * and only introduced with benchmark evidence + founder approval.
 *
 * ADR: docs/price-checker/adr/0001-openai-first-live-research.md
 */

export type SearchProviderName = 'openai_web_search' | 'serper' | 'serpapi' | 'tavily';
export type PageRetrieverName = 'direct_public' | 'firecrawl' | 'scrapingbee' | 'apify';

export interface ResearchConfig {
  /** Reasoning + extraction model. Founder-approved primary: gpt-5.6-sol. */
  extractionModel: string;
  /** Search-plan generation model (defaults to the extraction model). */
  planningModel: string;
  searchProvider: SearchProviderName;
  pageRetriever: PageRetrieverName;
  browserFallbackEnabled: boolean;
  maxSearchQueries: number;
  maxSourcesPerItem: number;
  researchTimeoutMs: number;
  sourceCacheTtlHours: number;
  /** Max bytes a single page fetch may read (retrieval safety). */
  maxPageBytes: number;
  pageFetchTimeoutMs: number;
  pageFetchMaxRetries: number;
  userAgent: string;
}

function num(value: string | undefined, fallback: number): number {
  const n = value === undefined ? NaN : Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === 'true';
}

/**
 * Reads config from an env map (defaults to process.env). Pure and testable.
 * Unknown provider names fall back to the OpenAI-first defaults rather than
 * silently trusting arbitrary strings.
 */
export function loadResearchConfig(env: NodeJS.ProcessEnv = process.env): ResearchConfig {
  const extractionModel =
    env.PRICE_CHECKER_EXTRACTION_MODEL?.trim() ||
    env.PRICE_CHECKER_MATRIX_MODEL?.trim() ||
    'gpt-5.6-sol';

  const searchProviderRaw = (env.PRICE_CHECKER_SEARCH_PROVIDER?.trim() || 'openai_web_search') as SearchProviderName;
  const pageRetrieverRaw = (env.PRICE_CHECKER_PAGE_RETRIEVER?.trim() || 'direct_public') as PageRetrieverName;

  const knownSearch: SearchProviderName[] = ['openai_web_search', 'serper', 'serpapi', 'tavily'];
  const knownRetrievers: PageRetrieverName[] = ['direct_public', 'firecrawl', 'scrapingbee', 'apify'];

  return {
    extractionModel,
    planningModel: env.PRICE_CHECKER_PLANNING_MODEL?.trim() || extractionModel,
    searchProvider: knownSearch.includes(searchProviderRaw) ? searchProviderRaw : 'openai_web_search',
    pageRetriever: knownRetrievers.includes(pageRetrieverRaw) ? pageRetrieverRaw : 'direct_public',
    browserFallbackEnabled: bool(env.PRICE_CHECKER_BROWSER_FALLBACK_ENABLED, false),
    maxSearchQueries: num(env.PRICE_CHECKER_MAX_SEARCH_QUERIES, 6),
    maxSourcesPerItem: num(env.PRICE_CHECKER_MAX_SOURCES_PER_ITEM, 12),
    researchTimeoutMs: num(env.PRICE_CHECKER_RESEARCH_TIMEOUT_MS, 120_000),
    sourceCacheTtlHours: num(env.PRICE_CHECKER_SOURCE_CACHE_TTL_HOURS, 72),
    maxPageBytes: num(env.PRICE_CHECKER_MAX_PAGE_BYTES, 3_000_000),
    pageFetchTimeoutMs: num(env.PRICE_CHECKER_PAGE_FETCH_TIMEOUT_MS, 15_000),
    pageFetchMaxRetries: num(env.PRICE_CHECKER_PAGE_FETCH_MAX_RETRIES, 2),
    userAgent:
      env.PRICE_CHECKER_USER_AGENT?.trim() ||
      'BuildMyHousePriceChecker/1.0 (+https://buildmyhouse.app/price-checker; research bot; contact: support@buildmyhouse.app)',
  };
}
