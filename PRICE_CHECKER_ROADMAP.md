# BuildMyHouse Price Checker — Staged Build Roadmap

**Rule of engagement:** We do not start a stage until every exit criterion of the previous stage is checked. Each stage lists (a) what YOU must bring, (b) what WE build/produce, and (c) exit criteria that gate the next stage.

**Architecture ground truth (overrides the prompt's Supabase default):** BuildMyHouse already runs a NestJS + Prisma + PostgreSQL backend (`apps/backend`), a Next.js admin dashboard (`apps/admin-dashboard`), and an Expo web app (`apps/mobile-homeowner`) with the `/tools/price-checker` route live. The Price Checker will be built on this stack. The `openai` SDK and `@nestjs/schedule` (cron) are already installed in the backend.

---



## MASTER "BRING-ALONG" LIST (everything you will need across all stages)

Gather these progressively — each is assigned to a stage below, but this is the one-glance list:

### Accounts, keys & money

- [x] OpenAI API key on a **paid organization account** (live in production and local `.env`, verified 2026-07-28; set the $100/month budget cap in the OpenAI dashboard if not done)
- [x] ~~A web search API account~~ — **NOT REQUIRED (founder decision 2026-07-30):** OpenAI web search (Responses API) is the approved default discovery tool. An external search provider (Serper/SerpAPI/Tavily) may only be introduced if benchmark evidence documents a material improvement — see `docs/price-checker/PROVIDER_DECISION_RECORD.md`
- [x] ~~A page-extraction/scraping service account~~ — **NOT REQUIRED:** first-party direct public-page retrieval + GPT-5.6 Sol extraction is the approved default. External extraction (Firecrawl/ScrapingBee/Apify) is benchmark-gated the same way
- [x] Paystack **business account** — existing account ready; switch to BMH main account later
- [x] Access to your production hosting/deploy pipeline — you deploy the backend yourself
- [x] Domain decision confirmed — `/tools/price-checker` on buildmyhouse.app



### People

- [ ] **One licensed Quantity Surveyor (QS)** willing to act as paid reviewer/advisor (name, phone, rate per review) — this is the single biggest trust lever
- [ ] At least **2 field verifiers** (can be your existing BMH agents) who can physically confirm prices at Lagos/Ogun building-material markets
- [ ] *(OPTIONAL — no longer a Stage 4 gate)* Merchant contacts willing to share price lists — useful later for offline-market coverage and confidence calibration; the pipeline works without them
- [ ] Someone (you or staff) who will do admin review of flagged prices at least twice a week



### Data & market knowledge

- [ ] *(OPTIONAL)* Any **real receipts, invoices, or contractor quotations** — optional evidence channel; they enter the same validation pipeline and never secretly override observed market evidence
- [ ] *(OPTIONAL)* Any supplier price lists you can obtain (PDF, WhatsApp broadcast, paper photo) — same optional channel
- [ ] Brand knowledge per category (e.g., cement: Dangote, BUA, Lafarge/Elephant; we will draft, you correct)
- [ ] Names of the physical markets your buyers actually use (e.g., Coker/Orile Lagos, Dei-Dei Abuja, building material lines in Ogun/Edo)



### Business decisions (you decide, we implement)

- [x] Price per paid generation and free-tier allowance — **1 cached single-product check/day per account (free); ₦15,000 per live report of up to 5 products**
- [ ] Which 10–15 product categories launch first (draft list in Stage 2)
- [ ] Which 4 locations launch first (prompt suggests Lagos, Ogun, Abuja, Edo)
- [x] Monthly all-in API spend ceiling — **$100/month**
- [ ] Legal/disclaimer copy approval (we draft, you approve)

---



## STAGE 1 — Foundations, decisions & accounts

**Objective:** Every account, key, and decision needed to build without stopping.

### You bring

- [x] OpenAI API key (paid org; live in production env and local `apps/backend/.env` — verified working 2026-07-28)
- [x] Confirmation of architecture — **CONFIRMED 2026-07-28:** existing `apps/backend` (NestJS/Prisma/Postgres), admin screens in `apps/admin-dashboard`, consumer UI at `/tools/price-checker` in `apps/mobile-homeowner`
- [x] Deployment — **you deploy the backend yourself; no blocker**
- [x] Paystack — **existing account ready to use; switch to BMH main Paystack account later**
- [x] Pricing decision — **APPROVED v1.1:** 1 cached single-product check per day per account (free); ₦15,000 (~$10) per live-researched report covering up to 5 products
- [x] Monthly API budget ceiling — **$100/month, caps non-revenue spend only (cache refreshes + free tier); paid generations are self-funding and never blocked**



### We produce

- [x] Product Requirements Document (PRD) for the MVP — `PRICE_CHECKER_PRD.md` **v1.1, approved 2026-07-28**
- [x] Cost model: estimated cost per generation vs price per generation — PRD §7; 70–94% margin per paid report; free tier break-even ≈ 6–7 paid reports/month
- [x] Environment variable plan and secrets checklist — PRD §10



### Exit criteria (all checked before Stage 2)

- [x] OpenAI key works from a test script in this repo — **PASS 2026-07-28** (`npx ts-node scripts/check-openai-key.ts` from `apps/backend`)
- [x] Architecture decision recorded
- [x] PRD approved by you — **approved 2026-07-28 (v1.1, amended pricing model)**
- [x] Unit-economics sheet shows profit per paid generation
- [x] Paystack onboarding submitted (account already active)

**✅ STAGE 1 CLOSED 2026-07-28 — Stage 2 (product taxonomy & catalog) is now active.**

---



## STAGE 2 — Product taxonomy & catalog (the knowledge layer)

**Objective:** A clean, Nigeria-correct catalog of products, brands, specs, units, and conversion factors. This is what separates a trusted tool from a search box. No code that touches prices ships before this exists.

> **2026-07-28 — Stage 2 revised per founder product correction.** The 15-category draft was too narrow for the ₦15,000 paid-report use cases. Stage 2 now uses a **three-level catalogue** (25 deep-launch families / expansion backlog / open custom research), a separate service & labour taxonomy, and a quotation-verification spec. Full design: `docs/price-checker/` (start with `STAGE2_TAXONOMY_DECISIONS.md`).
>
> **2026-07-28 (later) — Final founder matrix policy.** The Price Checker operates as scalable SaaS, not a human-dependent consultancy. Specification matrices are **generated dynamically by GPT-5.6** (env `PRICE_CHECKER_MATRIX_MODEL`) with deterministic validation underneath; **mandatory professional review is removed** — human review is optional escalation only, never a Stage 2 gate. Terminology spot checks are GPT-5.6-backed against real Nigerian listings. See `docs/price-checker/DYNAMIC_MATRIX_POLICY.md` and `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md`.

### You bring

- [x] Approval of the three-level catalogue strategy and revised Level 1 list (25 families) — **approved 2026-07-28**
- [x] Approval of the Level 2 expansion backlog and Level 3 open custom research — **approved 2026-07-28**
- [x] Approval of the quotation credit interpretation (5 successfully researched items per credit) — **approved 2026-07-28**
- [x] Approval of the proposed logical data model (subject to normal Stage 3 implementation review) — **approved 2026-07-28**
- [x] Decision on professional review — **mandatory review NOT approved; optional escalation only (2026-07-28)**

### We produce

- [x] Stage 2 assumption audit — `docs/price-checker/STAGE2_AUDIT.md` **(done 2026-07-28)**
- [x] 25 Level 1 family → sub-product → attribute specification matrices as typed data — `apps/backend/src/price-intelligence/taxonomy/families/` **(done 2026-07-28)**
- [x] Level 2 expansion backlog (23 families) + commercial priority scoring (18 dimensions, all 48 families) **(done 2026-07-28)**
- [x] Canonical units table + whitelisted deterministic conversions (zero invented factors, enforced in code) — `taxonomy/units.ts` **(done 2026-07-28)**
- [x] Clarifying-question tree per family with progressive disclosure + "I don't know" routing — `taxonomy/questions.ts` **(done 2026-07-28)**
- [x] Location taxonomy: state → city → market for Lagos, Ogun, Abuja, Edo + tested fallback ladder — `taxonomy/locations.ts` **(done 2026-07-28)**
- [x] Service & labour taxonomy (20 families) — `taxonomy/services.data.ts` **(done 2026-07-28)**
- [x] Custom-research workflow + admin-gated catalogue promotion — `taxonomy/custom-research.ts` **(done 2026-07-28)**
- [x] Matrix validation & optional-escalation policy, record schema and status logic — `taxonomy/review.ts` + `taxonomy/matrix.ts` **(done 2026-07-28)**
- [x] Dynamic AI matrix schema (v1), strict validation, confidence states, readiness gating, escalation logic — `taxonomy/matrix.ts` **(done 2026-07-28)**
- [x] GPT-5.6 terminology spot-check runner + real-listing corpus (51 samples, 25 families, public Jiji.ng pages) — `apps/backend/scripts/price-checker-terminology-check.ts` **(done 2026-07-28)**
- [x] Source-evidence policy incl. receipts/quotations, privacy redaction, source-access register — `taxonomy/evidence.ts` **(done 2026-07-28)**
- [x] Quotation-verification product specification **(done 2026-07-28)**
- [x] Proposed logical data model (no migration yet, per rule) **(done 2026-07-28)**
- [x] 64 Stage 2 tests (matching, questions, conversions, fallbacks, review status, promotion gating, privacy) **(done 2026-07-28)**

### Exit criteria (REVISED 2026-07-28 — professional human reviews are NOT part of these criteria)

- [x] Founder approval of the three-level catalogue strategy recorded
- [x] Founder approval of the 25 Level 1 families recorded
- [x] Founder approval of the quotation-credit interpretation recorded
- [x] Founder approval of the logical data model recorded
- [x] Dynamic AI matrix-generation policy documented — `docs/price-checker/DYNAMIC_MATRIX_POLICY.md`
- [x] Temporary matrix JSON schema defined (v1) and strictly validated — `taxonomy/matrix.ts`
- [x] Clarification-question generation defined (schema + engine docs)
- [x] Deterministic unit and conversion validation intact (zero invented factors, enforced by `convertPrice()` + AI-factor rejection in `validateProposedConversions()`)
- [x] GPT-5.6 terminology spot checks completed for the 25 Level 1 families (2–3 real Jiji.ng examples per family) — **genuinely run 2026-07-28/29** with `gpt-5.6-sol`: 52/52 valid, 0 failures (`docs/price-checker/TERMINOLOGY_SPOTCHECK_RESULTS.md`)
- [x] Material terminology corrections applied and versioned (alias additions across all 25 families, dated in `families/*.data.ts`)
- [x] Custom-product matrix generation documented — `docs/price-checker/CUSTOM_RESEARCH_WORKFLOW.md`
- [x] Optional escalation rules documented (never mandatory) — `docs/price-checker/MATRIX_VALIDATION_AND_ESCALATION_POLICY.md`
- [x] Existing tests, new AI matrix tests, type checks and affected builds pass (105 backend tests / 7 suites, `tsc --noEmit` clean, `nest build` passes — 2026-07-28)
- [x] No fabricated price stored as current market data; no fake professional approval recorded (test-enforced)

**✅ STAGE 2 CLOSED 2026-07-28 — all revised exit criteria pass. Stage 3 (database schema & core data model) is now active.** Checklist: `docs/price-checker/STAGE2_VALIDATION_CHECKLIST.md`.

---



## STAGE 3 — Database schema & core data model **(✅ CLOSED 2026-07-28 — migration + seed applied to production and verified)**

**Objective:** Prisma migrations that store products, sources, and price observations with full provenance. Implements the founder-approved logical model (`docs/price-checker/LOGICAL_DATA_MODEL.md` v3.0) plus the founder's 12 Stage 3 requirement sets (2026-07-28): permanent-vs-temporary separation, AI matrix provenance, research/billing entity separation, append-only observations and credit ledger, tri-state inclusions, Decimal money, custom-product privacy, marketplace separation, location separation, integrity/SaaS features, and evidence privacy.

### You bring

- [x] Migration + seed applied to production 2026-07-28 via one-off ECS Fargate task (`buildmyhouse-price-stage3-migrate:1`, image tag `price-stage3`) inside the VPC — RDS is private, so this is the standard path. Round-trip check passed against production; live backend unaffected (health 200, service stable)



### We produce

- [x] 27 Prisma models in the `Price*` namespace (migration `20260729025036_add_price_intelligence`): permanent catalogue (`PriceCategory`, `PriceProductFamily`, `PriceProduct`, `PriceBrand`, `PriceAlias`, `PriceSpecificationDefinition`, `PriceUnit`, `PriceConversionRule`, `PriceServiceFamily`, `PriceLocation`, `PriceSource`, `PriceSeller`), evidence (`PriceObservation` append-only + `PriceObservationAttribute` + `PriceEvidenceDocument` private/redacted split), research & billing (`PriceQuery`, `PriceResearchRequest`, `PriceResearchRequestItem`, `PriceResearchRun`, `PriceResearchClarification`, `PriceReport`, `PriceReportItem`, `PriceCreditLedger` append-only), AI provenance (`PriceTemporaryMatrix`), governance (`PriceCustomProductRequest`, `PriceTaxonomyChangeRequest`, `PriceTerminologyCheck`, `PriceProfessionalReview`, `PriceSeedMeta`)
- [x] Idempotent seed (`prisma/seeds/price-intelligence.seed.ts`, `pnpm prisma:seed:price`) loading the full Stage 2 catalogue — verified identical on repeat runs
- [x] Admin read-only catalogue API (`GET /admin/price-catalogue/*`, admin-guarded, zero write endpoints) + round-trip script (`scripts/price-catalogue-roundtrip-check.ts`)
- [x] Deterministic billing (`src/price-intelligence/billing/credits.ts`) and observation lifecycle (`src/price-intelligence/observations/observations.ts`) modules with 33 tests covering the Stage 1 credit rules



### Exit criteria (revised per founder, 2026-07-28)

- [x] Permanent catalogue and temporary matrices are structurally separate (`PriceTemporaryMatrix` FK-bound to one request item; promotion only via `PriceTaxonomyChangeRequest`)
- [x] AI matrix provenance stored (model, response ID, prompt/schema version, input hash, validation status/errors, confidence, readiness, escalation, supersededBy)
- [x] Research request / item / run / report / report-item / query records separated
- [x] Append-only credit accounting (`PriceCreditLedger` signed deltas; balance = SUM, never a mutable counter)
- [x] Stage 1 refund + insufficient-data rules test-covered (5→1 credit, 6–10→2, insufficient-data free, failed report free, reserve-then-settle)
- [x] Observations retain history (active/stale/superseded/rejected/duplicate; deterministic fingerprint + supersession; no deletes)
- [x] Inclusion fields distinguish unknown from excluded (tri-state strings, default `unknown`)
- [x] Money fields use `Decimal`, ISO currency codes; no floats for authoritative prices
- [x] Custom products cannot self-publish (private by default; admin-approved change record required)
- [x] Marketplace `Material` and `PriceObservation` remain separate (optional one-way provenance link only)
- [x] Location fallback provenance preserved (seller/delivery/source-market locations; match + fallback level on report items)
- [x] Seed scripts idempotent (verified by double-run)
- [x] Indexes and unique constraints on all founder-listed query paths
- [x] Sensitive evidence private (private/redacted/extracted separation; seller contacts flagged sensitive)
- [x] Migration applies successfully — validated on a clean local database AND applied to production (`20260729025036_add_price_intelligence`, 2026-07-28)
- [x] Seed data loads successfully (25 families, 109 products, 307 aliases, 120 spec defs, 37 brands, 32 units, 11 conversion rules, 29 locations, 7 sources, 20 service families)
- [x] Admin read-only catalogue view proves complete round-tripping (script passes against seeded DB)
- [x] Tests (138), type checking, and backend build pass

---



## STAGE 4 — AI-first live research pipeline **(✅ CLOSED 2026-07-30 — OpenAI-first pipeline live-benchmarked; founder approved closure)**

**Objective (revised):** Given a user's product or service request, location and available specification, dynamically create or enrich the research matrix, discover current public evidence through OpenAI web search and permitted page retrieval, extract comparable observations, validate and normalise them deterministically, and return a traceable observed market range with an honest confidence level.

**Production promise:** *"BuildMyHouse Price Checker dynamically understands the requested product or service, asks only the specifications needed for a valid comparison, searches current permitted public sources, extracts traceable observations, validates them deterministically and reports an honest observed price range. When reliable comparable evidence is unavailable, it returns insufficient data rather than manufacturing certainty."*

**Approved architecture (ADR-0001):** GPT-5.6 Sol (Responses API) is the primary reasoning, search-planning and extraction model. OpenAI web search is the default discovery tool. A first-party SSRF-safe direct page retriever fetches permitted public pages. Deterministic application code owns all validation, unit conversion, dedup, independence counting, range/median maths, confidence and credit accounting. No external search/extraction subscription is required; provider interfaces exist and any external provider is benchmark-gated + founder-approved (`docs/price-checker/PROVIDER_DECISION_RECORD.md`). Research is NOT limited to the 25 Level 1 families — they supply reusable templates, not a boundary. Merchant data is an optional evidence channel, never a launch requirement.

### You bring (revised — founder inputs only)

- [x] Approval of the OpenAI-first architecture (given 2026-07-30)
- [ ] Approval if benchmark evidence later justifies a paid external provider
- [ ] Normal product and report-quality review during testing

*(NOT required: merchant receipts, merchant WhatsApp contacts, weekly merchant feeds, supplier price lists, external search-provider account, external extraction-provider account.)*

### We produce

- [x] Provider abstractions (`SearchProvider`, `PageRetriever`, `BrowserRetriever`, `ObservationExtractor`) with env-configured selection (`src/price-intelligence/research/providers/`)
- [x] `OpenAIWebSearchProvider` — Responses API `web_search` tool for discovery; full search provenance (query, intent, result URL/title/snippet/domain); snippets never become observations when the page can be fetched
- [x] `DirectPublicPageRetriever` — BuildMyHouse user agent, timeouts, bounded retries, size caps, scheme rejection, DNS/private-IP SSRF guard (incl. redirects), robots.txt respect, per-source access policy; 13 recorded retrieval outcomes
- [x] `OpenAIPriceObservationExtractor` — GPT-5.6 Sol, no tools (cannot invent pages), strict schema, "must not infer" rules; one bounded retry with validator feedback
- [x] Deterministic gate: extraction validated against the retrieved page (source URL must match; price digits must appear in verbatim supporting spans found on the page) — fabrications are structurally rejected
- [x] Dynamic bounded search-plan generation (schema-validated, deduped, clamped to `PRICE_CHECKER_MAX_SEARCH_QUERIES`)
- [x] Full pipeline STEP 1–9 (`research/pipeline.ts`): plan → discover → retrieve → extract → validate/normalise (Stage 2 conversion rules only) → append-only observations → deterministic result → credit finalisation via Stage 1 rules
- [x] Duplicate fingerprints + independent-source detection (domain/seller/identifier-hash/syndication grouping); confidence uses INDEPENDENT count
- [x] Cache identity + freshness (search/page/extraction/observation/result layers; spec-sensitive keys; hit/partial/miss/stale states)
- [x] Cost logging per call type (model, input/output/cached/reasoning tokens, retrieval + browser counts, estimated cost; never fabricates a $ figure without configured pricing)
- [x] Revised source registry with per-source access decisions (Jiji ≠ Jumia ≠ Konga ≠ Facebook)
- [x] Benchmark harness + 12 representative requests (incl. custom product, service, bundle, weak-coverage location, expected-insufficient) — `scripts/price-checker-benchmark.ts`
- [x] Admin research diagnostics (read-only): config/provider status, runs per request, observations per family
- [ ] Scheduled refresh jobs (`@nestjs/schedule`) for top product/location pairs — deferred to Stage 6/7 wiring (cache + refresh identity already built)
- [ ] Manual/document evidence ingestion admin path (optional channel; same validation pipeline) — deferred to the admin stage

### Exit criteria (revised)

- [x] OpenAI-first pipeline implemented; GPT-5.6 Sol generates bounded search plans; OpenAI web search discovers traceable sources
- [x] Direct public-page retrieval works for supported pages; restrictions recorded per outcome
- [x] Structured extraction produces schema-valid observations; unsupported claims rejected (ungrounded-observation count enforced = 0)
- [x] Unit normalisation uses only registered deterministic rules; observations append-only; every accepted observation retains source URL + check date
- [x] Duplicate URLs and non-independent sources handled; confidence uses independent count; <3 independent sources ⇒ low confidence / insufficient data (never fabricated evidence)
- [x] Benchmark covers products, custom products, bundles, services, weak coverage, expected-insufficient
- [x] Cached free checks cause no live research spend (free tier is cache-read-only by design; spec-sensitive cache keys tested)
- [x] Cost per live report measured (token-level; USD once account pricing configured)
- [x] Stage 1 credit rules remain test-covered; no merchant data required; no external subscriptions required
- [x] Tests, type checking and build pass
- [x] No fabricated prices/sources in 20 consecutive test runs — **complete 2026-07-30:** 20 live item-runs across `benchmark-results.json` (12), `benchmark-regate.json` (2 pre-top-up) + smoke (1) and `benchmark-final.json` (5); ungrounded-observation count = 0 in every run; the expected-insufficient staircase request confirmed live to return insufficient data after the currency + spec-match gates
- [x] One-time evidence-verification QA — benchmark reports retained at `apps/backend/scripts/data/benchmark-{results,regate,final}.json` with every accepted source URL + check date for spot-checking; founder approved Stage 4 closure 2026-07-30 (real-life testing continues in later stages via the free tier)
- [x] **Founder action complete:** OpenAI credits topped up 2026-07-30; benchmark spend stopped after the final 5-item validation run to preserve credits for real usage

**✅ STAGE 4 CLOSED 2026-07-30 — Stage 5 closed the same day (see below); Stage 6 (consumer experience) is next.** Evidence: `apps/backend/scripts/data/benchmark-{results,regate,final}.json` · ADR: `docs/price-checker/adr/0001-openai-first-live-research.md` · Providers: `docs/price-checker/PROVIDER_DECISION_RECORD.md`. Stage 4 already ships deterministic range/median/outlier/confidence maths (`research/result.ts`) and the insufficient-data pathway — Stage 5 refines calibration, report formatting and the consumer-facing wording on top of them.

---



## STAGE 5 — Confidence scoring, ranges & report generation

**Objective:** Turn raw observations into the trustworthy output format: range, median, confidence label with reasons, inclusions/exclusions, caveats — per sections 2, 10, and 20.

**✅ STAGE 5 CLOSED 2026-07-30.** Evidence: `apps/backend/scripts/data/stage5-report-validation.json` (12/12 stored benchmark queries pass, zero live spend) · sample rendered reports: `apps/backend/scripts/data/stage5-sample-reports.txt` · engine + tests: `apps/backend/src/price-intelligence/reports/` (44 unit/integration tests). Scoring is fully deterministic and versioned (`price-confidence-v1`): weighted components (source quality 25, recency 20, spec match 25, location match 15, cluster tightness 15) plus hard safety gates that can only ever LOWER a label. No LLM assigns any confidence number. Every report carries component scores, deterministic reasons, per-observation exclusion audit, policy versions and a canonical input hash, and regenerates byte-identically from stored observations.

### You bring

- [x] Optional one-time review of benchmark reports by the founder, operations team or an appropriate construction professional. Normal confidence scoring is deterministic and requires no human approval — professional review remains available only as an optional escalation (high-value purchases, quotation reviews, structural materials, user-requested verification).



### We produce

- [x] Deterministic range/median calculators (outliers excluded with per-observation audit; minimum independent-source counts per confidence tier)
- [x] Confidence scoring engine (source tier, recency, spec match, location match, cluster tightness) with a stored explanation for every score — versioned policy `price-confidence-v1`
- [x] "Insufficient data" pathway that refuses to guess and says so honestly (consumer format: what was requested, what was checked, what was missing, what to do next)
- [x] Report generator producing the exact section-20 format (product, location, observed range, typical price, inclusions, sources + dates, confidence, caution, BMH next step) — typed contract + separate plain-text renderer, no UI mixed in
- [x] Unit + integration tests over the scoring rules (44 tests: high/moderate/low/insufficient, single-source, duplicate-seller, outlier, used-vs-new, location/staleness/delivery-unknown handling, hard-gate downgrades, reproducibility, version change)



### Exit criteria (revised 2026-07-30 — QS calibration is no longer compulsory)

- [x] Confidence scoring is deterministic and versioned (`price-confidence-v1`; same observations + version ⇒ identical score, label, reasons, hash)
- [x] Every confidence result stores component scores and explanations (persisted in report snapshot payload)
- [x] High-confidence hard gates implemented (≥3 independent sources, ≥1 Tier 1/2 source, strong spec match, defensible location, recent evidence, tight cluster, full traceability)
- [x] Consumer reports contain range, typical price, inclusions, exclusions, source dates, confidence and cautions
- [x] Every report is reproducible from stored observations (canonical SHA-256 input hash; regeneration verified byte-identical)
- [x] Every accepted price is traceable to a source URL and check date (validated per benchmark record)
- [x] At least one deliberately data-poor query correctly returns "insufficient reliable data" instead of a fake price (`bm-obscure-insufficient`)
- [x] Duplicate listings do not falsely increase source confidence (independence groups; several URLs from one seller count once)
- [x] No routine QS approval is required anywhere in report generation
- [x] Unit, integration, benchmark and reproducibility tests pass (224 backend price-intelligence tests; 12/12 benchmark validation records)
- [x] No fabricated price, seller, source or unsupported report claim (all report claims map to stored observation fields; single-source results are never presented as market ranges)
- [x] Existing Stage 4 behaviour intact (all Stage 4 suites still pass; no research-pipeline changes)

---



## STAGE 6 — Consumer experience at `/tools/price-checker`

**Objective:** Replace the current static repair-ranges page with the real product: search → clarify → location → generate report. Simple language for homeowners, full detail on tap.

**✅ STAGE 6 CLOSED 2026-07-31 (founder sign-off).** Founder tested the full flow locally (cement → questions → research → insufficient-data report → report page) and approved the UI/UX. The five-tester manual usability round is **waived for launch by founder decision 2026-07-31** — the script stays at `docs/price-checker/STAGE6_MANUAL_USABILITY_SCRIPT.md` and should be run post-launch as ongoing validation, not as a launch gate.  
Live product: `apps/mobile-homeowner/components/tools/price-checker/*` · Report route: `/tools/price-checker/reports/[reportId]` · Consumer API: `apps/backend/src/price-intelligence/consumer/`.

Post-implementation additions (2026-07-30/31): page title + persuasive value copy (`PriceCheckerAbout.tsx`); insufficient-data results now escalate to a **WhatsApp verified local market check** (prefilled message with product/spec/location, `lib/whatsapp-support.ts`) — the consumed check funds the manual verification instead of a refund (`PRICE_CHECKER_COUNT_INSUFFICIENT_DATA=true` remains the policy).

The Aura.build attachment was treated as a layout/animation reference only (iframe presentation with fake “9,200+ Live Connections” metrics). Production UI uses BuildMyHouse Poppins/charcoal/selective emerald, real Stage 2–5 data, and a typed state machine. Research jobs do **not** support true pause/resume — Pause during research honestly cancels and preserves answers.

### You bring

- [x] Approval of UX copy and the disclaimer/caveat wording — founder approved UI/UX 2026-07-31
- [x] Free-tier defaults shipped via env: anonymous 2 / authenticated 5 completed reports per rolling 24h (`PRICE_CHECKER_ANONYMOUS_DAILY_LIMIT`, `PRICE_CHECKER_AUTHENTICATED_DAILY_LIMIT`). Watermarked/summary-only free tier deferred (full consumer report for free checks).



### We produce

- [x] Search + product picker driven by the Stage 2 catalog (`GET /price-checker/catalogue/search`)
- [x] Clarifying-question flow (brand, spec, unit, quantity, location) with “I don’t know” help paths + `unknownNotes`
- [x] Report screen at `/tools/price-checker/reports/:reportId`: range, typical price, confidence, sources, inclusions/exclusions, caveats, PDF, save-to-account
- [x] Loading/error/empty/insufficient-data/usage-limit states; mobile-first single-column with collapsible panels
- [x] Anonymous usage allowed for free tier; login required only to save report history
- [x] Analytics events via existing `trackWebEvent` (no private free-text answers)



### Exit criteria

- [x] Functional product replaces static repair ranges at `/tools/price-checker` (code complete)
- [x] End-to-end flow verified locally by founder 2026-07-30/31 (catalogue search → questions → live research → report + insufficient-data path + WhatsApp escalation)
- [x] ~~5 non-technical testers~~ — **waived for launch by founder 2026-07-31**; run `STAGE6_MANUAL_USABILITY_SCRIPT.md` post-launch as ongoing validation
- [x] Backend type check + price-intelligence tests pass (231); Stage 4/5 intact
- [x] Stage 6 TypeScript clean on new files; existing app routes unaffected
- [x] Production homeowner web build verified locally (`expo export --platform web`, 2026-07-31); re-verify on CI/staging at deploy time

---



## STAGE 7 — Payments, metering & unit economics

**Objective:** Charge only for the reports in the current Price Checker request, allow secure guest payment via Paystack, meter actual fulfilment, and confirm positive margin on every paid report. **Not a subscription. Not a prepaid credit wallet. Not login-gated.**

**⚙️ STAGE 7 CODE IMPLEMENTATION COMPLETE 2026-07-31 — live commercial validation pending.**  
Guest pay-per-request (not a wallet). Modal: `PriceCheckPaymentModal` · Callback: `/tools/price-checker/payment/callback` · Backend: `apps/backend/src/price-intelligence/payments/` · Admin: `/price-checker-revenue` · Policy: `docs/price-checker/REFUND_AND_INSUFFICIENT_DATA_POLICY.md`.

Commercial model: free allowance → pay only for chargeable items in this request → Paystack → server verify → confirm → research → reports. No account required to pay, generate, open or download. Sign-in remains optional on the report page to save history. The Stage 6 “sign in for a higher daily allowance” path is replaced by guest checkout.

### You bring

- [ ] Paystack account **approved for live payments** (test mode supported in code)
- [ ] Final price per report in naira (`PRICE_CHECKER_PRICE_PER_REPORT_KOBO` — checkout disabled until set; never invent a production price)
- [ ] Optional same-checkout volume-discount decision (disabled by default)
- [ ] Settlement bank account confirmed
- [x] Refund and insufficient-data customer wording — `docs/price-checker/REFUND_AND_INSUFFICIENT_DATA_POLICY.md`



### We produce

- [x] Guest payment modal (Aura-adapted charcoal card, BuildMyHouse emerald; no subscription/wallet copy)
- [x] Server-side immutable payment quotes in kobo; client never calculates the authoritative amount
- [x] Paystack initialize / verify / webhook (HMAC SHA512) / refund integration (test mode first)
- [x] One-time paid report batches with entitlements — **no reusable wallet / credit balance**
- [x] Anonymous payment recovery (callback + checkout snapshot; recovery email service)
- [x] Report fulfilment linked atomically to payment (idempotent; research starts only after verified success)
- [x] Free-allowance math: `freeApplied = min(requested, remainingFree)`, charge only the remainder
- [x] Insufficient-data disclosed before payment; counts as fulfilled when research ran (configurable)
- [x] Technical failure → retry or full/partial refund path; dislike of a found price is not a refund
- [x] Admin transactions / alerts / unit-economics / margin dashboard (`/price-checker-revenue`)
- [x] Cost controls, rate limits, research-cost ceiling config; free-allowance metering retained
- [x] Optional report-page sign-in for saving history (Stage 6 behaviour retained)



### Exit criteria

- [x] Anonymous user can pay without creating an account
- [x] Payment returns to the same Price Checker request (answers preserved)
- [x] Idempotent orders / webhook fingerprints / unique Paystack references (refresh-safe)
- [x] Research cannot start before successful server verification
- [x] Amount and currency are verified before fulfilment
- [x] Mixed free and paid batches charge the correct amount (quote.math tests)
- [x] Failed / abandoned payment produces no research start
- [x] Insufficient-data policy is shown before payment
- [x] Report view and PDF require no login
- [x] Report-page sign-in saves the report and returns to it
- [x] Admin dashboard shows revenue, costs and margin per report
- [x] Refund and compliance procedure is written
- [x] Existing Stage 4–6 behaviour remains intact (unit/regression tests)
- [ ] One payment for N items produces exactly N report outcomes (**validate in Paystack test run**)
- [ ] A technical / partial failure refund path verified against Paystack test API
- [ ] Paystack **test-mode** end-to-end with real test keys (founder: set `PAYSTACK_SECRET_KEY` + `PRICE_CHECKER_PRICE_PER_REPORT_KOBO`)
- [ ] A real Nigerian **live** transaction settles end to end (**live commercial validation — founder**)

**Do not mark Stage 7 fully CLOSED until test-mode + live settlement criteria pass.**

---



## STAGE 8 — Admin Price Intelligence dashboard

**Objective:** Create an exception-based operations cockpit in the BuildMyHouse admin dashboard so authorised staff can review uncertain evidence, approve merchant prices, maintain sources and catalogue data, understand unmet demand and audit every change.

**Principle:** Automation for normal cases + human review for exceptions + complete auditability. Do **not** require human approval for every consumer report.

**Status (2026-07-31):** Stage 8 **code implementation complete; operational validation pending.** Do not mark CLOSED until the three manual criteria below pass. Script: `docs/price-checker/STAGE8_MANUAL_OPERATIONAL_VALIDATION.md`.

### You bring

- [ ] Named staff member(s) responsible for review duty
- [ ] Their expected review availability
- [ ] Approval of the initial review SLA (defaults: critical 4h / high 24h / medium 72h / low 168h)
- [ ] At least one merchant price-list image for the end-to-end manual test

### We produce

- [x] Price Intelligence overview (`/price-intelligence`)
- [x] Exception-based review queue + workspace (approve / reject / correct)
- [x] Deterministic priority scoring + review state machine + SLA due dates
- [x] Manual price-entry workflow with maker-checker
- [x] Merchant-submission workflow (item-level approval, WhatsApp evidence upload)
- [x] Source-health monitor (disable / enable / recheck without circumvention)
- [x] Catalogue management (aliases, brands, deactivate products; DB alias overlay on consumer search)
- [x] Search-demand analytics + unmatched-term mapping
- [x] Immutable audit history
- [x] Reviewer assignment + PI permission model (VIEW / REVIEW / ENTRY / CATALOGUE / SOURCE_ADMIN / SETTINGS / AUDIT_EXPORT / SUPER_ADMIN)
- [x] Report revisions + consumer “updated after evidence review” notice
- [x] Link to Stage 7 revenue (not duplicated): `/price-checker-revenue`

### Exit criteria

- [x] Authorised staff can access the Price Intelligence section (admin dashboard gate)
- [x] Unauthorised non-admin users cannot access it
- [x] Low-confidence and insufficient-data exceptions enter the queue (post-report intake)
- [x] A reviewer can approve, reject and correct observations (API + UI)
- [x] Original evidence remains immutable (superseding corrections)
- [x] Corrections produce versioned downstream reports
- [x] Manual price entry requires review (maker-checker)
- [x] Merchant submissions support item-level approval
- [x] Broken sources are visible and can be disabled; historical evidence preserved
- [x] Catalogue aliases/brands can be maintained without a developer
- [x] Search Demand identifies demand / insufficient-data patterns
- [x] Every administrative edit appears in the audit history
- [x] Unit tests for ops priority / state machine / permissions / SLA / maker-checker / intake
- [x] Existing Stage 4–7 price-intelligence tests remain green
- [ ] A real staff member completes approve, reject and correct without developer help
- [ ] A merchant price-list image completes the full end-to-end workflow into a consumer report
- [ ] Role permissions manually verified (reviewer / catalogue / source admin / ordinary admin without PI access)

**Do not mark Stage 8 fully CLOSED until the three manual operational criteria pass.**

---



## STAGE 9 — Ground-truth validation (the trust gate)

**Objective:** Prove accuracy against the physical market before public launch. This stage is the difference between "most trusted in Nigeria" and "another blog with prices."

### You bring

- [ ] Field verifiers dispatched: physically confirm **25–30 prices** across ≥2 launch locations (photos of price boards/receipts, seller name, date) — budget their transport/airtime
- [ ] QS engagement for a formal review pass over 20 generated reports
- [ ] Your honest go/no-go judgment



### We produce

- [ ] Accuracy scorecard: generated range vs field-verified price for every checked item
- [ ] Fix list for every miss (bad source, wrong unit, stale cache, spec mismatch) — each fixed and re-tested
- [ ] Calibration updates to confidence scoring based on results
- [ ] "Verified against market" methodology page copy (this becomes public marketing material)



### Exit criteria (hard gate — no launch without these)

- [ ] ≥80% of field-verified prices fall inside our published range; 100% of misses explained and fixed or the product/location marked low-confidence
- [ ] QS signs off on report quality in writing (even informal)
- [ ] Zero known cases of fabricated sources or prices

---



## STAGE 10 — Launch, SEO & growth loop

**Objective:** Public launch with the credibility artifacts from Stage 9, plus the SEO surface and alerts that make it a customer-acquisition machine.

### You bring

- [ ] Launch announcement plan (your social channels, WhatsApp communities, diaspora groups)
- [ ] Decision on which SEO pages ship first (we recommend: cement Lagos/Abuja, 12 mm rebar Nigeria, roofing sheets Nigeria, tiles Lagos, German flooring Lagos — only pages with real Stage 4 data)
- [ ] Budget/appetite decision for price alerts (email first, WhatsApp later)



### We produce

- [ ] Landing-page tools section updated: Price Checker card points to the full tool, marked live with its real capability description
- [ ] SEO pages per product/location that have sufficient data (real ranges, last-updated dates, FAQs, buying guidance, BMH next-step CTA) — no thin pages
- [ ] Price alert MVP (email) on saved products
- [ ] Sitemap/robots/JSON-LD updates matching the site's existing SEO machinery
- [ ] Post-launch monitoring: API spend alerts, error alerts, weekly accuracy spot-check schedule
- [ ] 30-day review checklist: demand analytics → next categories/locations → merchant onboarding pipeline



### Exit criteria

- [ ] Tool is public, paid generations work in production, margin positive
- [ ] First SEO pages indexed
- [ ] Weekly ops rhythm running (admin review + spot checks)
- [ ] Backlog for v2 (professional subscriptions, merchant profiles, historical charts, API access) prioritized from real usage data

---



## Standing rules for every stage

1. No stage starts until the previous stage's exit criteria are all checked in this file.
2. Every price shown to a user must be traceable to a stored observation with a source URL and check date.
3. "Insufficient reliable data" is always an acceptable answer; a confident wrong price never is.
4. Deterministic code for math (ranges, medians, conversions, dedup); AI only for extraction, matching, and plain-language explanation.
5. All third-party services are verified live (pricing, docs, Nigeria support) before we commit to them.
6. Credibility outranks speed, features, and launch dates.

