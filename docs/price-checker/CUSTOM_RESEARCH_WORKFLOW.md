# Price Checker — Custom-Product Research Workflow (Level 3)

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/custom-research.ts`

The catalogue is never a hard restriction on paid reports. "Research a product not listed" is a first-class entry point.

## Request capture

`CustomResearchRequestInput`: product name, plain-language description, intended use, location, desired quantity, known brand, known specification, photos, quotation/invoice upload, seller link, required deadline, delivery required, installation required.

## Outcomes

`routeCustomRequest()` produces one of:

1. `matched_confident` — exact alias hit on an existing family; proceeds as normal catalogue research.
2. `matched_needs_clarification` — partial alias hit; user confirms the family before research runs.
3. `temporary_research_item` — no match but sufficiently specified (name + at least one of description/brand/spec/photo/quotation/seller link); eligible for paid research; result is delivered to the customer but **no public product page or permanent catalogue item is created**.
4. `admin_review` — ambiguous, sensitive, or operator-flagged requests.
5. `unsupported` — outside research scope (recorded for demand learning).
6. `insufficiently_specified` — asks the user for more identity/context before anything runs.
7. `proposed_new_catalogue_product` — via demand-based promotion (below).

## AI matrix generation for custom items (founder policy 2026-07-28)

For `temporary_research_item` outcomes (no existing family), GPT-5.6 generates a **temporary specification matrix from scratch** (`DYNAMIC_MATRIX_POLICY.md`): identifying the product and likely category, the price-affecting attributes, units, and clarification questions. The matrix is validated deterministically (`validateTemporaryMatrix`), the user answers only the important missing questions (or uploads evidence), and research proceeds without permanently adding a catalogue family. Repeated custom requests feed demand learning below; **AI never publishes a new permanent family automatically**.

## Demand learning

Every unsupported/custom query records: raw query, normalised query, matched family (if any), failed-match reason, requested location, frequency, paid intent, quotation attached, admin outcome, proposed/approved/rejected category, first-seen and latest-seen dates.

## Promotion rule (human-gated)

`qualifiesForPromotionProposal()`: ≥3 distinct requests with ≥1 paid-intent within 60 days ⇒ a **taxonomy change proposal** is generated. AI may draft the proposed family; `canPublishPromotedFamily()` requires explicit admin approval with a recorded admin ID before anything is published. Automation can never publish a family. Tested in `taxonomy.spec.ts`.

## Credits

A temporary research item consumes allowance like a catalogue item; if it returns "insufficient data" it does not count (Stage 1 rule 7), and a completely failed report consumes no credit (rule 8).
