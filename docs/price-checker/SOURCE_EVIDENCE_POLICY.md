# Price Checker — Source & Evidence Policy (incl. Receipts, Quotations, Price Lists)

**Version:** 2.0 · **Date:** 2026-07-30 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/evidence.ts` (evidence classes) + `apps/backend/src/price-intelligence/research/source-registry.ts` (Stage 4 per-source access policy)

Covers Stage 2 deliverables 11–12 and the Stage 4 revisions (founder-approved 2026-07-30).

## Evidence classes (with trust tiers)

Tier 1: manufacturer/authorised distributor. Tier 2: established ecommerce/supplier, supplier quotation, supplier price list, receipt/invoice, manually confirmed merchant price. Tier 3: classified-marketplace listing, user-submitted evidence. Tier 4: weak secondary source. (`EVIDENCE_CLASS_TIER`.)

## Capture fields

Every evidence sample documents the 22 fields in `EVIDENCE_CAPTURE_FIELDS`: source type/name/URL-or-document-ref, seller + seller location, product description, price, currency, original unit, quantity, date shown by source, date checked, delivery/installation/VAT inclusion, retail-or-wholesale, availability, new-or-used, negotiable, extraction method, archived-evidence ref (where legally permitted), and limitations.

## Ethics rules (hard constraints)

No CAPTCHA bypass, no automated account login, no rate-limit evasion, no ToS violations, no personal-data scraping, no unnecessary private seller information, and a search-result snippet is never presented as a verified listing. **No production scraping integrations are built in Stage 2 at all.**

## Source registry (revised in Stage 4)

The registry is **not merely a list of sites to scrape**. `research/source-registry.ts` stores, per source: name, domain, source type, confidence tier, coverage, public-access status, **search-discovery eligibility, direct-fetch eligibility, browser-fallback eligibility** (three separate decisions), API/feed availability, permission requirement, rate-limit policy, robots/terms notes and review status, enabled flag, and admin notes. Runtime metrics (extraction success rate, observation acceptance rate, freshness, latency, cost) are tracked against the Stage 3 `PriceSource` table.

Access decisions are source-specific: **Jiji** is discovery- and fetch-eligible (asking prices, Tier 3; in practice its bot protection may return 403, which is recorded honestly, never bypassed); **Jumia** is discovery- and fetch-eligible (Tier 2, JSON-LD usually present); **Konga** is discovery-only (automated extraction prohibited); **Facebook Marketplace** is excluded entirely (login-gated). A source can be valuable for discovery even when automatic extraction is not permitted.

## Retrieval outcomes (Stage 4)

Every fetch attempt records one of 13 outcomes (`fetched_successfully`, `structured_data_found`, `readable_text_found`, `blocked_by_source`, `login_required`, `captcha_required`, `robots_or_policy_restricted`, `dynamic_rendering_required`, `no_useful_content`, `timeout`, `unsafe_url_rejected`, `unsupported_content`, `fetch_failed`) — the outcome is stored, not merely the extracted price. The retrieval layer uses a clear BuildMyHouse user agent, sensible timeouts, bounded retries, response-size caps, unsafe-scheme rejection, SSRF/private-IP protection (including redirects), robots.txt respect, and never bypasses logins, CAPTCHAs or rate limits.

## Stage 2 evidence targets

Two or three representative examples per Level 1 family, from more than one source type where practical, gathered only to prove the matrices reflect real seller terminology — never claimed to represent the full market. The per-family `samples[]` are typed `illustrativeOnly: true` structure tests; live terminology spot-checks against real listings are part of open Stage 2 validation.

## Uploaded documents (receipts, quotations, supplier price lists)

**Upload workflow captures:** document type, supplier, supplier location, transaction/quotation date, product lines (description, quantity, unit, price), delivery, installation, wholesale status, uploader's relationship to the document, proof-consent status, moderation status, and private fields to redact.

**Document lifecycle** (`EvidenceDocumentState`): uploaded → extraction pending → extraction complete → clarification required → under review → approved as evidence / rejected / duplicate / expired / private archive only.

**Privacy:** the following are never publicly exposed and are redacted (`redactSensitiveFields()`, tested including nested structures): customer names, phone numbers, home addresses, bank details, card details, private invoice numbers, signatures, emails, account numbers, and any unnecessary identifying information. Raw uploads live in private storage (existing S3 upload module) with admin-only access; only redacted extracts can ever feed public-facing statistics, and only after moderation approves the document as evidence.

Stage 2 creates the structure only; no document collection drive is required before Stage 2 closes.

## Merchant data is optional (Stage 4 founder decision)

Merchant price lists, receipts, WhatsApp contacts and weekly feeds are **not required** to build, validate or launch the live-research pipeline. They remain optional evidence channels (useful later for offline-market coverage, transaction prices, wholesale, delivery costs, weak-online-coverage products, confidence calibration). Any merchant document submitted later enters the **same observation-validation pipeline** — it never bypasses validation and never secretly overrides independently observed market evidence.

Evidence is labelled distinctly as: public online listing · manufacturer source · authorised distributor source · supplier quotation · supplier price list · receipt/completed transaction · merchant-submitted update · user-submitted evidence · manually entered observation.
