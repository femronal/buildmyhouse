# Price Checker — Stage 2 Repository Audit

**Version:** 1.0 · **Date:** 2026-07-28 · **Status:** Recorded before any Stage 2 changes

This audit answers the ten Stage 2 pre-design questions against the actual repository state.

## 1. Where did the 15-category list originate?

It was drafted during Stage 1 from section 16 ("Core MVP") of the Price Checker agent prompt, lightly edited (POP/ceiling added), and copied into `PRICE_CHECKER_PRD.md` §4 and `PRICE_CHECKER_ROADMAP.md` Stage 2. It was never derived from demand data, commercial scoring, or the BuildMyHouse repairs-first wedge.

## 2. Is it hard-coded anywhere?

**No.** A full-repo search found the list only in the two markdown documents (`PRICE_CHECKER_PRD.md:36`, `PRICE_CHECKER_ROADMAP.md:99` and an SEO suggestion at `:354`). No code, schema, UI, or test references it.

## 3. How does the PRD treat the list?

As a **launch priority with explicit deferral**: "Categories (confirm final list in Stage 2)". It reads as a draft, but the §4 sentence "Everything else shows 'location not yet covered'" pattern and the absence of any custom-research pathway meant the PRD *implied* a complete product boundary. That implication is what Stage 2 removes.

## 4. Which code, schema, UI, or tests assume only 15 categories?

**None.** The current `/tools/price-checker` page (`apps/mobile-homeowner/components/tools/PriceCheckerPage.tsx`) is a static page over `REPAIR_PRICING_GUIDE` — 5 repair *services* (plumbing, electrical, roof leak, drainage, window), not the 15 materials. The landing tools catalog (`apps/mobile-homeowner/lib/property-tools-catalog.ts`) describes the tool but lists no categories.

## 5. Which documents must be updated so the catalogue is not a hard limit?

- `PRICE_CHECKER_PRD.md` §4 (scope) and §5 (journey) — updated this stage.
- `PRICE_CHECKER_ROADMAP.md` Stage 2 section (category list, QS-only sign-off) — updated this stage.
- No code changes required for this specific correction.

## 6. Does the current architecture support an "Other product / custom research" request?

**No.** Nothing exists: no research request models, no request routing, no admin queue. The Price Checker backend does not exist yet (Stage 3+ work), so custom research can be designed in from the start at zero retrofit cost. Design: `docs/price-checker/CUSTOM_RESEARCH_WORKFLOW.md`.

## 7. What would break if the catalogue grows later?

Nothing in code today. The risks are design-time: (a) if categories were hard-coded into Prisma enums, growth would need migrations — the proposed model therefore uses **rows, not enums**, for categories/families; (b) if question trees were hard-coded into frontend components, growth would need releases — questions are therefore **data, rendered generically**.

## 8. Does the existing `Material` model have enough structure for price intelligence?

**No — and it must not be extended to try.** `Material` (`apps/backend/prisma/schema.prisma:400`) is a vendor-owned marketplace listing: one mutable `price: Float`, free-text `category`/`brand`/`unit`, `stock`, `vendorId`, order/review relations. It lacks: source provenance (URL, date checked), seller location, specification attributes, original vs normalised units, observation history, confidence, review status. Forcing observations into it would conflate a vendor's advertised offer with independently observed market evidence — precisely the confusion the product rules prohibit.

## 9. Which existing pieces are reusable, and which concepts must remain separate?

**Reuse:**
- `User` + string roles (`'homeowner' | 'general_contractor' | 'subcontractor' | 'vendor' | 'admin'`) and `rbac.guard.ts` role guards for admin permissions.
- Upload infrastructure (`apps/backend/src/upload`, S3 presigning) for evidence documents, receipts, quotation uploads.
- Notifications module for research-complete / clarification-needed messages.
- Payments module patterns for the future Paystack credit flow (Stage 7).
- `openai.service.ts` config pattern (`OPENAI_API_KEY`, per-feature model overrides).
- Naming/style conventions: kebab-case files, typed const taxonomies (`packages/shared-types/src/build-opportunity-taxonomy.ts` is a good precedent), colocated `*.spec.ts` tests under `apps/backend/src`.

**Keep separate (new price-intelligence namespace):**
- Catalogue (families, products, attributes, aliases) — not `Material`.
- Observations (evidence with provenance) — never vendor-editable.
- Evidence documents (receipts/quotations, with redaction) — private by default.
- Research requests/reports (paid work products) — linked to `User`, not to marketplace.
- A future *optional* link `PriceObservation.materialId` can associate a marketplace listing as one **source** of an observation, keeping the direction one-way.

## 10. Are service and labour prices currently represented anywhere?

Only as static marketing/planning content, none of it structured for price intelligence:
- `REPAIR_PRICING_GUIDE` (`apps/mobile-homeowner/lib/agent-seo-content.ts`) — 5 repair job ranges (labour + material bundled, directional).
- Renovation budget planner constants (`BASE_SPACE_COST_NGN` etc. in `RenovationBudgetPlannerPage.tsx`) — per-space lump estimates.
- Milestone payment tool — no prices, only budget allocation.

None distinguishes labour-only vs labour-and-material, pricing unit, minimum job charge, or scope conditions. A separate service-price taxonomy is required: `docs/price-checker/SERVICE_LABOUR_TAXONOMY.md`.

## Audit conclusion

The 15-category limit is a documentation artifact, not a technical one. The clean-slate backend position means the three-level catalogue (deep launch families / expansion backlog / open custom research) can be adopted without refactoring. The single structural decision the audit forces: **price-intelligence entities are a new, separate model namespace; the marketplace `Material` table is not extended.**
