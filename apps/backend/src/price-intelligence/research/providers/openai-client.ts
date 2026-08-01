/**
 * Thin shared OpenAI client factory + Responses API helpers for Stage 4.
 * Keeps the (untyped-in-this-SDK-version) Responses surface in one place and
 * normalises token usage across calls for cost logging.
 */
import OpenAI from 'openai';
import { TokenUsage } from './types';

export function createOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY;
  return new OpenAI({ apiKey: key || 'sk-mock-key' });
}

export function normalizeUsage(model: string, usage: unknown): TokenUsage | null {
  if (!usage || typeof usage !== 'object') return null;
  const u = usage as Record<string, any>;
  return {
    model,
    inputTokens: u.input_tokens ?? u.prompt_tokens ?? 0,
    outputTokens: u.output_tokens ?? u.completion_tokens ?? 0,
    cachedTokens: u.input_tokens_details?.cached_tokens ?? 0,
    reasoningTokens: u.output_tokens_details?.reasoning_tokens ?? 0,
  };
}

/** Collect url_citation annotations from a Responses API result. */
export function collectCitationUrls(response: any): { url: string; title: string | null }[] {
  const out: { url: string; title: string | null }[] = [];
  for (const item of response?.output ?? []) {
    if (item.type !== 'message') continue;
    for (const content of item.content ?? []) {
      for (const ann of content.annotations ?? []) {
        if (ann.type === 'url_citation' && typeof ann.url === 'string') {
          out.push({ url: ann.url, title: ann.title ?? null });
        }
      }
    }
  }
  return out;
}

/** Collect the search queries the web_search tool actually ran (provenance). */
export function collectSearchActions(response: any): { type: string; queries?: string[]; url?: string }[] {
  const out: { type: string; queries?: string[]; url?: string }[] = [];
  for (const item of response?.output ?? []) {
    if (item.type === 'web_search_call' && item.action) {
      out.push({ type: item.action.type, queries: item.action.queries, url: item.action.url });
    }
  }
  return out;
}

/** Best-effort extraction of a JSON value from model text (handles ```json fences). */
export function parseJsonFromText(text: string): unknown {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const trimmed = candidate.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // try to locate the first {...} or [...] block
    const objMatch = trimmed.match(/[[{][\s\S]*[\]}]/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
