import {
  priceCheckerReducer,
  initialPriceCheckerState,
  validateAnswer,
  readyForReview,
  nextQuestionId,
  unansweredRequiredIds,
  buildUnderstanding,
  questionProgress,
  UNKNOWN_ANSWER,
  LOCATION_QUESTION_ID,
  PriceCheckerState,
} from './state';
import { QuestionsPreview, ResearchStatusDto } from './types';

const preview: QuestionsPreview = {
  familyKey: 'cement',
  familyName: 'Cement',
  kind: 'product',
  questions: [
    {
      id: 'brand',
      prompt: 'Which brand?',
      type: 'brand_search',
      required: true,
      options: ['Dangote', 'BUA', 'Lafarge'],
      whyItMatters: 'Brand affects price.',
      allowUnknown: true,
    },
    {
      id: 'quantity',
      prompt: 'How many bags?',
      type: 'number',
      required: true,
      options: [],
      whyItMatters: null,
      allowUnknown: false,
    },
  ],
  missingRequiredIds: ['brand', 'quantity'],
  contradictions: [],
  answeredCount: 0,
  estimatedRemaining: 2,
  unknownNotes: [],
};

function withProduct(over: Partial<PriceCheckerState> = {}): PriceCheckerState {
  return {
    ...initialPriceCheckerState,
    phase: 'asking_question',
    product: { key: 'cement', kind: 'product', name: 'Cement', category: 'Structural' },
    preview,
    currentQuestionId: 'brand',
    ...over,
  };
}

describe('validateAnswer', () => {
  it('accepts chip options and unknown when allowed', () => {
    expect(validateAnswer(preview.questions[0], 'Dangote').value).toBe('Dangote');
    expect(validateAnswer(preview.questions[0], "I don't know").value).toBe(UNKNOWN_ANSWER);
  });

  it('rejects unknown when the question forbids it', () => {
    const result = validateAnswer(preview.questions[1], UNKNOWN_ANSWER);
    expect(result.ok).toBe(false);
  });

  it('validates numbers', () => {
    expect(validateAnswer(preview.questions[1], '50').value).toBe('50');
    expect(validateAnswer(preview.questions[1], '0').ok).toBe(false);
  });
});

describe('priceCheckerReducer', () => {
  it('moves through search → product → questions', () => {
    let s = initialPriceCheckerState;
    s = priceCheckerReducer(s, { type: 'SEARCH_STARTED' });
    expect(s.phase).toBe('product_search');
    s = priceCheckerReducer(s, {
      type: 'SEARCH_SUCCEEDED',
      matches: [
        {
          kind: 'product',
          key: 'cement',
          name: 'Cement',
          category: 'Structural',
          matchConfidence: 'exact_alias',
          matchedAlias: 'cement',
          marketNames: [],
        },
      ],
    });
    s = priceCheckerReducer(s, {
      type: 'PRODUCT_SELECTED',
      product: { key: 'cement', kind: 'product', name: 'Cement', category: 'Structural' },
    });
    expect(s.phase).toBe('product_selected');
    s = priceCheckerReducer(s, { type: 'PREVIEW_LOADED', preview });
    expect(s.phase).toBe('asking_question');
    expect(s.currentQuestionId).toBe('brand');
  });

  it('accepts answers and opens review when required + location are complete', () => {
    let s = withProduct({ answers: { brand: 'Dangote' }, currentQuestionId: 'quantity' });
    s = priceCheckerReducer(s, {
      type: 'ANSWER_ACCEPTED',
      questionId: 'quantity',
      value: '100',
      preview: { ...preview, missingRequiredIds: [] },
    });
    expect(s.currentQuestionId).toBe(LOCATION_QUESTION_ID);
    s = priceCheckerReducer(s, { type: 'LOCATION_SELECTED', key: 'ng-la-lagos', label: 'Lagos' });
    expect(s.phase).toBe('reviewing_answers');
    expect(readyForReview(s)).toBe(true);
  });

  it('supports I don’t know without inventing a brand', () => {
    let s = withProduct();
    s = priceCheckerReducer(s, {
      type: 'ANSWER_ACCEPTED',
      questionId: 'brand',
      value: UNKNOWN_ANSWER,
      preview,
    });
    expect(s.answers.brand).toBe(UNKNOWN_ANSWER);
    const understanding = buildUnderstanding(s);
    expect(understanding.find((r) => r.key === 'brand')?.state).toBe('unknown');
  });

  it('recalculates questions after editing an earlier answer', () => {
    let s = withProduct({
      answers: { brand: 'Dangote', quantity: '100' },
      locationKey: 'ng-la-lagos',
      locationLabel: 'Lagos',
      phase: 'reviewing_answers',
    });
    s = priceCheckerReducer(s, { type: 'EDIT_ANSWER', questionId: 'brand' });
    expect(s.phase).toBe('asking_question');
    expect(s.editingFromReview).toBe(true);
    expect(s.requestId).toBeNull();
    s = priceCheckerReducer(s, {
      type: 'ANSWER_ACCEPTED',
      questionId: 'brand',
      value: 'BUA',
      preview,
    });
    expect(s.phase).toBe('reviewing_answers');
    expect(s.answers.brand).toBe('BUA');
  });

  it('pause during questions preserves answers', () => {
    const s = priceCheckerReducer(withProduct({ answers: { brand: 'Dangote' } }), { type: 'PAUSE_TAPPED' });
    expect(s.phase).toBe('paused');
    expect(s.answers.brand).toBe('Dangote');
  });

  it('cancel during research returns to review without a report', () => {
    let s = withProduct({
      phase: 'processing',
      requestId: 'req-1',
      answers: { brand: 'Dangote', quantity: '50' },
      locationKey: 'ng-la-lagos',
      locationLabel: 'Lagos',
    });
    s = priceCheckerReducer(s, { type: 'CANCEL_STARTED' });
    expect(s.phase).toBe('cancelling');
    s = priceCheckerReducer(s, { type: 'CANCEL_CONFIRMED' });
    expect(s.phase).toBe('reviewing_answers');
    expect(s.requestId).toBeNull();
    expect(s.answers.quantity).toBe('50');
  });

  it('report_ready requires a report id; processing without report stays processing', () => {
    let s = withProduct({ phase: 'processing', requestId: 'req-1' });
    const processing: ResearchStatusDto = {
      requestId: 'req-1',
      status: 'processing',
      stage: 'searching_sources',
      elapsedSeconds: 12,
      metrics: {
        discoveredSourceCount: 4,
        retrievedPageCount: 2,
        acceptedObservationCount: null,
        independentSourceCount: null,
      },
      reportId: null,
      reportAccessToken: null,
      errorCategory: null,
    };
    s = priceCheckerReducer(s, { type: 'STATUS_UPDATED', status: processing });
    expect(s.phase).toBe('processing');
    expect(s.research?.metrics.discoveredSourceCount).toBe(4);

    s = priceCheckerReducer(s, {
      type: 'STATUS_UPDATED',
      status: {
        ...processing,
        status: 'completed',
        reportId: 'rep-1',
        reportAccessToken: 'tok',
        stage: 'preparing_report',
        metrics: { ...processing.metrics, independentSourceCount: 3, acceptedObservationCount: 5 },
      },
    });
    expect(s.phase).toBe('report_ready');
  });

  it('insufficient_data is distinct from failed', () => {
    let s = withProduct({ phase: 'processing', requestId: 'req-1' });
    s = priceCheckerReducer(s, {
      type: 'STATUS_UPDATED',
      status: {
        requestId: 'req-1',
        status: 'insufficient_data',
        stage: 'preparing_report',
        elapsedSeconds: 40,
        metrics: {
          discoveredSourceCount: 2,
          retrievedPageCount: 1,
          acceptedObservationCount: 0,
          independentSourceCount: 0,
        },
        reportId: 'rep-2',
        reportAccessToken: 'tok',
        errorCategory: null,
      },
    });
    expect(s.phase).toBe('insufficient_data');
  });

  it('usage limit is a dedicated phase', () => {
    const s = priceCheckerReducer(withProduct({ phase: 'ready_to_generate' }), {
      type: 'USAGE_LIMIT_REACHED',
      usage: { allowed: false, limit: 2, used: 2, remaining: 0, authenticated: false, resetsAt: null },
    });
    expect(s.phase).toBe('usage_limit_reached');
  });

  it('never shows confidence before scoring (research metrics stay null until backend sends them)', () => {
    const s = withProduct({ phase: 'asking_question' });
    expect(s.research).toBeNull();
    expect(questionProgress(s).answered).toBe(0);
    expect(unansweredRequiredIds(s)).toContain('brand');
    expect(nextQuestionId(s)).toBe('brand');
  });

  it('payment_required → quote → confirmed → processing preserves answers', () => {
    const quote = {
      id: 'q-1',
      currency: 'NGN',
      requestedItemCount: 1,
      freeItemCountApplied: 0,
      chargeableItemCount: 1,
      unitPriceKobo: 1500000,
      subtotalKobo: 1500000,
      discountKobo: 0,
      totalKobo: 1500000,
      pricingVersion: 'v1',
      expiresAt: new Date().toISOString(),
      lineItems: [{ productLabel: 'Cement', locationLabel: 'Lagos', amountKobo: 1500000, free: false }],
      status: 'ready' as const,
    };
    let s = withProduct({
      phase: 'ready_to_generate',
      answers: { brand: 'Dangote', quantity: '50' },
      locationKey: 'ng-la-lagos',
      locationLabel: 'Lagos',
    });
    s = priceCheckerReducer(s, { type: 'PAYMENT_REQUIRED' });
    expect(s.phase).toBe('awaiting_payment');
    expect(s.quoteLoading).toBe(true);
    s = priceCheckerReducer(s, { type: 'QUOTE_READY', quote });
    expect(s.quote?.totalKobo).toBe(1500000);
    expect(s.answers.brand).toBe('Dangote');
    s = priceCheckerReducer(s, { type: 'PAYMENT_INITIALIZING', email: 'guest@example.com' });
    s = priceCheckerReducer(s, { type: 'PAYMENT_INITIALIZED', paymentOrderId: 'ord-1' });
    expect(s.phase).toBe('payment_pending');
    s = priceCheckerReducer(s, {
      type: 'PAYMENT_CONFIRMED',
      paymentOrderId: 'ord-1',
      status: {
        status: 'success',
        fulfilmentStatus: 'ready',
        amountPaidKobo: 1500000,
        chargeableItemCount: 1,
        freeItemCountApplied: 0,
        reference: 'ref_xxx',
        paidAt: new Date().toISOString(),
      },
    });
    expect(s.phase).toBe('payment_confirmed');
    expect(s.paymentOrderId).toBe('ord-1');
    s = priceCheckerReducer(s, { type: 'GENERATION_STARTED', requestId: 'req-paid-1' });
    expect(s.phase).toBe('processing');
    expect(s.answers.quantity).toBe('50');
    expect(s.paymentOrderId).toBe('ord-1');
  });

  it('payment abandoned returns answers to review via dismiss', () => {
    let s = withProduct({
      phase: 'awaiting_payment',
      answers: { brand: 'BUA', quantity: '20' },
      locationKey: 'ng-la-lagos',
      locationLabel: 'Lagos',
    });
    s = priceCheckerReducer(s, { type: 'PAYMENT_ABANDONED' });
    expect(s.phase).toBe('payment_abandoned');
    s = priceCheckerReducer(s, { type: 'PAYMENT_DISMISSED' });
    expect(s.phase).toBe('reviewing_answers');
    expect(s.answers.brand).toBe('BUA');
  });

  it('checkout restore lands on payment_confirmed without wiping answers', () => {
    const s = priceCheckerReducer(initialPriceCheckerState, {
      type: 'CHECKOUT_RESTORED',
      product: { key: 'cement', kind: 'product', name: 'Cement', category: 'Structural' },
      answers: { brand: 'Dangote', quantity: '100' },
      locationKey: 'ng-la-lagos',
      locationLabel: 'Lagos Mainland',
      query: 'cement',
      preview,
      quote: null,
      paymentOrderId: 'ord-9',
      guestEmail: 'a@b.com',
      phase: 'payment_confirmed',
      paymentStatus: {
        status: 'success',
        fulfilmentStatus: 'ready',
        amountPaidKobo: 1500000,
        chargeableItemCount: 1,
        freeItemCountApplied: 0,
        reference: 'ref_9',
        paidAt: new Date().toISOString(),
      },
    });
    expect(s.phase).toBe('payment_confirmed');
    expect(s.answers.brand).toBe('Dangote');
    expect(s.locationLabel).toBe('Lagos Mainland');
  });
});
