# Confidence & Reporting Policy (Stage 5)

**Status:** Active · **Scoring policy:** `price-confidence-v1` · **Report generator:** `price-report-v1`
**Code:** `apps/backend/src/price-intelligence/reports/` (`confidence-policy.ts`, `confidence.ts`, `report.ts`, `bridge.ts`)

## Principle

The final price range, median, outlier decisions, confidence score, confidence label and
insufficient-data decision are produced by **deterministic, versioned, testable rules** — never by
an AI model. The Stage 4 AI layer only classifies evidence (spec match, seller location, source
type, duplicates) and must return supporting evidence for every classification. The same accepted
observations and policy version always produce the same numerical result and the same canonical
input hash.

Routine report generation requires **no human approval**. Professional (QS) review is an optional
escalation only: high-value purchases, contractor quotation reviews, structural materials,
user-requested verification, occasional one-time calibration.

## Score formula (0–100)

| Component | Weight | How it is scored |
|---|---|---|
| Source quality | 25 | 40% best tier + 30% average tier + 20% independent-source count (capped at 4) + 10% domain diversity. Tier fractions: T1 1.0, T2 0.85, T3 0.55, T4 0.25 |
| Recency | 20 | Mean of per-observation bands on the **conservative date** (listing/update date when shown, else check date; a fetch date is never proof of freshness): ≤7d 100%, ≤30d 85%, ≤60d 60%, ≤90d 35%, ≤180d 15%, older ⇒ excluded |
| Specification match | 25 | Mean of: exact 100%, close 70%, partial 30%, ambiguous ⇒ excluded, mismatch ⇒ excluded |
| Location match | 15 | Mean of: exact_city 100%, same_state 80%, nearby_market 55%, national_supplier 30%, different_region 10%, unknown 0% |
| Cluster tightness | 15 | Relative median absolute deviation (MAD ÷ median) of accepted normalised prices: ≤8% 100%, ≤15% 80%, ≤25% 55%, ≤40% 25%, wider 0% |

Cluster tightness is computed only after unit normalisation, spec gating, currency gating,
deduplication and exclusion of invalid observations.

## Exclusion rules (all audited per observation with rule + reason + policy version)

`untraceable_source` (missing URL/check date) · `specification_mismatch` · `specification_ambiguous` ·
`used_product_in_new_request` · `not_comparable_full_price` (deposit/rental/accessory/bundle/currency) ·
`stale_observation` (>180 days) · `unit_not_comparable` (non-modal normalised unit) ·
`duplicate_seller_listing` (same independence group; best tier, then freshest, is kept) ·
`statistical_outlier` (>3.5× MAD, only applied at n ≥ 4).

Excluded observations are never silently deleted: the report snapshot and admin audit retain them.

## Independence

Several URLs from one seller/independence group count as **one** source. Groups come from the
Stage 4 independence detection (domain + seller identity).

## Hard gates (labels can only be lowered, never raised)

- **Market range requires ≥ 2 independent accepted observations.** Exactly one credible source ⇒
  "single-source observed price" (never called a market range, typical price, or high confidence).
  Zero ⇒ insufficient data.
- **High** additionally requires: ≥3 independent sources, ≥1 Tier 1/2 source, spec component ≥80%,
  location component ≥50%, recency component ≥60%, relative MAD ≤25%, full traceability.
- **Moderate** requires ≥2 independent sources.

## Labels

HIGH 80–100 + all high gates · MODERATE 60–79 + moderate gate · LOW 40–59 (or a higher score
downgraded by a failed gate) · INSUFFICIENT DATA <40 or any critical gate failure.

## Report contract & reproducibility

`PriceCheckerReport` (typed, UI-free) contains product, location + limitations, pricing
(range/typical or single-source price), inclusions/exclusions/unknowns (silence ⇒ "not stated",
never "excluded"), per-source detail (seller, tier, displayed + normalised price, units, location
class, URL, listing date, check date), the full `ConfidenceAssessment` (components, positive and
limiting reasons from deterministic templates, hard-gate failures, per-observation exclusions,
recency audit), cautions, one relevant BuildMyHouse next step, and a reproducibility block:
policy versions, included/excluded observation IDs and a SHA-256 hash of the canonical
(sorted-key, order-independent) structured inputs. Snapshots persist in `PriceReportItem.payload`;
admins read them via `GET /admin/price-research/reports/:reportId`.

## Insufficient-data reports

State what was requested, how many sources were checked, why the evidence was insufficient, what
was missing and what the user can do next (expand location, related spec, manual market check,
procurement assistance). No guessed prices, ever.

## Changing the policy

Any change to weights, bands, thresholds or gates requires a **new version string** in
`confidence-policy.ts`. Reports store the version they were scored with; benchmark validation
(`scripts/price-checker-stage5-reports.ts`, stored Stage 4 evidence, zero live spend) must be
re-run and pass before a new version becomes active.
