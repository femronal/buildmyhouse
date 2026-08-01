/**
 * Stage 6/7 — Price Checker session controller.
 *
 * Wires the pure state machine to the real backend: catalogue search,
 * server-validated question previews, research start/cancel, guest payment
 * quotes, and truthful status polling. Restores checkout after Paystack redirect.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { priceCheckerApi, PriceCheckerApiError } from '@/lib/price-checker/api';
import { priceCheckerAnalytics } from '@/lib/price-checker/analytics';
import {
  clearCheckoutSnapshot,
  loadCheckoutSnapshot,
  saveCheckoutSnapshot,
} from '@/lib/price-checker/session';
import {
  initialPriceCheckerState,
  priceCheckerReducer,
  currentQuestion,
  nextQuestionId,
  questionProgress,
  readyForReview,
  validateAnswer,
  buildUnderstanding,
  isPaymentSuccessStatus,
  PriceCheckerState,
  SelectedProduct,
  UNKNOWN_ANSWER,
  LOCATION_QUESTION_ID,
} from '@/lib/price-checker/state';
import { CatalogueSearchResult, PaymentStatusDto, ResearchStatusDto } from '@/lib/price-checker/types';

const ACTIVE_RUN_KEY = 'price_checker_active_request';
const POLL_INTERVAL_MS = 2500;
const PAYMENT_POLL_MS = 2000;

async function storage() {
  return require('@react-native-async-storage/async-storage').default;
}

function isPaymentRequiredError(err: unknown): boolean {
  return (
    err instanceof PriceCheckerApiError &&
    err.status === 403 &&
    (err.code === 'usage_limit_reached' || err.code === 'payment_required')
  );
}

export function usePriceCheckerSession(authenticated: boolean) {
  const [state, dispatch] = useReducer(priceCheckerReducer, initialPriceCheckerState);
  const [connectionLost, setConnectionLost] = useState(false);
  const [lastStatusAt, setLastStatusAt] = useState<number | null>(null);
  const pollFailures = useRef(0);
  const stateRef = useRef<PriceCheckerState>(state);
  stateRef.current = state;
  const paymentModalTracked = useRef<string | null>(null);

  const persistCheckout = useCallback(async (overrides?: Partial<PriceCheckerState>) => {
    const s = { ...stateRef.current, ...overrides };
    if (!s.product || !s.locationKey || !s.locationLabel) return;
    await saveCheckoutSnapshot({
      product: s.product,
      answers: s.answers,
      locationKey: s.locationKey,
      locationLabel: s.locationLabel,
      query: s.query,
      preview: s.preview,
      quoteId: s.quote?.id ?? null,
      paymentOrderId: s.paymentOrderId,
      guestEmail: s.guestEmail,
    }).catch(() => undefined);
  }, []);

  // ---------------------------------------------------------------------
  // Mount: analytics, usage, restore active run / checkout snapshot
  // ---------------------------------------------------------------------
  useEffect(() => {
    priceCheckerAnalytics.opened(authenticated);
    let cancelled = false;
    (async () => {
      try {
        const usage = await priceCheckerApi.usage();
        if (!cancelled) dispatch({ type: 'USAGE_LOADED', usage });
      } catch {
        // Non-blocking; limits are enforced server-side anyway.
      }
      try {
        const store = await storage();
        const activeId: string | null = await store.getItem(ACTIVE_RUN_KEY);
        if (activeId && !cancelled) {
          const status = await priceCheckerApi.researchStatus(activeId);
          if (status.status === 'processing' && !cancelled) {
            dispatch({ type: 'RESTORED_ACTIVE_RUN', requestId: activeId });
            dispatch({ type: 'STATUS_UPDATED', status });
            return;
          }
          await store.removeItem(ACTIVE_RUN_KEY);
        }
      } catch {
        const store = await storage().catch(() => null);
        await store?.removeItem(ACTIVE_RUN_KEY).catch(() => undefined);
      }
      // Checkout snapshot is restored by workspace when ?payment= is present,
      // or eagerly when a paid-but-unconfirmed order exists.
      try {
        const snap = await loadCheckoutSnapshot();
        if (!snap || cancelled || stateRef.current.product) return;
        if (snap.paymentOrderId) {
          let paymentStatus: PaymentStatusDto | null = null;
          try {
            paymentStatus = await priceCheckerApi.paymentStatus(snap.paymentOrderId);
          } catch {
            paymentStatus = null;
          }
          let quote = null;
          // Quote may have expired; confirmation uses paymentStatus amounts.
          const phase = paymentStatus && isPaymentSuccessStatus(paymentStatus.status)
            ? 'payment_confirmed'
            : paymentStatus?.status === 'failed' || paymentStatus?.status === 'amount_mismatch'
              ? 'payment_failed'
              : snap.paymentOrderId
                ? 'payment_pending'
                : 'awaiting_payment';
          dispatch({
            type: 'CHECKOUT_RESTORED',
            product: snap.product,
            answers: snap.answers,
            locationKey: snap.locationKey,
            locationLabel: snap.locationLabel,
            query: snap.query,
            preview: snap.preview,
            quote,
            paymentOrderId: snap.paymentOrderId,
            guestEmail: snap.guestEmail,
            phase: phase as any,
            paymentStatus,
          });
          if (phase === 'payment_confirmed' && paymentStatus) {
            priceCheckerAnalytics.paidBatchConfirmed(
              paymentStatus.chargeableItemCount,
              paymentStatus.freeItemCountApplied,
            );
          }
        }
      } catch {
        // Fresh start is fine.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locationsQuery = useQuery({
    queryKey: ['priceCheckerLocations'],
    queryFn: async () => (await priceCheckerApi.locations()).locations,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Track payment modal view once per quote id
  useEffect(() => {
    if (state.phase !== 'awaiting_payment' || !state.quote) return;
    if (paymentModalTracked.current === state.quote.id) return;
    paymentModalTracked.current = state.quote.id;
    priceCheckerAnalytics.paymentModalViewed({
      requestedItemCount: state.quote.requestedItemCount,
      freeItemCount: state.quote.freeItemCountApplied,
      chargeableItemCount: state.quote.chargeableItemCount,
      totalKobo: state.quote.totalKobo,
      pricingVersion: state.quote.pricingVersion,
      authenticated,
    });
  }, [state.phase, state.quote, authenticated]);

  // ---------------------------------------------------------------------
  // Status polling while processing
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (state.phase !== 'processing' || !state.requestId) return;
    const requestId = state.requestId;
    const paid = Boolean(state.paymentOrderId);
    let stopped = false;
    let lastStage: string | null = null;

    const poll = async () => {
      try {
        const status: ResearchStatusDto = await priceCheckerApi.researchStatus(requestId);
        if (stopped) return;
        pollFailures.current = 0;
        setConnectionLost(false);
        setLastStatusAt(Date.now());
        if (status.stage && status.stage !== lastStage) {
          if (lastStage) priceCheckerAnalytics.stageCompleted(lastStage);
          lastStage = status.stage;
        }
        dispatch({ type: 'STATUS_UPDATED', status });
        if (status.status !== 'processing') {
          const store = await storage().catch(() => null);
          await store?.removeItem(ACTIVE_RUN_KEY).catch(() => undefined);
          if (status.status === 'completed') {
            priceCheckerAnalytics.reportCompleted(
              'available_in_report',
              status.metrics.independentSourceCount ?? 0,
              status.elapsedSeconds,
            );
            if (paid) priceCheckerAnalytics.paidReportCompleted(status.elapsedSeconds);
            await clearCheckoutSnapshot().catch(() => undefined);
          } else if (status.status === 'insufficient_data') {
            priceCheckerAnalytics.insufficientData(status.elapsedSeconds);
            if (paid) priceCheckerAnalytics.paidInsufficientData(status.elapsedSeconds);
            await clearCheckoutSnapshot().catch(() => undefined);
          } else if (status.status === 'failed') {
            priceCheckerAnalytics.error(status.errorCategory ?? 'internal');
            if (paid) priceCheckerAnalytics.paidTechnicalFailure();
          }
        }
      } catch (err) {
        if (stopped) return;
        pollFailures.current += 1;
        if (err instanceof PriceCheckerApiError && (err.status === 403 || err.status === 404)) {
          dispatch({
            type: 'GENERATION_REJECTED',
            error: { category: 'internal', message: 'We lost track of this research run. Your answers are safe — please try again.' },
          });
          stopped = true;
          return;
        }
        if (pollFailures.current >= 3) setConnectionLost(true);
      }
    };

    void poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [state.phase, state.requestId, state.paymentOrderId]);

  // ---------------------------------------------------------------------
  // Payment status polling after redirect
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (state.phase !== 'payment_pending' || !state.paymentOrderId) return;
    const orderId = state.paymentOrderId;
    let stopped = false;
    let ticks = 0;

    const poll = async () => {
      try {
        const status = await priceCheckerApi.paymentStatus(orderId);
        if (stopped) return;
        if (isPaymentSuccessStatus(status.status)) {
          priceCheckerAnalytics.paymentSucceeded(
            status.chargeableItemCount,
            status.freeItemCountApplied,
            status.amountPaidKobo ?? 0,
          );
          priceCheckerAnalytics.paidBatchConfirmed(status.chargeableItemCount, status.freeItemCountApplied);
          dispatch({ type: 'PAYMENT_CONFIRMED', status, paymentOrderId: orderId });
          await persistCheckout({ paymentOrderId: orderId, paymentStatus: status });
          return;
        }
        if (status.status === 'failed') {
          priceCheckerAnalytics.paymentFailed();
          dispatch({ type: 'PAYMENT_FAILED', status, message: 'Payment could not be completed. Your answers are still saved.' });
          return;
        }
        if (status.status === 'amount_mismatch') {
          priceCheckerAnalytics.paymentAmountMismatch();
          dispatch({
            type: 'PAYMENT_FAILED',
            status,
            message: 'We could not confirm the payment amount. Please contact BuildMyHouse support with your receipt.',
          });
          return;
        }
        if (status.status === 'abandoned') {
          priceCheckerAnalytics.paymentAbandoned();
          dispatch({ type: 'PAYMENT_ABANDONED' });
          return;
        }
        ticks += 1;
        if (ticks === 1) priceCheckerAnalytics.paymentPending();
        dispatch({ type: 'PAYMENT_PENDING', paymentOrderId: orderId, status });
      } catch {
        // Keep pending; user can retry from callback recovery.
      }
    };

    void poll();
    const interval = setInterval(poll, PAYMENT_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [state.phase, state.paymentOrderId, persistCheckout]);

  // ---------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------

  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    dispatch({ type: 'QUERY_CHANGED', query: q });
    dispatch({ type: 'SEARCH_STARTED' });
    priceCheckerAnalytics.productSearchStarted();
    try {
      const { results } = await priceCheckerApi.searchCatalogue(q);
      dispatch({ type: 'SEARCH_SUCCEEDED', matches: results });
    } catch {
      dispatch({
        type: 'SEARCH_FAILED',
        message: 'We could not reach the catalogue. Please check your connection and try again.',
      });
    }
  }, []);

  const selectProduct = useCallback(async (match: CatalogueSearchResult) => {
    const product: SelectedProduct = { key: match.key, kind: match.kind, name: match.name, category: match.category };
    dispatch({ type: 'PRODUCT_SELECTED', product });
    priceCheckerAnalytics.productSelected(match.category, match.key, match.kind);
    try {
      const preview = await priceCheckerApi.questionsPreview(match.key, match.kind, {});
      dispatch({ type: 'PREVIEW_LOADED', preview });
    } catch {
      dispatch({
        type: 'SEARCH_FAILED',
        message: 'We could not load the questions for this product. Please try again.',
      });
    }
  }, []);

  const submitAnswer = useCallback(async (raw: string) => {
    const s = stateRef.current;
    const question = currentQuestion(s);
    if (!question || !s.product) return;

    if (question.id === LOCATION_QUESTION_ID) return; // location uses selectLocation

    const validation = validateAnswer(question, raw);
    if (!validation.ok) {
      dispatch({ type: 'ANSWER_REJECTED', message: validation.message ?? 'Please try a different answer.' });
      return;
    }
    dispatch({ type: 'ANSWER_SUBMITTED' });
    if (validation.value === UNKNOWN_ANSWER) priceCheckerAnalytics.unknownSelected(question.id);

    const merged = { ...s.answers, [question.id]: validation.value! };
    try {
      const preview = await priceCheckerApi.questionsPreview(s.product.key, s.product.kind, merged);
      if (preview.contradictions.length > 0) {
        dispatch({ type: 'ANSWER_REJECTED', message: preview.contradictions[0] });
        return;
      }
      const { answered, total } = questionProgress(s);
      priceCheckerAnalytics.questionAnswered(question.id, question.type, Math.min(answered + 1, total));
      dispatch({ type: 'ANSWER_ACCEPTED', questionId: question.id, value: validation.value!, preview });
    } catch {
      dispatch({ type: 'ANSWER_ACCEPTED', questionId: question.id, value: validation.value!, preview: null });
    }
  }, []);

  const selectUnknown = useCallback(() => {
    void submitAnswer(UNKNOWN_ANSWER);
  }, [submitAnswer]);

  const selectLocation = useCallback((key: string, label: string) => {
    dispatch({ type: 'LOCATION_SELECTED', key, label });
  }, []);

  const editAnswer = useCallback((questionId: string) => {
    priceCheckerAnalytics.answerEdited(questionId);
    if (questionId === LOCATION_QUESTION_ID) {
      dispatch({ type: 'EDIT_ANSWER', questionId: LOCATION_QUESTION_ID });
      return;
    }
    dispatch({ type: 'EDIT_ANSWER', questionId });
  }, []);

  const pauseAndEdit = useCallback(async () => {
    const s = stateRef.current;
    if (s.phase === 'processing' && s.requestId) {
      priceCheckerAnalytics.generationCancelled(s.research?.stage ?? null);
      dispatch({ type: 'CANCEL_STARTED' });
      try {
        await priceCheckerApi.cancelResearch(s.requestId);
      } catch {
        // Even if cancel fails remotely, the user returns to review.
      }
      const store = await storage().catch(() => null);
      await store?.removeItem(ACTIVE_RUN_KEY).catch(() => undefined);
      dispatch({ type: 'CANCEL_CONFIRMED' });
      return;
    }
    priceCheckerAnalytics.generationPaused();
    dispatch({ type: 'PAUSE_TAPPED' });
  }, []);

  const resumeQuestions = useCallback(() => {
    dispatch({ type: 'RESUME_QUESTIONS' });
  }, []);

  const openReview = useCallback(() => {
    priceCheckerAnalytics.reviewOpened();
    dispatch({ type: 'REVIEW_OPENED' });
  }, []);

  const openPaymentQuote = useCallback(async () => {
    const s = stateRef.current;
    if (!s.product || !s.locationKey || !s.locationLabel) return;
    dispatch({ type: 'PAYMENT_REQUIRED' });
    try {
      const quote = await priceCheckerApi.createPaymentQuote({
        items: [
          {
            familyKey: s.product.key,
            kind: s.product.kind,
            answers: s.answers,
            locationKey: s.locationKey,
            rawProductName: s.query || s.product.name,
            productLabel: s.product.name,
          },
        ],
      });
      priceCheckerAnalytics.paymentQuoteCreated({
        requestedItemCount: quote.requestedItemCount,
        freeItemCount: quote.freeItemCountApplied,
        chargeableItemCount: quote.chargeableItemCount,
        totalKobo: quote.totalKobo,
        pricingVersion: quote.pricingVersion,
      });
      dispatch({ type: 'QUOTE_READY', quote });
      await persistCheckout({ quote, paymentOrderId: null });
    } catch (err) {
      dispatch({
        type: 'QUOTE_FAILED',
        error: {
          category: 'network',
          message:
            err instanceof PriceCheckerApiError
              ? err.message
              : 'We could not prepare a payment quote. Your answers are safe — please try again.',
        },
      });
    }
  }, [persistCheckout]);

  const generateReport = useCallback(async () => {
    const s = stateRef.current;
    if (!s.product || !s.locationKey || !readyForReview(s)) return;
    dispatch({ type: 'GENERATE_REQUESTED' });
    priceCheckerAnalytics.generationStarted(s.product.key, s.locationKey.split('-').length > 2 ? 'city' : 'state');
    try {
      const { requestId } = await priceCheckerApi.startResearch({
        familyKey: s.product.key,
        kind: s.product.kind,
        answers: s.answers,
        locationKey: s.locationKey,
        rawProductName: s.query || s.product.name,
      });
      const store = await storage().catch(() => null);
      await store?.setItem(ACTIVE_RUN_KEY, requestId).catch(() => undefined);
      setLastStatusAt(Date.now());
      dispatch({ type: 'GENERATION_STARTED', requestId });
    } catch (err) {
      if (isPaymentRequiredError(err)) {
        priceCheckerAnalytics.usageLimitReached(authenticated);
        await openPaymentQuote();
        return;
      }
      priceCheckerAnalytics.error('generation_start');
      dispatch({
        type: 'GENERATION_REJECTED',
        error: {
          category: err instanceof PriceCheckerApiError && err.status === 400 ? 'invalid_request' : 'network',
          message:
            err instanceof PriceCheckerApiError && err.status === 400
              ? err.message
              : 'We could not start the price research. Your answers are safe — please try again.',
        },
      });
    }
  }, [authenticated, openPaymentQuote]);

  const initializePayment = useCallback(
    async (email: string) => {
      const s = stateRef.current;
      if (!s.quote) return;
      dispatch({ type: 'PAYMENT_INITIALIZING', email });
      priceCheckerAnalytics.paymentEmailEntered();
      priceCheckerAnalytics.paymentStarted(s.quote.chargeableItemCount, s.quote.totalKobo);
      try {
        const { paymentOrderId, authorizationUrl } = await priceCheckerApi.initializePayment({
          quoteId: s.quote.id,
          email: email.trim(),
        });
        dispatch({ type: 'PAYMENT_INITIALIZED', paymentOrderId });
        await persistCheckout({ paymentOrderId, guestEmail: email.trim() });
        priceCheckerAnalytics.paymentRedirected();
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.assign(authorizationUrl);
        } else {
          await Linking.openURL(authorizationUrl);
        }
      } catch (err) {
        priceCheckerAnalytics.paymentFailed();
        dispatch({
          type: 'PAYMENT_INIT_FAILED',
          message:
            err instanceof PriceCheckerApiError
              ? err.message
              : 'We could not start secure payment. Please try again.',
        });
      }
    },
    [persistCheckout],
  );

  const startPaidResearch = useCallback(async () => {
    const s = stateRef.current;
    if (!s.paymentOrderId) return;
    priceCheckerAnalytics.paidResearchStarted(s.paymentStatus?.chargeableItemCount ?? s.quote?.chargeableItemCount ?? 1);
    dispatch({ type: 'GENERATE_REQUESTED' });
    try {
      const result = await priceCheckerApi.startPaidBatch(s.paymentOrderId);
      const requestId = result.requestId ?? result.requestIds?.[0];
      if (!requestId) {
        throw new PriceCheckerApiError('No research request was returned', 500, 'internal');
      }
      const store = await storage().catch(() => null);
      await store?.setItem(ACTIVE_RUN_KEY, requestId).catch(() => undefined);
      setLastStatusAt(Date.now());
      dispatch({ type: 'GENERATION_STARTED', requestId });
    } catch (err) {
      if (isPaymentRequiredError(err)) {
        await openPaymentQuote();
        return;
      }
      priceCheckerAnalytics.error('paid_research_start');
      dispatch({
        type: 'GENERATION_REJECTED',
        error: {
          category: 'network',
          message:
            err instanceof PriceCheckerApiError
              ? err.message
              : 'We could not start the paid price research. Your payment is safe — please try again.',
        },
      });
    }
  }, [openPaymentQuote]);

  const handlePaymentReturn = useCallback(
    async (opts: { paymentOrderId?: string | null; reference?: string | null }) => {
      const snap = await loadCheckoutSnapshot();
      const orderId = opts.paymentOrderId || snap?.paymentOrderId || stateRef.current.paymentOrderId;
      if (snap && !stateRef.current.product) {
        dispatch({
          type: 'CHECKOUT_RESTORED',
          product: snap.product,
          answers: snap.answers,
          locationKey: snap.locationKey,
          locationLabel: snap.locationLabel,
          query: snap.query,
          preview: snap.preview,
          quote: null,
          paymentOrderId: orderId,
          guestEmail: snap.guestEmail,
          phase: 'payment_pending',
          paymentStatus: null,
        });
      } else if (orderId) {
        dispatch({ type: 'PAYMENT_PENDING', paymentOrderId: orderId });
      }

      if (opts.reference) {
        try {
          const status = await priceCheckerApi.verifyPayment({ reference: opts.reference });
          if (isPaymentSuccessStatus(status.status)) {
            priceCheckerAnalytics.paymentSucceeded(
              status.chargeableItemCount,
              status.freeItemCountApplied,
              status.amountPaidKobo ?? 0,
            );
            priceCheckerAnalytics.paidBatchConfirmed(status.chargeableItemCount, status.freeItemCountApplied);
            dispatch({
              type: 'PAYMENT_CONFIRMED',
              status,
              paymentOrderId: status.paymentOrderId ?? orderId ?? undefined,
            });
            await persistCheckout({
              paymentOrderId: status.paymentOrderId ?? orderId ?? null,
              paymentStatus: status,
            });
            return;
          }
          if (status.status === 'failed' || status.status === 'amount_mismatch') {
            if (status.status === 'amount_mismatch') priceCheckerAnalytics.paymentAmountMismatch();
            else priceCheckerAnalytics.paymentFailed();
            dispatch({
              type: 'PAYMENT_FAILED',
              status,
              message:
                status.status === 'amount_mismatch'
                  ? 'We could not confirm the payment amount. Please contact BuildMyHouse support with your receipt.'
                  : 'Payment could not be completed. Your answers are still saved.',
            });
            return;
          }
          dispatch({
            type: 'PAYMENT_PENDING',
            paymentOrderId: status.paymentOrderId ?? orderId ?? undefined,
            status,
          });
          priceCheckerAnalytics.paymentPending();
          return;
        } catch {
          // Fall through to order polling.
        }
      }

      if (orderId) {
        dispatch({ type: 'PAYMENT_PENDING', paymentOrderId: orderId });
        priceCheckerAnalytics.paymentPending();
      }
    },
    [persistCheckout],
  );

  const dismissPayment = useCallback(() => {
    dispatch({ type: 'PAYMENT_DISMISSED' });
  }, []);

  const abandonPayment = useCallback(() => {
    priceCheckerAnalytics.paymentAbandoned();
    dispatch({ type: 'PAYMENT_ABANDONED' });
  }, []);

  const failPayment = useCallback((message?: string) => {
    priceCheckerAnalytics.paymentFailed();
    dispatch({
      type: 'PAYMENT_FAILED',
      message: message ?? 'Payment could not be completed. Your answers are still saved.',
    });
  }, []);

  const restoreCheckoutSnapshot = useCallback(
    async (
      phase:
        | 'awaiting_payment'
        | 'payment_pending'
        | 'payment_confirmed'
        | 'payment_failed'
        | 'payment_abandoned'
        | 'reviewing_answers',
      paymentOrderId?: string | null,
    ) => {
      const snap = await loadCheckoutSnapshot();
      if (!snap) return false;
      dispatch({
        type: 'CHECKOUT_RESTORED',
        product: snap.product,
        answers: snap.answers,
        locationKey: snap.locationKey,
        locationLabel: snap.locationLabel,
        query: snap.query,
        preview: snap.preview,
        quote: null,
        paymentOrderId: paymentOrderId ?? snap.paymentOrderId,
        guestEmail: snap.guestEmail,
        phase,
        paymentStatus: null,
      });
      return true;
    },
    [],
  );

  const retryPayment = useCallback(async () => {
    await openPaymentQuote();
  }, [openPaymentQuote]);

  const startAnother = useCallback(async () => {
    const store = await storage().catch(() => null);
    await store?.removeItem(ACTIVE_RUN_KEY).catch(() => undefined);
    await clearCheckoutSnapshot().catch(() => undefined);
    paymentModalTracked.current = null;
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    connectionLost,
    lastStatusAt,
    locations: locationsQuery.data ?? [],
    derived: {
      currentQuestion: currentQuestion(state),
      progress: questionProgress(state),
      readyForReview: readyForReview(state),
      understanding: buildUnderstanding(state),
      nextQuestionId: nextQuestionId(state),
    },
    actions: {
      search,
      selectProduct,
      submitAnswer,
      selectUnknown,
      selectLocation,
      editAnswer,
      pauseAndEdit,
      resumeQuestions,
      openReview,
      generateReport,
      startAnother,
      initializePayment,
      startPaidResearch,
      handlePaymentReturn,
      dismissPayment,
      abandonPayment,
      failPayment,
      restoreCheckoutSnapshot,
      retryPayment,
      openPaymentQuote,
      setQuery: (query: string) => dispatch({ type: 'QUERY_CHANGED', query }),
    },
  };
}
