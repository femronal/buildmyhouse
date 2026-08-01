/**
 * Stage 6 — consumer Price Checker DTOs.
 *
 * Everything here is CONSUMER-SAFE: no admin scoring debug, no private seller
 * contacts, no crawl internals, no raw AI output. The client never decides
 * confidence, ranges, source acceptance or usage entitlement — these types
 * only carry what the backend already decided.
 */

export interface CatalogueSearchResult {
  kind: 'product' | 'service';
  key: string;
  name: string;
  category: string;
  matchConfidence: 'exact_alias' | 'partial_alias';
  matchedAlias: string;
  /** Illustrative wording to help the user confirm, e.g. common market names. */
  marketNames: string[];
}

export interface ConsumerQuestion {
  id: string;
  prompt: string;
  type:
    | 'single_select'
    | 'multi_select'
    | 'number'
    | 'quantity_unit'
    | 'free_text'
    | 'brand_search'
    | 'model_search'
    | 'location'
    | 'yes_no';
  required: boolean;
  options: string[];
  whyItMatters: string | null;
  allowUnknown: boolean;
}

export interface QuestionsPreview {
  familyKey: string;
  familyName: string;
  kind: 'product' | 'service';
  questions: ConsumerQuestion[];
  /** IDs of required questions not yet answered. */
  missingRequiredIds: string[];
  /** Deterministic contradiction messages (e.g. impossible combinations). */
  contradictions: string[];
  answeredCount: number;
  /** "About N questions remaining" — changes as conditionals appear. */
  estimatedRemaining: number;
  /**
   * Plain-language notes when the user selected “I don’t know” on one or more
   * questions. Never invents a specification; explains the accuracy impact.
   */
  unknownNotes: string[];
}

export interface ConsumerLocation {
  key: string;
  label: string;
  type: 'country' | 'state' | 'city' | 'local_area' | 'market';
  parentKey: string | null;
}

export type ResearchStageCode =
  | 'validating_request'
  | 'planning_search'
  | 'searching_sources'
  | 'reading_listings'
  | 'matching_specifications'
  | 'normalising_units'
  | 'removing_duplicates'
  | 'calculating_range'
  | 'scoring_confidence'
  | 'preparing_report';

export const RESEARCH_STAGES: { code: ResearchStageCode; label: string }[] = [
  { code: 'validating_request', label: 'Validating your product' },
  { code: 'planning_search', label: 'Planning the search' },
  { code: 'searching_sources', label: 'Searching current sources' },
  { code: 'reading_listings', label: 'Reading matching listings' },
  { code: 'matching_specifications', label: 'Matching specifications' },
  { code: 'normalising_units', label: 'Normalising units' },
  { code: 'removing_duplicates', label: 'Removing duplicate or unsuitable listings' },
  { code: 'calculating_range', label: 'Calculating price range' },
  { code: 'scoring_confidence', label: 'Scoring confidence' },
  { code: 'preparing_report', label: 'Preparing report' },
];

export type ResearchJobStatus =
  | 'processing'
  | 'completed'
  | 'insufficient_data'
  | 'failed'
  | 'cancelled';

export interface ResearchStatusDto {
  requestId: string;
  status: ResearchJobStatus;
  stage: ResearchStageCode | null;
  /** Server-computed truthful elapsed seconds since the run started. */
  elapsedSeconds: number;
  metrics: {
    discoveredSourceCount: number | null;
    retrievedPageCount: number | null;
    acceptedObservationCount: number | null;
    independentSourceCount: number | null;
  };
  reportId: string | null;
  /** Present only for the owning anonymous session. */
  reportAccessToken: string | null;
  /** Consumer-safe failure category; never a stack trace. */
  errorCategory: 'timeout' | 'sources_unavailable' | 'internal' | null;
}

export interface UsageStatusDto {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  authenticated: boolean;
  /** ISO time when the oldest counted report leaves the rolling window. */
  resetsAt: string | null;
}

/** Consumer-safe report source row (mirrors Stage 5 ReportSource, no internals). */
export interface ConsumerReportSource {
  sellerName: string | null;
  sourceTierLabel: string;
  displayedPrice: number;
  currency: string;
  normalizedPrice: number | null;
  originalUnit: string | null;
  normalizedUnit: string | null;
  sellerLocationClass: string;
  sourceUrl: string;
  listingDate: string | null;
  dateChecked: string;
}

export interface ConsumerConfidenceDto {
  score: number;
  label: 'high' | 'moderate' | 'low' | 'insufficient_data';
  positiveReasons: string[];
  limitingReasons: string[];
  /** Consumer-worded gate limitations (e.g. "only one independent seller"). */
  limitations: string[];
  components: {
    sourceQuality: { score: number; max: number };
    recency: { score: number; max: number };
    specificationMatch: { score: number; max: number };
    locationMatch: { score: number; max: number };
    priceClustering: { score: number; max: number };
  };
}

export interface ConsumerReportDto {
  reportId: string;
  status: 'complete' | 'single_source' | 'insufficient_data';
  generatedAt: string;
  product: {
    name: string;
    brand: string | null;
    specification: Record<string, string | number | boolean>;
    requestedUnit: string | null;
  };
  location: {
    requested: string;
    limitations: string[];
  };
  pricing: {
    currency: string | null;
    observedLow: number | null;
    observedHigh: number | null;
    typicalPrice: number | null;
    normalisedUnit: string | null;
    acceptedObservationCount: number;
    independentSourceCount: number;
    excludedListingCount: number;
    singleSourcePrice: number | null;
  };
  inclusions: string[];
  exclusions: string[];
  unknowns: string[];
  sources: ConsumerReportSource[];
  confidence: ConsumerConfidenceDto;
  cautions: string[];
  insufficientData: {
    explanation: string;
    sourcesChecked: number;
    missingData: string[];
    nextSteps: string[];
  } | null;
  buildMyHouseNextStep: { label: string; destination: string };
  /** Auditability marker shown in the footer — not a secret. */
  scoringVersion: string;
  savedToAccount: boolean;
  /** Report revision number (1 = original delivery). */
  reportVersion: number;
  /** Plain-language notice when evidence review materially updated the report. */
  updateNotice: string | null;
  /** ISO timestamp of last material update; null when version is still 1. */
  updatedAt: string | null;
}

export const SOURCE_TIER_LABELS: Record<number, string> = {
  1: 'Official / manufacturer',
  2: 'Established retailer',
  3: 'Marketplace listing',
  4: 'Weak reference',
};
