import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  CatalogueSearchResult,
  ConsumerLocation,
  ConsumerQuestion,
  ConsumerReportDto,
  PaymentStatusDto,
  PriceCheckPaymentQuote,
  RESEARCH_STAGES,
} from '@/lib/price-checker/types';
import { PriceCheckerPhase, UnderstandingRow } from '@/lib/price-checker/state';
import { PriceCheckerComposer } from './PriceCheckerComposer';
import { SuggestedAnswerChips } from './SuggestedAnswerChips';
import { QuestionProgressBars } from './QuestionProgressBars';
import { ElapsedResearchTimer } from './ElapsedResearchTimer';
import { PauseAndEditButton } from './PauseAndEditButton';
import { AnswerReviewPanel } from './AnswerReviewPanel';
import { LocationPicker } from './LocationPicker';
import { ReportReadyPanel } from './ReportReadyPanel';
import { InsufficientDataPanel } from './InsufficientDataPanel';
import { PriceCheckerErrorPanel } from './PriceCheckerErrorPanel';
import { PaidBatchConfirmation } from './PaidBatchConfirmation';
import { pc } from './theme';

type Props = {
  phase: PriceCheckerPhase;
  query: string;
  searching: boolean;
  matches: CatalogueSearchResult[];
  searchMessage: string | null;
  question: ConsumerQuestion | null;
  progress: { answered: number; total: number };
  clarification: string | null;
  understanding: UnderstandingRow[];
  locations: ConsumerLocation[];
  researchStage: string | null;
  elapsedSeed: number;
  requestId: string | null;
  connectionLost: boolean;
  errorMessage: string | null;
  errorCategory: string | null;
  reportSummary: ConsumerReportDto | null;
  cancelNotice: string | null;
  unknownNotes: string[];
  liveRegionText: string;
  quote?: PriceCheckPaymentQuote | null;
  paymentStatus?: PaymentStatusDto | null;
  paymentWelcomeBack?: boolean;
  startingPaidResearch?: boolean;
  onSetQuery: (q: string) => void;
  onSearch: (q: string) => void;
  onSelectProduct: (m: CatalogueSearchResult) => void;
  onSubmitAnswer: (raw: string) => void;
  onUnknown: () => void;
  onSelectLocation: (key: string, label: string) => void;
  onPause: () => void;
  onResume: () => void;
  onEdit: (id: string) => void;
  onGenerate: () => void;
  onOpenReport: () => void;
  onDownloadPdf: () => void;
  onStartAnother: () => void;
  onRetry: () => void;
  onStartPaidResearch?: () => void;
  onReviewPaidDetails?: () => void;
};

function composerPlaceholder(phase: PriceCheckerPhase, question: ConsumerQuestion | null): string {
  if (phase === 'idle' || phase === 'product_search') return 'Search for a material…';
  if (!question) return 'Type your answer…';
  switch (question.type) {
    case 'brand_search':
      return 'Enter the brand…';
    case 'location':
      return 'Which city should we check?';
    case 'number':
    case 'quantity_unit':
      return 'How many do you need?';
    default:
      return 'Type your answer or choose an option…';
  }
}

export function ConversationPanel(props: Props) {
  const {
    phase,
    query,
    searching,
    matches,
    searchMessage,
    question,
    progress,
    clarification,
    understanding,
    locations,
    researchStage,
    elapsedSeed,
    requestId,
    connectionLost,
    errorMessage,
    errorCategory,
    reportSummary,
    cancelNotice,
    unknownNotes,
    liveRegionText,
    quote,
    paymentStatus,
    paymentWelcomeBack,
    startingPaidResearch,
    onSetQuery,
    onSearch,
    onSelectProduct,
    onSubmitAnswer,
    onUnknown,
    onSelectLocation,
    onPause,
    onResume,
    onEdit,
    onGenerate,
    onOpenReport,
    onDownloadPdf,
    onStartAnother,
    onRetry,
    onStartPaidResearch,
    onReviewPaidDetails,
  } = props;

  const [draft, setDraft] = useState('');
  useEffect(() => {
    setDraft('');
  }, [question?.id, phase]);

  const asking =
    phase === 'asking_question' || phase === 'answer_needs_clarification' || phase === 'validating_answer';
  const processing = phase === 'processing' || phase === 'cancelling' || phase === 'ready_to_generate';
  const showTimer = asking || processing || phase === 'paused';
  const showQuestionBars = asking || phase === 'paused' || phase === 'reviewing_answers';
  const showResearchBars = processing;

  return (
    <View
      className="rounded-[2rem] border p-6 md:p-8"
      style={{
        backgroundColor: pc.charcoalSoft,
        borderColor: pc.panelBorder,
        minHeight: 520,
      }}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
      >
        {liveRegionText}
      </Text>

      {/* Composer — green bubble */}
      {(phase === 'idle' || phase === 'product_search' || asking) && question?.type !== 'location' ? (
        <PriceCheckerComposer
          label={
            phase === 'idle' || phase === 'product_search'
              ? 'Search for a building material'
              : question?.prompt ?? 'Your answer'
          }
          placeholder={composerPlaceholder(phase, question)}
          value={phase === 'idle' || phase === 'product_search' ? query : draft}
          onChangeText={phase === 'idle' || phase === 'product_search' ? onSetQuery : setDraft}
          onSubmit={(v) => {
            if (phase === 'idle' || phase === 'product_search') onSearch(v);
            else onSubmitAnswer(v);
          }}
          loading={searching || phase === 'validating_answer'}
          disabled={phase === 'validating_answer'}
          multiline={question?.type === 'free_text'}
        />
      ) : null}

      {showQuestionBars ? (
        <QuestionProgressBars mode="questions" answered={progress.answered} total={progress.total} />
      ) : null}
      {showResearchBars ? (
        <QuestionProgressBars
          mode="research"
          currentStage={(researchStage as any) ?? null}
        />
      ) : null}

      {showTimer ? (
        <ElapsedResearchTimer
          running={asking || phase === 'processing' || phase === 'ready_to_generate'}
          resetKey={requestId ?? question?.id ?? 'session'}
          seededSeconds={elapsedSeed}
        />
      ) : null}

      {(asking || processing) && phase !== 'ready_to_generate' ? (
        <PauseAndEditButton onPress={onPause} duringResearch={processing} disabled={phase === 'cancelling'} />
      ) : null}

      <View className="mt-auto">
        {/* IDLE */}
        {(phase === 'idle' || (phase === 'product_search' && matches.length === 0 && !searching)) && (
          <>
            <Text className="mb-1 text-xs uppercase tracking-[0.18em]" style={{ fontFamily: 'Poppins_600SemiBold', color: '#6ee7b7' }}>
              BuildMyHouse Price Checker
            </Text>
            <Text className="mb-3 text-2xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              What building material do you want to price?
            </Text>
            <Text className="text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
              Search for a product or describe what you need. We will ask only the questions required to compare the
              right item.
            </Text>
            {searchMessage ? (
              <Text className="mt-4 text-sm text-amber-200" style={{ fontFamily: 'Poppins_400Regular' }} accessibilityLiveRegion="polite">
                {searchMessage}
              </Text>
            ) : null}
          </>
        )}

        {/* PRODUCT MATCHES */}
        {phase === 'product_search' && matches.length > 0 ? (
          <>
            <Text className="mb-3 text-xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              I found {matches.length} possible product{matches.length === 1 ? '' : 's'}. Which one are you pricing?
            </Text>
            <View className="gap-2">
              {matches.map((m) => (
                <Pressable
                  key={`${m.kind}:${m.key}`}
                  onPress={() => onSelectProduct(m)}
                  accessibilityRole="button"
                  accessibilityLabel={m.name}
                  className="min-h-[52px] justify-center rounded-2xl border border-white/10 px-4 py-3"
                  style={{ backgroundColor: pc.charcoalDeep }}
                >
                  <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {m.name}
                  </Text>
                  <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {m.category}
                    {m.marketNames[0] ? ` · also called ${m.marketNames[0]}` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {searching ? (
          <View className="mt-4 flex-row items-center gap-2">
            <ActivityIndicator color={pc.green} />
            <Text className="text-sm text-slate-400">Searching the catalogue…</Text>
          </View>
        ) : null}

        {/* QUESTION */}
        {asking && question ? (
          <>
            <Text className="mb-1 text-xs uppercase tracking-wide text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Question {Math.min(progress.answered + 1, progress.total)} of about {progress.total}
            </Text>
            <Text className="mb-2 text-xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              {question.prompt}
            </Text>
            {question.whyItMatters ? (
              <Text className="mb-4 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                {question.whyItMatters}
              </Text>
            ) : null}

            {question.type === 'location' ? (
              <LocationPicker locations={locations} onSelect={onSelectLocation} disabled={phase === 'validating_answer'} />
            ) : (
              <SuggestedAnswerChips
                options={question.options}
                onSelect={onSubmitAnswer}
                allowUnknown={question.allowUnknown}
                onUnknown={onUnknown}
                disabled={phase === 'validating_answer'}
              />
            )}

            {clarification ? (
              <Text className="mt-2 text-sm text-amber-200" style={{ fontFamily: 'Poppins_400Regular' }} accessibilityLiveRegion="polite">
                {clarification}
              </Text>
            ) : null}
          </>
        ) : null}

        {/* PAUSED */}
        {phase === 'paused' ? (
          <>
            <Text className="mb-2 text-2xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              Answers paused
            </Text>
            <Text className="mb-5 text-sm text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
              Your answers are saved. Edit any detail below, or continue where you left off.
            </Text>
            <AnswerReviewPanel
              rows={understanding}
              onEdit={onEdit}
              onGenerate={onGenerate}
              onContinueEditing={onResume}
              unknownNotes={unknownNotes}
            />
          </>
        ) : null}

        {/* REVIEW */}
        {(phase === 'reviewing_answers' || phase === 'ready_to_generate') && (
          <AnswerReviewPanel
            rows={understanding}
            onEdit={onEdit}
            onGenerate={onGenerate}
            onContinueEditing={onResume}
            generating={phase === 'ready_to_generate'}
            errorMessage={errorMessage}
            cancelNotice={cancelNotice}
            unknownNotes={unknownNotes}
          />
        )}

        {/* PAYMENT PENDING (after Paystack return) */}
        {phase === 'payment_pending' ? (
          <View className="items-center py-6">
            <ActivityIndicator color={pc.green} />
            <Text className="mt-3 text-center text-xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              We’re confirming your payment
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
              This normally takes a moment. Your materials and answers are still saved.
            </Text>
          </View>
        ) : null}

        {/* PAYMENT CONFIRMED */}
        {phase === 'payment_confirmed' && onStartPaidResearch && onReviewPaidDetails ? (
          <PaidBatchConfirmation
            quote={quote ?? null}
            paymentStatus={paymentStatus ?? null}
            understanding={understanding}
            welcomeBack={paymentWelcomeBack}
            onStartResearch={onStartPaidResearch}
            onReviewDetails={onReviewPaidDetails}
            starting={startingPaidResearch}
          />
        ) : null}

        {/* PROCESSING */}
        {phase === 'processing' || phase === 'cancelling' ? (
          <>
            <Text className="mb-2 text-2xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              Checking current prices
            </Text>
            <Text className="mb-3 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
              We are comparing recent sources that match your product, specification and location. You can stop if you
              need to correct an answer.
            </Text>
            {researchStage ? (
              <Text className="text-sm" style={{ fontFamily: 'Poppins_500Medium', color: '#6ee7b7' }} accessibilityLiveRegion="polite">
                {RESEARCH_STAGES.find((s) => s.code === researchStage)?.label ?? researchStage}
              </Text>
            ) : null}
            {connectionLost ? (
              <Text className="mt-3 text-sm text-amber-200">We lost connection briefly. Retrying… Your answers are safe.</Text>
            ) : null}
          </>
        ) : null}

        {/* REPORT READY */}
        {phase === 'report_ready' && reportSummary ? (
          <ReportReadyPanel
            summary={reportSummary}
            onOpenReport={onOpenReport}
            onDownloadPdf={onDownloadPdf}
            onStartAnother={onStartAnother}
          />
        ) : null}

        {/* INSUFFICIENT */}
        {phase === 'insufficient_data' ? (
          <InsufficientDataPanel
            report={reportSummary}
            productName={understanding.find((r) => r.key === 'product')?.value ?? null}
            locationLabel={understanding.find((r) => r.key === '__location')?.value ?? null}
            onEdit={onResume}
            onOpenReport={onOpenReport}
            onStartAnother={onStartAnother}
          />
        ) : null}

        {/* FAILED */}
        {phase === 'failed' && errorMessage ? (
          <PriceCheckerErrorPanel
            error={{ category: (errorCategory as any) ?? 'internal', message: errorMessage }}
            connectionLost={connectionLost}
            requestId={requestId}
            onRetry={onRetry}
            onEdit={onResume}
          />
        ) : null}
      </View>
    </View>
  );
}
