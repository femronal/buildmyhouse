import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type View as ViewType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Brush, Check, Download, FileText, Hammer, HardHat, Image as ImageIcon, Pencil, Share2, Sofa, Trees, Wrench } from 'lucide-react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { trackWebEvent } from '@/lib/analytics';
import {
  ACCENT_GREEN,
  currencyByCode,
  milestoneCalculatorConfig as config,
  projectById,
  proofLabel,
  type CurrencyCode,
  type ProjectTypeId,
} from '@/lib/milestoneCalculator.config';
import { milestonePaymentScheduleBuilderPageContent as pageContent } from '@/lib/milestone-payment-schedule-builder-content';
import {
  addStage,
  buildDefaultStages,
  buildShareText,
  computePlan,
  draftFromLegacy,
  firstIncompleteStep,
  fixIt,
  formatMoney,
  nudge,
  parseDraft,
  planStatus,
  removeStage,
  shortAmount,
  splitEvenly,
  stageTip,
  stagesWereEdited,
  type SavedDraft,
  type StageDraft,
} from '@/lib/milestoneCalculator';
import { capturePlanImage, downloadPlanPdf, savePlanImage, sharePlanOnWhatsApp } from '@/lib/milestoneCalculator.export';

const logo = require('@/assets/images/logo.png');
const TOTAL_STEPS = 7;

function stageIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('foundation') || normalized.includes('site preparation')) return HardHat;
  if (normalized.includes('structural') || normalized.includes('framing') || normalized.includes('repairs') || normalized.includes('systems')) return Hammer;
  if (normalized.includes('wall') || normalized.includes('surface') || normalized.includes('strip-out') || normalized.includes('preparation')) return Wrench;
  if (normalized.includes('interior') || normalized.includes('finishes') || normalized.includes('styling') || normalized.includes('fittings')) return Sofa;
  if (normalized.includes('exterior') || normalized.includes('landscaping') || normalized.includes('outside')) return Trees;
  if (normalized.includes('planning') || normalized.includes('measurement') || normalized.includes('procurement') || normalized.includes('buying')) return FileText;
  return Brush;
}

function focusNode(node: unknown) {
  const element = node as { focus?: () => void } | null;
  element?.focus?.();
}

function lockToViewport(node: ReactNode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}

export default function MilestoneCalculator() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const headingRef = useRef<ViewType | null>(null);
  const statusRef = useRef<ViewType | null>(null);
  const shareRef = useRef<ViewType | null>(null);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [returnToBudget, setReturnToBudget] = useState(false);
  const [projectType, setProjectType] = useState<ProjectTypeId | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [budgetDigits, setBudgetDigits] = useState('');
  const [currencyAdjusted, setCurrencyAdjusted] = useState(false);
  const [contingency, setContingency] = useState(config.contingency.default);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherDigits, setOtherDigits] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [stages, setStages] = useState<StageDraft[]>([]);
  const [lastChanged, setLastChanged] = useState(0);
  const [renameIndex, setRenameIndex] = useState<number | null>(null);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [openProof, setOpenProof] = useState<number | null>(null);
  const [noteOpen, setNoteOpen] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<null | 'over' | ProjectTypeId>(null);
  const [coarse, setCoarse] = useState(false);
  const [typing, setTyping] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [busy, setBusy] = useState<null | 'pdf' | 'image' | 'whatsapp'>(null);
  const [exportError, setExportError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const viewed = useRef<number | null>(null);

  const budget = Number(budgetDigits || '0');
  const money = currency ? currencyByCode(currency) : config.currencies[0];
  const project = projectType ? projectById(projectType) : null;
  const status = planStatus(stages);
  const plan = useMemo(
    () => computePlan(budget, contingency, stages.map((stage) => stage.pct)),
    [budget, contingency, stages],
  );
  const summary =
    budget > 0 && stages.length
      ? `${config.copy.liveSummary(formatMoney(plan.forStages, money.symbol), stages.length, formatMoney(plan.keptAside, money.symbol))}${
          step === 5 ? ` · ${status.total}%` : ''
        }`
      : '';

  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return;
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
    };
  }, [active]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setHydrated(true);
      return;
    }
    setCoarse(window.matchMedia('(pointer: coarse)').matches);
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const params = new URLSearchParams(window.location.search);
    const urlStep = Number(params.get('step'));
    try {
      const saved = parseDraft(JSON.parse(window.localStorage.getItem(config.storageKey) || 'null'));
      const legacy = draftFromLegacy(JSON.parse(window.localStorage.getItem(config.legacyStorageKey) || 'null'));
      if (saved) {
        applyDraft(saved);
        setWelcome(true);
        if (urlStep >= 1 && urlStep <= 7) {
          setActive(true);
          setStep(urlStep);
          setWelcome(false);
        }
      } else if (legacy) {
        const type = legacy.projectType;
        setProjectType(type);
        setCurrency(legacy.currency);
        setBudgetDigits(legacy.budget ? String(legacy.budget) : '');
        setContingency(legacy.contingency);
        setStages(type ? buildDefaultStages(type) : []);
        setWelcome(Boolean(type || legacy.currency || legacy.budget));
        window.localStorage.removeItem(config.legacyStorageKey);
      }
    } catch {
      // Ignore unreadable drafts. Private mode can throw on later writes.
    }
    setHydrated(true);
    const onPop = () => {
      const next = Number(new URLSearchParams(window.location.search).get('step'));
      if (next >= 1 && next <= 7) {
        setActive(true);
        setStep(next);
        setEditMode(false);
      } else {
        setActive(false);
      }
    };
    window.addEventListener('popstate', onPop);
    const viewport = window.visualViewport;
    const onViewport = () => {
      if (!viewport) return;
      setKeyboardInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };
    viewport?.addEventListener('resize', onViewport);
    viewport?.addEventListener('scroll', onViewport);
    return () => {
      window.removeEventListener('popstate', onPop);
      viewport?.removeEventListener('resize', onViewport);
      viewport?.removeEventListener('scroll', onViewport);
    };
    // Hydrate once. Later saves must not reload this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || Platform.OS !== 'web') return;
    const handle = window.setTimeout(() => {
      try {
        if (!projectType && !currency && !budgetDigits && !welcome && !active) {
          window.localStorage.removeItem(config.storageKey);
          return;
        }
        const draft: SavedDraft = {
          version: 2,
          step: active ? step : 1,
          projectType,
          currency,
          budget,
          contingency,
          stages: projectType ? stages : [],
          updatedAt: Date.now(),
        };
        if (draft.stages.length >= 3 || draft.projectType || draft.budget) {
          window.localStorage.setItem(config.storageKey, JSON.stringify(draft));
        }
      } catch {
        // Private mode.
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [active, budget, budgetDigits, contingency, currency, hydrated, projectType, stages, step, welcome]);

  useEffect(() => {
    const handle = window.setTimeout(() => setAnnouncement(summary), 500);
    return () => window.clearTimeout(handle);
  }, [summary]);

  useEffect(() => {
    if (!active) return;
    const node = headingRef.current as unknown as HTMLElement | null;
    node?.focus?.();
    if (viewed.current !== step) {
      viewed.current = step;
      trackWebEvent('mps_calc_step_view', { step });
      if (step === 7 && projectType && currency) {
        trackWebEvent('mps_calc_result_view', {
          project_type: projectType,
          currency,
          stage_count: stages.length,
          contingency_pct: contingency,
        });
      }
    }
  }, [active, contingency, currency, projectType, stages.length, step]);

  function applyDraft(draft: SavedDraft) {
    setProjectType(draft.projectType);
    setCurrency(draft.currency);
    setBudgetDigits(draft.budget ? String(draft.budget) : '');
    setContingency(draft.contingency);
    setStages(draft.stages);
    setStep(draft.step);
  }

  function writeUrl(next: number, mode: 'push' | 'replace') {
    if (Platform.OS !== 'web') return;
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(next));
    const state = { mpsStep: next };
    if (mode === 'push') window.history.pushState(state, '', url);
    else window.history.replaceState(state, '', url);
  }

  function go(next: number, mode: 'push' | 'replace' = 'push') {
    if (next > step) trackWebEvent('mps_calc_step_complete', { step });
    setStep(next);
    setActive(true);
    writeUrl(next, mode);
  }

  function begin(fromSaved: boolean) {
    trackWebEvent('mps_calc_start');
    setWelcome(false);
    setActive(true);
    const next = fromSaved ? Math.min(7, Math.max(1, step || 1)) : 1;
    setStep(next);
    writeUrl(next, 'push');
  }

  function clearHold() {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  }

  function startOver() {
    trackWebEvent('mps_calc_start_over');
    setConfirm(null);
    setActive(false);
    setWelcome(false);
    setEditMode(false);
    setStep(1);
    setProjectType(null);
    setCurrency(null);
    setBudgetDigits('');
    setCurrencyAdjusted(false);
    setContingency(config.contingency.default);
    setStages([]);
    setOtherOpen(false);
    setBudgetError('');
    setExportError('');
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(config.storageKey);
        window.localStorage.removeItem(config.legacyStorageKey);
      } catch {
        // ignore
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('step');
      window.history.replaceState({}, '', url.pathname);
    }
  }

  function chooseProject(nextType: ProjectTypeId) {
    if (projectType && projectType !== nextType && stages.length && stagesWereEdited(projectType, stages)) {
      setConfirm(nextType);
      return;
    }
    commitProject(nextType, true);
  }

  function commitProject(nextType: ProjectTypeId, reset: boolean) {
    setProjectType(nextType);
    if (reset || stages.length === 0) {
      setStages(buildDefaultStages(nextType));
      setLastChanged(0);
    }
    setConfirm(null);
    const delay = reduceMotion ? 0 : 250;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      if (editMode) go(7, 'replace');
      else go(2);
    }, delay);
  }

  function chooseCurrency(code: CurrencyCode) {
    if (currency && currency !== code && budget > 0) setCurrencyAdjusted(true);
    setCurrency(code);
    const delay = reduceMotion ? 0 : 250;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      if (returnToBudget) {
        setReturnToBudget(false);
        go(3, 'replace');
        return;
      }
      if (editMode) go(7, 'replace');
      else go(3);
    }, delay);
  }

  function pushDigit(digit: string) {
    setBudgetError('');
    setBudgetDigits((current) => {
      const next = `${current}${digit}`.replace(/^0+(?=\d)/, '');
      return next.slice(0, config.budgetDigits);
    });
  }

  function chooseContingency(value: number) {
    setContingency(value);
    setOtherOpen(false);
    const delay = reduceMotion ? 0 : 400;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      if (editMode) go(7, 'replace');
      else go(5);
    }, delay);
  }

  function jumpFromPill() {
    const target = firstIncompleteStep({ projectType, currency, budget, stages });
    if (target === 7) {
      setEditMode(false);
      go(7);
      return;
    }
    go(target, 'replace');
  }

  function editStep(target: number) {
    setEditMode(true);
    go(target);
  }

  async function runExport(kind: 'pdf' | 'image' | 'whatsapp') {
    if (!project || !currency) return;
    setBusy(kind);
    setExportError('');
    try {
      const shareText = buildShareText({
        projectLabel: project.resultLabel,
        symbol: money.symbol,
        budget,
        contingencyPct: contingency,
        stages,
        url: config.toolUrl,
      });
      if (kind === 'pdf') {
        const renderedLogo = document.querySelector('#builder img') as HTMLImageElement | null;
        const resolved = Image.resolveAssetSource?.(logo);
        await downloadPlanPdf({
          projectLabel: project.resultLabel,
          projectType: project.id,
          currencyCode: currency,
          symbol: money.symbol,
          budget,
          contingencyPct: contingency,
          stages,
          reminders: pageContent.smartWarnings.items,
          logoUri: renderedLogo?.currentSrc || resolved?.uri,
          shareText,
        });
        trackWebEvent('mps_calc_download_pdf');
      } else if (kind === 'image') {
        const node = shareRef.current as unknown as HTMLElement | null;
        if (!node) throw new Error('missing card');
        await savePlanImage(node);
        trackWebEvent('mps_calc_save_image');
      } else {
        const node = shareRef.current as unknown as HTMLElement | null;
        let image: File | null = null;
        if (node) {
          try {
            const blob = await capturePlanImage(node, 1);
            image = new File([blob], 'buildmyhouse-payment-plan.png', { type: 'image/png' });
          } catch {
            image = null;
          }
        }
        const method = await sharePlanOnWhatsApp(shareText, image);
        trackWebEvent('mps_calc_share_whatsapp', { method });
      }
    } catch {
      setExportError(config.copy.exportFailed);
    } finally {
      setBusy(null);
    }
  }

  const formattedBudget = formatMoney(budget, money.symbol);
  const screenStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1100,
    backgroundColor: '#fff',
    overflow: 'hidden' as const,
  };

  if (!active) {
    return (
      <View nativeID="builder" style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <Text className="text-black text-[22px] leading-7 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          {welcome ? config.copy.welcomeTitle : config.copy.startTitle}
        </Text>
        {welcome ? null : (
          <Text className="text-gray-500 text-base leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {config.copy.startSub}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => begin(welcome)}
          className="bmh-mps-focus rounded-full bg-black px-5 py-3 min-h-12 items-center justify-center"
        >
          <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {welcome ? config.copy.continueButton : config.copy.startButton}
          </Text>
        </Pressable>
        {welcome ? (
          <Pressable accessibilityRole="button" onPress={() => setConfirm('over')} className="bmh-mps-focus mt-3 min-h-12 items-center justify-center">
            <Text className="text-black text-base" style={{ fontFamily: 'Poppins_500Medium' }}>
              {config.copy.startOverButton}
            </Text>
          </Pressable>
        ) : null}
        {confirm === 'over' ? <Confirm onYes={startOver} onNo={() => setConfirm(null)} /> : null}
      </View>
    );
  }

  const heading =
    step === 1
      ? config.copy.projectHeading
      : step === 2
        ? config.copy.currencyHeading
        : step === 3
          ? config.copy.budgetHeading
          : step === 4
            ? config.copy.contingencyHeading
            : step === 5
              ? config.copy.splitHeading
              : step === 6
                ? config.copy.proofHeading
                : config.copy.planTitle;
  const helper =
    step === 1
      ? config.copy.projectHelper
      : step === 2
        ? config.copy.currencyHelper
        : step === 3
          ? currencyAdjusted
            ? config.copy.budgetNotConverted
            : config.copy.budgetHelper
          : step === 4
            ? config.copy.contingencyHelper
            : step === 5
              ? config.copy.splitHelper
              : step === 6
                ? config.copy.proofHelper
                : `${project?.resultLabel ?? ''} · ${stages.length} stages`;

  return lockToViewport(
    <View nativeID="builder" className="bmh-mps-screen bg-white" style={screenStyle}>
      <View
        className="flex-1 bg-white"
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: isPhone ? undefined : 480,
          alignSelf: 'center',
          overflow: 'hidden',
        }}
      >
        <View className="flex-row items-center justify-between px-4 pt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={config.copy.back}
            onPress={() => {
              if (step === 1) setActive(false);
              else if (Platform.OS === 'web' && window.history.length > 1) window.history.back();
              else go(step - 1, 'replace');
            }}
            className="bmh-mps-focus min-h-12 min-w-12 justify-center"
          >
            <Text className="text-black text-base" style={{ fontFamily: 'Poppins_500Medium' }}>
              {step === 1 ? '' : `‹ ${config.copy.back}`}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirm('over')} className="bmh-mps-focus min-h-12 justify-center">
            <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
              {config.copy.startOverButton}
            </Text>
          </Pressable>
        </View>
        <View className="px-4 pb-2">
          <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <View style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: 4, backgroundColor: ACCENT_GREEN }} />
          </View>
          <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            {step === 7 ? config.copy.resultStep : config.copy.stepOf(step, TOTAL_STEPS)}
          </Text>
        </View>
        <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <View
            ref={headingRef}
            accessibilityRole="header"
            {...(Platform.OS === 'web' ? ({ tabIndex: -1 } as object) : null)}
          >
            <Text className="text-black text-[28px] leading-8" style={{ fontFamily: 'Poppins_700Bold' }}>
              {heading}
            </Text>
          </View>
          {helper ? (
            <Text className="text-gray-500 text-base leading-6 mt-2 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {helper}
            </Text>
          ) : null}

          {step === 1 ? (
            <View accessibilityRole="radiogroup">
              {config.projectTypes.map((item) => (
                <ChoiceCard
                  key={item.id}
                  title={item.title}
                  helper={item.helper}
                  selected={projectType === item.id}
                  Icon={item.id === 'new-build' ? HardHat : item.id === 'renovation' ? Hammer : Sofa}
                  onPress={() => chooseProject(item.id)}
                />
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            <View accessibilityRole="radiogroup">
              {config.currencies.map((item) => (
                <ChoiceCard
                  key={item.code}
                  title={item.label}
                  helper={item.symbol}
                  selected={currency === item.code}
                  onPress={() => chooseCurrency(item.code)}
                />
              ))}
            </View>
          ) : null}

          {step === 3 ? (
            <View>
              {coarse ? (
                <Text className="text-black text-5xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {budget ? formattedBudget : money.symbol}
                  <Text className="text-black">|</Text>
                </Text>
              ) : (
                <TextInput
                  value={budget ? formattedBudget : ''}
                  onChangeText={(value) => {
                    setBudgetError('');
                    setBudgetDigits(value.replace(/\D/g, '').slice(0, config.budgetDigits));
                  }}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  placeholder={money.symbol}
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                  className="text-black text-5xl"
                  style={{ fontFamily: 'Poppins_700Bold', fontSize: 40 }}
                />
              )}
              <View className="h-px bg-black mt-2 mb-4" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={money.label}
                onPress={() => {
                  setReturnToBudget(true);
                  go(2);
                }}
                className="bmh-mps-focus self-start rounded-full border border-gray-300 px-3 py-2 min-h-12 justify-center"
              >
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {money.code} ▾
                </Text>
              </Pressable>
              <View className="flex-row flex-wrap mt-4">
                {money.quickAmounts.map((amount) => (
                  <Pressable
                    key={amount}
                    accessibilityRole="button"
                    onPress={() => {
                      setBudgetError('');
                      setBudgetDigits(String(amount));
                    }}
                    className="bmh-mps-focus rounded-full border border-gray-300 px-3 py-2 mr-2 mb-2 min-h-12 justify-center"
                  >
                    <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {shortAmount(amount, money.symbol)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {budgetError ? (
                <Text className="text-red-700 text-base mt-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {budgetError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {step === 4 ? (
            <View>
              <Text className="text-black text-3xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {contingency === 0
                  ? config.copy.nothingAsideLine(formatMoney(budget, money.symbol))
                  : config.copy.keptAsideLine(formatMoney(plan.keptAside, money.symbol), formatMoney(plan.forStages, money.symbol))}
              </Text>
              <View className="flex-row flex-wrap mt-3">
                {config.contingency.options.map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: contingency === value && !otherOpen }}
                    onPress={() => chooseContingency(value)}
                    className="bmh-mps-focus rounded-2xl border px-4 py-3 mr-2 mb-2 min-h-12 min-w-16 items-center"
                    style={{ borderColor: contingency === value && !otherOpen ? '#000' : '#D1D5DB', backgroundColor: contingency === value && !otherOpen ? '#000' : '#fff' }}
                  >
                    <Text className={contingency === value && !otherOpen ? 'text-white' : 'text-black'} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {value === 0 ? config.copy.none : `${value}%`}
                    </Text>
                    {value === config.contingency.default ? (
                      <Text className={contingency === value && !otherOpen ? 'text-white' : 'text-gray-500'} style={{ fontFamily: 'Poppins_400Regular', fontSize: 12 }}>
                        {config.copy.suggested}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOtherOpen(true)}
                  className="bmh-mps-focus rounded-2xl border px-4 py-3 mb-2 min-h-12"
                  style={{ borderColor: otherOpen ? '#000' : '#D1D5DB', backgroundColor: otherOpen ? '#000' : '#fff' }}
                >
                  <Text className={otherOpen ? 'text-white' : 'text-black'} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {config.copy.other}
                  </Text>
                </Pressable>
              </View>
              {contingency === 0 ? (
                <Text className="text-gray-500 text-base mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {config.copy.noneNote}
                </Text>
              ) : null}
            </View>
          ) : null}

          {step === 5 && project ? (
            <View>
              <View style={cardShadowStyle} className="border border-gray-200 rounded-2xl p-4 mb-4">
                <Text className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {config.copy.recommended(project.resultLabel, stages.length, formatMoney(plan.forStages, money.symbol))}
                </Text>
                <View className="flex-row h-3 rounded-full overflow-hidden bg-gray-100">
                  {stages.map((stage, index) => (
                    <View key={stage.id} style={{ flex: Math.max(stage.pct, 1), backgroundColor: index % 2 === 0 ? '#111' : '#9CA3AF' }} />
                  ))}
                </View>
              </View>
              <View
                ref={statusRef}
                accessibilityLiveRegion="polite"
                className="rounded-xl px-3 py-3 mb-3"
                style={{ backgroundColor: status.ok ? '#F0FDF4' : '#000' }}
              >
                <Text className={status.ok ? 'text-black' : 'text-white'} style={{ fontFamily: 'Poppins_500Medium', color: status.ok ? ACCENT_GREEN : '#fff' }}>
                  {status.ok
                    ? config.copy.addsUp
                    : status.total > 100
                      ? config.copy.overWarning(status.total, status.total - 100)
                      : config.copy.underWarning(status.total, 100 - status.total)}
                </Text>
                {status.ok ? null : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      trackWebEvent('mps_calc_split_fix_it');
                      setStages(fixIt(stages, lastChanged));
                    }}
                    className="bmh-mps-focus mt-2 self-start min-h-12 justify-center"
                  >
                    <Text className="text-white underline" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {config.copy.fixIt}
                    </Text>
                  </Pressable>
                )}
              </View>
              <View className="flex-row flex-wrap mb-3">
                <Pressable accessibilityRole="button" onPress={() => setStages(splitEvenly(stages))} className="bmh-mps-focus rounded-full bg-black px-3 py-2 mr-2 min-h-12 justify-center">
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.splitEvenly}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (!projectType) return;
                    setStages(buildDefaultStages(projectType));
                    setLastChanged(0);
                  }}
                  className="bmh-mps-focus rounded-full border border-gray-300 px-3 py-2 min-h-12 justify-center"
                >
                  <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.resetSuggested}</Text>
                </Pressable>
              </View>
              {stages.map((stage, index) => {
                const Icon = stageIcon(`${stage.key} ${stage.name}`);
                return (
                  <View key={stage.id} className="border border-gray-200 rounded-2xl p-3 mb-3">
                    <View className="flex-row items-center mb-2">
                      <Icon size={18} color="#111" />
                      {renameIndex === index ? (
                        <TextInput
                          value={stage.name}
                          autoFocus
                          maxLength={config.nameMax}
                          onChangeText={(value) =>
                            setStages((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, name: value } : row)))
                          }
                          onBlur={() => {
                            setTyping(false);
                            setStages((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, name: row.name.trim() || projectById(projectType || 'new-build').stages[index]?.name || config.copy.newStageName } : row,
                              ),
                            );
                            setRenameIndex(null);
                          }}
                          onFocus={() => setTyping(true)}
                          className="flex-1 ml-2 text-black text-base"
                          style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}
                        />
                      ) : (
                        <Text className="flex-1 ml-2 text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {stage.name}
                        </Text>
                      )}
                      <Pressable accessibilityRole="button" accessibilityLabel={config.copy.renameStage} onPress={() => setRenameIndex(index)} className="bmh-mps-focus min-h-12 min-w-12 items-center justify-center">
                        <Pencil size={16} color="#111" />
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={config.copy.more} onPress={() => setMenuIndex(menuIndex === index ? null : index)} className="bmh-mps-focus min-h-12 min-w-12 items-center justify-center">
                        <Text style={{ fontFamily: 'Poppins_700Bold' }}>⋯</Text>
                      </Pressable>
                    </View>
                    {menuIndex === index && stages.length > config.stageCount.min ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setStages(removeStage(stages, index));
                          setMenuIndex(null);
                        }}
                        className="bmh-mps-focus mb-2 self-end min-h-12 justify-center"
                      >
                        <Text className="text-red-700" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.remove}</Text>
                      </Pressable>
                    ) : null}
                    <View className="flex-row items-center">
                      <Stepper
                        label={config.copy.decrease(stage.name)}
                        text="–"
                        disabled={stage.pct <= config.stagePercent.min}
                        onPress={() => {
                          setLastChanged(index);
                          setStages((current) => nudge(current, index, -1));
                        }}
                        onHoldStart={() => {
                          clearHold();
                          holdRef.current = setInterval(() => {
                            setLastChanged(index);
                            setStages((current) => nudge(current, index, -1));
                          }, 90);
                        }}
                        onHoldEnd={clearHold}
                      />
                      <View className="flex-1 items-center">
                        <Text className="text-black text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>{stage.pct}%</Text>
                        <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {formatMoney(plan.amounts[index] ?? 0, money.symbol)}
                        </Text>
                      </View>
                      <Stepper
                        label={config.copy.increase(stage.name)}
                        text="+"
                        disabled={stage.pct >= config.stagePercent.max}
                        onPress={() => {
                          setLastChanged(index);
                          setStages((current) => nudge(current, index, 1));
                        }}
                        onHoldStart={() => {
                          clearHold();
                          holdRef.current = setInterval(() => {
                            setLastChanged(index);
                            setStages((current) => nudge(current, index, 1));
                          }, 90);
                        }}
                        onHoldEnd={clearHold}
                      />
                    </View>
                  </View>
                );
              })}
              {stages.length < config.stageCount.max ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStages(addStage(stages, config.copy.newStageName, [...config.addedStageProof]))}
                  className="bmh-mps-focus min-h-12 justify-center"
                >
                  <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.addStage}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {step === 6 ? (
            <View>
              {stages.map((stage, index) => (
                <View key={stage.id} className="border-b border-gray-200 py-3">
                  <View className="flex-row items-start">
                    <Pressable accessibilityRole="button" onPress={() => setOpenProof(openProof === index ? null : index)} className="flex-1 bmh-mps-focus">
                      <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {index + 1} · {stage.name}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {stage.proof.map((item) => proofLabel(item)).join(' · ') || config.copy.proofTip}
                      </Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={config.copy.edit} onPress={() => setOpenProof(openProof === index ? null : index)} className="bmh-mps-focus min-h-12 justify-center pl-3">
                      <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.edit}</Text>
                    </Pressable>
                  </View>
                  {openProof === index ? (
                    <View className="mt-3">
                      <View className="flex-row flex-wrap">
                        {config.proofOptions.map((option) => {
                          const on = stage.proof.includes(option.key);
                          return (
                            <Pressable
                              key={option.key}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: on }}
                              onPress={() =>
                                setStages((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? { ...row, proof: on ? row.proof.filter((item) => item !== option.key) : [...row.proof, option.key] }
                                      : row,
                                  ),
                                )
                              }
                              className="bmh-mps-focus rounded-full px-3 py-2 mr-2 mb-2 min-h-12 justify-center border"
                              style={{ backgroundColor: on ? '#000' : '#fff', borderColor: on ? '#000' : '#D1D5DB' }}
                            >
                              <Text className={on ? 'text-white' : 'text-black'} style={{ fontFamily: 'Poppins_500Medium' }}>
                                {on ? '✓ ' : ''}
                                {option.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {stage.proof.length === 0 ? (
                        <Text className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.proofTip}</Text>
                      ) : null}
                      {noteOpen === index ? (
                        <TextInput
                          value={stage.note}
                          multiline
                          maxLength={config.noteMax}
                          placeholder={config.copy.notePlaceholder}
                          onChangeText={(value) =>
                            setStages((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, note: value } : row)))
                          }
                          onFocus={() => setTyping(true)}
                          onBlur={() => setTyping(false)}
                          accessibilityLabel={config.copy.noteLabel}
                          className="border border-gray-300 rounded-xl px-3 py-3 text-black"
                          style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, minHeight: 88 }}
                        />
                      ) : (
                        <Pressable accessibilityRole="button" onPress={() => setNoteOpen(index)} className="bmh-mps-focus min-h-12 justify-center">
                          <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.addNote}</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {step === 7 && project && currency ? (
            <View>
              <View className="bg-black rounded-2xl p-4 mb-4">
                <Image source={logo} accessibilityLabel="BuildMyHouse" style={{ width: 36, height: 36, marginBottom: 8 }} />
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.planTitle}</Text>
                <Text className="text-white text-4xl mt-2" style={{ fontFamily: 'Poppins_700Bold' }}>{formattedBudget}</Text>
                <Text className="text-white/80 text-sm mt-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {config.copy.keptAsideLabel(formatMoney(plan.keptAside, money.symbol), contingency)}
                </Text>
                <Text className="text-white/80 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {config.copy.forStagesLabel(formatMoney(plan.forStages, money.symbol))}
                </Text>
                <Text className="text-white/70 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {project.resultLabel} · {stages.length} stages
                </Text>
              </View>
              <SummaryRow label={config.copy.projectRow} value={project.resultLabel} onEdit={() => editStep(1)} />
              <SummaryRow label={config.copy.currencyRow} value={money.label} onEdit={() => editStep(2)} />
              <SummaryRow label={config.copy.budgetRow} value={formattedBudget} onEdit={() => editStep(3)} />
              <SummaryRow label={config.copy.keptRow} value={`${contingency}%`} onEdit={() => editStep(4)} />
              <SummaryRow label={config.copy.stagesRow} value={`${stages.length} · ${status.total}%`} onEdit={() => editStep(5)} />
              <SummaryRow label={config.copy.proofRow} value={config.copy.edit} onEdit={() => editStep(6)} />
              <View className="mt-4 pl-4">
                {stages.map((stage, index) => (
                  <View key={stage.id} className="flex-row mb-4">
                    <View className="items-center mr-3">
                      <View className="w-6 h-6 rounded-full bg-black items-center justify-center">
                        <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{index + 1}</Text>
                      </View>
                      <View className="w-px flex-1 bg-gray-300" />
                    </View>
                    <View className="flex-1 pb-2">
                      <View className="flex-row justify-between">
                        <Text className="text-black flex-1 pr-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {index + 1} · {stage.name}
                        </Text>
                        <Text className="text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                          {formatMoney(plan.amounts[index] ?? 0, money.symbol)}
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{stage.pct}%</Text>
                      <Text className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.seeBefore}</Text>
                      <View className="flex-row flex-wrap mt-1">
                        {stage.proof.map((item) => (
                          <Text key={item} className="text-gray-500 text-xs border border-gray-200 rounded-full px-2 py-1 mr-1 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                            {proofLabel(item)}
                          </Text>
                        ))}
                      </View>
                      {stage.note ? (
                        <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular', fontStyle: 'italic' }}>{stage.note}</Text>
                      ) : null}
                      <Text className="text-gray-700 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {config.copy.paidSoFar(formatMoney(plan.paidSoFar[index] ?? 0, money.symbol))}
                      </Text>
                      <Text className="text-gray-700 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {config.copy.stillInControl(formatMoney(plan.stillInControl[index] ?? 0, money.symbol))}
                      </Text>
                      <StageTip name={stage.name} projectId={project.id} />
                    </View>
                  </View>
                ))}
                {contingency > 0 ? (
                  <View className="flex-row">
                    <View className="w-3 h-3 rounded-full border border-black mr-3 mt-1" />
                    <View className="flex-1">
                      <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {config.copy.keptAsideStop(formatMoney(plan.keptAside, money.symbol))}
                      </Text>
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.keptAsideNote}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <Reminders />
              <Text className="text-gray-500 text-xs mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.disclaimer}</Text>
              {exportError ? (
                <Text className="text-red-700 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>{exportError}</Text>
              ) : null}
              <View className="mt-5">
                <View className="flex-row justify-between mb-3">
                  <ActionButton label={busy === 'pdf' ? config.copy.preparing : config.copy.downloadPdf} Icon={Download} disabled={busy !== null} onPress={() => runExport('pdf')} />
                  <ActionButton label={busy === 'image' ? config.copy.preparing : config.copy.saveImage} Icon={ImageIcon} disabled={busy !== null} onPress={() => runExport('image')} />
                  <ActionButton label={busy === 'whatsapp' ? config.copy.preparing : config.copy.shareWhatsapp} Icon={Share2} disabled={busy !== null} onPress={() => runExport('whatsapp')} />
                </View>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    trackWebEvent('mps_calc_start_tracked_click');
                    router.push('/start' as never);
                  }}
                  className="bmh-mps-focus rounded-full min-h-12 items-center justify-center"
                  style={{ backgroundColor: ACCENT_GREEN }}
                >
                  <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.startTracked}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setConfirm('over')} className="bmh-mps-focus min-h-12 items-center justify-center mt-1">
                  <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.startOverButton}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {typing && keyboardInset > 80 ? null : (
          <View className="px-4 pt-2 bg-white" style={{ paddingBottom: 16 + keyboardInset }}>
            <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
              {announcement}
            </Text>
            {step >= 3 && summary ? (
              <Pressable accessibilityRole="button" onPress={jumpFromPill} className="bmh-mps-focus rounded-full bg-black px-4 py-3 mb-2">
                <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_500Medium', color: step === 5 && !status.ok ? '#FDE68A' : '#fff' }}>
                  {summary}
                </Text>
              </Pressable>
            ) : null}
            {step === 3 || (step === 4 && otherOpen) || step === 5 || step === 6 ? (
                <View>
                  {step === 6 ? (
                    <Pressable accessibilityRole="button" onPress={() => go(7)} className="bmh-mps-focus items-center min-h-12 justify-center mb-1">
                      <Text className="text-gray-600" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.skipProof}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (step === 3) {
                        if (budget < money.minBudget) {
                          setBudgetError(config.copy.minBudgetError(formatMoney(money.minBudget, money.symbol)));
                          return;
                        }
                        if (editMode) go(7, 'replace');
                        else go(4);
                        return;
                      }
                      if (step === 4 && otherOpen) {
                        const value = Math.min(config.contingency.otherMax, Math.max(0, Number(otherDigits || '0')));
                        setContingency(value);
                        if (editMode) go(7, 'replace');
                        else go(5);
                        return;
                      }
                      if (step === 5) {
                        if (!status.ok) {
                          const node = statusRef.current as unknown as HTMLElement | null;
                          node?.scrollIntoView?.({ block: 'center' });
                          focusNode(node);
                          return;
                        }
                        if (editMode) go(7, 'replace');
                        else go(6);
                        return;
                      }
                      if (step === 6) go(7);
                    }}
                    className="bmh-mps-focus rounded-full min-h-14 items-center justify-center"
                    style={{ backgroundColor: step === 3 && budget < money.minBudget ? '#E5E7EB' : step === 5 && !status.ok ? '#E5E7EB' : '#000' }}
                  >
                    <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold', color: (step === 3 && budget < money.minBudget) || (step === 5 && !status.ok) ? '#9CA3AF' : '#fff' }}>
                      {editMode ? config.copy.backToPlan : step === 6 ? config.copy.seePlan : config.copy.next}
                    </Text>
                  </Pressable>
                </View>
            ) : null}
            {coarse && step === 3 ? <Keypad onDigit={pushDigit} onDelete={() => setBudgetDigits((current) => current.slice(0, -1))} /> : null}
            {step === 4 && otherOpen ? (
              <Keypad
                mode="percent"
                onDigit={(digit) => setOtherDigits((current) => `${current}${digit}`.replace(/\D/g, '').slice(0, 2))}
                onDelete={() => setOtherDigits((current) => current.slice(0, -1))}
                extra={otherDigits ? `${Math.min(config.contingency.otherMax, Number(otherDigits))}%` : '0%'}
              />
            ) : null}
          </View>
        )}
        {confirm === 'over' ? <Confirm onYes={startOver} onNo={() => setConfirm(null)} /> : null}
        {confirm && confirm !== 'over' ? (
          <View className="absolute inset-0 bg-black/40 items-center justify-center px-6">
            <View className="bg-white rounded-2xl p-4 w-full">
              <Text className="text-black text-base mb-4" style={{ fontFamily: 'Poppins_500Medium' }}>
                {config.copy.resetStagesTitle(projectById(confirm).resultLabel)}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => commitProject(confirm, true)} className="bmh-mps-focus bg-black rounded-full min-h-12 items-center justify-center mb-2">
                <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.resetStagesYes}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => commitProject(confirm, false)} className="bmh-mps-focus min-h-12 items-center justify-center">
                <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.keepStages}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <View pointerEvents="none" style={{ position: 'fixed', left: 0, top: 0, width: 1080, height: 0, overflow: 'hidden' }} accessibilityElementsHidden>
        <View ref={shareRef} collapsable={false} style={{ width: 1080, backgroundColor: '#fff', padding: 48 }}>
          <Image source={logo} style={{ width: 64, height: 64 }} />
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, marginTop: 8, color: '#111' }}>BuildMyHouse</Text>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 42, marginTop: 16, color: '#111' }}>{config.copy.planTitle}</Text>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 56, color: '#111' }}>{formattedBudget}</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 22, marginTop: 8, color: '#111' }}>
            {project?.resultLabel} · {contingency}% kept aside ({formatMoney(plan.keptAside, money.symbol)})
          </Text>
          {stages.map((stage, index) => (
            <Text key={stage.id} style={{ fontFamily: 'Poppins_500Medium', fontSize: 22, marginTop: 10, color: '#111' }}>
              {index + 1}. {stage.name} · {formatMoney(plan.amounts[index] ?? 0, money.symbol)} · {stage.pct}% · {stage.proof.map((item) => proofLabel(item)).join(', ')}
            </Text>
          ))}
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 18, marginTop: 24, color: '#111' }}>{config.copy.disclaimer}</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 18, color: '#111' }}>{config.toolUrl}</Text>
        </View>
        </View>
      </View>
    </View>
  );
}

function ChoiceCard({
  title,
  helper,
  selected,
  onPress,
  Icon,
}: {
  title: string;
  helper: string;
  selected: boolean;
  onPress: () => void;
  Icon?: typeof HardHat;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="bmh-mps-focus flex-row items-center border rounded-2xl px-4 py-4 mb-3 min-h-12"
      style={{ borderColor: selected ? '#000' : '#E5E7EB', backgroundColor: selected ? '#F9FAFB' : '#fff' }}
    >
      {Icon ? <Icon size={22} color="#111" style={{ marginRight: 12 }} /> : null}
      <View className="flex-1">
        <Text className="text-black text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{title}</Text>
        <Text className="text-gray-500 text-base" style={{ fontFamily: 'Poppins_400Regular' }}>{helper}</Text>
      </View>
      {selected ? <Check size={18} color="#111" /> : <View className="w-5 h-5 rounded-full border border-gray-300" />}
    </Pressable>
  );
}

function Stepper({
  label,
  text,
  disabled,
  onPress,
  onHoldStart,
  onHoldEnd,
}: {
  label: string;
  text: string;
  disabled: boolean;
  onPress: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onHoldStart}
      onPressOut={onHoldEnd}
      className="bmh-mps-focus w-12 h-12 rounded-full border border-gray-300 items-center justify-center"
      style={{ opacity: disabled ? 0.35 : 1 }}
    >
      <Text className="text-black text-2xl" style={{ fontFamily: 'Poppins_500Medium' }}>{text}</Text>
    </Pressable>
  );
}

function Keypad({
  onDigit,
  onDelete,
  extra,
  mode = 'amount',
}: {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  extra?: string;
  mode?: 'amount' | 'percent';
}) {
  const keys = mode === 'percent' ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  return (
    <View className="mt-3">
      {extra ? (
        <Text className="text-center text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>{extra}</Text>
      ) : null}
      <View className="flex-row flex-wrap">
        {keys.map((key) =>
          key ? (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === '⌫' ? config.copy.keypadBackspace : key}
              onPress={() => (key === '⌫' ? onDelete() : onDigit(key))}
              className="bmh-mps-focus items-center justify-center"
              style={{ width: '33.33%', minHeight: 56 }}
            >
              <Text className="text-black text-2xl" style={{ fontFamily: 'Poppins_500Medium' }}>{key}</Text>
            </Pressable>
          ) : (
            <View key="blank" style={{ width: '33.33%', minHeight: 56 }} />
          ),
        )}
      </View>
    </View>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-200">
      <View className="flex-1 pr-3">
        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{label}</Text>
        <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{value}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${config.copy.edit} ${label}`} onPress={onEdit} className="bmh-mps-focus min-h-12 justify-center">
        <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.edit}</Text>
      </Pressable>
    </View>
  );
}

function ActionButton({
  label,
  Icon,
  onPress,
  disabled,
}: {
  label: string;
  Icon: typeof Download;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} className="bmh-mps-focus items-center flex-1 min-h-16">
      <Icon size={22} color="#111" />
      <Text className="text-black text-xs text-center mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>{label}</Text>
    </Pressable>
  );
}

function StageTip({ name, projectId }: { name: string; projectId: ProjectTypeId }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="mt-1">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} className="bmh-mps-focus min-h-12 justify-center">
        <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.whyThisMatters}</Text>
      </Pressable>
      {open ? (
        <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{stageTip(name, projectId)}</Text>
      ) : null}
    </View>
  );
}

function Reminders() {
  const [open, setOpen] = useState(false);
  return (
    <View className="mt-4">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} className="bmh-mps-focus min-h-12 justify-center">
        <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.readReminders}</Text>
      </Pressable>
      {open
        ? pageContent.smartWarnings.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))
        : null}
    </View>
  );
}

function Confirm({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <View className="mt-4 border border-gray-200 rounded-2xl p-3">
      <Text className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.startOverConfirm}</Text>
      <Pressable accessibilityRole="button" onPress={onYes} className="bmh-mps-focus bg-black rounded-full min-h-12 items-center justify-center mb-2">
        <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.startOverYes}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onNo} className="bmh-mps-focus min-h-12 items-center justify-center">
        <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.cancel}</Text>
      </Pressable>
    </View>
  );
}
