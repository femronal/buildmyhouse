# Price Checker — Level 2 Expansion Backlog

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/expansion.data.ts`

23 expansion families recorded with: why valuable, paid-report potential, likely escalation discipline, likely source availability, and proposed priority (1 = next wave). None receives a full launch matrix in Stage 2; all must fit the existing `ProductFamily` type when promoted. Commercial scores for each live in `priority.data.ts` alongside Level 1.

| Priority | Families |
|---|---|
| 1 (next wave) | Air conditioners · Water heaters · Borehole equipment · Wardrobe systems · Marble/granite/quartz finishes · Fencing & gate systems |
| 2 | Water treatment · Automatic transfer switches · Electric fencing · Access control · Lighting systems · Glass balustrades & shower enclosures · Steel trusses & roofing timber · Building chemicals · Scaffolding & equipment hire · Fire-safety equipment |
| 3 | Smart locks · Drainage channels & covers · Kerbs · Sealants & adhesives · Landscaping inputs · Commercial pumps & controls · Fuel-station equipment |

**Promotion path:** an expansion family is promoted by (1) building its full matrix in the taxonomy files, (2) passing GPT-5.6 terminology validation against real listings, (3) admin approval — the same gate as custom-research promotions (`CUSTOM_RESEARCH_WORKFLOW.md`). Professional review is optional escalation only. Custom paid research for any of these families is allowed **today** via the Level 3 flow; the backlog only gates catalogue depth, never paid research.
