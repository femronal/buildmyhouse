# Price Checker — Catalogue Priority (Paid-Report Value Model)

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/priority.data.ts`

Every deep-launch (Level 1) and expansion (Level 2) family is scored 1–5 on 18 dimensions: search demand, paid-report willingness, average purchase value, spec complexity, quotation-inflation risk, seller-price inconsistency, delivery sensitivity, installation sensitivity, online-source availability, offline-supplier availability, unit-normalisation ease, counterfeit risk, repairs relevance, renovation relevance, construction relevance, diaspora relevance, SEO potential, and BuildMyHouse service-conversion potential. Totals are computed deterministically by `totalScore()`; ranked output by `rankedPriorities()`.

**Scores are recorded analyst judgments for prioritisation, not market facts. Revisit with real demand data after launch.**

## Key conclusions

1. **The most-searched item is not the best paid item.** Cement scores highest on search demand (5) and lowest on paid willingness (1). It anchors the free/cached/SEO funnel and builds trust; it will rarely sell a ₦15,000 report alone.
2. **The paid-report core is systems, not commodities:** inverters, batteries, solar panels, generators, kitchen cabinets, aluminium windows, doors, CCTV, roofing, waterproofing. They share: high ticket, dense specs, bundle games, counterfeit risk, installation sensitivity, diaspora relevance.
3. **Funnel roles** (`funnel` field): `free` = cache/SEO anchor; `paid` = live-research report strength; `both` = commodity with occasional bulk/quotation paid pull.
4. **Launch-priority recommendation:** all 25 Level 1 families launch together (free families feed the cache; paid families justify the report price). Among Level 2, the priority-1 wave is: air conditioners, wardrobe systems, stone finishes, fencing & gates, borehole equipment, water heaters.

## Why each family is free, paid or both

The per-family `why` strings in `priority.data.ts` record the reasoning (e.g. batteries: "Chemistry confusion (lithium vs tubular) makes naive comparisons costly — exactly what the report solves"). See `LEVEL2_EXPANSION_BACKLOG.md` for expansion rationale.
