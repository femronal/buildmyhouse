/**
 * Level 3 — open custom research routing and catalogue-promotion rules.
 * Doc: docs/price-checker/CUSTOM_RESEARCH_WORKFLOW.md
 *
 * The catalogue is never a hard limit on paid research. A custom request may
 * be researched as a temporary item, but ONLY an admin can promote a repeated
 * request into a published catalogue family. AI may propose; humans approve.
 */
import { matchQueryToFamilies } from './matching';
import { CustomRequestOutcome, CustomResearchRequestInput } from './types';

export interface CustomRequestRouting {
  outcome: CustomRequestOutcome;
  matchedFamilyKey?: string;
  detail: string;
}

/** Minimum information for a temporary research item to be researchable at all. */
function isSufficientlySpecified(input: CustomResearchRequestInput): boolean {
  const hasIdentity = input.productName.trim().length >= 3;
  const hasContext = Boolean(
    (input.description && input.description.trim().length >= 10) ||
      input.knownBrand ||
      input.knownSpecification ||
      (input.photoRefs && input.photoRefs.length > 0) ||
      input.quotationUploadRef ||
      input.sellerLink,
  );
  return hasIdentity && hasContext;
}

export function routeCustomRequest(input: CustomResearchRequestInput): CustomRequestRouting {
  const matches = matchQueryToFamilies(input.productName);

  if (matches.length > 0 && matches[0].confidence === 'exact_alias') {
    return {
      outcome: 'matched_confident',
      matchedFamilyKey: matches[0].key,
      detail: `Matched to catalogue family '${matches[0].key}' via alias '${matches[0].matchedAlias}'.`,
    };
  }

  if (matches.length > 0) {
    return {
      outcome: 'matched_needs_clarification',
      matchedFamilyKey: matches[0].key,
      detail: `Probable match to '${matches[0].key}'; user must confirm before research runs.`,
    };
  }

  if (!isSufficientlySpecified(input)) {
    return {
      outcome: 'insufficiently_specified',
      detail: 'Not enough information to research. Ask for description, brand, spec, photo, quotation or seller link.',
    };
  }

  return {
    outcome: 'temporary_research_item',
    detail: 'No catalogue match. Eligible for paid research as a temporary item; result is not published as a product page.',
  };
}

// ---------------------------------------------------------------------------
// Demand learning and promotion
// ---------------------------------------------------------------------------

export interface CustomDemandSignal {
  normalizedQuery: string;
  distinctRequestCount: number;
  paidIntentCount: number;
  firstSeen: string; // ISO date
  latestSeen: string; // ISO date
}

export const PROMOTION_RULE = {
  minDistinctRequests: 3,
  minPaidIntent: 1,
  windowDays: 60,
} as const;

/** Whether demand justifies PROPOSING (not creating) a new catalogue family. */
export function qualifiesForPromotionProposal(signal: CustomDemandSignal, now: Date = new Date()): boolean {
  const firstSeen = new Date(signal.firstSeen);
  const ageDays = (now.getTime() - firstSeen.getTime()) / 86_400_000;
  return (
    signal.distinctRequestCount >= PROMOTION_RULE.minDistinctRequests &&
    signal.paidIntentCount >= PROMOTION_RULE.minPaidIntent &&
    ageDays <= PROMOTION_RULE.windowDays
  );
}

export interface PromotionDecisionInput {
  proposalExists: boolean;
  adminApproved: boolean;
  approvedByAdminId?: string;
}

/**
 * A proposal becomes a published catalogue family ONLY with explicit admin
 * approval. AI/automation can never publish.
 */
export function canPublishPromotedFamily(decision: PromotionDecisionInput): boolean {
  return decision.proposalExists && decision.adminApproved && Boolean(decision.approvedByAdminId);
}
