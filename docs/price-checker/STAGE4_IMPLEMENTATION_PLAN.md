# Stage 4 Implementation Plan & Validation Checklist — AI-first live research

**Founder decisions honoured:** OpenAI-first architecture (ADR-0001); no external subscriptions; no merchant-data prerequisites; not limited to the 25 Level 1 families; AI never fabricates retrieval results; deterministic code owns all maths and gates.

## Module map (`apps/backend/src/price-intelligence/research/`)

| File | Responsibility |
|---|---|
| `research.config.ts` | Env-driven config (providers, model, limits, TTLs, user agent). |
| `providers/types.ts` | `SearchProvider`, `PageRetriever`, `BrowserRetriever`, `ObservationExtractor` + I/O types, 13 retrieval outcomes. |
| `providers/openai-client.ts` | Responses API helpers: usage normalisation, citation/search-action collection, lenient JSON parse. |
| `providers/openai-web-search.provider.ts` | STEP 3 discovery via `web_search` tool; per-source discovery policy applied; provenance kept. |
| `providers/direct-page-retriever.ts` | STEP 4 first-party fetch: UA, timeout, bounded retries, size cap, scheme rejection, DNS/private-IP SSRF guard incl. redirects, robots.txt, per-source fetch policy; JSON-LD/OG/microdata/readable-text parsing (dependency-free). |
| `providers/openai-extractor.provider.ts` | STEP 5 GPT-5.6 Sol extraction, NO tools, strict schema + "must not infer" rules; retry prompt carries validator feedback. |
| `providers/index.ts` | Env-based factory; unimplemented providers fail fast. |
| `search-plan.ts` | STEP 2 plan schema, strict validation, dedupe + clamp (no unbounded searching). |
| `planner.ts` | AI plan generation from the temporary matrix (queries combine name/alias/brand/spec/unit/location/year/intent). |
| `extraction-schema.ts` | STEP 6 gate: full field/type/enum/tri-state checks; source-URL grounding; verbatim-span + price-digit grounding; instalment/deposit/accessory/used/bundle rules; `isComparableFullPrice`. |
| `independence.ts` | Section 13: same-domain+seller, hashed private identifier, syndicated/duplicated description, same-distributor grouping; raw vs independent counts; identifiers hashed, never exposed. |
| `cache.ts` | Section 15: cache identities (family+spec+location+quantity class+condition+delivery+installation), layer keys, freshness states. |
| `cost.ts` | Section 16: per-call cost events, token totals, USD only when account pricing configured (never fabricated). |
| `result.ts` | STEP 8: per-independent-group price points, modal unit, MAD outlier exclusion, range/median, deterministic confidence (<3 independent ⇒ low; none ⇒ insufficient_data). |
| `pipeline.ts` | STEP 1–8 orchestration with injected providers; returns observations + diagnostics + cost; persistence maps onto Stage 3 tables. |
| `source-registry.ts` | Section 11: per-source policy (discovery/fetch/browser eligibility, tier, robots/terms status, rate policy); Jiji ≠ Jumia ≠ Konga ≠ Facebook. |
| `benchmark/benchmark-requests.ts` | 12 representative requests (incl. custom, service, bundle, weak coverage, expected-insufficient). |
| `benchmark/metrics.ts` | Section 8 measures + ungrounded-observation guard. |
| `research-diagnostics.{service,controller}.ts` | Admin read-only diagnostics: config, runs per request, observations per family. |

Runner: `apps/backend/scripts/price-checker-benchmark.ts` (explicit integration command; not part of jest).

## Pipeline (per request item)

1. **Request prep** — caller confirms matrix readiness via Stage 2 `decideReadiness`; uncertain matrices stop for clarification before any spend.
2. **Search planning** — GPT-5.6 plan → `validateSearchPlan` → `boundSearchPlan` (dedupe + clamp to `PRICE_CHECKER_MAX_SEARCH_QUERIES`).
3. **Source discovery** — `web_search` tool; candidates = model's JSON list ∪ citation URLs; per-source discovery policy; URL+domain dedupe (≤3/domain, ≤`PRICE_CHECKER_MAX_SOURCES_PER_ITEM` total); provenance preserved.
4. **Page retrieval** — direct fetch with all safeguards; outcome recorded per URL (13 states); optional browser fallback only if enabled + policy allows + `dynamic_rendering_required`.
5. **AI extraction** — page evidence + matrix to GPT-5.6 Sol (no tools); strict JSON.
6. **Deterministic validation** — grounding + type/enum/tri-state gates; one bounded retry with validator feedback; unit conversion via registered rules only (failures keep original units); duplicate fingerprints; location match level; bundles/accessories/used/rental/instalment/deposit excluded from full-price comparison.
7. **Observation storage** — append-only into Stage 3 `PriceObservation` (existing `planObservationIngest` supersession/dup logic); source URL + check date always retained.
8. **Result generation** — independence grouping → per-group points → range/median/confidence deterministically; GPT-5.6 may word the report using ONLY validated numbers.
9. **Credit finalisation** — Stage 1 rules via existing `billing/credits.ts` (insufficient-data items free; fully failed report releases the reserve).

## Service & labour research

Supported by the same pipeline (`isService` flows to planner + extractor). Results labelled *"Observed advertised or quoted service range"*; unlike scopes are separated by required attributes (basis, unit, city, finish level, …); insufficient evidence returns *"Insufficient comparable public data for this exact service scope."*

## Caching & free tier

Free daily check = cache read ONLY (no code path from free checks to the live pipeline). Paid requests may reuse fresh observations and research only stale/missing evidence. Cache keys are spec-sensitive; a materially different spec can never hit another spec's entry (tested).

## Validation checklist (Stage 4)

- [x] 57 research unit tests green (`npx jest src/price-intelligence/research`)
- [x] Anti-fabrication proven in tests: invented source URL rejected; ungrounded price rejected; policy-blocked page yields no observation
- [x] Type check + build pass
- [x] Live capability probe: Responses API + `web_search` on `gpt-5.6-sol` returns real cited Nigerian listings (`scripts/price-checker-probe-websearch.ts`)
- [x] Live benchmark harness runs end-to-end; report at `scripts/data/benchmark-results.json`; ungrounded-observation count enforced = 0
- [ ] One-time founder/admin QA of benchmark observations against the actual public pages (not a recurring workflow)

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `PRICE_CHECKER_EXTRACTION_MODEL` | `gpt-5.6-sol` (falls back to `PRICE_CHECKER_MATRIX_MODEL`) | Reasoning/extraction model |
| `PRICE_CHECKER_PLANNING_MODEL` | extraction model | Search-plan model |
| `PRICE_CHECKER_SEARCH_PROVIDER` | `openai_web_search` | Search provider name |
| `PRICE_CHECKER_PAGE_RETRIEVER` | `direct_public` | Page retriever name |
| `PRICE_CHECKER_BROWSER_FALLBACK_ENABLED` | `false` | Browser fallback gate |
| `PRICE_CHECKER_MAX_SEARCH_QUERIES` | `6` | Plan clamp |
| `PRICE_CHECKER_MAX_SOURCES_PER_ITEM` | `12` | Candidate clamp |
| `PRICE_CHECKER_RESEARCH_TIMEOUT_MS` | `120000` | Per-item budget |
| `PRICE_CHECKER_SOURCE_CACHE_TTL_HOURS` | `72` | Cache freshness |
| `PRICE_CHECKER_MAX_PAGE_BYTES` | `3000000` | Fetch size cap |
| `PRICE_CHECKER_PAGE_FETCH_TIMEOUT_MS` | `15000` | Per-fetch timeout |
| `PRICE_CHECKER_PAGE_FETCH_MAX_RETRIES` | `2` | Bounded retries |
| `PRICE_CHECKER_USER_AGENT` | BuildMyHouse research UA | Clear self-identification |
| `PRICE_CHECKER_MODEL_PRICING_JSON` | unset | USD/1M-token pricing map; without it costs are reported in tokens, never invented dollars |
