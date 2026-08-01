# Price Checker — "Verify My Quotation" Product Specification (future paid product)

**Version:** 1.0 · **Date:** 2026-07-28 · **Status:** Stage 2 specification only; built in later stages

This is expected to be the strongest commercial use case for the ₦15,000 report: a homeowner (often diaspora) uploads a contractor/supplier quotation, BOQ, invoice, receipt, screenshot, PDF, image, or supported spreadsheet, and receives a line-by-line reasonableness assessment.

## Pipeline (future implementation, deterministic/AI split per Stage 2 rules)

1. **Extract** line items (AI) while **preserving original wording** verbatim on every line.
2. **Map** each line to a catalogue product family, service family, or temporary research item (AI proposes, deterministic alias matching validates, ambiguous lines go to clarification).
3. **Identify missing specifications** per the family's matching keys; **request clarification** through the standard question engine.
4. **Detect bundles** (product + installation + accessories in one line) using family `bundle_state`/inclusion structures; bundles are compared only against bundle observations, never product-only listings.
5. **Detect duplicated items** across lines.
6. **Detect arithmetic errors** (qty × rate ≠ amount; column totals) — purely deterministic.
7. **Detect quantity/unit mismatches** against the canonical unit dictionary (e.g. tiles quoted per carton but quantified in m² without a coverage factor).
8. **Research comparable market observations** per mapped line (Stage 4+ engine).
9. **Separate** product, labour, delivery, installation, VAT and accessories using the product/service taxonomy split.
10. **Compare** line rates and quotation totals against observed ranges; **flag lines that cannot be compared** with the reason (not comparable spec, prohibited conversion, insufficient data).

## Language rules

The system never labels a quotation "fraudulent" or a contractor dishonest. Approved neutral phrasings:

- "This line is above the checked observed range."
- "The specification is incomplete, so the comparison is low confidence."
- "Delivery may explain part of the difference."
- "This item appears to be a bundle and should not be compared with product-only listings."

## Credit interpretation (recommendation)

One ₦15,000 credit covers **up to five successfully researched catalogue items** (product or service families after mapping) — not five uploaded lines and not five whole families. Fairness rules: duplicate lines of the same item merge and count once; lines returned "insufficient data" don't count (Stage 1 rule 7); arithmetic/structure checks over the whole document are free with any report; six to ten researched items consume two credits (Stage 1 rule 5); the user sees the item count and credit requirement **before** payment (rule 6). This is the fairest interpretation because the customer pays for delivered research, not document length. **Awaiting founder approval before Stage 6/7 UI copy.**

## Privacy

Quotation uploads follow the evidence-document lifecycle and redaction rules in `SOURCE_EVIDENCE_POLICY.md`; contractor personal phone numbers and customer identity fields are redacted from anything that leaves admin review.
