# Stage 8 — Manual operational validation script

Code completion does **not** close Stage 8. Complete this script with a real staff member before marking Stage 8 CLOSED.

## Prerequisites

- Admin dashboard access for at least two staff accounts (maker + checker).
- Backend + admin dashboard running against a non-destructive environment.
- One merchant price-list photograph (WhatsApp screenshot or market photo).
- Founder confirmation of review SLA (defaults: critical 4h / high 24h / medium 72h / low 168h).

## Criterion 1 — Full review cycle without developer help

| Field | Value |
|---|---|
| Staff member | |
| Date | |
| Cases used (IDs) | |
| Time taken | |
| Developer help required? | Yes / No |
| Confusing steps | |

Steps:

1. Open **Price Intelligence → Review Queue**.
2. Open one case → **Approve** with a note.
3. Open a second case → **Reject** with a required reason.
4. Open a third case → **Correct** (structured or observation) with a reason.
5. Confirm the case events and **Audit History** show each action.

Outcome: ☐ Pass ☐ Fail

## Criterion 2 — WhatsApp photo → consumer report

| Field | Value |
|---|---|
| Staff creator | |
| Staff reviewer (different person) | |
| Date | |
| Evidence file ref / document ID | |
| Merchant submission ID | |
| Approved item ID(s) | |
| Resulting observation ID(s) | |
| Consumer report ID where observation appears | |

Steps:

1. Upload the merchant price-list image in **Merchant Submissions** or **Manual Entry**.
2. Enter at least two line items from the image.
3. Submit for review.
4. A **different** reviewer approves one item and rejects one item.
5. Confirm the approved item creates an eligible `PriceObservation`.
6. Run a consumer price check for that product/location and confirm the observation can be included only via normal Stage 5 rules (not hard-coded into the report).
7. Trace audit: report ← observation ← review decision ← evidence ← merchant/reviewer.

Outcome: ☐ Pass ☐ Fail

## Criterion 3 — Role permissions

| Role under test | Account | Can access PI? | Restricted actions verified | Result |
|---|---|---|---|---|
| Authorised reviewer | | | Approve/reject/correct | ☐ |
| Catalogue administrator | | | Add alias / brand | ☐ |
| Source administrator | | | Disable / enable source | ☐ |
| Ordinary admin without PI permission | | Must receive authorised error / no data | | ☐ |

Notes on permission setup: empty `priceIntelligencePermissions` grants all PI permissions to dashboard admins (backward compatible). To restrict, set an explicit permission array on the user (e.g. `["VIEW","REVIEW"]`).

Outcome: ☐ Pass ☐ Fail

## Sign-off

| | |
|---|---|
| Founder / ops owner | |
| Date | |
| Stage 8 status | Code complete / CLOSED |
