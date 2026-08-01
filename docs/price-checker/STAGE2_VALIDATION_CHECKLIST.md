# Price Checker — Stage 2 Validation Checklist

**Version:** 2.0 · **Date:** 2026-07-28 · Revised per founder decisions of 2026-07-28 (AI-first matrices; professional review = optional escalation only, removed as a Stage 2 gate)

## Drafting (complete)

- [x] 15-category assumption audited (`STAGE2_AUDIT.md`)
- [x] Catalogue no longer a hard limit (three-level model + Level 3 custom research designed and tested)
- [x] 25 deep-launch families defined with full matrices (typed data + tests)
- [x] 23 expansion families documented with value rationale
- [x] Custom research designed (routing, outcomes, admin-gated promotion)
- [x] Service/labour taxonomy designed (20 families, scope factors, comparison rules)
- [x] Every Level 1 family: specification matrix, unit rules, clarification tree, named optional-escalation discipline (test-enforced)
- [x] Location taxonomy documented with tested fallback ladder
- [x] Source-evidence classes + access register documented
- [x] Quotation-verification workflow specified (incl. credit recommendation)
- [x] Logical data model proposed (no migration created)
- [x] Sensitive-data handling documented and redaction tested

## Founder approvals (RECORDED 2026-07-28)

- [x] Three-level catalogue strategy — **approved**
- [x] 25 Level 1 launch product families — **approved**
- [x] Level 2 expansion backlog — **approved**
- [x] Level 3 open custom product research — **approved**
- [x] Quotation-credit interpretation (one credit = up to five successfully researched items) — **approved**
- [x] Logical data model — **approved**, subject to normal Stage 3 implementation review
- [x] Mandatory human professional review as a Stage 2 requirement — **NOT approved**; replaced by AI matrix validation with optional escalation

## Revised validation requirements (per founder policy)

- [x] Dynamic AI matrix-generation policy documented (`DYNAMIC_MATRIX_POLICY.md`)
- [x] Temporary matrix JSON schema defined and strictly validated (`matrix.ts`, schemaVersion 1)
- [x] Clarification-question generation defined (schema + engine docs)
- [x] Deterministic unit and conversion validation intact (existing tests unchanged and passing)
- [x] AI matrix schema + validation tests added (mocked responses; no paid API calls in CI)
- [x] Optional escalation rules documented and tested (never mandatory; `isHumanReviewRequired()` = false)
- [x] Custom-product matrix generation documented (temporary matrix from scratch; no auto-publication)
- [x] **GPT-5.6 terminology spot checks** completed for all 25 Level 1 families using 2–3 real Nigerian listing examples per family — **genuinely run 2026-07-28/29** with `gpt-5.6-sol`: 52 checks, 52 valid structured outputs, 0 failures (`scripts/data/terminology-check-results.json`, summary in `TERMINOLOGY_SPOTCHECK_RESULTS.md`)
- [x] Material terminology corrections applied and versioned (alias additions across 25 families, dated comments in `families/*.data.ts`; attribute proposals retained for dynamic-matrix runtime, not hard-coded)

**Removed (not requirements):** recruiting QS/structural/electrical/building-services/architect/security reviewers; professional reviews recorded for the 25 matrices; human sign-off of any matrix. Human professional review is optional escalation only — see `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md`.

## Final verification (2026-07-28)

- [x] Backend tests: 105 passed, 7 suites (incl. 24 new matrix/escalation tests, mocked AI — no paid calls in CI)
- [x] Type check (`tsc --noEmit`): clean
- [x] Backend build (`nest build`): passes
- [x] Linter: no errors on changed paths
- [x] No fabricated price stored as market data; no fake professional approval recorded (test-enforced)

## Exit statement

**STAGE 2 CLOSED 2026-07-28.** All revised exit criteria pass. Stage 3 (database schema & core data model) is now active.
