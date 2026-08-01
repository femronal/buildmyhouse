# Price Checker — Stage 2 Open Questions & Assumptions

**Version:** 2.0 · **Date:** 2026-07-28 · Updated with founder decisions of 2026-07-28

## Decisions — RESOLVED by founder (2026-07-28)

1. **Quotation credit interpretation** — **APPROVED**: one credit = up to five *successfully researched catalogue items* (duplicates merged, insufficient-data lines free). See `QUOTATION_VERIFICATION_SPEC.md`.
2. **Level 1 list confirmation** — **APPROVED**: the 25 families as named.
3. **Logical data model** — **APPROVED**, subject to normal Stage 3 implementation review.
4. **Professional reviewer recruitment** — **RESOLVED: not required.** Mandatory professional review is removed; matrices are AI-generated (GPT-5.6) with deterministic validation, and human review is optional escalation only. No recruitment gate exists for Stage 2. See `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md`.
5. **Three-level catalogue strategy / Level 2 backlog / Level 3 custom research** — **APPROVED**.

## Assumptions made (flag if wrong)

1. Docs live in `docs/price-checker/`; the two root Stage 1 files (`PRICE_CHECKER_PRD.md`, `PRICE_CHECKER_ROADMAP.md`) stay where they are and link in.
2. Stage 2 typed taxonomy lives in `apps/backend/src/price-intelligence/taxonomy/`; types can be lifted to `packages/shared-types` later if the admin dashboard needs compile-time access.
3. Brand/spec vocabularies in the matrices were written from general Nigerian-market knowledge and are validated by **GPT-5.6 terminology spot checks against real public listings** (`scripts/data/terminology-check-results.json`). **No price in the repo is presented as market data.**
4. Nearby-state fallback table covers launch states only; it expands as data rows with new states.
5. Promotion rule thresholds (≥3 distinct requests, ≥1 paid intent, 60 days) are starting values; tune with real demand data.
6. "GPT-5.6" resolves to the API model id `gpt-5.6-sol`, configured via `PRICE_CHECKER_MATRIX_MODEL` (never hard-coded).

## Known risks

1. **AI matrix quality drift:** dynamic matrices depend on model behaviour; strict schema validation, registered-conversion whitelisting and confidence gating are the guardrails, plus optional specialist escalation for exceptional cases. Monitor invalid-output rates from the spot-check runner.
2. **Terminology drift:** Nigerian market slang shifts (and varies by region); aliases must be an admin-editable list, not a code constant, from Stage 3 onward. Re-run the terminology checker periodically.
3. **Scope creep in services:** service prices vary so much with scope that early reports should lean on disclosure ("labour-only, excludes demolition") rather than tight ranges.
4. **JSON-column flexibility vs admin editing:** keeping attributes/questions as JSON speeds MVP but defers admin CRUD; revisit at Stage 5.
5. **Marketplace listing noise:** real listings mix products with machines, services and bundles (observed in the spot-check corpus: block-moulding machines in block searches, installation services in paving/POP searches, full solar bundles in inverter searches). The matrix `productType`/`itemNature` distinction and bundle hard-blocks address this; keep testing against real listings.
