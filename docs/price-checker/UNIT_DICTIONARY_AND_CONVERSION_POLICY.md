# Price Checker — Canonical Unit Dictionary & Conversion Policy

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/units.ts`

This document covers Stage 2 deliverables 6 (unit dictionary) and 7 (conversion policy).

## Dictionary

~32 canonical units, each with: code, display label, aliases, and dimension (count, mass, area, volume, length, electric capacity, energy, power, package, service). Free-text units are prohibited — every observation stores a canonical code resolved via `resolveUnitAlias()`. Ambiguous market packages are made unambiguous in the code itself (`bag_50kg`, `bucket_20l`, `trailer_600bags`, `length_12m`, `length_5_8m`) so no hidden assumption rides along.

## Conversion policy

1. **Registered conversions only.** `CONVERSION_RULES` is the complete whitelist. `convertPrice()` returns a typed failure (`conversion_not_registered`, `missing_required_factor`, `invalid_factor`, `factor_source_mismatch`) instead of ever guessing.
2. **No invented factors.** Every non-fixed rule declares its factor source: `fixed` (physics: tonne→kg), `manufacturer_spec` (rebar mass tables, panel wattage), `product_spec` (m² per tile carton for the *exact* product), or `seller_stated` (coil length, tipper tonnage).
3. **Original values always preserved.** Conversion results carry `originalPrice`, `originalUnit`, `factorUsed`, `factorSource`, and a human-readable `formula`. The stored observation keeps original seller price/unit/quantity forever.
4. **Precision:** normalised prices round to 2 decimal places at the final step only.
5. **Prohibited examples (tested):** cement bag→m² (unregistered); tile carton→m² without the product's m²-per-carton; any conversion with a zero/negative/absent factor.
6. **Confidence provenance:** whether a factor was seller-specified, manufacturer-specified, professionally reviewed, or assumed is recorded via `factorSource`; "assumed" does not exist as an option by design.
7. **Compatibility:** `unitsComparable()` answers whether two canonical units may ever be compared (identical or linked by a registered rule). Incompatible dimensions never compare.
