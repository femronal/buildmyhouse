/**
 * Stage 6 — consumer Price Checker types (mirrors the backend consumer DTOs).
 * All figures shown in the UI come from these backend-provided values; the
 * client never invents counts, ranges or confidence.
 */

export interface CatalogueSearchResult {
  kind: 'product' | 'service';
  key: string;
  name: string;
  category: string;
  matchConfidence: 'exact_alias' | 'partial_alias';
  matchedAlias: string;
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
  missingRequiredIds: string[];
  contradictions: string[];
  answeredCount: number;
  estimatedRemaining: number;
  unknownNotes?: string[];
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

export type ResearchJobStatus = 'processing' | 'completed' | 'insufficient_data' | 'failed' | 'cancelled';

export interface ResearchStatusDto {
  requestId: string;
  status: ResearchJobStatus;
  stage: ResearchStageCode | null;
  elapsedSeconds: number;
  metrics: {
    discoveredSourceCount: number | null;
    retrievedPageCount: number | null;
    acceptedObservationCount: number | null;
    independentSourceCount: number | null;
  };
  reportId: string | null;
  reportAccessToken: string | null;
  errorCategory: 'timeout' | 'sources_unavailable' | 'internal' | null;
}

export interface UsageStatusDto {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  authenticated: boolean;
  resetsAt: string | null;
}

/** Stage 7 — server-owned payment quote (amounts always in kobo). */
export type PaymentQuoteStatus =
  | 'draft'
  | 'ready'
  | 'payment_initialized'
  | 'paid'
  | 'expired'
  | 'cancelled';

export interface PaymentQuoteLineItem {
  productLabel: string;
  locationLabel: string;
  amountKobo: number;
  free: boolean;
  /** Optional server ids — never invent client-side. */
  requestItemId?: string;
  productId?: string;
}

export interface PriceCheckPaymentQuote {
  id: string;
  currency: 'NGN' | string;
  requestedItemCount: number;
  freeItemCountApplied: number;
  chargeableItemCount: number;
  unitPriceKobo: number;
  subtotalKobo: number;
  discountKobo: number;
  totalKobo: number;
  pricingVersion: string;
  expiresAt: string;
  lineItems: PaymentQuoteLineItem[];
  status: PaymentQuoteStatus;
}

export type PaymentOrderStatus =
  | 'initialized'
  | 'pending'
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'amount_mismatch'
  | 'refunded'
  | 'partially_refunded';

export type PaymentFulfilmentStatus =
  | 'awaiting_payment'
  | 'ready'
  | 'research_started'
  | 'completed'
  | 'partial'
  | 'failed';

export interface PaymentStatusDto {
  status: PaymentOrderStatus | string;
  fulfilmentStatus: PaymentFulfilmentStatus | string;
  amountPaidKobo: number | null;
  chargeableItemCount: number;
  freeItemCountApplied: number;
  /** Opaque reference — display only; never send to analytics. */
  reference: string | null;
  paidAt: string | null;
  paymentOrderId?: string;
}

export interface PaymentInitializeResponse {
  paymentOrderId: string;
  authorizationUrl: string;
}

export interface PaidBatchStartResponse {
  requestId?: string;
  requestIds?: string[];
}

export interface PaidBatchDto {
  paymentOrderId: string;
  fulfilmentStatus: PaymentFulfilmentStatus | string;
  requestIds: string[];
  reportIds?: string[];
}

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
  location: { requested: string; limitations: string[] };
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
  scoringVersion: string;
  savedToAccount: boolean;
  reportVersion: number;
  updateNotice: string | null;
  updatedAt: string | null;
}
