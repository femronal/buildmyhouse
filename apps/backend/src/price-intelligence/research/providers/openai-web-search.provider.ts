/**
 * Stage 4 STEP 3 — OpenAIWebSearchProvider (default, founder-approved).
 *
 * Uses the OpenAI Responses API `web_search` tool for source DISCOVERY only.
 * Returns candidate URLs + provenance. It does NOT turn snippets into
 * authoritative observations — the pipeline re-fetches each candidate through
 * the first-party retriever and extracts deterministically. Hallucinated URLs
 * are harmless here: they fail at the retrieval step.
 */
import OpenAI from 'openai';
import {
  SearchProvider,
  SearchProviderResult,
  SearchQuerySpec,
  SearchResult,
} from './types';
import { ResearchConfig } from '../research.config';
import { canDiscover, domainOf } from '../source-registry';
import { collectCitationUrls, collectSearchActions, normalizeUsage, parseJsonFromText } from './openai-client';

export class OpenAIWebSearchProvider implements SearchProvider {
  readonly name = 'openai_web_search';
  constructor(
    private readonly client: OpenAI,
    private readonly config: ResearchConfig,
  ) {}

  async search(queries: SearchQuerySpec[], signal?: AbortSignal): Promise<SearchProviderResult> {
    const queryList = queries.slice(0, this.config.maxSearchQueries);
    const prompt = [
      'You are the source-DISCOVERY step of a Nigerian construction price-intelligence pipeline.',
      'Use web search to find CURRENT public listing/product pages for the item described by these queries.',
      'Run each query, prefer Nigerian sources, and collect candidate result pages.',
      '',
      'Queries:',
      ...queryList.map((q, i) => `${i + 1}. ${q.query}  [intent: ${q.intent}]`),
      '',
      'Return STRICT JSON ONLY (no prose) as an array of candidates:',
      '[{"url": "...", "title": "...", "snippet": "...", "fromQuery": "..."}]',
      'Rules:',
      '- Only include URLs that actually appeared in your web search results.',
      '- Do NOT invent URLs, prices, or snippets.',
      '- Prefer product/listing pages over category pages.',
      `- Return at most ${this.config.maxSourcesPerItem} candidates.`,
    ].join('\n');

    let response: any;
    try {
      response = await (this.client as any).responses.create(
        {
          model: this.config.extractionModel,
          tools: [{ type: 'web_search' }],
          input: prompt,
          // Reasoning tokens count against output for this model family; a low
          // cap truncates the JSON candidate list mid-stream.
          max_output_tokens: 8000,
        },
        signal ? { signal } : undefined,
      );
    } catch (err) {
      return {
        provider: this.name,
        results: [],
        usage: null,
        responseId: null,
      };
    }

    const usage = normalizeUsage(this.config.extractionModel, response.usage);
    const responseId: string | null = response.id ?? null;

    // Primary: JSON candidate list the model returned.
    const parsed = parseJsonFromText(response.output_text ?? '');
    const candidates: SearchResult[] = [];
    const seen = new Set<string>();

    const push = (url: string, title: string | null, snippet: string | null, fromQuery: string) => {
      if (!url || seen.has(url)) return;
      if (!/^https?:\/\//i.test(url)) return;
      if (!canDiscover(url).allowed) return; // per-source discovery policy
      seen.add(url);
      candidates.push({ url, title, snippet, sourceDomain: domainOf(url), fromQuery });
    };

    if (Array.isArray(parsed)) {
      for (const c of parsed) {
        if (c && typeof c === 'object' && typeof (c as any).url === 'string') {
          const r = c as any;
          push(r.url, r.title ?? null, r.snippet ?? null, r.fromQuery ?? '');
        }
      }
    }

    // Supplement with citation URLs the model actually opened (high signal).
    for (const cite of collectCitationUrls(response)) {
      push(cite.url, cite.title, null, 'citation');
    }

    return {
      provider: this.name,
      results: candidates.slice(0, this.config.maxSourcesPerItem),
      usage,
      responseId,
    };
  }
}
