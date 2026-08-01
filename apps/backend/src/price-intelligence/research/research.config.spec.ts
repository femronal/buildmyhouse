import { loadResearchConfig } from './research.config';
import { CostAccumulator, estimateUsd, loadModelPricing } from './cost';

describe('loadResearchConfig', () => {
  it('defaults to the OpenAI-first architecture', () => {
    const c = loadResearchConfig({} as NodeJS.ProcessEnv);
    expect(c.searchProvider).toBe('openai_web_search');
    expect(c.pageRetriever).toBe('direct_public');
    expect(c.browserFallbackEnabled).toBe(false);
    expect(c.extractionModel).toBe('gpt-5.6-sol');
  });

  it('falls back to the matrix model when no explicit extraction model set', () => {
    const c = loadResearchConfig({ PRICE_CHECKER_MATRIX_MODEL: 'gpt-5.6-sol' } as any);
    expect(c.extractionModel).toBe('gpt-5.6-sol');
  });

  it('rejects unknown provider names and falls back to defaults', () => {
    const c = loadResearchConfig({ PRICE_CHECKER_SEARCH_PROVIDER: 'totally-made-up' } as any);
    expect(c.searchProvider).toBe('openai_web_search');
  });

  it('reads numeric limits and browser flag from env', () => {
    const c = loadResearchConfig({
      PRICE_CHECKER_MAX_SEARCH_QUERIES: '4',
      PRICE_CHECKER_BROWSER_FALLBACK_ENABLED: 'true',
    } as any);
    expect(c.maxSearchQueries).toBe(4);
    expect(c.browserFallbackEnabled).toBe(true);
  });
});

describe('cost estimation', () => {
  it('returns 0 USD (tokens only) when pricing is unknown — never fabricates a dollar figure', () => {
    const usd = estimateUsd({ model: 'gpt-5.6-sol', inputTokens: 1000, outputTokens: 500, cachedTokens: 0, reasoningTokens: 100 }, {});
    expect(usd).toBe(0);
  });

  it('computes USD when pricing is provided', () => {
    const pricing = loadModelPricing({
      PRICE_CHECKER_MODEL_PRICING_JSON: JSON.stringify({ 'gpt-5.6-sol': { inputPerM: 2, outputPerM: 8, cachedInputPerM: 1 } }),
    } as any);
    const usd = estimateUsd(
      { model: 'gpt-5.6-sol', inputTokens: 1_000_000, outputTokens: 1_000_000, cachedTokens: 0, reasoningTokens: 0 },
      pricing,
    );
    expect(usd).toBe(10);
  });

  it('CostAccumulator summarises calls and marks pricing known/unknown', () => {
    const acc = new CostAccumulator({});
    acc.record('planning_call', { model: 'gpt-5.6-sol', inputTokens: 100, outputTokens: 50, cachedTokens: 0, reasoningTokens: 0 });
    acc.record('search_call', { model: 'gpt-5.6-sol', inputTokens: 200, outputTokens: 80, cachedTokens: 0, reasoningTokens: 0 });
    acc.record('page_retrieval', null, 3);
    const s = acc.summary();
    expect(s.planningCalls).toBe(1);
    expect(s.searchCalls).toBe(1);
    expect(s.pageRetrievals).toBe(3);
    expect(s.pricingKnown).toBe(false);
  });
});
