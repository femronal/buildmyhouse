# Price Checker — Clarifying-Question Engine

**Version:** 1.0 · **Date:** 2026-07-28 · **Source of truth:** `apps/backend/src/price-intelligence/taxonomy/questions.ts` + per-family `questions[]` in `families/`

## Principles

- Ask only questions that materially affect price comparison (each question maps to price-changing attributes).
- Plain language, with technical terms explained in the prompt or `whyItMatters` (shown as helper text) — e.g. "Surface pump (beside tank) or submersible (inside borehole/well)?".
- Every question declares `allowUnknown`; "I don't know" is a first-class answer.
- Progressive disclosure: `selectVisibleQuestions()` shows only `always` questions plus `conditional` questions whose `dependsOn` condition is satisfied. `admin_only` and `professional_review` questions never reach end users (the latter now exists only for optional-escalation workflows; it is never a user-facing gate).
- Contradiction detection: `findContradictions()` flags conditional answers whose dependency no longer holds (user changed an earlier answer).
- Photo upload and quotation upload are supported question types and also serve as "I don't know" escape hatches.

## Question types

single_select, multi_select, number, quantity_unit, free_text, brand_search, model_search, location, yes_no, image_upload, document_upload — plus the `unknown` answer channel.

## "I don't know" outcomes (deterministic routing)

`resolveUnknownOutcome()` routes to: quotation extraction (if a quotation is attached) → photo identification (if a photo is attached) → admin clarification (3+ unknowns) → broadened low-confidence research (default) → insufficient specification (when the question forbids unknown, e.g. retail-vs-trailer for cement). Professional assistance is offered from the admin-clarification path when the gap is technical (e.g. cable conductor material).

## AI-generated clarification questions (founder policy 2026-07-28)

At runtime, GPT-5.6 generates concise clarification questions inside the temporary matrix (`DYNAMIC_MATRIX_POLICY.md`), asking **only the important missing questions** after the family-template questions and known answers are accounted for. Each AI-generated question must satisfy the strict schema (`matrix.ts`): `id`, `question`, `plainLanguageExplanation`, `attributeKey`, `questionType` (one of the types above), `required`, `reasonItAffectsPrice`, `options` where relevant, `allowsUnknown`, `allowsUpload`, `displayOrder`. Invalid questions are rejected deterministically (`validateTemporaryMatrix`) — malformed AI output never reaches the user. Deterministic routing of answers (including "I don't know") is unchanged.

## Coverage

Every Level 1 family ships a question tree; validity (dependencies point to real questions, required questions detectable, unknown handling) is enforced by `questions.spec.ts` and `taxonomy.spec.ts`.
