# Price Checker — Dynamic AI Matrix Policy

**Version:** 1.0 · **Date:** 2026-07-28 · **Founder-approved**
**Source of truth:** `apps/backend/src/price-intelligence/taxonomy/matrix.ts` · Model config: env `PRICE_CHECKER_MATRIX_MODEL` (currently `gpt-5.6-sol`; do not hard-code the model name)

## Principle

A product specification matrix is generated dynamically in the background by the approved OpenAI reasoning model (GPT-5.6) **before** a live price search proceeds. The generated matrix is a **temporary research structure tied to that request** — not a permanent catalogue record unless an admin later approves it as a reusable definition. AI must never invent specifications merely to produce a price.

## The dynamic flow

1. User enters a catalogue product or custom product.
2. AI identifies the product and its likely category.
3. AI generates a temporary specification matrix as structured JSON.
4. The matrix identifies the product details that can materially affect price.
5. The system compares the generated matrix with any existing catalogue definition (`enrichMatrixFromFamily` — required attributes, comparison unit and prohibitions come from the catalogue, never AI alone).
6. The system asks the user only the important missing questions.
7. The user may answer "I don't know," upload a photograph, provide a seller link, or upload a quotation.
8. AI updates the matrix using the available answers and evidence.
9. Live price research begins only when the specification is sufficiently clear (`decideReadiness`).
10. When unclear: lower confidence, ask for clarification, offer exceptional (optional) review, or return insufficient data.
11. The system never invents specifications to force a price.

## Runtime matrix = combination of

1. the reusable family template (the 25 Level 1 matrices remain baseline templates);
2. the user's product description;
3. known specifications;
4. uploaded evidence;
5. relevant market terminology;
6. AI reasoning;
7. deterministic unit and validation rules.

For **Level 3 custom searches** with no existing family, GPT-5.6 generates a temporary matrix from scratch; clarification questions are asked; the request proceeds **without** permanently adding a catalogue family. Repeated custom requests may create an admin taxonomy suggestion, but AI must never publish a new permanent family automatically (`canPublishPromotedFamily` requires admin approval — test-enforced).

## Temporary matrix schema (v1 — `validateTemporaryMatrix`)

Top level: `requestId`, `rawProductName`, `canonicalProductName`, `matchedFamilyId`, `matchConfidence`, `productType`, `aliasesDetected`, `intendedUse`, `requiredAttributes`, `knownAttributes`, `missingAttributes`, `clarificationQuestions`, `originalUnit`, `preferredComparisonUnit`, `possibleConversions`, `prohibitedConversions`, `inclusionQuestions`, `deliveryRequired`, `installationRequired`, `condition`, `location`, `riskFlags`, `evidenceProvided`, `minimumResearchReadiness`, `researchReady`, `confidence`, `uncertaintyReasons`, `escalationRecommended`, `generatedByModel`, `generatedAt`, `schemaVersion`.

Each clarification question: `id`, `question`, `plainLanguageExplanation`, `attributeKey`, `questionType`, `required`, `reasonItAffectsPrice`, `options` (where relevant), `allowsUnknown`, `allowsUpload`, `displayOrder`.

Malformed model output is rejected with itemised errors; one corrective retry is permitted, after which the request fails safely (no silent repair).

## AI vs deterministic responsibilities

**AI (GPT-5.6):** identifying products from ordinary Nigerian market language; generating temporary matrices; interpreting aliases and misspellings; deciding which attributes materially affect price; generating concise clarification questions; extracting product details from quotations and listing text; identifying possible product mismatches; comparing generated matrices against catalogue definitions; explaining uncertainty; recommending escalation.

**Deterministic code:** unit compatibility; unit conversions; quantities; arithmetic; currency handling; range and median calculations; credit accounting; date handling; location fallback; source counts; duplicate handling; confidence-score arithmetic; required output fields; refusal when minimum evidence thresholds are not satisfied.

**AI must not invent:** conversion factors; product dimensions; carton coverage; cable length; steel weight; battery capacity; delivery charges; current prices; seller availability; professional approval. Enforced by `validateProposedConversions`: every proposed conversion must match a registered `CONVERSION_RULES` entry with the registered factor source; AI-supplied fixed factors that disagree are rejected.

## Confidence and failure states (`decideReadiness` — deterministic)

| State | Paid research proceeds? |
|---|---|
| `research_ready_high_confidence` | Yes |
| `research_ready_moderate_confidence` | Yes |
| `clarification_required` | No — asks required questions |
| `evidence_required` | No — requests photo/link/quotation |
| `optional_specialist_escalation` | Yes — specialist look offered, never required |
| `unsupported_product` | No |
| `insufficient_specification` | No |

Paid research must not silently continue when the matrix is too uncertain. The AI-generated matrix does not guarantee correctness; safety-sensitive reports carry the informational disclaimer in `MATRIX_VALIDATION_AND_ESCALATION_POLICY.md` without triggering mandatory review.

## Terminology spot checks (GPT-5.6-backed, replaces human checks)

Runner: `apps/backend/scripts/price-checker-terminology-check.ts` (one family, a set, or `--all`; `--dry-run`; JSON output; one retry on malformed structured output; failure reporting; token/cost logging; API key never printed; model via `PRICE_CHECKER_MATRIX_MODEL`).

Corpus: `scripts/data/terminology-samples.json` — 2–3 **real** Nigerian listing texts per Level 1 family, captured manually from public Jiji.ng search pages on 2026-07-28 (no restricted scraping, no CAPTCHA bypass, no automated account access). Results: `scripts/data/terminology-check-results.json`, recording model, response ID, family, source reference, date, terms discovered, proposed corrections, validation result, confidence, and whether an admin correction was applied.

Rules: an AI spot check is not professional certification; sample listing prices are never market data; checks count as complete only when the model-backed validation genuinely ran.

## Testing

Automated tests (`matrix.spec.ts`) mock AI structures — no paid API calls in CI. Live GPT-5.6 validation is a separate explicit command (the script above).
