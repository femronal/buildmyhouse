# Price Checker — Stage 2 Taxonomy Decision Record

**Version:** 2.0 · **Date:** 2026-07-28 · **Status:** Founder-approved 2026-07-28 (three-level catalogue, 25 Level 1 families, Level 2 backlog, Level 3 custom research, quotation-credit interpretation, logical data model subject to Stage 3 implementation review). Mandatory professional review was **not** approved — see Decision 5 (revised) and Decision 10.

## Decision 1 — Three-level catalogue model (replaces the 15-category boundary)

| Level | Name | Contents | Treatment |
|---|---|---|---|
| 1 | Deep launch families | 25 product families (list below) | Full specification matrix (reusable baseline template), unit rules, clarification tree, named optional-escalation discipline, illustrative samples |
| 2 | Expansion backlog | 23+ families | Recorded with value rationale, likely reviewer, source availability, priority; **no full matrices yet**; must fit the same taxonomy types |
| 3 | Open custom research | Anything a paying user asks for | "Research a product not listed" flow; admin-gated; never auto-published to catalogue |

**Rationale:** the paid ₦15,000 report monetises high-stakes, multi-spec, high-variance purchases (solar systems, generators, kitchens, windows, CCTV) and quotation verification — not single commodity items. Free/cached/SEO traffic monetises commodity items (cement, rebar, tiles). The catalogue therefore serves two distinct funnels and must never cap what a paying customer may request.

## Decision 2 — Category roles (free vs paid vs both)

Each family carries a `funnelRole`: `free_traffic` (cache/SEO strength), `paid_research` (report strength), or `both`. Commodity families (cement, sand, blocks) are primarily `free_traffic`; system families (solar, inverter, generator, kitchen, CCTV, windows) are primarily `paid_research`; several (roofing, tiles, cable, pumps, doors) are `both`. Scores in `CATALOGUE_PRIORITY.md` justify each assignment.

## Decision 3 — Final Level 1 list (25 families)

1. Cement · 2. Reinforcement steel · 3. Concrete blocks · 4. Sand · 5. Granite & aggregates · 6. Roofing sheets & accessories · 7. Tiles, adhesive & grout · 8. Paint systems · 9. Electrical cables · 10. Electrical protection & wiring accessories · 11. Plumbing pipes & fittings · 12. Water pumps · 13. Water-storage tanks · 14. Solar panels · 15. Inverters · 16. Solar & inverter batteries · 17. Generators · 18. Doors · 19. Aluminium windows & glass systems · 20. Sanitary wares & bathroom fittings · 21. Kitchen cabinets & worktops · 22. POP, gypsum & ceiling systems · 23. German flooring, interlocking stones & external paving · 24. Waterproofing materials & systems · 25. CCTV & security equipment

Families are **parents** with typed sub-products (e.g., Paint systems → primer, emulsion, satin/gloss, texture coating, screeding, waterproof coating). Sub-products live inside the family definition, not as a flat list. Nigerian market names/aliases are first-class fields (e.g., "iron rod" for rebar, "chippings" for granite, "German floor" for interlocking/paved compound flooring, "up-tank" for elevated storage tanks).

## Decision 4 — Labour and services are a separate taxonomy

Service prices (tiling per m², borehole drilling, solar installation…) are **not** rows in the product-observation model. They use a parallel `ServiceFamily` taxonomy with scope conditions (labour-only vs labour-and-material, minimum job charge, access, disposal, call-out). See `SERVICE_LABOUR_TAXONOMY.md`. Comparisons across service observations require scope-condition matching, and reports must say when scopes differ.

## Decision 5 (REVISED 2026-07-28) — Professional review is optional escalation only

The founder did **not** approve mandatory human professional review. The earlier "all launch matrices must receive documented professional review" is **replaced** by: matrices are AI-generated (GPT-5.6) with deterministic validation underneath, and human professional review is an **optional escalation for exceptional cases only** (structural/safety-sensitive decisions, unusual industrial equipment, conflicting specs, extremely high value, contradictory seller descriptions, safety-risk misidentification, user-requested verification, or the AI reporting it cannot produce a defensible comparison). The discipline mapping (QS, structural engineer, electrical engineer, building-services, architect/interior, security/low-voltage) is retained purely as **escalation ownership** — routing metadata, not a sign-off requirement. No human review gates Stage 2 closure. Full policy: `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md`.

## Decision 6 — Taxonomy is data, not code structure

Categories, families, attributes, units, questions, and locations are represented as **typed data** (Stage 2: TypeScript constants in `apps/backend/src/price-intelligence/taxonomy/`; Stage 3: seeded Prisma rows). No Prisma enums for categories. No migration is created in Stage 2 (per instruction 13); the logical model is documented in `LOGICAL_DATA_MODEL.md` for review first.

## Decision 7 — Placement of Stage 2 typed structures

Chosen: `apps/backend/src/price-intelligence/taxonomy/` with colocated `*.spec.ts` tests (backend jest picks up `src/**/*.spec.ts`; backend is the system of record). Considered: `packages/shared-types` (precedent: `build-opportunity-taxonomy.ts`) — rejected for Stage 2 because shared-types has no test runner and the taxonomy is backend-domain data that clients will consume via API, not import. If the admin dashboard later needs the types at compile time, the *types* (not the data) can be lifted to shared-types.

## Decision 8 — Custom research never auto-creates catalogue entries

A custom request may be: matched to a family (confidently or with clarification), run as a temporary research item, referred to admin, marked unsupported, or marked insufficiently specified. Repeated demand (rule: ≥3 distinct paying-intent requests for the same normalised product within 60 days) generates a **taxonomy change proposal**; only an admin can approve publication. AI may propose matches; humans approve. See `CUSTOM_RESEARCH_WORKFLOW.md`.

## Decision 9 — Five-product credit interpretation (recommendation)

A ₦15,000 credit covers **up to five successfully researched catalogue items** (product or service families after mapping), where: duplicate lines of the same item merge into one; lines returned "insufficient data" do not count; bundles that decompose into a product + installation count as two items only if the user asks both to be researched. This is the fairest interpretation because the user pays for delivered research, not for uploaded lines. Recorded as the default in `QUOTATION_VERIFICATION_SPEC.md`; founder may override before Stage 6 UI copy is written.

## Decision 10 — Matrices are generated dynamically by AI at runtime

A temporary specification matrix is generated by the approved OpenAI reasoning model (env `PRICE_CHECKER_MATRIX_MODEL`, currently `gpt-5.6-sol`) before any live price search, validated deterministically (`matrix.ts`), enriched from the reusable family template, and gated by explicit confidence states. The generated matrix is a temporary research structure tied to the request — never a permanent catalogue record unless an admin approves it. For Level 3 custom searches, the AI generates the matrix from scratch. Terminology spot checks are GPT-5.6-backed against real Nigerian listings (not human reviewers). See `DYNAMIC_MATRIX_POLICY.md`.

## Deliverables index (this stage)

| Doc | File |
|---|---|
| Audit | `STAGE2_AUDIT.md` |
| This decision record | `STAGE2_TAXONOMY_DECISIONS.md` |
| Catalogue priority scoring | `CATALOGUE_PRIORITY.md` |
| Level 1 catalogue (source of truth = TS) | `LEVEL1_CATALOGUE.md` + `apps/backend/src/price-intelligence/taxonomy/families/` |
| Level 2 expansion backlog | `LEVEL2_EXPANSION_BACKLOG.md` |
| Service/labour taxonomy | `SERVICE_LABOUR_TAXONOMY.md` + `taxonomy/services.data.ts` |
| Unit dictionary + conversion policy | `UNIT_DICTIONARY_AND_CONVERSION_POLICY.md` + `taxonomy/units.ts` |
| Location taxonomy | `LOCATION_TAXONOMY.md` + `taxonomy/locations.ts` |
| Clarifying-question engine | `CLARIFYING_QUESTION_ENGINE.md` + `taxonomy/questions.ts` |
| Matrix validation & optional escalation policy | `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md` |
| Dynamic AI matrix policy | `DYNAMIC_MATRIX_POLICY.md` |
| Source evidence policy (incl. receipts/quotations) | `SOURCE_EVIDENCE_POLICY.md` |
| Custom research workflow | `CUSTOM_RESEARCH_WORKFLOW.md` |
| Quotation verification spec | `QUOTATION_VERIFICATION_SPEC.md` |
| Logical data model | `LOGICAL_DATA_MODEL.md` |
| Validation checklist | `STAGE2_VALIDATION_CHECKLIST.md` |
| Open questions & assumptions | `STAGE2_OPEN_QUESTIONS.md` |
