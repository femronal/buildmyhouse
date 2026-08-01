# Price Checker — Level 1 Product-Family Catalogue

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/families/`

25 deep-launch families, each carrying a full specification matrix as typed data. The matrix standard per family:

1. **Identity** — canonical name, Nigerian market names/aliases/misspellings (`marketNames`), parent category, sub-products (parent→child, e.g. Paint systems → primer/emulsion/satin/texture/screeding/waterproof coating), product-vs-system-vs-accessory (`kind`), applicable conditions (new/used/refurbished/rental).
2. **Price-changing attributes** — `attributes[]` with `priceChanging` flags; only category-relevant attributes are included (e.g. cement: brand/grade/bag weight/retail-vs-wholesale; batteries: chemistry/voltage/Ah/brand/condition/warranty/bundle state).
3. **Original seller units** — `sellerUnits[]`, canonical codes only.
4. **Normalised comparison unit** — `normalizedUnit` + `normalizedUnitRationale` explaining validity.
5. **Conversion requirements** — registered rules in `units.ts` (`CONVERSION_RULES`); anything unregistered is prohibited and `convertPrice()` returns an explicit failure rather than guessing.
6. **Clarifying questions** — `questions[]`, each marked always/conditional/optional/admin-only/professional-review, with plain-language prompts, "why it matters" text, and `allowUnknown` flags.
7. **Matching rules** — `matching.exactMatchKeys` / `closeMatchKeys` / `neverComparableAcross` (e.g. battery chemistry, cement retail-vs-trailer, paving material-only vs with-laying).
8. **Inclusions/exclusions** — `inclusionChecks` (delivery, VAT, installation, accessories, warranty, labour, transportation, loading/offloading, minimum quantity, negotiable).
9. **Risk flags** — `riskFlags` (used item, accessory-only, deposit-only, contact-for-price, placeholder, smaller spec, wholesale-only, damaged, discontinued, rental, incomplete bundle).
10. **Optional-escalation ownership** — `reviewers.primary`/`secondary` + reason. This is routing metadata for *optional* escalation reviews only (founder decision 2026-07-28: no mandatory professional sign-off). When an optional review does occur, its status is computed from review records, not asserted (see `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md`).

**Matrices are reusable baseline templates, not runtime answers.** At runtime, GPT-5.6 generates a temporary matrix combining the template, the user's description, known specs, uploaded evidence, market terminology, AI reasoning and deterministic unit/validation rules (`DYNAMIC_MATRIX_POLICY.md`). Terminology in these templates is validated by GPT-5.6 spot checks against real Nigerian listings (`scripts/data/terminology-check-results.json`).
11. **Evidence examples** — 2 per family in `samples[]`, hard-typed `illustrativeOnly: true` with an "ILLUSTRATIVE ONLY" note. **Never market data, never user-facing, excluded from production reports.**

## Family list (grouped)

| Group | Families | File |
|---|---|---|
| Structural | Cement · Reinforcement steel · Concrete blocks · Sand · Granite & aggregates | `families/structural.data.ts` |
| Envelope | Roofing sheets & accessories · Waterproofing · Doors · Aluminium windows & glass | `families/envelope.data.ts` |
| Finishes | Tiles/adhesive/grout · Paint systems · POP/gypsum/ceilings · German flooring & paving · Kitchen cabinets & worktops · Sanitary wares | `families/finishes.data.ts` |
| MEP | Electrical cables · Electrical protection & accessories · Plumbing pipes & fittings · Water pumps · Water tanks | `families/mep.data.ts` |
| Energy & security | Solar panels · Inverters · Solar/inverter batteries · Generators · CCTV & security | `families/energy-security.data.ts` |

Integrity is enforced by tests (`taxonomy.spec.ts`): 25 unique keys, registered units only, valid question dependencies, named escalation disciplines, illustrative-only samples, bundle structures on bundle-prone families.
