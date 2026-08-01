# Price Checker — Proposed Logical Data Model (Stage 2)

**Version:** 3.0 · **Date:** 2026-07-28 · **Status:** **Founder-approved 2026-07-28** and implemented in Stage 3 (`apps/backend/prisma/schema.prisma`, Price Intelligence section) with the founder's Stage 3 additions mapped in below.

## Stage 3 additions (founder requirements, 2026-07-28 — mapped without removing approved decisions)

1. **Permanent vs temporary separation:** permanent catalogue = `PriceCategory`, `PriceProductFamily`, `PriceProduct` (named sub-products), `PriceBrand`, `PriceAlias`, `PriceSpecificationDefinition`, `PriceUnit`, `PriceConversionRule`, `PriceServiceFamily`, `PriceLocation`, `PriceSource`, `PriceSeller`. `PriceTemporaryMatrix` belongs to one research-request item and can never modify or publish a permanent record (promotion only via admin-approved `PriceTaxonomyChangeRequest`).
2. **AI matrix provenance:** `PriceTemporaryMatrix` stores request/item IDs, matched family, raw input, matrix JSON, model name, model response ID, prompt version, schema version, input hash, validation status/errors, confidence, uncertainty reasons, readiness state, escalation recommendation, generatedAt, expiresAt, supersededByMatrixId — never the final JSON alone.
3. **Research/billing separation:** `PriceQuery` (analytics only) / `PriceResearchRequest` / `PriceResearchRequestItem` / `PriceResearchRun` (per attempt) / `PriceReport` / `PriceReportItem` / `PriceCreditLedger` (append-only signed-delta events: credit_purchased, credit_reserved, credit_consumed, credit_released, credit_refunded, admin_adjustment). Commercial rules (≤5 products = 1 credit, 6–10 = 2, insufficient-data lines free, failed report free, reserve-then-settle) implemented deterministically in `src/price-intelligence/billing/credits.ts` with tests.
4. **Append-only observations:** `PriceObservation` status ∈ active/stale/superseded/rejected/duplicate, with duplicate fingerprint, supersededByObservationId, rejection reason, review status, full source/seller/wording/original-vs-normalised price+unit+conversion provenance, listing/checked/expiry dates, collection method, availability. History is never deleted or overwritten.
5. **Tri-state inclusions:** delivery/installation/VAT/accessories/warranty stored as `included | excluded | unknown | not_applicable` (string state, default `unknown`); availability similarly explicit. Missing never silently means excluded.
6. **Financial/unit safety:** all money uses `Decimal` (no floats), ISO `currencyCode` (default NGN); normalised units FK to `PriceUnit`; conversions store rule, original value/unit, converted value/unit, inputs, factor source, confidence. AI-invented factors remain impossible (whitelist FK + Stage 2 validators).
7. **Custom privacy/promotion:** `PriceCustomProductRequest` is private and request-specific by default; AI suggestions (family match / alias / product / family) are stored as proposals; publication requires an approved `PriceTaxonomyChangeRequest` with audit fields.
8. **Marketplace separation:** unchanged from v2 — optional one-way `PriceObservation.materialId` provenance link only.
9. **Location separation:** observation carries sellerLocation, deliveryLocation and sourceMarketLocation; request carries requestedLocation; `PriceReportItem` records locationMatchLevel + fallbackLevel (exact_local / same_city / same_state / nearby_state / national).
10. **Integrity/SaaS:** FKs, unique constraints, composite indexes on the founder-listed query paths, soft deletes on catalogue entities, createdAt/updatedAt, append-only audit records (`PriceCreditLedger`, `PriceObservation`, `PriceTerminologyCheck`, `PriceTaxonomyChangeRequest` decisions), idempotent seeds keyed on natural unique codes (`PriceSeedMeta` records seed versions), schema versioning on matrices and family definitions.
11. **Evidence privacy:** `PriceEvidenceDocument` separates privateFileRef / redactedFileRef / extractedData / redactedExtract; sensitive by default; public APIs may only ever read redacted fields.

Original v2 proposal (still authoritative for entity intent) follows.

## Structural decision

Price intelligence gets its **own model namespace**, separate from the marketplace `Material` table (audit Q8: vendor-owned listings must never be conflated with independently observed evidence). Naming follows existing schema conventions (uuid PKs, `@@map` snake-case tables, string enums where flexibility is needed). Prefix: `Price*`.

## Proposed entities

| Entity | MVP? | Storage | Notes |
|---|---|---|---|
| `PriceCategory` | Yes | Relational rows (no enums) | Parent categories (structural, envelope, finishes, mep, energy, security). Soft delete. |
| `PriceProductFamily` | Yes | Relational + JSON columns | Mirrors the typed `ProductFamily`. `version Int` for review gating; audit history. `attributes`, `questions`, `matching`, `inclusionChecks`, `riskFlags` may live as validated JSON columns initially (schema-checked against the TS types) and normalise later if admin editing demands it. |
| `PriceProductAlias` | Yes | Relational | Market names/misspellings, unique per family; drives matching + demand learning. |
| `PriceServiceFamily` | Yes | Relational + JSON | Mirrors `ServiceFamily`. Kept in a separate table from product families (labour separation rule). |
| `PriceAttributeDefinition` / `PriceAttributeOption` | Later | JSON inside family (MVP) | Normalise into tables only when admin CRUD for attributes ships (Stage 5). |
| `PriceProductSpecification` | Later | — | A named, reusable spec preset (e.g. "Dangote 42.5 50kg retail"); not needed for MVP. |
| `PriceUnit` | Yes | Relational (seeded from `UNITS`) | Canonical codes; referenced by observations. |
| `PriceConversionRule` | Yes | Relational (seeded from `CONVERSION_RULES`) | Whitelist table; versioned by audit history. |
| `PriceClarifyingQuestion` / `PriceQuestionCondition` | Later | JSON inside family (MVP) | Question trees are data already; relational only when the admin question-editor ships. |
| `PriceLocation` | Yes | Relational (seeded from `LOCATIONS`) | Self-referencing parent; type field; used for both seller and delivery references. |
| `PriceSource` | Yes | Relational | Source registry incl. access status (`SOURCE_ACCESS_REGISTER`). |
| `PriceSeller` | Yes | Relational | Seller identity; may optionally link to marketplace vendor `User` (`vendorUserId?`) but never requires it. Contains sensitive contact fields → restricted. |
| `PriceEvidenceDocument` | Yes | Relational + private file ref | Uploaded receipts/quotations; lifecycle state machine; `uploadedByUserId → User`; sensitive; soft delete; links to existing upload storage. |
| `PriceObservation` | Yes | Relational, **append-only** | The heart: familyId, sourceId, sellerId, sellerLocationId, deliveryLocationId?, original price/unit/qty, normalised price/unit + conversion provenance, evidence class, inclusion flags, risk flags, dates (shown/checked), extraction method, limitations. Never vendor-editable; corrections create superseding rows. |
| `PriceObservationAttribute` | Yes | Relational (key/value) | Attribute values per observation; enables matching queries. |
| `PriceResearchRequest` / `PriceResearchRequestItem` | Yes | Relational | Paid/free request; items map to families or temporary custom items; per-item status incl. `insufficient_data` (credit rules). Links to `User`, payment record. |
| `PriceResearchClarification` | Yes | Relational | Q&A exchanges on a request item. |
| `PriceReport` / `PriceReportItem` | Yes | Relational + JSON payload | Generated work product; immutable snapshot incl. ranges, sources, notices; audit history. |
| `PriceTemporaryMatrix` | Yes | Relational + JSON payload | AI-generated temporary matrix per research-request item (`matrix.ts` schema v1): model, response id, generated matrix JSON, validation result, confidence state, escalation flag. Tied to the request; becomes catalogue data only via an approved `PriceTaxonomyChangeRequest`. |
| `PriceTerminologyCheck` | Yes | Relational, append-only | GPT-5.6 terminology spot-check records (model, response id, family, source reference, date, terms discovered, proposed corrections, validation result, confidence, admin correction applied). Never recorded as professional certification. |
| `PriceProfessionalReview` | Later (optional) | Relational, append-only | Mirrors `ProfessionalReviewRecord` for **optional escalation reviews only** (founder decision 2026-07-28: no mandatory reviews); versioned against family version so stale approvals demote honestly. |
| `PriceTaxonomyChangeRequest` | Yes | Relational | Promotion proposals (from demand learning or admin); requires admin approval to apply. |
| `PriceCustomProductRequest` | Yes | Relational | Level 3 requests + demand-learning fields (normalised query, frequency, paid intent, outcomes). |

## Cross-cutting rules

- **Versioning:** `PriceProductFamily`, `PriceServiceFamily`, `PriceConversionRule` (matrix version drives review status).
- **Audit history:** family/service edits, review records, taxonomy change requests, report generation.
- **Append-only:** `PriceObservation`, `PriceTerminologyCheck`, `PriceProfessionalReview` (optional escalations).
- **Soft delete:** categories, families, aliases, sellers, sources.
- **Sensitive data:** `PriceSeller` contacts, `PriceEvidenceDocument` raw files/extracts (redaction before any exposure), `PriceCustomProductRequest` uploads.
- **Links to existing models:** `User` (requesters, uploaders, admin approvers), payments (Paystack records, Stage 7), uploads (S3 refs), notifications. Optional one-way `PriceObservation.materialId → Material` records a marketplace listing as a source; nothing in the marketplace reads price-intelligence tables.
- **Independence:** no public marketplace surface reads these tables directly; reports are the only user-facing projection.

## Admin information architecture & permissions (design only in Stage 2)

Future admin section "Price Intelligence" with areas: Catalogue (categories, families, aliases, market names, attributes, questions), Units & conversions, Locations, Sources & access policy, Sellers, Evidence inbox (moderation + redaction), Reviews (assignments, versions, approvals), Research operations (requests, clarifications, reports), Demand & gaps (custom requests, insufficient-data log, taxonomy change requests).

Recommended permission roles (mapped onto the existing string-role + `rbac.guard.ts` pattern, as admin sub-permissions):

| Role | Can |
|---|---|
| catalogue_editor | Edit draft families/aliases/questions; cannot publish |
| evidence_reviewer | Moderate/redact evidence documents |
| professional_reviewer | Submit optional-escalation review records for assigned categories only (no mandatory-review workflow exists) |
| price_research_operator | Run/manage research requests and clarifications |
| senior_approver | Publish families, approve taxonomy changes, approve reviews |
| full_admin | Everything, incl. permissions |

Only Stage 5 builds these screens; Stage 2 fixes the IA and role boundaries so the data model supports them.

## Migration plan

Stage 3 (backend skeleton) creates the MVP tables after founder approval of this document, seeding `PriceUnit`, `PriceConversionRule`, `PriceLocation`, `PriceCategory`, `PriceProductFamily`, `PriceServiceFamily`, and aliases directly from the Stage 2 typed data — the TS files remain the seed source of truth, guaranteeing docs/code/database agreement.
