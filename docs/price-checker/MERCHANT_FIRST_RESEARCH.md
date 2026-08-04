# Merchant-first research architecture

**Status:** Implemented (consumer research + AI-assisted merchant intake)  
**Date:** 2026-08-04

## Goal

Use approved merchant / admin price-list observations as first-class evidence, **before** spending on live web research — without letting one shop secretly become “the market.”

## Intake (admin)

1. Staff uploads a WhatsApp / market price-list image (`Merchant Submissions`).
2. **Extract items with AI** drafts line items via GPT-5.6 Sol vision (`POST /admin/price-intelligence/merchant-submissions/extract-from-image`).
3. Staff corrects family keys / units and submits.
4. A reviewer **approves** items → `PriceObservation` rows (`collectionMethod: merchant_feed`, `evidenceClass: merchant_confirmed`).
5. Manual Entry follows the same observation factory with `admin_entry`.

AI never publishes prices. Humans approve.

## Consumer research order

In `PriceCheckerResearchService.runJob`:

1. Build the plan target from catalogue answers.
2. **Lookup** active, fresh (`≤ maxObservationAgeDays`) observations for the family (`merchant_feed` + `admin_entry`).
3. Soft brand filter when a brand answer exists.
4. Independence: merchant rows group by `merchantId`; each admin entry is its own group.
5. If **≥ 2 independent groups** → skip live web research (unless `PRICE_CHECKER_FORCE_LIVE_RESEARCH=true`).
6. Else → run Stage 4 `researchItem`, then **merge** internal + live scoring observations.
7. Stage 5 `generateReport` scores the combined set. Report cautions state whether merchant lists and/or live web were used.

## What this is not

- Not “re-read every PDF with the model on each user check.”
- Not a private per-merchant catalogue that bypasses confidence gates.
- One merchant alone still yields single-source / low-confidence behaviour when it cannot form a range.

## Env

| Variable | Effect |
|---|---|
| `PRICE_CHECKER_FORCE_LIVE_RESEARCH=true` | Always run live web even when internal evidence is enough |
| `PRICE_CHECKER_EXTRACTION_MODEL` | Model used for price-list vision extract (default Sol) |

## Key files

- `research/internal-observations.ts` — pure mapping + sufficiency
- `research/internal-observation.service.ts` — Prisma lookup
- `ops/merchant-list-extractor.service.ts` — vision extract
- `consumer/price-checker-research.service.ts` — orchestration
- Admin UI: `apps/admin-dashboard/.../merchant-submissions/page.tsx`
