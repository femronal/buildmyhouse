/**
 * Stage 6/7 — Price Checker state machine.
 *
 * A single typed reducer drives the whole guided flow, so impossible states
 * (processing+paused, report ready without a report id, confidence before
 * scoring…) cannot be represented. All transitions are pure and unit-tested.
 *
 * Stage 7 adds guest payment phases: awaiting_payment → payment_pending →
 * payment_confirmed → processing. No credit-wallet language in the UI.
 */
import {
  CatalogueSearchResult,
  ConsumerQuestion,
  PaymentStatusDto,
  PriceCheckPaymentQuote,
  QuestionsPreview,
  ResearchStatusDto,
  UsageStatusDto,
} from './types';

export const UNKNOWN_ANSWER = 'unknown';
/** Synthetic client-side question id for the Nigerian location picker. */
export const LOCATION_QUESTION_ID = '__location';

export type PriceCheckerPhase =
  | 'idle'
  | 'product_search'
  | 'product_selected'
  | 'asking_question'
  | 'validating_answer'
  | 'answer_needs_clarification'
  | 'reviewing_answers'
  | 'ready_to_generate'
  | 'processing'
  | 'paused'
  | 'cancelling'
  | 'report_ready'
  | 'insufficient_data'
  | 'failed'
  | 'usage_limit_reached'
  | 'awaiting_payment'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'payment_abandoned';

export interface SelectedProduct {
  key: string;
  kind: 'product' | 'service';
  name: string;
  category: string;
}

export interface PriceCheckerError {
  category:
    | 'network'
    | 'timeout'
    | 'sources_unavailable'
    | 'invalid_request'
    | 'report_failed'
    | 'internal';
  message: string;
}

export interface PriceCheckerState {
  phase: PriceCheckerPhase;
  query: string;
  searching: boolean;
  matches: CatalogueSearchResult[];
  searchMessage: string | null;
  product: SelectedProduct | null;
  preview: QuestionsPreview | null;
  answers: Record<string, string>;
  currentQuestionId: string | null;
  clarification: string | null;
  locationKey: string | null;
  locationLabel: string | null;
  /** True when the user is editing a single answer from review/pause. */
  editingFromReview: boolean;
  requestId: string | null;
  research: ResearchStatusDto | null;
  usage: UsageStatusDto | null;
  error: PriceCheckerError | null;
  /** Stage 7 — server quote for the current request (never invent amounts). */
  quote: PriceCheckPaymentQuote | null;
  paymentOrderId: string | null;
  paymentStatus: PaymentStatusDto | null;
  guestEmail: string | null;
  quoteLoading: boolean;
  paymentInitializing: boolean;
}

export const initialPriceCheckerState: PriceCheckerState = {
  phase: 'idle',
  query: '',
  searching: false,
  matches: [],
  searchMessage: null,
  product: null,
  preview: null,
  answers: {},
  currentQuestionId: null,
  clarification: null,
  locationKey: null,
  locationLabel: null,
  editingFromReview: false,
  requestId: null,
  research: null,
  usage: null,
  error: null,
  quote: null,
  paymentOrderId: null,
  paymentStatus: null,
  guestEmail: null,
  quoteLoading: false,
  paymentInitializing: false,
};

// ---------------------------------------------------------------------------
// Selectors (pure, derived — never stored twice)
// ---------------------------------------------------------------------------

export function requiredQuestions(state: PriceCheckerState): ConsumerQuestion[] {
  return (state.preview?.questions ?? []).filter((q) => q.required);
}

export function unansweredRequiredIds(state: PriceCheckerState): string[] {
  const pending = requiredQuestions(state)
    .filter((q) => {
      const v = state.answers[q.id];
      return v === undefined || v === '';
    })
    .map((q) => q.id);
  if (!state.locationKey) pending.push(LOCATION_QUESTION_ID);
  return pending;
}

export function nextQuestionId(state: PriceCheckerState): string | null {
  return unansweredRequiredIds(state)[0] ?? null;
}

export function currentQuestion(state: PriceCheckerState): ConsumerQuestion | null {
  if (!state.currentQuestionId) return null;
  if (state.currentQuestionId === LOCATION_QUESTION_ID) {
    return {
      id: LOCATION_QUESTION_ID,
      prompt: 'Where should we check prices?',
      type: 'location',
      required: true,
      options: [],
      whyItMatters: 'Prices differ between Nigerian states and cities, so we compare sellers relevant to your location.',
      allowUnknown: false,
    };
  }
  return (state.preview?.questions ?? []).find((q) => q.id === state.currentQuestionId) ?? null;
}

export function questionProgress(state: PriceCheckerState): { answered: number; total: number } {
  const required = requiredQuestions(state);
  const total = required.length + 1; // + location
  const answered =
    required.filter((q) => {
      const v = state.answers[q.id];
      return v !== undefined && v !== '';
    }).length + (state.locationKey ? 1 : 0);
  return { answered, total };
}

export function readyForReview(state: PriceCheckerState): boolean {
  return Boolean(
    state.product && state.preview && unansweredRequiredIds(state).length === 0 && state.preview.contradictions.length === 0,
  );
}

export interface UnderstandingRow {
  key: string;
  label: string;
  value: string | null;
  state: 'provided' | 'unknown' | 'needed' | 'optional';
}

/** "What we understand" — derived only from confirmed structured data. */
export function buildUnderstanding(state: PriceCheckerState): UnderstandingRow[] {
  const rows: UnderstandingRow[] = [];
  if (state.product) {
    rows.push({ key: 'product', label: 'Product', value: state.product.name, state: 'provided' });
    rows.push({ key: 'category', label: 'Category', value: state.product.category, state: 'provided' });
  }
  for (const q of state.preview?.questions ?? []) {
    const value = state.answers[q.id];
    rows.push({
      key: q.id,
      label: questionLabel(q),
      value: value === UNKNOWN_ANSWER ? 'Not sure yet' : (value ?? null),
      state:
        value === UNKNOWN_ANSWER
          ? 'unknown'
          : value !== undefined && value !== ''
            ? 'provided'
            : q.required
              ? 'needed'
              : 'optional',
    });
  }
  rows.push({
    key: LOCATION_QUESTION_ID,
    label: 'Location',
    value: state.locationLabel,
    state: state.locationLabel ? 'provided' : 'needed',
  });
  return rows;
}

const LABEL_OVERRIDES: Record<string, string> = {
  brand: 'Brand',
  quantity: 'Quantity',
  condition: 'Condition',
  delivery_needed: 'Delivery',
  retail_or_wholesale: 'Retail or wholesale',
  installation_needed: 'Installation',
};

export function questionLabel(q: ConsumerQuestion): string {
  if (LABEL_OVERRIDES[q.id]) return LABEL_OVERRIDES[q.id];
  const cleaned = q.id.replace(/_/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// ---------------------------------------------------------------------------
// Deterministic answer validation (no AI required for structured answers)
// ---------------------------------------------------------------------------

export interface AnswerValidation {
  ok: boolean;
  value?: string;
  message?: string;
}

export function validateAnswer(question: ConsumerQuestion, raw: string): AnswerValidation {
  const text = raw.trim();
  if (!text) return { ok: false, message: 'Please enter an answer, or choose “I don’t know”.' };
  if (text.length > 200) return { ok: false, message: 'Please keep your answer under 200 characters.' };

  if (text.toLowerCase() === UNKNOWN_ANSWER || /^i\s*(don'?t|do not)\s*know$/i.test(text)) {
    if (!question.allowUnknown) {
      return {
        ok: false,
        message: 'We need this detail before comparing prices — different options are genuinely different products.',
      };
    }
    return { ok: true, value: UNKNOWN_ANSWER };
  }

  if (question.type === 'yes_no') {
    const lower = text.toLowerCase();
    if (['yes', 'y', 'true'].includes(lower)) return { ok: true, value: 'yes' };
    if (['no', 'n', 'false'].includes(lower)) return { ok: true, value: 'no' };
    return { ok: false, message: 'Please answer yes or no.' };
  }

  if (question.type === 'number') {
    const n = Number(text.replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) return { ok: false, message: 'Please enter a number greater than zero.' };
    return { ok: true, value: String(n) };
  }

  if ((question.type === 'single_select' || question.type === 'multi_select') && question.options.length > 0) {
    const lower = text.toLowerCase();
    const exact = question.options.find((o) => o.toLowerCase() === lower);
    if (exact) return { ok: true, value: exact };
    const partialMatches = question.options.filter(
      (o) => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()),
    );
    if (partialMatches.length === 1) return { ok: true, value: partialMatches[0] };
    if (partialMatches.length > 1) {
      return { ok: false, message: `Did you mean one of: ${partialMatches.slice(0, 4).join(', ')}? Tap an option below.` };
    }
    // Free-typed values outside the known options stay allowed (e.g. an
    // uncommon brand), unless the question forbids unknowns entirely.
    return { ok: true, value: text };
  }

  return { ok: true, value: text };
}

export function isPaymentSuccessStatus(status: string | null | undefined): boolean {
  return status === 'success' || status === 'paid';
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type PriceCheckerEvent =
  | { type: 'RESET' }
  | { type: 'QUERY_CHANGED'; query: string }
  | { type: 'SEARCH_STARTED' }
  | { type: 'SEARCH_SUCCEEDED'; matches: CatalogueSearchResult[] }
  | { type: 'SEARCH_FAILED'; message: string }
  | { type: 'PRODUCT_SELECTED'; product: SelectedProduct }
  | { type: 'PREVIEW_LOADED'; preview: QuestionsPreview }
  | { type: 'ANSWER_SUBMITTED' }
  | { type: 'ANSWER_ACCEPTED'; questionId: string; value: string; preview: QuestionsPreview | null }
  | { type: 'ANSWER_REJECTED'; message: string }
  | { type: 'LOCATION_SELECTED'; key: string; label: string }
  | { type: 'EDIT_ANSWER'; questionId: string }
  | { type: 'PAUSE_TAPPED' }
  | { type: 'RESUME_QUESTIONS' }
  | { type: 'REVIEW_OPENED' }
  | { type: 'GENERATE_REQUESTED' }
  | { type: 'GENERATION_STARTED'; requestId: string }
  | { type: 'GENERATION_REJECTED'; error: PriceCheckerError }
  | { type: 'USAGE_LIMIT_REACHED'; usage: UsageStatusDto | null }
  | { type: 'STATUS_UPDATED'; status: ResearchStatusDto }
  | { type: 'CANCEL_STARTED' }
  | { type: 'CANCEL_CONFIRMED' }
  | { type: 'USAGE_LOADED'; usage: UsageStatusDto }
  | { type: 'RESTORED_ACTIVE_RUN'; requestId: string }
  | { type: 'PAYMENT_REQUIRED' }
  | { type: 'QUOTE_READY'; quote: PriceCheckPaymentQuote }
  | { type: 'QUOTE_FAILED'; error: PriceCheckerError }
  | { type: 'PAYMENT_INITIALIZING'; email: string }
  | { type: 'PAYMENT_INITIALIZED'; paymentOrderId: string }
  | { type: 'PAYMENT_INIT_FAILED'; message: string }
  | { type: 'PAYMENT_PENDING'; paymentOrderId?: string; status?: PaymentStatusDto | null }
  | { type: 'PAYMENT_CONFIRMED'; status: PaymentStatusDto; paymentOrderId?: string }
  | { type: 'PAYMENT_FAILED'; status?: PaymentStatusDto | null; message?: string }
  | { type: 'PAYMENT_ABANDONED' }
  | { type: 'PAYMENT_DISMISSED' }
  | {
      type: 'CHECKOUT_RESTORED';
      product: SelectedProduct;
      answers: Record<string, string>;
      locationKey: string;
      locationLabel: string;
      query: string;
      preview: QuestionsPreview | null;
      quote: PriceCheckPaymentQuote | null;
      paymentOrderId: string | null;
      guestEmail: string | null;
      phase: Extract<
        PriceCheckerPhase,
        'awaiting_payment' | 'payment_pending' | 'payment_confirmed' | 'payment_failed' | 'payment_abandoned' | 'reviewing_answers'
      >;
      paymentStatus?: PaymentStatusDto | null;
    };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function priceCheckerReducer(state: PriceCheckerState, event: PriceCheckerEvent): PriceCheckerState {
  switch (event.type) {
    case 'RESET':
      return { ...initialPriceCheckerState, usage: state.usage };

    case 'QUERY_CHANGED':
      return { ...state, query: event.query, searchMessage: null };

    case 'SEARCH_STARTED':
      return { ...state, phase: 'product_search', searching: true, searchMessage: null, error: null };

    case 'SEARCH_SUCCEEDED':
      return {
        ...state,
        searching: false,
        matches: event.matches,
        phase: 'product_search',
        searchMessage:
          event.matches.length === 0
            ? 'We could not find that in the catalogue yet. Try a simpler name (for example “cement” or “roofing sheet”).'
            : null,
      };

    case 'SEARCH_FAILED':
      return { ...state, searching: false, searchMessage: event.message, phase: 'product_search' };

    case 'PRODUCT_SELECTED':
      return {
        ...state,
        phase: 'product_selected',
        product: event.product,
        preview: null,
        answers: {},
        locationKey: state.locationKey,
        locationLabel: state.locationLabel,
        currentQuestionId: null,
        clarification: null,
        editingFromReview: false,
        requestId: null,
        research: null,
        error: null,
        quote: null,
        paymentOrderId: null,
        paymentStatus: null,
        guestEmail: null,
        quoteLoading: false,
        paymentInitializing: false,
      };

    case 'PREVIEW_LOADED': {
      if (!state.product) return state;
      const next = { ...state, preview: event.preview };
      const question = nextQuestionId(next);
      return question
        ? { ...next, phase: 'asking_question', currentQuestionId: question, clarification: null }
        : { ...next, phase: 'reviewing_answers', currentQuestionId: null };
    }

    case 'ANSWER_SUBMITTED':
      if (state.phase !== 'asking_question' && state.phase !== 'answer_needs_clarification') return state;
      return { ...state, phase: 'validating_answer', clarification: null };

    case 'ANSWER_ACCEPTED': {
      const answers = { ...state.answers, [event.questionId]: event.value };
      const next: PriceCheckerState = {
        ...state,
        answers,
        preview: event.preview ?? state.preview,
        clarification: null,
      };
      // After a paid confirmation, edits return to confirmation (item count locked).
      if (state.editingFromReview && state.paymentOrderId && state.paymentStatus && isPaymentSuccessStatus(state.paymentStatus.status)) {
        return { ...next, phase: 'payment_confirmed', currentQuestionId: null, editingFromReview: false };
      }
      if (state.editingFromReview) {
        const pending = nextQuestionId(next);
        return pending
          ? { ...next, phase: 'asking_question', currentQuestionId: pending, editingFromReview: false }
          : { ...next, phase: 'reviewing_answers', currentQuestionId: null, editingFromReview: false };
      }
      const question = nextQuestionId(next);
      return question
        ? { ...next, phase: 'asking_question', currentQuestionId: question }
        : { ...next, phase: 'reviewing_answers', currentQuestionId: null };
    }

    case 'ANSWER_REJECTED':
      return { ...state, phase: 'answer_needs_clarification', clarification: event.message };

    case 'LOCATION_SELECTED': {
      const next: PriceCheckerState = {
        ...state,
        locationKey: event.key,
        locationLabel: event.label,
        clarification: null,
      };
      if (state.editingFromReview && state.paymentOrderId && state.paymentStatus && isPaymentSuccessStatus(state.paymentStatus.status)) {
        return { ...next, phase: 'payment_confirmed', currentQuestionId: null, editingFromReview: false };
      }
      if (state.phase !== 'asking_question' && state.phase !== 'answer_needs_clarification') return next;
      const pending = nextQuestionId(next);
      return pending
        ? { ...next, phase: 'asking_question', currentQuestionId: pending, editingFromReview: false }
        : { ...next, phase: 'reviewing_answers', currentQuestionId: null, editingFromReview: false };
    }

    case 'EDIT_ANSWER':
      if (!state.preview) return state;
      return {
        ...state,
        phase: 'asking_question',
        currentQuestionId: event.questionId,
        editingFromReview: true,
        clarification: null,
        // Editing invalidates any completed/failed run; answers + paid entitlement stay.
        requestId: null,
        research: null,
        error: null,
      };

    case 'PAUSE_TAPPED':
      if (state.phase === 'asking_question' || state.phase === 'answer_needs_clarification' || state.phase === 'validating_answer') {
        return { ...state, phase: 'paused', currentQuestionId: null, clarification: null };
      }
      return state;

    case 'RESUME_QUESTIONS': {
      if (state.paymentOrderId && state.paymentStatus && isPaymentSuccessStatus(state.paymentStatus.status)) {
        return { ...state, phase: 'payment_confirmed', currentQuestionId: null };
      }
      const pending = nextQuestionId(state);
      return pending
        ? { ...state, phase: 'asking_question', currentQuestionId: pending }
        : { ...state, phase: 'reviewing_answers', currentQuestionId: null };
    }

    case 'REVIEW_OPENED':
      return {
        ...state,
        phase: 'reviewing_answers',
        currentQuestionId: null,
        clarification: null,
        quoteLoading: false,
        paymentInitializing: false,
      };

    case 'GENERATE_REQUESTED':
      if (!readyForReview(state)) return state;
      return { ...state, phase: 'ready_to_generate', error: null };

    case 'GENERATION_STARTED':
      return {
        ...state,
        phase: 'processing',
        requestId: event.requestId,
        research: null,
        error: null,
        quoteLoading: false,
        paymentInitializing: false,
      };

    case 'GENERATION_REJECTED':
      return { ...state, phase: 'reviewing_answers', error: event.error, quoteLoading: false, paymentInitializing: false };

    case 'USAGE_LIMIT_REACHED':
      // Legacy phase — Stage 7 primary path uses payment phases instead.
      return { ...state, phase: 'usage_limit_reached', usage: event.usage ?? state.usage };

    case 'STATUS_UPDATED': {
      if (state.requestId !== event.status.requestId) return state;
      const research = event.status;
      if (research.status === 'processing') {
        if (state.phase !== 'processing') return { ...state, research };
        return { ...state, research };
      }
      if (research.status === 'completed' && research.reportId) {
        return { ...state, research, phase: 'report_ready' };
      }
      if (research.status === 'insufficient_data' && research.reportId) {
        return { ...state, research, phase: 'insufficient_data' };
      }
      if (research.status === 'cancelled') {
        return { ...state, research, phase: state.phase === 'cancelling' ? state.phase : 'reviewing_answers' };
      }
      return {
        ...state,
        research,
        phase: 'failed',
        error: {
          category: research.errorCategory === 'timeout' ? 'timeout' : (research.errorCategory ?? 'internal'),
          message:
            research.errorCategory === 'timeout'
              ? 'The research took too long and was stopped. Your answers are safe — you can try again.'
              : 'Something went wrong while checking prices. Your answers are safe — you can try again.',
        },
      };
    }

    case 'CANCEL_STARTED':
      if (state.phase !== 'processing') return state;
      return { ...state, phase: 'cancelling' };

    case 'CANCEL_CONFIRMED':
      return {
        ...state,
        phase: 'reviewing_answers',
        requestId: null,
        research: null,
        error: null,
      };

    case 'USAGE_LOADED':
      return { ...state, usage: event.usage };

    case 'RESTORED_ACTIVE_RUN':
      return { ...state, phase: 'processing', requestId: event.requestId };

    case 'PAYMENT_REQUIRED':
      return {
        ...state,
        phase: 'awaiting_payment',
        quoteLoading: true,
        paymentInitializing: false,
        error: null,
      };

    case 'QUOTE_READY':
      return {
        ...state,
        phase: 'awaiting_payment',
        quote: event.quote,
        quoteLoading: false,
        error: null,
      };

    case 'QUOTE_FAILED':
      return {
        ...state,
        phase: 'reviewing_answers',
        quoteLoading: false,
        error: event.error,
      };

    case 'PAYMENT_INITIALIZING':
      return { ...state, paymentInitializing: true, guestEmail: event.email, error: null };

    case 'PAYMENT_INITIALIZED':
      return {
        ...state,
        paymentOrderId: event.paymentOrderId,
        paymentInitializing: false,
        phase: 'payment_pending',
      };

    case 'PAYMENT_INIT_FAILED':
      return {
        ...state,
        paymentInitializing: false,
        phase: 'payment_failed',
        error: { category: 'network', message: event.message },
      };

    case 'PAYMENT_PENDING':
      return {
        ...state,
        phase: 'payment_pending',
        paymentOrderId: event.paymentOrderId ?? state.paymentOrderId,
        paymentStatus: event.status ?? state.paymentStatus,
        quoteLoading: false,
        paymentInitializing: false,
      };

    case 'PAYMENT_CONFIRMED':
      return {
        ...state,
        phase: 'payment_confirmed',
        paymentOrderId: event.paymentOrderId ?? state.paymentOrderId,
        paymentStatus: event.status,
        quoteLoading: false,
        paymentInitializing: false,
        error: null,
      };

    case 'PAYMENT_FAILED':
      return {
        ...state,
        phase: 'payment_failed',
        paymentStatus: event.status ?? state.paymentStatus,
        paymentInitializing: false,
        error: event.message
          ? { category: 'network', message: event.message }
          : state.error,
      };

    case 'PAYMENT_ABANDONED':
      return {
        ...state,
        phase: 'payment_abandoned',
        paymentInitializing: false,
      };

    case 'PAYMENT_DISMISSED':
      return {
        ...state,
        phase: 'reviewing_answers',
        quoteLoading: false,
        paymentInitializing: false,
        // Keep quote/order so "Try payment again" can reuse; clear only on RESET/PRODUCT.
      };

    case 'CHECKOUT_RESTORED':
      return {
        ...state,
        phase: event.phase,
        product: event.product,
        answers: event.answers,
        locationKey: event.locationKey,
        locationLabel: event.locationLabel,
        query: event.query,
        preview: event.preview,
        quote: event.quote,
        paymentOrderId: event.paymentOrderId,
        guestEmail: event.guestEmail,
        paymentStatus: event.paymentStatus ?? null,
        currentQuestionId: null,
        clarification: null,
        editingFromReview: false,
        requestId: null,
        research: null,
        error: null,
        quoteLoading: false,
        paymentInitializing: false,
        searching: false,
      };

    default:
      return state;
  }
}
