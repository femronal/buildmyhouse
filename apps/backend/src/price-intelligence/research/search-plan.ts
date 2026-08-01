/**
 * Stage 4 STEP 2 — dynamic search-plan generation.
 *
 * GPT-5.6 Sol proposes a bounded set of query variations from the temporary
 * matrix. This module validates that plan strictly and clamps it to the
 * configured limits so the pipeline can never launch unbounded/recursive
 * searching. Query CONTENT is AI-generated (product understanding, section
 * 2A); bounding and acceptance are deterministic (section 2C).
 */
import { SearchQuerySpec } from './providers/types';

export const SEARCH_PLAN_SCHEMA_VERSION = 1;

export interface SearchPlan {
  requestItemId: string;
  schemaVersion: number;
  queries: SearchQuerySpec[];
  /** AI's stated source-type priorities (e.g. manufacturer > distributor > marketplace). */
  sourceTypePriority: string[];
  notes: string;
}

export interface SearchPlanValidation {
  valid: boolean;
  errors: string[];
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function validateSearchPlan(raw: unknown): SearchPlanValidation {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['search plan is not an object'] };
  }
  const p = raw as Record<string, unknown>;
  if (!isNonEmptyString(p.requestItemId)) errors.push('requestItemId missing');
  if (p.schemaVersion !== SEARCH_PLAN_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${SEARCH_PLAN_SCHEMA_VERSION}`);
  }
  if (!Array.isArray(p.queries) || p.queries.length === 0) {
    errors.push('queries must be a non-empty array');
  } else {
    p.queries.forEach((q, i) => {
      if (!q || typeof q !== 'object') {
        errors.push(`queries[${i}] not an object`);
        return;
      }
      const query = q as Record<string, unknown>;
      if (!isNonEmptyString(query.query)) errors.push(`queries[${i}].query missing`);
      if (!isNonEmptyString(query.intent)) errors.push(`queries[${i}].intent missing`);
      if (!Array.isArray(query.targetSourceTypes) || !query.targetSourceTypes.every((t) => typeof t === 'string')) {
        errors.push(`queries[${i}].targetSourceTypes must be string[]`);
      }
    });
  }
  if (!Array.isArray(p.sourceTypePriority) || !p.sourceTypePriority.every((t) => typeof t === 'string')) {
    errors.push('sourceTypePriority must be string[]');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Deterministically bound a validated plan: dedupe identical queries
 * (case-insensitive), then clamp to maxQueries. Never expands the plan.
 */
export function boundSearchPlan(plan: SearchPlan, maxQueries: number): SearchPlan {
  const seen = new Set<string>();
  const deduped: SearchQuerySpec[] = [];
  for (const q of plan.queries) {
    const key = q.query.trim().toLowerCase();
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      query: q.query.trim(),
      intent: q.intent.trim(),
      targetSourceTypes: q.targetSourceTypes,
    });
  }
  return { ...plan, queries: deduped.slice(0, Math.max(1, maxQueries)) };
}
