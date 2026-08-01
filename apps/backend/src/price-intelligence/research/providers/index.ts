/**
 * Provider factory. Chooses implementations from env config. Only the
 * OpenAI-first defaults are implemented in Stage 4; optional external
 * providers throw a clear "not enabled" error until benchmark evidence
 * justifies them and the founder approves (section 7/8).
 */
import OpenAI from 'openai';
import { ResearchConfig } from '../research.config';
import { SearchProvider, PageRetriever, ObservationExtractor, BrowserRetriever } from './types';
import { OpenAIWebSearchProvider } from './openai-web-search.provider';
import { DirectPublicPageRetriever } from './direct-page-retriever';
import { OpenAIPriceObservationExtractor } from './openai-extractor.provider';

export function buildSearchProvider(client: OpenAI, config: ResearchConfig): SearchProvider {
  switch (config.searchProvider) {
    case 'openai_web_search':
      return new OpenAIWebSearchProvider(client, config);
    default:
      throw new Error(
        `Search provider '${config.searchProvider}' is not enabled. Only 'openai_web_search' ships in Stage 4; ` +
          'external providers require benchmark evidence + founder approval (see provider decision record).',
      );
  }
}

export function buildPageRetriever(config: ResearchConfig): PageRetriever {
  switch (config.pageRetriever) {
    case 'direct_public':
      return new DirectPublicPageRetriever(config);
    default:
      throw new Error(
        `Page retriever '${config.pageRetriever}' is not enabled. Only 'direct_public' ships in Stage 4; ` +
          'external retrievers require benchmark evidence + founder approval (see provider decision record).',
      );
  }
}

export function buildExtractor(client: OpenAI, config: ResearchConfig): ObservationExtractor {
  return new OpenAIPriceObservationExtractor(client, config);
}

export function buildBrowserRetriever(_config: ResearchConfig): BrowserRetriever | undefined {
  // Controlled browser / computer-use fallback is not implemented in Stage 4.
  // It is gated by PRICE_CHECKER_BROWSER_FALLBACK_ENABLED and a future,
  // benchmark-justified, founder-approved implementation.
  return undefined;
}

export * from './types';
