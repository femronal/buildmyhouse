import { useEffect, useState, type ReactNode } from 'react';
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
import { getPriceCheckerDensity, pc, PriceCheckerDensity } from './theme';

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
  /** Viewport width — drives compact type + spacing for thin phones. */
  viewportWidth?: number;
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

function Title({ density, children }: { density: PriceCheckerDensity; children: ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: 'Poppins_500Medium',
        color: '#fff',
        fontSize: density.titleSize,
        lineHeight: density.titleLineHeight,
        marginBottom: density.compact ? 8 : 12,
      }}
    >
      {children}
    </Text>
  );
}

function Body({ density, children, style }: { density: PriceCheckerDensity; children: ReactNode; style?: object }) {
  return (
    <Text
      style={{
        fontFamily: 'Poppins_400Regular',
        color: '#94a3b8',
        fontSize: density.bodySize,
        lineHeight: density.bodyLineHeight,
        ...style,
      }}
    >
      {children}
    </Text>
  );
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
    viewportWidth = 1024,
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

  const density = getPriceCheckerDensity(viewportWidth);
  const { compact } = density;

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
  const showComposer =
    (phase === 'idle' || phase === 'product_search' || asking) && question?.type !== 'location';

  const composer = showComposer ? (
    <PriceCheckerComposer
      compact={compact}
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
  ) : null;

  return (
    <View
      style={{
        backgroundColor: pc.charcoalSoft,
        borderColor: pc.panelBorder,
        borderWidth: 1,
        borderRadius: density.panelRadius,
        padding: density.panelPad,
        // Desktop keeps a roomy panel; mobile sizes to content so the fold stays usable.
        minHeight: compact ? undefined : 520,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
      >
        {liveRegionText}
      </Text>

      {/* On mobile, copy first then composer near the thumb / keyboard. Desktop keeps search on top. */}
      {!compact ? composer : null}

      {showQuestionBars ? (
        <QuestionProgressBars
          mode="questions"
          answered={progress.answered}
          total={progress.total}
          compact={compact}
        />
      ) : null}
      {showResearchBars ? (
        <QuestionProgressBars
          mode="research"
          currentStage={(researchStage as any) ?? null}
          compact={compact}
        />
      ) : null}

      {showTimer ? (
        <ElapsedResearchTimer
          running={asking || phase === 'processing' || phase === 'ready_to_generate'}
          resetKey={requestId ?? question?.id ?? 'session'}
          seededSeconds={elapsedSeed}
          compact={compact}
        />
      ) : null}

      {(asking || processing) && phase !== 'ready_to_generate' ? (
        <PauseAndEditButton
          onPress={onPause}
          duringResearch={processing}
          disabled={phase === 'cancelling'}
          compact={compact}
        />
      ) : null}

      <View style={{ marginTop: compact ? 0 : 'auto', width: '100%', maxWidth: '100%' }}>
        {(phase === 'idle' || (phase === 'product_search' && matches.length === 0 && !searching)) && (
          <>
            <Text
              style={{
                fontFamily: 'Poppins_600SemiBold',
                color: '#6ee7b7',
                fontSize: density.labelSize,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              BuildMyHouse Price Checker
            </Text>
            <Title density={density}>What building material do you want to price?</Title>
            <Body density={density}>
              {compact
                ? 'Search a product. We ask only the questions needed for a fair comparison.'
                : 'Search for a product or describe what you need. We will ask only the questions required to compare the right item.'}
            </Body>
            {searchMessage ? (
              <Text
                style={{
                  marginTop: 12,
                  fontFamily: 'Poppins_400Regular',
                  fontSize: density.bodySize,
                  color: '#fde68a',
                }}
                accessibilityLiveRegion="polite"
              >
                {searchMessage}
              </Text>
            ) : null}
          </>
        )}

        {phase === 'product_search' && matches.length > 0 ? (
          <>
            <Title density={density}>
              I found {matches.length} possible product{matches.length === 1 ? '' : 's'}. Which one are you pricing?
            </Title>
            <View style={{ gap: compact ? 6 : 8 }}>
              {matches.map((m) => (
                <Pressable
                  key={`${m.kind}:${m.key}`}
                  onPress={() => onSelectProduct(m)}
                  accessibilityRole="button"
                  accessibilityLabel={m.name}
                  style={{
                    minHeight: compact ? 48 : 52,
                    justifyContent: 'center',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: compact ? 12 : 16,
                    paddingVertical: compact ? 10 : 12,
                    backgroundColor: pc.charcoalDeep,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Poppins_600SemiBold',
                      color: '#fff',
                      fontSize: compact ? 14 : 16,
                    }}
                  >
                    {m.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Poppins_400Regular',
                      color: '#64748b',
                      fontSize: compact ? 11 : 12,
                      marginTop: 2,
                    }}
                  >
                    {m.category}
                    {m.marketNames[0] ? ` · also called ${m.marketNames[0]}` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {searching ? (
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color={pc.green} />
            <Body density={density}>Searching the catalogue…</Body>
          </View>
        ) : null}

        {asking && question ? (
          <>
            <Text
              style={{
                fontFamily: 'Poppins_600SemiBold',
                color: '#64748b',
                fontSize: density.labelSize,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Question {Math.min(progress.answered + 1, progress.total)} of about {progress.total}
            </Text>
            <Title density={density}>{question.prompt}</Title>
            {question.whyItMatters ? (
              <Body density={density} style={{ marginBottom: compact ? 10 : 16 }}>
                {question.whyItMatters}
              </Body>
            ) : null}

            {question.type === 'location' ? (
              <LocationPicker
                locations={locations}
                onSelect={onSelectLocation}
                disabled={phase === 'validating_answer'}
              />
            ) : (
              <SuggestedAnswerChips
                options={question.options}
                onSelect={onSubmitAnswer}
                allowUnknown={question.allowUnknown}
                onUnknown={onUnknown}
                disabled={phase === 'validating_answer'}
                compact={compact}
              />
            )}

            {clarification ? (
              <Text
                style={{
                  marginTop: 8,
                  fontFamily: 'Poppins_400Regular',
                  fontSize: density.bodySize,
                  color: '#fde68a',
                }}
                accessibilityLiveRegion="polite"
              >
                {clarification}
              </Text>
            ) : null}
          </>
        ) : null}

        {phase === 'paused' ? (
          <>
            <Title density={density}>Answers paused</Title>
            <Body density={density} style={{ marginBottom: compact ? 12 : 20 }}>
              Your answers are saved. Edit any detail below, or continue where you left off.
            </Body>
            <AnswerReviewPanel
              rows={understanding}
              onEdit={onEdit}
              onGenerate={onGenerate}
              onContinueEditing={onResume}
              unknownNotes={unknownNotes}
            />
          </>
        ) : null}

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

        {phase === 'payment_pending' ? (
          <View style={{ alignItems: 'center', paddingVertical: compact ? 16 : 24 }}>
            <ActivityIndicator color={pc.green} />
            <Title density={density}>We’re confirming your payment</Title>
            <Body density={density} style={{ textAlign: 'center' }}>
              This normally takes a moment. Your materials and answers are still saved.
            </Body>
          </View>
        ) : null}

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

        {phase === 'processing' || phase === 'cancelling' ? (
          <>
            <Title density={density}>Checking current prices</Title>
            <Body density={density} style={{ marginBottom: 10 }}>
              We are comparing recent sources that match your product, specification and location. You can stop if
              you need to correct an answer.
            </Body>
            {researchStage ? (
              <Text
                style={{ fontFamily: 'Poppins_500Medium', color: '#6ee7b7', fontSize: density.bodySize }}
                accessibilityLiveRegion="polite"
              >
                {RESEARCH_STAGES.find((s) => s.code === researchStage)?.label ?? researchStage}
              </Text>
            ) : null}
            {connectionLost ? (
              <Text
                style={{
                  marginTop: 10,
                  fontFamily: 'Poppins_400Regular',
                  fontSize: density.bodySize,
                  color: '#fde68a',
                }}
              >
                We lost connection briefly. Retrying… Your answers are safe.
              </Text>
            ) : null}
          </>
        ) : null}

        {phase === 'report_ready' && reportSummary ? (
          <ReportReadyPanel
            summary={reportSummary}
            onOpenReport={onOpenReport}
            onDownloadPdf={onDownloadPdf}
            onStartAnother={onStartAnother}
            compact={compact}
          />
        ) : null}

        {phase === 'insufficient_data' ? (
          <InsufficientDataPanel
            report={reportSummary}
            productName={understanding.find((r) => r.key === 'product')?.value ?? null}
            locationLabel={understanding.find((r) => r.key === '__location')?.value ?? null}
            onEdit={onResume}
            onOpenReport={onOpenReport}
            onStartAnother={onStartAnother}
            compact={compact}
          />
        ) : null}

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

      {/* Mobile: composer after copy so the field sits nearer the keyboard without page jump. */}
      {compact ? <View style={{ marginTop: showComposer ? 12 : 0 }}>{composer}</View> : null}
    </View>
  );
}
