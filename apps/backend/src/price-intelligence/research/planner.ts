/**
 * Stage 4 STEP 2 — AI search-plan generation.
 *
 * GPT-5.6 Sol turns the temporary matrix into a bounded set of query
 * variations (product understanding, section 2A). The plan is validated and
 * clamped deterministically (section 2C) before any search runs.
 */
import OpenAI from 'openai';
import { ResearchConfig } from './research.config';
import { SearchPlan, SEARCH_PLAN_SCHEMA_VERSION, validateSearchPlan, boundSearchPlan } from './search-plan';
import { normalizeUsage, parseJsonFromText } from './providers/openai-client';
import { TokenUsage } from './providers/types';

export interface PlanTarget {
  requestItemId: string;
  canonicalProductName: string;
  aliases: string[];
  brand?: string | null;
  model?: string | null;
  specification: Record<string, string>;
  locationLabel: string;
  isService: boolean;
  currentYear: number;
}

export interface PlannerOutput {
  plan: SearchPlan | null;
  usage: TokenUsage | null;
  responseId: string | null;
  errors: string[];
}

export async function generateSearchPlan(
  client: OpenAI,
  config: ResearchConfig,
  target: PlanTarget,
  signal?: AbortSignal,
): Promise<PlannerOutput> {
  const prompt = [
    'Generate a bounded web-search plan to find CURRENT Nigerian prices for the item below.',
    'Combine product name, Nigerian aliases, brand/model, specification, capacity/size/unit, and location.',
    'Produce diverse query variations (exact spec + location; exact spec + Nigeria; alias; brand+model;',
    'product + supplier; product + marketplace; alternative spelling). Do not depend on one query or marketplace.',
    '',
    `Item: ${target.canonicalProductName}`,
    `Aliases: ${target.aliases.join(', ') || '(none)'}`,
    `Brand: ${target.brand ?? 'unknown'}  Model: ${target.model ?? 'unknown'}`,
    `Specification: ${JSON.stringify(target.specification)}`,
    `Location: ${target.locationLabel}`,
    `Type: ${target.isService ? 'service/labour' : 'physical product'}`,
    `Year: ${target.currentYear}`,
    '',
    'Return STRICT JSON ONLY:',
    '{',
    `  "requestItemId": "${target.requestItemId}",`,
    `  "schemaVersion": ${SEARCH_PLAN_SCHEMA_VERSION},`,
    `  "queries": [{"query": "...", "intent": "...", "targetSourceTypes": ["marketplace"|"manufacturer"|"distributor"|"ecommerce"|"directory"]}],`,
    '  "sourceTypePriority": ["manufacturer", "authorised_distributor", "established_ecommerce", "classified_marketplace"],',
    '  "notes": "brief"',
    '}',
    `Produce between 3 and ${config.maxSearchQueries} queries. No prose outside the JSON.`,
  ].join('\n');

  let response: any;
  try {
    response = await (client as any).responses.create(
      {
        model: config.planningModel,
        input: prompt,
        max_output_tokens: 4000,
      },
      signal ? { signal } : undefined,
    );
  } catch (err) {
    return { plan: null, usage: null, responseId: null, errors: [err instanceof Error ? err.message : String(err)] };
  }

  const usage = normalizeUsage(config.planningModel, response.usage);
  const parsed = parseJsonFromText(response.output_text ?? '');
  const validation = validateSearchPlan(parsed);
  if (!validation.valid) {
    return { plan: null, usage, responseId: response.id ?? null, errors: validation.errors };
  }
  const bounded = boundSearchPlan(parsed as SearchPlan, config.maxSearchQueries);
  return { plan: bounded, usage, responseId: response.id ?? null, errors: [] };
}
