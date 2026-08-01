# Price Checker — Service & Labour Taxonomy

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/services.data.ts`

Labour and installation prices are **never** stored as ordinary product observations. They use a parallel `ServiceFamily` model with 20 launch service families: tiling, painting, screeding, POP installation, gypsum ceiling installation, electrical point installation, plumbing point installation, roofing labour, window fabrication & installation, door installation, solar installation, CCTV installation, inverter installation, air-conditioner installation, drainage construction, borehole drilling, waterproofing application, German-floor installation, kitchen-cabinet fabrication & installation, and scaffolding/equipment rental.

## Per-family definition

- **pricingBasis** — `labour_only`, `labour_and_material`, or `either`. Observations must record which basis a price uses; the two bases never compare directly.
- **pricingUnits** — canonical service units (`sqm`, `point`, `piece`, `room`, `job`, `day`, `linear_metre`, `kva`).
- **hasMinimumJobCharge** — all launch services carry minimum-job-charge behaviour; small jobs must not be divided into misleading per-unit rates.
- **scopeFactors** — the conditions that must match (or be disclosed) before two service prices are compared. Every family includes the base set (labour-vs-material basis, location, project scale, access conditions, transportation, call-out fee) plus family-specific factors (e.g. tiling: tile size, floor-vs-wall, screeding required, demolition of old tiles, disposal; electrical points: conduiting-vs-surface, rewiring, chasing, materials included, testing & commissioning; borehole drilling: expected depth, terrain/geology, casing, pump/tank/treatment inclusion, geophysical survey).
- **reviewers** — named optional-escalation discipline per family (routing metadata, not mandatory sign-off — see `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md`).

## Comparison rule

Service prices are comparable only when pricing basis, pricing unit and material scope factors match. Reports must state scope differences explicitly (e.g. "this rate includes materials; the other is labour-only") instead of presenting a single merged range. Warranty, testing/commissioning, demolition and disposal are disclosure fields on every service observation.

Complexity factors not yet quantifiable (finish level, access) are recorded as free-text scope notes in Stage 2 and become structured attributes when real observations justify it.
