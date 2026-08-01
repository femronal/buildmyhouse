import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePriceCheckerSession } from '@/hooks/usePriceCheckerSession';
import { priceCheckerApi } from '@/lib/price-checker/api';
import { priceCheckerAnalytics } from '@/lib/price-checker/analytics';
import { ConsumerReportDto } from '@/lib/price-checker/types';
import { isMobileWeb } from '@/lib/responsive-layout';
import { ConversationPanel } from './ConversationPanel';
import { PriceCheckerAbout, PriceCheckerHeader } from './PriceCheckerAbout';
import { ProductUnderstandingPanel } from './ProductUnderstandingPanel';
import { EvidenceConfidencePanel } from './EvidenceConfidencePanel';
import { PriceCheckPaymentModal, PaymentModalUiState } from './PriceCheckPaymentModal';
import { UsageLimitDialog } from './UsageLimitDialog';
import { pc } from './theme';

const AUTO_OPEN =
  typeof process !== 'undefined' &&
  process.env.EXPO_PUBLIC_PRICE_CHECKER_AUTO_OPEN_REPORT === 'true';

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function PriceCheckerWorkspace() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    payment?: string | string[];
    order?: string | string[];
    reference?: string | string[];
  }>();
  const { width } = useWindowDimensions();
  const mobile = isMobileWeb(width) || width < 900;
  const { data: user } = useCurrentUser();
  const authenticated = Boolean(user);
  const session = usePriceCheckerSession(authenticated);
  const { state, derived, actions, connectionLost, locations } = session;

  const [report, setReport] = useState<ConsumerReportDto | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);
  const [mobileUnderstandOpen, setMobileUnderstandOpen] = useState(false);
  const [mobileEvidenceOpen, setMobileEvidenceOpen] = useState(false);
  const [paymentWelcomeBack, setPaymentWelcomeBack] = useState(false);
  const paymentReturnHandled = useRef(false);

  // Handle Paystack return query params once
  useEffect(() => {
    const payment = firstParam(params.payment);
    const order = firstParam(params.order);
    const reference = firstParam(params.reference);
    if (!payment && !order && !reference) return;
    if (paymentReturnHandled.current) return;
    paymentReturnHandled.current = true;

    if (payment === 'abandoned') {
      setPaymentWelcomeBack(false);
      void actions.restoreCheckoutSnapshot('payment_abandoned', order).then((ok) => {
        if (!ok) actions.abandonPayment();
      });
    } else if (payment === 'failed') {
      setPaymentWelcomeBack(false);
      void actions.restoreCheckoutSnapshot('payment_failed', order).then((ok) => {
        if (!ok) actions.failPayment();
      });
    } else {
      setPaymentWelcomeBack(payment === 'confirmed' || payment === 'processing');
      void actions.handlePaymentReturn({ paymentOrderId: order, reference });
    }

    // Clean the URL so refresh does not re-trigger.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('order');
      url.searchParams.delete('reference');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [params.payment, params.order, params.reference, actions]);

  // Fetch consumer report when ready
  useEffect(() => {
    const reportId = state.research?.reportId;
    const token = state.research?.reportAccessToken ?? null;
    if (!reportId || (state.phase !== 'report_ready' && state.phase !== 'insufficient_data')) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const dto = await priceCheckerApi.getReport(reportId, token);
        if (!cancelled) {
          setReport(dto);
          if (AUTO_OPEN && state.phase === 'report_ready' && Platform.OS === 'web') {
            const path = priceCheckerApi.reportPath(reportId, token);
            window.open(path, '_blank', 'noopener,noreferrer');
          }
        }
      } catch {
        // Summary panel can still show research metrics; full report opens later.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.research?.reportId, state.research?.reportAccessToken, state.phase]);

  useEffect(() => {
    if (state.phase === 'reviewing_answers' && !state.requestId) {
      setCancelNotice((prev) =>
        prev ??
        (state.error === null
          ? null
          : null),
      );
    }
  }, [state.phase, state.requestId, state.error]);

  const liveRegionText = useMemo(() => {
    if (state.phase === 'asking_question' && derived.currentQuestion) return derived.currentQuestion.prompt;
    if (state.phase === 'processing' && state.research?.stage) {
      return `Stage: ${state.research.stage}`;
    }
    if (state.phase === 'payment_pending') return 'We’re confirming your payment';
    if (state.phase === 'payment_confirmed') return 'Payment confirmed. Your request is ready for research.';
    if (state.phase === 'report_ready') return 'Your price report is ready';
    if (state.phase === 'insufficient_data') return 'We could not confirm a reliable price range yet';
    if (state.clarification) return state.clarification;
    return '';
  }, [state.phase, state.research?.stage, state.clarification, derived.currentQuestion]);

  const openReport = () => {
    const reportId = state.research?.reportId;
    if (!reportId) return;
    const token = state.research?.reportAccessToken ?? null;
    const path = priceCheckerApi.reportPath(reportId, token);
    priceCheckerAnalytics.reportOpened(report?.status ?? 'complete');
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      router.push(path as any);
    }
  };

  const downloadPdf = async () => {
    const reportId = state.research?.reportId;
    if (!reportId) return;
    const token = state.research?.reportAccessToken ?? null;
    const url = priceCheckerApi.pdfUrl(reportId, token);
    priceCheckerAnalytics.pdfDownloaded();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      await Linking.openURL(url);
    }
  };

  const handlePause = async () => {
    if (state.phase === 'processing') {
      setCancelNotice(
        'Research was stopped so you can correct your answers. Your existing answers have been saved.',
      );
    }
    await actions.pauseAndEdit();
  };

  const lastUpdated = state.research
    ? new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const paymentModalVisible =
    state.phase === 'awaiting_payment' ||
    state.phase === 'payment_failed' ||
    state.phase === 'payment_abandoned';

  const paymentUiState: PaymentModalUiState = (() => {
    if (state.phase === 'payment_abandoned') return 'abandoned';
    if (state.phase === 'payment_failed') return 'failed';
    if (state.quoteLoading) return 'quote_loading';
    if (state.paymentInitializing) return 'initializing';
    if (state.quote) return 'quote_ready';
    return 'quote_loading';
  })();

  const conversation = (
    <ConversationPanel
      phase={state.phase}
      query={state.query}
      searching={state.searching}
      matches={state.matches}
      searchMessage={state.searchMessage}
      question={derived.currentQuestion}
      progress={derived.progress}
      clarification={state.clarification}
      understanding={derived.understanding}
      locations={locations}
      researchStage={state.research?.stage ?? null}
      elapsedSeed={state.research?.elapsedSeconds ?? 0}
      requestId={state.requestId}
      connectionLost={connectionLost}
      errorMessage={state.error?.message ?? null}
      errorCategory={state.error?.category ?? null}
      reportSummary={report}
      cancelNotice={cancelNotice}
      unknownNotes={state.preview?.unknownNotes ?? []}
      liveRegionText={liveRegionText}
      quote={state.quote}
      paymentStatus={state.paymentStatus}
      paymentWelcomeBack={paymentWelcomeBack}
      startingPaidResearch={state.phase === 'ready_to_generate' && Boolean(state.paymentOrderId)}
      onSetQuery={actions.setQuery}
      onSearch={actions.search}
      onSelectProduct={actions.selectProduct}
      onSubmitAnswer={actions.submitAnswer}
      onUnknown={actions.selectUnknown}
      onSelectLocation={actions.selectLocation}
      onPause={handlePause}
      onResume={() => {
        setCancelNotice(null);
        actions.resumeQuestions();
      }}
      onEdit={actions.editAnswer}
      onGenerate={actions.generateReport}
      onOpenReport={openReport}
      onDownloadPdf={downloadPdf}
      onStartAnother={() => {
        setReport(null);
        setCancelNotice(null);
        setPaymentWelcomeBack(false);
        void actions.startAnother();
      }}
      onRetry={() => void actions.generateReport()}
      onStartPaidResearch={() => void actions.startPaidResearch()}
      onReviewPaidDetails={() => {
        // Keep payment_confirmed; edit from understanding panel / answer rows.
        const firstEditable = derived.understanding.find((r) => r.key !== 'product' && r.key !== 'category');
        if (firstEditable) actions.editAnswer(firstEditable.key);
      }}
    />
  );

  return (
    <View className="flex-1" style={{ backgroundColor: pc.pageBg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="mx-auto w-full max-w-[1100px] px-4 pt-8 md:px-8">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.push('/tools' as any))}
            className="mb-6 h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={16} color="#171717" weight="bold" />
          </Pressable>

          <PriceCheckerHeader />

          {!mobile ? (
            <View className="flex-row gap-6">
              <View className="w-[42%]">{conversation}</View>
              <View className="flex-1 gap-6">
                <ProductUnderstandingPanel rows={derived.understanding} />
                <EvidenceConfidencePanel
                  phase={state.phase}
                  research={state.research}
                  confidence={report?.confidence ?? null}
                  lastUpdated={lastUpdated}
                />
              </View>
            </View>
          ) : (
            <View className="gap-4">
              {conversation}
              <Pressable
                onPress={() => setMobileUnderstandOpen((v) => !v)}
                className="min-h-[44px] flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4"
                accessibilityRole="button"
                accessibilityLabel="Toggle what we understand"
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold' }} className="text-neutral-900">
                  What we understand
                </Text>
                <Text className="text-neutral-500">{mobileUnderstandOpen ? 'Hide' : 'Show'}</Text>
              </Pressable>
              {mobileUnderstandOpen ? <ProductUnderstandingPanel rows={derived.understanding} /> : null}
              <Pressable
                onPress={() => setMobileEvidenceOpen((v) => !v)}
                className="min-h-[44px] flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4"
                accessibilityRole="button"
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold' }} className="text-neutral-900">
                  Evidence and confidence
                </Text>
                <Text className="text-neutral-500">{mobileEvidenceOpen ? 'Hide' : 'Show'}</Text>
              </Pressable>
              {mobileEvidenceOpen ? (
                <EvidenceConfidencePanel
                  phase={state.phase}
                  research={state.research}
                  confidence={report?.confidence ?? null}
                  lastUpdated={lastUpdated}
                />
              ) : null}
            </View>
          )}

          <PriceCheckerAbout />
        </View>
      </ScrollView>

      <PriceCheckPaymentModal
        visible={paymentModalVisible}
        quote={state.quote}
        quoteLoading={state.quoteLoading}
        initializing={state.paymentInitializing}
        uiState={paymentUiState}
        initialEmail={state.guestEmail}
        errorMessage={state.error?.message ?? null}
        onClose={() => actions.dismissPayment()}
        onPay={(email) => void actions.initializePayment(email)}
        onReviewMaterials={() => actions.dismissPayment()}
        onRetryQuote={() => void actions.openPaymentQuote()}
        onRetryPayment={() => void actions.retryPayment()}
      />

      {/* Legacy edge-case only — primary free-limit path is the guest payment modal. */}
      <UsageLimitDialog
        visible={state.phase === 'usage_limit_reached'}
        usage={state.usage}
        onClose={() => actions.openReview()}
        onContinueToPayment={() => void actions.openPaymentQuote()}
      />
    </View>
  );
}
