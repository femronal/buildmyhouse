/**
 * Stage 6 — Price Checker analytics.
 *
 * Uses the existing BuildMyHouse GA abstraction (`trackWebEvent`). Only safe,
 * structural properties are sent — NEVER free-text answers, names, emails,
 * phone numbers, addresses, report access tokens or raw source URLs.
 */
import { trackWebEvent } from '../analytics';

type SafeProps = Record<string, string | number | boolean | undefined>;

function track(eventName: string, props?: SafeProps) {
  trackWebEvent(eventName, props);
}

function durationBand(seconds: number): string {
  if (seconds < 30) return 'under_30s';
  if (seconds < 60) return '30_60s';
  if (seconds < 120) return '1_2m';
  if (seconds < 300) return '2_5m';
  return 'over_5m';
}

function sourceCountBand(count: number): string {
  if (count <= 1) return '0_1';
  if (count <= 3) return '2_3';
  if (count <= 6) return '4_6';
  return '7_plus';
}

export const priceCheckerAnalytics = {
  opened: (authenticated: boolean) => track('price_checker_opened', { authenticated }),
  productSearchStarted: () => track('price_checker_product_search_started'),
  productSelected: (categoryKey: string, productKey: string, kind: string) =>
    track('price_checker_product_selected', { category: categoryKey, product_key: productKey, kind }),
  questionViewed: (questionId: string, questionType: string, questionNumber: number) =>
    track('price_checker_question_viewed', { question_id: questionId, question_type: questionType, question_number: questionNumber }),
  questionAnswered: (questionId: string, questionType: string, questionNumber: number) =>
    track('price_checker_question_answered', { question_id: questionId, question_type: questionType, question_number: questionNumber }),
  unknownSelected: (questionId: string) => track('price_checker_unknown_selected', { question_id: questionId }),
  answerEdited: (questionId: string) => track('price_checker_answer_edited', { question_id: questionId }),
  reviewOpened: () => track('price_checker_review_opened'),
  generationStarted: (productKey: string, locationLevel: string) =>
    track('price_checker_generation_started', { product_key: productKey, location_level: locationLevel }),
  generationPaused: () => track('price_checker_generation_paused'),
  generationCancelled: (stage: string | null) =>
    track('price_checker_generation_cancelled', { stage: stage ?? 'unknown' }),
  stageCompleted: (stage: string) => track('price_checker_stage_completed', { stage }),
  reportCompleted: (confidenceLabel: string, independentSources: number, elapsedSeconds: number) =>
    track('price_checker_report_completed', {
      confidence_label: confidenceLabel,
      independent_source_band: sourceCountBand(independentSources),
      duration_band: durationBand(elapsedSeconds),
    }),
  insufficientData: (elapsedSeconds: number) =>
    track('price_checker_insufficient_data', { duration_band: durationBand(elapsedSeconds) }),
  reportOpened: (status: string) => track('price_checker_report_opened', { report_status: status }),
  manualCheckRequested: (source: 'report_page' | 'workspace') =>
    track('price_checker_manual_check_requested', { source }),
  pdfDownloaded: () => track('price_checker_pdf_downloaded'),
  loginPromptViewed: () => track('price_checker_login_prompt_viewed'),
  reportSaved: () => track('price_checker_report_saved'),
  usageLimitReached: (authenticated: boolean) => track('price_checker_usage_limit_reached', { authenticated }),
  error: (category: string) => track('price_checker_error', { error_category: category }),

  // Stage 7 — privacy-safe payment events (never email, reference, tokens)
  paymentModalViewed: (props: {
    requestedItemCount: number;
    freeItemCount: number;
    chargeableItemCount: number;
    totalKobo: number;
    pricingVersion: string;
    authenticated: boolean;
  }) =>
    track('price_checker_payment_modal_viewed', {
      requested_item_band: itemCountBand(props.requestedItemCount),
      free_item_count: props.freeItemCount,
      chargeable_item_count: props.chargeableItemCount,
      total_price_band: priceBand(props.totalKobo),
      pricing_version: props.pricingVersion,
      authenticated: props.authenticated,
    }),
  paymentQuoteCreated: (props: {
    requestedItemCount: number;
    freeItemCount: number;
    chargeableItemCount: number;
    totalKobo: number;
    pricingVersion: string;
  }) =>
    track('price_checker_payment_quote_created', {
      requested_item_band: itemCountBand(props.requestedItemCount),
      free_item_count: props.freeItemCount,
      chargeable_item_count: props.chargeableItemCount,
      total_price_band: priceBand(props.totalKobo),
      pricing_version: props.pricingVersion,
    }),
  paymentEmailEntered: () => track('price_checker_payment_email_entered'),
  paymentStarted: (chargeableItemCount: number, totalKobo: number) =>
    track('price_checker_payment_started', {
      chargeable_item_count: chargeableItemCount,
      total_price_band: priceBand(totalKobo),
    }),
  paymentRedirected: () => track('price_checker_payment_redirected'),
  paymentAbandoned: () => track('price_checker_payment_abandoned'),
  paymentFailed: () => track('price_checker_payment_failed'),
  paymentPending: () => track('price_checker_payment_pending'),
  paymentSucceeded: (chargeableItemCount: number, freeItemCount: number, totalKobo: number) =>
    track('price_checker_payment_succeeded', {
      chargeable_item_count: chargeableItemCount,
      free_item_count: freeItemCount,
      total_price_band: priceBand(totalKobo),
    }),
  paymentAmountMismatch: () => track('price_checker_payment_amount_mismatch'),
  paidBatchConfirmed: (chargeableItemCount: number, freeItemCount: number) =>
    track('price_checker_paid_batch_confirmed', {
      chargeable_item_count: chargeableItemCount,
      free_item_count: freeItemCount,
    }),
  paidResearchStarted: (chargeableItemCount: number) =>
    track('price_checker_paid_research_started', { chargeable_item_count: chargeableItemCount }),
  paidReportCompleted: (durationSeconds: number) =>
    track('price_checker_paid_report_completed', { duration_band: durationBand(durationSeconds) }),
  paidInsufficientData: (durationSeconds: number) =>
    track('price_checker_paid_insufficient_data', { duration_band: durationBand(durationSeconds) }),
  paidTechnicalFailure: () => track('price_checker_paid_technical_failure'),
};

function itemCountBand(n: number): string {
  if (n <= 1) return '1';
  if (n <= 3) return '2_3';
  if (n <= 5) return '4_5';
  return '6_plus';
}

/** Coarse naira bands from kobo — never the exact amount. */
function priceBand(kobo: number): string {
  const naira = kobo / 100;
  if (naira <= 0) return '0';
  if (naira < 2000) return 'under_2k';
  if (naira < 5000) return '2k_5k';
  if (naira < 15000) return '5k_15k';
  if (naira < 50000) return '15k_50k';
  return '50k_plus';
}
