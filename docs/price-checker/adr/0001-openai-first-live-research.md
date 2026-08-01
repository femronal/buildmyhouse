# ADR-0001 — OpenAI-first live research architecture (Stage 4)

**Status:** Accepted (founder decision, 2026-07-30)
**Supersedes:** the original Stage 4 assumption that a paid third-party search API (Serper/SerpAPI/Tavily) and possibly a paid extraction service (Firecrawl/ScrapingBee/Apify) must be selected before development, and that merchant price lists / WhatsApp feeds were Stage 4 prerequisites.

## Decision

BuildMyHouse Price Checker's paid live-research pipeline is **OpenAI-first**:

1. **GPT-5.6 Sol** (`gpt-5.6-sol`, env `PRICE_CHECKER_EXTRACTION_MODEL`) is the primary reasoning, search-planning and extraction model, called through the **OpenAI Responses API**.
2. **OpenAI web search** (Responses API `web_search` tool) is the default source-discovery tool.
3. A **first-party direct public-page retriever** fetches discovered pages lawfully from the BuildMyHouse backend before any external extraction service is considered.
4. **Deterministic application code** owns everything arithmetic or rule-based: schema validation, unit compatibility/conversion (registered rules only), duplicate detection, independence counting, range/median, location matching, confidence scoring, credit accounting, caching, storage.
5. **No external search or extraction subscription is required** to build, validate or launch. Provider interfaces exist so one can be added later — only with benchmark evidence of a material improvement, presented to the founder.

## Separation of responsibilities

| Concern | Owner |
|---|---|
| Product identification, matrix generation, clarification questions, Nigerian terminology, search-query generation, source-relevance judgment, listing extraction, bundle/mismatch detection, plain-language explanation | GPT-5.6 Sol (Responses API) |
| Web search, public-page fetching, structured-data reading, URL + check-date recording | Retrieval tools/backend services (`OpenAIWebSearchProvider`, `DirectPublicPageRetriever`) |
| Schema validation, unit conversion, dedup, arithmetic, range/median, source counting, location matching, credit accounting, cache checks, confidence maths, evidence thresholds, storage | Deterministic application code (`research/`, `taxonomy/`, `observations/`, `billing/`) |

**Hard rule:** the model must never fabricate webpage contents the retrieval layer did not provide. Enforced structurally, not just by prompt:

- The extractor runs with **no tools** and receives only retrieved page evidence — it cannot fetch or invent a page.
- `validateExtractedObservation` rejects any observation whose `sourceUrl` is not the retrieved page, and any numeric price whose verbatim supporting text span is not found in the retrieved page content.
- Hallucinated URLs from discovery die at the retrieval step (a page that cannot be fetched produces no observation).
- The benchmark harness counts "ungrounded observations" and fails the run if the count is not zero.

## Why not an external provider by default

- The Responses API `web_search` tool discovers Nigerian marketplace/product URLs directly (verified against live Jiji/Jumia/e-commerce listings on 2026-07-30).
- Direct fetch + dependency-free parsing (JSON-LD, Open Graph, microdata, readable text) works on a meaningful share of Nigerian e-commerce pages.
- An external provider adds a subscription, a data-sharing relationship and a hard dependency before any evidence exists that it is needed.

External providers may be reconsidered only per `PROVIDER_DECISION_RECORD.md`: benchmark first (search only → +direct retrieval → +GPT-5.6 extraction → browser fallback), and only recommend an external service with measured, material improvement, its cost, its legal limits, and whether it is primary or fallback.

## Browser / computer-use fallback

Disabled by default (`PRICE_CHECKER_BROWSER_FALLBACK_ENABLED=false`). Permitted only for public pages where ordinary fetching demonstrably fails, per-source policy allows it, and no login/CAPTCHA bypass or traffic disguise is involved. Not implemented in Stage 4; the interface and env gate exist.

## Consequences

- The founder brings **no external accounts and no merchant data** to Stage 4.
- Some sources (e.g. Jiji returns HTTP 403 to plain backend fetches) are discovery-only until/unless a compliant retrieval path is justified; the retrieval outcome is recorded honestly (`login_required`, `blocked_by_source`, …) instead of being worked around.
- Cost is measured per call (tokens + call counts) so the ₦15,000 report stays economically measurable; GPT-5.6 Sol is not assumed cheaper — it is benchmarked.
