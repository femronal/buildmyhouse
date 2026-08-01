# Price Checker — Location Taxonomy

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/locations.ts`

## Model

Nigeria-first hierarchy of typed nodes: country → state → city → local area, plus **market** nodes (e.g. Orile/Coker building materials, Owode Onirin iron, Idumota/Dosunmu electrical, Dei-Dei Abuja) attached to cities. Every observation distinguishes **seller location** from **delivery destination** — both reference the same node table, on separate fields. `nationalDelivery` is a per-seller capability flag, not a location.

Launch-priority states: **Lagos, Ogun, Abuja/FCT, Edo** (flagged `launchPriority`). Ten more states are pre-seeded; expanding to all 36 + FCT is a data change (add rows), never a code change. Lagos/Ogun local areas and markets are likewise data — no neighbourhood is hard-coded into business logic.

## Fallback ladder (deterministic, tested)

`matchLocation(requested, observed, nationalDelivery)` walks:

1. exact local area
2. same city
3. same state — with mandatory substitution notice
4. nearby state (regional table, e.g. Lagos↔Ogun) — with substitution notice
5. national seller — only if the seller delivers nationally, with notice that delivery cost is usually excluded
6. insufficient local data — explicit, never silently papered over

Reports must render the `substitutionNotice` verbatim whenever levels 3–5 are used, so a user in Ajah is never shown an Orile price as if it were local without disclosure.
