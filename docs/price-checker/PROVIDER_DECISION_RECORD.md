# Provider Decision Record — Price Checker Stage 4

**Status:** OpenAI-first (no external provider required). Founder-approved 2026-07-30.
**Rule:** an external search/extraction provider may become a production dependency ONLY after the benchmark demonstrates a material gap, and the recommendation is presented to the founder with measured evidence.

## Active providers

| Interface | Implementation | Config |
|---|---|---|
| `SearchProvider` | `OpenAIWebSearchProvider` (Responses API `web_search`) | `PRICE_CHECKER_SEARCH_PROVIDER=openai_web_search` |
| `PageRetriever` | `DirectPublicPageRetriever` (first-party, SSRF-safe) | `PRICE_CHECKER_PAGE_RETRIEVER=direct_public` |
| `ObservationExtractor` | `OpenAIPriceObservationExtractor` (GPT-5.6 Sol, no tools) | `PRICE_CHECKER_EXTRACTION_MODEL=gpt-5.6-sol` |
| `BrowserRetriever` | none (gated off) | `PRICE_CHECKER_BROWSER_FALLBACK_ENABLED=false` |

Interfaces for optional future implementations (Serper/SerpApi/Tavily/Firecrawl/ScrapingBee/Apify/ControlledBrowser) exist in `src/price-intelligence/research/providers/`; none is implemented or installed. Selecting an unimplemented provider name in env fails fast with a clear error instead of silently degrading.

## Benchmark gate (must precede any external provider)

Benchmark ladder (per founder section 8):
1. OpenAI web search only.
2. OpenAI web search + direct page retrieval.
3. OpenAI web search + direct retrieval + GPT-5.6 extraction  ← **current production configuration**.
4. Browser fallback on a small permitted set (not yet implemented).

Measured per run by `scripts/price-checker-benchmark.ts` (`scripts/data/benchmark-results.json`):
relevant-source discovery rate, page-retrieval success rate, valid-observation rate, spec/price extraction accuracy (QA against actual pages), citation completeness (ungrounded count must be 0), latency, token/cost totals, failure mix by retrieval outcome, source diversity, Nigerian-domain coverage.

## Current benchmark findings (2026-07-30 runs)

Full 12-item run (`apps/backend/scripts/data/benchmark-results.json`), a 3-item re-run after the currency + spec-match gates (`benchmark-regate.json`), and a final 5-item validation run after credits top-up (`benchmark-final.json` — rebar reached 3 independent sources at ₦950k–1.12m/tonne; the expected-insufficient staircase correctly returned insufficient data; 0 ungrounded observations; 20 consecutive clean runs completed):

- 12/12 items completed without technical failure; **11 priced, 1 honest insufficient-data** (CCTV bundle).
- **100% discovery success** (every item found candidate sources); **58.9% of fetched pages usable**; every usable page produced schema-valid observations.
- **6/12 items reached ≥3 independent sources** (cement 7, battery 8, tiling labour 6, roofing 5, inverter 4, pump 3); items below 3 were labelled low confidence, never inflated.
- Sample results: Dangote 50kg cement Lagos ₦9,500–11,900/bag (7 independent, moderate); 12mm rebar Abuja ₦950k–1.01m/tonne (2 independent, low); tiling labour Lagos ₦500–3,200/sqm (5 independent, moderate, service-labelled); bespoke staircase → insufficient data after the currency/spec gates.
- **0 ungrounded observations** (after final-URL redirect accounting): every accepted price traces to a page the retriever actually fetched, with its check date.
- Average latency ~3.3 min/item (sequential, reasoning model, retry-inclusive). Cost measured in tokens per call; USD pending `PRICE_CHECKER_MODEL_PRICING_JSON` from the founder's account pricing.
- The full run exhausted the OpenAI account's remaining prepaid credits (429 "no credits remaining" at the end of the re-run) — topping up is a founder action before further live runs.

Failure modes by source type:

- **Jiji.ng** — excellent for discovery (OpenAI web search surfaces and cites listings), but plain backend fetches receive **HTTP 403** (bot protection; 32 of 51 retrieval failures in the full run were `login_required`, mostly Jiji). Recorded honestly; NOT worked around. Jiji is therefore discovery-eligible, direct-fetch-limited today — the single largest coverage gap if it persists.
- **Independent Nigerian e-commerce stores** (e.g. building-materials retailers on Shopify/WooCommerce) — direct fetch works well; JSON-LD/Open Graph frequently present; extraction grounded and accepted.
- **Manufacturer sites** (e.g. cement.dangote.com) — fetch fine; usually no retail price displayed; correctly yield zero observations rather than invented prices.
- **Konga** — per Stage 2 register: automated extraction prohibited ⇒ discovery-only in the source policy.
- **Facebook Marketplace** — login-gated ⇒ excluded entirely.

## Standing recommendation

No external provider is justified at this time. If a future benchmark shows that pages blocked to direct fetch (e.g. Jiji listings) materially reduce independent-source counts for common requests, the options to evaluate — in order — are: (a) compliant partnership/API with the platform, (b) a controlled browser fallback on permitted pages, (c) an external retrieval provider — each presented to the founder with: which source types need it, % of benchmark failures solved, added monthly cost, cost per successful report, legal/access limits, and primary-vs-fallback status.
