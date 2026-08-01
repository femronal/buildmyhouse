# BuildMyHouse Price Checker — MVP Product Requirements Document

**Status:** **APPROVED v1.1** — founder approved 2026-07-28 with amended pricing model (daily cached free tier + 5-product paid bundle)
**Date:** 2026-07-28
**Owner:** BuildMyHouse
**Companion doc:** `PRICE_CHECKER_ROADMAP.md` (staged build plan)

---

## 1. Summary

A construction-price intelligence tool at `buildmyhouse.app/tools/price-checker`. A user searches for a material (e.g., "Dangote cement", "12 mm rod", "German flooring"), answers short clarifying questions (brand, spec, unit, quantity, location), and receives a **generated price report**: observed price range, typical price, confidence level with explanation, inclusions/exclusions, sources with dates, and caveats.

It is not a search box that shows one random listing. Every report is built from multiple stored **price observations**, each traceable to a source URL and check date. When data is insufficient, the tool says so instead of guessing.

## 2. Decisions locked in Stage 1

| Decision | Value |
|---|---|
| Stack | Existing monorepo: NestJS + Prisma + PostgreSQL backend, Next.js admin dashboard, Expo web frontend |
| URL | `/tools/price-checker` on buildmyhouse.app |
| Free tier | **1 cached single-product check per day per registered account** — served from cache only, never triggers live research |
| Price | **₦15,000 (~$10) per paid generation** = one **live-researched report covering up to 5 products** in one location; 6–10 products = 2 generations, and so on |
| Payments | Paystack (existing account; switch to BMH main account later) |
| API budget ceiling | **$100/month caps non-revenue spend** (scheduled cache refreshes + free-tier exceptions); paid generations are never blocked by the ceiling because each is self-funding (~70–94% margin) |
| Deployment | Founder deploys backend; migrations + env vars ship with normal releases |

## 3. Users (MVP priority order)

1. **Diaspora Nigerians** planning or funding projects remotely (highest willingness to pay; ₦15k is cheap insurance against a padded quote).
2. **Homeowners/landlords** validating a contractor's quotation before releasing money.
3. **Contractors, QS professionals, developers** doing procurement research (future subscription tier, not MVP).

## 4. MVP scope

**Catalogue (revised in Stage 2 — supersedes the earlier 15-category draft):** a three-level model, detailed in `docs/price-checker/STAGE2_TAXONOMY_DECISIONS.md`:

- **Level 1 — 25 deep-launch product families** with full specification matrices (reusable baseline templates for AI-generated runtime matrices — `docs/price-checker/DYNAMIC_MATRIX_POLICY.md`), unit rules, question trees and named optional-escalation disciplines (`docs/price-checker/LEVEL1_CATALOGUE.md`): cement, reinforcement steel, concrete blocks, sand, granite & aggregates, roofing sheets & accessories, tiles/adhesive/grout, paint systems, electrical cables, electrical protection & wiring accessories, plumbing pipes & fittings, water pumps, water-storage tanks, solar panels, inverters, solar & inverter batteries, generators, doors, aluminium windows & glass, sanitary wares & bathroom fittings, kitchen cabinets & worktops, POP/gypsum/ceilings, German flooring & external paving, waterproofing, CCTV & security equipment.
- **Level 2 — expansion backlog** (23 families, `docs/price-checker/LEVEL2_EXPANSION_BACKLOG.md`).
- **Level 3 — open custom research:** "Research a product not listed" is always available for paid reports; the catalogue is **never a hard limit** on what a paying customer may request (`docs/price-checker/CUSTOM_RESEARCH_WORKFLOW.md`).

**Services & labour:** priced via a separate service taxonomy (20 families), never mixed into product observations (`docs/price-checker/SERVICE_LABOUR_TAXONOMY.md`).

**Locations:** Lagos, Ogun, Abuja (FCT), Edo launch-priority, expandable to all states; deterministic fallback ladder with mandatory substitution notices (`docs/price-checker/LOCATION_TAXONOMY.md`).

**In scope:** product search, clarifying-question flow, live research pipeline, report generation, confidence scoring, daily cached free check, paid multi-product generations (up to 5 products), Paystack payment, report history for logged-in users, admin review, manual price entry, scheduled refresh of popular products.

**Out of scope for MVP:** price alerts, historical trend charts, merchant profiles/marketplace, professional subscriptions, API access, mobile app parity (web-first), WhatsApp delivery, quotation-upload comparison (v2 — high value, needs the same engine first; the full product spec already exists at `docs/price-checker/QUOTATION_VERIFICATION_SPEC.md`).

## 5. User journey

**Free daily check (cache-only):**

1. Land on `/tools/price-checker`, log in (account required — 1 check/day per account, not per device).
2. Pick **one product** from the covered catalog + location.
3. Instantly receive the cached market picture, clearly labelled "last updated [date]" — summary format, no PDF.
4. If the product/location is not in the cache: no live run — the user sees "this needs a live market check" with the paid option, and the request is logged as demand signal.
5. Upsell path is always visible: "Need today's prices for your full material list? Get a live report for up to 5 products — ₦15,000."

**Paid generation (live research, up to 5 products):**

1. User builds a list of **1–5 products** (e.g., cement + rods + blocks + tiles + paint) in one location.
2. Answer clarifying questions per product — only those that materially change price (brand → spec → unit/quantity). Every question has an "I'm not sure" path with plain-language help.
3. See a **preview**: products understood, location, sources available, confidence expectation — before paying.
4. Pay ₦15,000 via Paystack → credit → live research runs. Lists of 6–10 products consume 2 credits (UI states this before payment).
5. Receive the full report (format below), stored in history, PDF download included.
6. Next-step CTAs: book a repair, request quote review, start a project (BuildMyHouse conversion loop).

**Account rule:** all generations (free and paid) require a registered account (email login). No anonymous generations — prevents free-tier farming and builds the lead list.

## 6. Report format (contract with the user)

A paid report contains one section per product (up to 5), each with the structure below, plus a combined summary at the top. The free daily check shows a condensed version of a single product section (range, typical price, confidence, last-updated) without the full source list or PDF.

Each product section contains, in order:

1. **Product** — exact product + specification researched.
2. **Location** — target market/city.
3. **Latest observed range** — ₦X–₦Y per stated unit.
4. **Typical observed price** — median-style figure, clearly labelled "observed", never "the market price".
5. **What the price appears to include** — delivery, installation, retail vs wholesale, new vs used.
6. **Sources checked** — list with seller/site names and dates checked.
7. **Confidence** — High / Moderate / Low / Insufficient, with the reasons stated.
8. **Important caution** — negotiation, transport, spec, availability caveats.
9. **BuildMyHouse next step** — one relevant CTA, never more.

If confidence = Insufficient for a product in a paid report: no range is shown for that product and it does **not count** toward the 5-product allowance (the user can substitute another product or take a partial refund of that slot as credit). A fully failed generation never consumes a credit. All insufficient-data requests are logged as demand signal for the admin dashboard.

## 7. Unit economics (cost model)

Assumptions dated 2026-07-28; re-verify vendor pricing in Stage 4 before committing.

**Estimated variable cost per live-researched product (uncached):**

| Component | Estimate |
|---|---|
| OpenAI web search (Responses API `web_search` tool, 1 discovery call w/ multiple queries) | token-priced (measured per run) |
| Direct page fetch (~6–12 pages, first-party) | ~$0 (compute only) |
| GPT-5.6 Sol planning + extraction + report (~25–60k in / 5–10k out tokens incl. reasoning) | measured by cost logger |
| **Total per product** | **measured, not assumed — see `scripts/data/benchmark-results.json`; no external search/extraction subscription required (ADR-0001)** |

**Per paid generation (up to 5 products):**

| Report size | Worst-case API cost | Revenue | Gross margin |
|---|---|---|---|
| 1 product | ~$0.60 | $10 | ~94% |
| 3 products | ~$1.80 | $10 | ~82% |
| 5 products (max) | ~$3.00 | $10 | ~70% |

Products already cached from the scheduled refresh cost ≈ $0, so real margins will typically exceed these worst-case figures.

**Fixed monthly cost — cache refresh (funds the free tier):**
- Scheduled refresh of the top ~40–50 product/location pairs, weekly: **~$50–65/month** at typical per-product cost.
- The free daily check serves only from this cache, so its marginal cost per free user is ≈ $0 — free-tier cost does not scale with user count.
- **Break-even: ~6–7 paid generations per month (~₦105,000)** covers the entire refresh bill. Everything beyond is profit.

**Budget rules (hard rules):**
- The **$100/month ceiling applies to non-revenue spend only**: cache refreshes and any free-tier exceptions. Spend alarms at 50% / 80% / 100%; at 100%, refreshes pause and free checks serve the existing cache.
- **Paid generations are never blocked** by the ceiling — each carries its own ~70–94% margin and funds itself.
- Free tier is limited to launch categories and locations (what the cache actually covers); everything else routes to the paid live check.

**Pricing risk note (flagged once, decision stands):** ₦15,000 positions the paid report as a premium, high-stakes tool — right for diaspora buyers validating a ₦5m quotation. The daily free check now covers the casual "price of one bag of cement" user, which resolves most of the original concern. Watch free → paid conversion after launch.

## 8. System behaviour rules (non-negotiable)

1. Never present one listing as "the market price" — always range + typical + confidence.
2. Every displayed figure traces to a stored observation with source URL and check date.
3. Deterministic code for math (ranges, medians, unit conversion, dedup, outlier flags); LLM only for extraction, matching, and plain-language explanation.
4. No fabricated prices, sellers, links, or dates. Failed research = honest "insufficient data", not a guess.
5. Outliers flagged with neutral language ("significantly below other observed listings — confirm independently"), never fraud accusations.
6. Lawful data collection only: robots/ToS respected per source; no CAPTCHA bypasses; merchant partnerships and manual entry where automation isn't appropriate (roadmap Stage 4 details).

## 9. Technical architecture (maps to existing repo)

- **`apps/backend`** — new `price-intelligence` NestJS module:
  - Prisma models (roadmap Stage 3): catalog, sources, sellers, observations, queries, credits/transactions.
  - Research service (Stage 4, OpenAI-first — ADR-0001): GPT-5.6 Sol search planning → OpenAI web search discovery → first-party direct page retrieval → GPT-5.6 Sol structured extraction → deterministic validation → append-only observations.
  - Report service: deterministic range/median/confidence + LLM plain-language sections.
  - Credit + Paystack service (initialize/verify/webhook), atomic credit consumption with report delivery.
  - Cron (`@nestjs/schedule`): refresh top product/location pairs; spend-monitoring job.
  - Reuses existing `OpenAIService` config pattern (`OPENAI_API_KEY`, model override envs).
- **`apps/admin-dashboard`** — Price Intelligence section: review queue, manual entry, catalog management, source health, demand analytics, revenue/margin view.
- **`apps/mobile-homeowner`** — `/tools/price-checker` becomes the real tool (search → clarify → preview → pay → report → history). Current static repair-ranges page content moves to a small "repair labour ranges" link, or retires.

## 10. Environment variables & secrets plan

Backend (`apps/backend/.env` + production env):

| Variable | Status |
|---|---|
| `OPENAI_API_KEY` | Live in production; **add to local `.env` for development** |
| `OPENAI_MODEL` / `PRICE_CHECKER_AI_MODEL` | Existing pattern; per-feature override |
| ~~`SEARCH_API_KEY`~~ / ~~`EXTRACTION_API_KEY`~~ | **Not required** — OpenAI-first architecture approved 2026-07-30 (ADR-0001); external providers benchmark-gated |
| `PRICE_CHECKER_*` research config (provider, model, limits, cache TTL, UA, pricing JSON) | New — Stage 4; see `.env.example` + `docs/price-checker/STAGE4_IMPLEMENTATION_PLAN.md` |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | New — Stage 7 (existing account) |
| `PRICE_CHECKER_MONTHLY_BUDGET_USD` | New — spend ceiling, default `100` |

Rules: secrets never committed; `.env.example` updated with placeholders each stage; key rotation possible without code changes.

## 11. Metrics

- Searches, previews, generations (free vs paid), conversion rate free → paid.
- Revenue, API cost, margin per generation (logged per request, visible in admin).
- Cache hit rate; "insufficient data" rate by product/location (feeds Stage 2/4 backlog).
- Report → BMH service CTA click-through (procurement/repair/project leads).

## 12. Acceptance

**Approved by founder 2026-07-28** with the amended pricing model: free tier = 1 cached single-product check per day per account; paid = ₦15,000 per live-researched report covering up to 5 products; $100/month ceiling caps non-revenue spend only. This closes the PRD exit criterion in `PRICE_CHECKER_ROADMAP.md`. Stage 2 (product taxonomy & catalog) is now active.
