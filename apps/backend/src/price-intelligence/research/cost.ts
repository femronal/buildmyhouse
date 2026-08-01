/**
 * Stage 4 section 16 — cost logging.
 *
 * The ₦15,000 paid report must remain economically measurable, so every model
 * call, search call, retrieval and browser fallback records its cost. We do
 * NOT assume GPT-5.6 Sol is automatically cheaper — cost is measured, not
 * asserted. Pricing per model is env-configurable (USD per 1M tokens) so the
 * figures track the founder's actual account pricing.
 */
import { TokenUsage } from './providers/types';

export type CostEventKind =
  | 'search_call'
  | 'extraction_call'
  | 'planning_call'
  | 'retry'
  | 'page_retrieval'
  | 'browser_fallback';

export interface CostEvent {
  kind: CostEventKind;
  model: string | null;
  usage: TokenUsage | null;
  /** Non-token unit count (e.g. 1 page fetch, 1 browser call). */
  units: number;
  estimatedUsd: number;
}

export interface ModelPricing {
  /** USD per 1,000,000 input tokens. */
  inputPerM: number;
  /** USD per 1,000,000 output tokens (incl. reasoning). */
  outputPerM: number;
  /** USD per 1,000,000 cached input tokens. */
  cachedInputPerM: number;
}

/**
 * Placeholder pricing. Real values must be set from the founder's OpenAI
 * account pricing via env (PRICE_CHECKER_MODEL_PRICING_JSON) before unit
 * economics are quoted. Absent that, cost is reported in tokens and the USD
 * figure is clearly marked estimated.
 */
export function loadModelPricing(env: NodeJS.ProcessEnv = process.env): Record<string, ModelPricing> {
  const raw = env.PRICE_CHECKER_MODEL_PRICING_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, ModelPricing>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function estimateUsd(usage: TokenUsage | null, pricing: Record<string, ModelPricing>): number {
  if (!usage) return 0;
  const p = pricing[usage.model];
  if (!p) return 0; // unknown pricing -> report tokens only, not a fabricated dollar figure
  const inputCost = ((usage.inputTokens - usage.cachedTokens) / 1_000_000) * p.inputPerM;
  const cachedCost = (usage.cachedTokens / 1_000_000) * p.cachedInputPerM;
  const outputCost = (usage.outputTokens / 1_000_000) * p.outputPerM;
  return Number((inputCost + cachedCost + outputCost).toFixed(6));
}

export class CostAccumulator {
  private events: CostEvent[] = [];
  constructor(private readonly pricing: Record<string, ModelPricing> = {}) {}

  record(kind: CostEventKind, usage: TokenUsage | null, units = 0): void {
    this.events.push({
      kind,
      model: usage?.model ?? null,
      usage,
      units,
      estimatedUsd: estimateUsd(usage, this.pricing),
    });
  }

  get all(): readonly CostEvent[] {
    return this.events;
  }

  summary() {
    const totals = {
      searchCalls: 0,
      extractionCalls: 0,
      planningCalls: 0,
      retries: 0,
      pageRetrievals: 0,
      browserFallbacks: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      reasoningTokens: 0,
      estimatedUsd: 0,
      pricingKnown: Object.keys(this.pricing).length > 0,
    };
    for (const e of this.events) {
      if (e.kind === 'search_call') totals.searchCalls++;
      if (e.kind === 'extraction_call') totals.extractionCalls++;
      if (e.kind === 'planning_call') totals.planningCalls++;
      if (e.kind === 'retry') totals.retries++;
      if (e.kind === 'page_retrieval') totals.pageRetrievals += e.units || 1;
      if (e.kind === 'browser_fallback') totals.browserFallbacks += e.units || 1;
      if (e.usage) {
        totals.inputTokens += e.usage.inputTokens;
        totals.outputTokens += e.usage.outputTokens;
        totals.cachedTokens += e.usage.cachedTokens;
        totals.reasoningTokens += e.usage.reasoningTokens;
      }
      totals.estimatedUsd += e.estimatedUsd;
    }
    totals.estimatedUsd = Number(totals.estimatedUsd.toFixed(6));
    return totals;
  }
}
