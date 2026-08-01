# Price Checker — Refund & insufficient-data policy

**Status:** Stage 7 operational policy (customer-facing wording approved with product copy)  
**Last updated:** 2026-07-31

## What the customer pays for

Payment covers **current price research and report preparation** for the materials listed in that checkout only. It is a one-time fulfilment for that request — not a subscription and not a reusable credit wallet.

## Report outcomes

Each paid (or free-allowance) item receives one of:

1. **Complete price report** — source-backed range, typical price, confidence, PDF.  
2. **Insufficient-data report** — research ran, but evidence was not strong enough for a defensible market range. This **counts as fulfilled** when `PRICE_CHECKER_INSUFFICIENT_DATA_COUNTS_AS_COMPLETED=true` (default). It is disclosed before payment.  
3. **Technical failure** — BuildMyHouse could not run or complete research (provider outage before meaningful work, internal crash, corrupted job). This does **not** count as a fulfilled paid report.

## Customer-facing disclosure (checkout)

> Each item receives either a source-backed price report or an honest insufficient-data result when reliable evidence cannot be confirmed. Technical failures are eligible for a refund.

## Refund rules

| Situation | Action |
|-----------|--------|
| Technical failure (full batch) | Full refund of the paid amount |
| Technical failure (subset of items) | Partial refund for failed line items only; completed reports kept |
| Duplicate payment | Full refund of the duplicate |
| Amount / currency mismatch | No fulfilment; admin review + refund of charged amount |
| Payment success but entitlement never created | Full refund after verification |
| Customer dislikes the prices found | **No refund** |
| Insufficient-data result | **No refund** (research was performed; disclosed before pay) |

Refunds are initiated via Paystack. Bank settlement timing is controlled by the payment provider — do not promise an instant bank credit.

## Operational workflow

1. Detect technical failure on a line item (`fulfilmentStatus = technical_failure`).  
2. Prefer safe retry once.  
3. If still failed, create a `price_check_refunds` row and call Paystack refund (full or partial kobo).  
4. Notify the customer at the guest checkout email.  
5. Admin → Price Checker revenue surfaces unfulfilled paid orders for review.

## Complaint procedure

1. Customer contacts WhatsApp / support with payment reference.  
2. Ops looks up order by `providerReference`.  
3. If technical failure confirmed → refund path above.  
4. If insufficient data → explain policy; offer verified local market check (WhatsApp escalation from Stage 6).  
5. Unusual cases → admin approval before refund.
