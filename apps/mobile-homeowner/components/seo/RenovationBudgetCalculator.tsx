import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions, type View as ViewType } from 'react-native';
import { useRouter } from 'expo-router';
import { Bath, BedDouble, Brush, Check, DoorOpen, Download, Droplets, Hammer, HardHat, House, Image as ImageIcon, Share2, Sofa, Trees, Zap } from 'lucide-react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { trackWebEvent } from '@/lib/analytics';
import { renovationBudgetPlannerPageContent as pageContent } from '@/lib/renovation-budget-planner-content';
import {
  ACCENT_GREEN,
  renovationBudgetConfig as config,
  type FinishId,
  type LocationId,
  type PropertyTypeId,
  type SizeId,
  type SpaceId,
  type WorkTypeId,
} from '@/lib/renovationBudget.config';
import {
  buildShareText,
  computeBudget,
  draftFromLegacy,
  firstIncompleteStep,
  formatNaira,
  highCostAreas,
  parseDraft,
  type SavedDraft,
  type SpaceChoice,
} from '@/lib/renovationBudget';
import { captureEstimateImage, downloadEstimatePdf, saveEstimateImage, shareEstimateOnWhatsApp } from '@/lib/renovationBudget.export';

const logo = require('@/assets/images/logo.png');
const TOTAL_STEPS = 8;

function lockToViewport(node: ReactNode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}

function focusNode(node: unknown) {
  const element = node as { focus?: () => void } | null;
  element?.focus?.();
}

function spaceIcon(space: SpaceId) {
  if (space === 'Living room') return Sofa;
  if (space === 'Kitchen') return Hammer;
  if (space === 'Bathrooms') return Bath;
  if (space === 'Bedrooms') return BedDouble;
  if (space === 'Roofing/Ceiling') return House;
  if (space === 'Electrical') return Zap;
  if (space === 'Plumbing') return Droplets;
  if (space === 'Windows/Doors') return DoorOpen;
  if (space === 'Exterior') return Brush;
  return Trees;
}

export default function RenovationBudgetCalculator() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const headingRef = useRef<ViewType | null>(null);
  const shareRef = useRef<ViewType | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [propertyType, setPropertyType] = useState<PropertyTypeId | null>(null);
  const [location, setLocation] = useState<LocationId | null>(null);
  const [sizeBand, setSizeBand] = useState<SizeId | null>(null);
  const [finishLevel, setFinishLevel] = useState<FinishId | null>(null);
  const [spaces, setSpaces] = useState<SpaceChoice[]>([]);
  const [contingency, setContingency] = useState(config.contingency.default);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherDigits, setOtherDigits] = useState('');
  const [spacesError, setSpacesError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [busy, setBusy] = useState<null | 'pdf' | 'image' | 'whatsapp'>(null);
  const [exportError, setExportError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [remindersOpen, setRemindersOpen] = useState(false);
  const viewed = useRef<number | null>(null);

  const ready = Boolean(location && sizeBand && finishLevel && spaces.length);
  const result = useMemo(
    () => (ready ? computeBudget(location!, sizeBand!, finishLevel!, contingency, spaces) : null),
    [contingency, finishLevel, location, ready, sizeBand, spaces],
  );
  const costly = result ? highCostAreas(result.rows) : [];
  const summary = result ? config.copy.liveSummary(formatNaira(result.total), formatNaira(result.contingencyAmount)) : '';

  function applyDraft(draft: SavedDraft) {
    setPropertyType(draft.propertyType);
    setLocation(draft.location);
    setSizeBand(draft.sizeBand);
    setFinishLevel(draft.finishLevel);
    setContingency(draft.contingency);
    setSpaces(draft.spaces);
    setStep(draft.step);
  }

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
    const urlStep = Number(new URLSearchParams(window.location.search).get('step'));
    try {
      const saved = parseDraft(JSON.parse(window.localStorage.getItem(config.storageKey) || 'null'));
      const legacy = draftFromLegacy(JSON.parse(window.localStorage.getItem(config.legacyStorageKey) || 'null'));
      if (saved) {
        applyDraft(saved);
        setWelcome(true);
        if (urlStep >= 1 && urlStep <= TOTAL_STEPS) {
          setActive(true);
          setStep(urlStep);
          setWelcome(false);
        }
      } else if (legacy) {
        applyDraft(legacy);
        setWelcome(true);
        window.localStorage.removeItem(config.legacyStorageKey);
      }
    } catch {
      // Private mode can throw. The start card still works.
    }
    setHydrated(true);
    const onPop = () => {
      const next = Number(new URLSearchParams(window.location.search).get('step'));
      if (next >= 1 && next <= TOTAL_STEPS) {
        setActive(true);
        setStep(next);
        setEditMode(false);
      } else setActive(false);
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
  }, []);

  useEffect(() => {
    if (!hydrated || Platform.OS !== 'web') return;
    const handle = window.setTimeout(() => {
      try {
        if (!propertyType && !location && !sizeBand && !finishLevel && !spaces.length && !welcome && !active) return;
        const draft: SavedDraft = {
          version: 2,
          step: active ? step : 1,
          propertyType,
          location,
          sizeBand,
          finishLevel,
          contingency,
          spaces,
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(config.storageKey, JSON.stringify(draft));
      } catch {
        // Ignore storage failures.
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [active, contingency, finishLevel, hydrated, location, propertyType, sizeBand, spaces, step, welcome]);

  useEffect(() => {
    if (!active) return;
    const node = headingRef.current as unknown as HTMLElement | null;
    node?.focus?.();
    if (viewed.current !== step) {
      viewed.current = step;
      trackWebEvent('rbp_calc_step_view', { step });
      if (step === 8 && propertyType && location && sizeBand && finishLevel) {
        trackWebEvent('rbp_calc_result_view', {
          property_type: propertyType,
          location,
          size_band: sizeBand,
          finish_level: finishLevel,
          space_count: spaces.length,
          contingency_pct: contingency,
        });
      }
    }
  }, [active, contingency, finishLevel, location, propertyType, sizeBand, spaces.length, step]);

  useEffect(() => {
    if (!summary) return;
    const handle = window.setTimeout(() => setAnnouncement(summary), 500);
    return () => window.clearTimeout(handle);
  }, [summary]);

  function go(next: number, mode: 'push' | 'replace' = 'push') {
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    setStep(next);
    setEditMode(false);
    setOtherOpen(false);
    if (Platform.OS !== 'web') return;
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(next));
    const state = { step: next };
    if (mode === 'replace') window.history.replaceState(state, '', url);
    else window.history.pushState(state, '', url);
  }

  function begin(resume: boolean) {
    setActive(true);
    setWelcome(false);
    const next = resume ? step : 1;
    setStep(next);
    trackWebEvent('rbp_calc_start');
    if (Platform.OS === 'web') {
      const url = new URL(window.location.href);
      url.searchParams.set('step', String(next));
      window.history.pushState({ step: next }, '', url);
    }
  }

  function startOver() {
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    setConfirm(false);
    setActive(false);
    setWelcome(false);
    setStep(1);
    setEditMode(false);
    setPropertyType(null);
    setLocation(null);
    setSizeBand(null);
    setFinishLevel(null);
    setSpaces([]);
    setContingency(config.contingency.default);
    setOtherOpen(false);
    setOtherDigits('');
    setSpacesError('');
    trackWebEvent('rbp_calc_start_over');
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(config.storageKey);
        window.localStorage.removeItem(config.legacyStorageKey);
      } catch {
        // Ignore.
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('step');
      window.history.pushState({}, '', url.pathname);
    }
  }

  function afterChoice(next: number) {
    const delay = reduceMotion ? 0 : 250;
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      trackWebEvent('rbp_calc_step_complete', { step });
      if (editMode) go(8, 'replace');
      else go(next);
    }, delay);
  }

  function chooseProperty(id: PropertyTypeId) {
    setPropertyType(id);
    afterChoice(2);
  }
  function chooseLocation(id: LocationId) {
    setLocation(id);
    afterChoice(3);
  }
  function chooseSize(id: SizeId) {
    setSizeBand(id);
    afterChoice(4);
  }
  function chooseFinish(id: FinishId) {
    setFinishLevel(id);
    afterChoice(5);
  }

  function toggleSpace(id: SpaceId) {
    setSpacesError('');
    setSpaces((current) => {
      if (current.some((item) => item.space === id)) return current.filter((item) => item.space !== id);
      return [...current, { space: id, workType: 'Upgrade' }];
    });
  }

  function setWork(id: SpaceId, workType: WorkTypeId) {
    setSpaces((current) => current.map((item) => (item.space === id ? { ...item, workType } : item)));
  }

  function chooseContingency(value: number) {
    setContingency(value);
    setOtherOpen(false);
    const delay = reduceMotion ? 0 : 400;
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      trackWebEvent('rbp_calc_step_complete', { step: 7 });
      if (editMode) go(8, 'replace');
      else go(8);
    }, delay);
  }

  function jumpFromPill() {
    if (!propertyType || !location || !sizeBand || !finishLevel || !spaces.length) {
      go(firstIncompleteStep({ propertyType, location, sizeBand, finishLevel, spaces }));
      return;
    }
    go(8);
  }

  async function runExport(kind: 'pdf' | 'image' | 'whatsapp') {
    if (!result || !propertyType || !location || !sizeBand || !finishLevel) return;
    setBusy(kind);
    setExportError('');
    const shareText = buildShareText({ propertyType, location, sizeBand, finishLevel, result, contingency });
    try {
      if (kind === 'pdf') {
        const renderedLogo = Platform.OS === 'web' ? (document.querySelector('#planner img') as HTMLImageElement | null) : null;
        await downloadEstimatePdf({
          propertyType,
          location,
          sizeBand,
          finishLevel,
          contingency,
          result,
          highCost: costly.map((row) => `${row.space} (${row.workType})`),
          reminders: pageContent.smartWarnings.items,
          logoUri: renderedLogo?.currentSrc,
        });
        trackWebEvent('rbp_calc_download_pdf');
      } else if (kind === 'image') {
        const node = shareRef.current as unknown as HTMLElement | null;
        if (!node) throw new Error('missing card');
        await saveEstimateImage(node);
        trackWebEvent('rbp_calc_save_image');
      } else {
        const node = shareRef.current as unknown as HTMLElement | null;
        let image: File | null = null;
        if (node) {
          try {
            const blob = await captureEstimateImage(node, 1);
            image = new File([blob], 'buildmyhouse-renovation-budget.png', { type: 'image/png' });
          } catch {
            image = null;
          }
        }
        const method = await shareEstimateOnWhatsApp(shareText, image);
        trackWebEvent('rbp_calc_share_whatsapp', { method });
      }
    } catch {
      setExportError(config.copy.exportFailed);
    } finally {
      setBusy(null);
    }
  }

  if (!active) {
    return (
      <View nativeID="planner" style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <Text className="text-black text-[22px] leading-7 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          {welcome ? config.copy.welcomeTitle : config.copy.startTitle}
        </Text>
        {welcome ? null : (
          <Text className="text-gray-500 text-base leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {config.copy.startSub}
          </Text>
        )}
        <Pressable accessibilityRole="button" onPress={() => begin(welcome)} className="bmh-calc-focus rounded-full bg-black px-5 py-3 min-h-12 items-center justify-center">
          <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {welcome ? config.copy.continueButton : config.copy.startButton}
          </Text>
        </Pressable>
        {welcome ? (
          <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} className="bmh-calc-focus mt-3 min-h-12 items-center justify-center">
            <Text className="text-black text-base" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.startOverButton}</Text>
          </Pressable>
        ) : null}
        {confirm ? <Confirm onYes={startOver} onNo={() => setConfirm(false)} /> : null}
      </View>
    );
  }

  const heading =
    step === 1 ? config.copy.propertyHeading
    : step === 2 ? config.copy.locationHeading
    : step === 3 ? config.copy.sizeHeading
    : step === 4 ? config.copy.finishHeading
    : step === 5 ? config.copy.spacesHeading
    : step === 6 ? config.copy.workHeading
    : step === 7 ? config.copy.contingencyHeading
    : config.copy.planTitle;
  const helper =
    step === 1 ? config.copy.propertyHelper
    : step === 2 ? config.copy.locationHelper
    : step === 3 ? config.copy.sizeHelper
    : step === 4 ? config.copy.finishHelper
    : step === 5 ? config.copy.spacesHelper
    : step === 6 ? config.copy.workHelper
    : step === 7 ? config.copy.contingencyHelper
    : propertyType && location ? `${propertyType} in ${location}` : '';

  const screen = (
    <View nativeID="planner" className="bmh-calc-screen bg-white" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, backgroundColor: '#fff', overflow: 'hidden' }}>
      <View className="bg-white" style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: isPhone ? undefined : 480, alignSelf: 'center', overflow: 'hidden' }}>
        <View className="flex-row items-center justify-between px-4 pt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={config.copy.back}
            onPress={() => {
              if (step === 1) setActive(false);
              else if (Platform.OS === 'web' && window.history.length > 1) window.history.back();
              else go(step - 1, 'replace');
            }}
            className="bmh-calc-focus min-h-12 min-w-12 justify-center"
          >
            <Text className="text-black text-base" style={{ fontFamily: 'Poppins_500Medium' }}>{step === 1 ? '' : `‹ ${config.copy.back}`}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} className="bmh-calc-focus min-h-12 justify-center">
            <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.startOverButton}</Text>
          </Pressable>
        </View>
        <View className="px-4 pb-2">
          <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <View style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: 4, backgroundColor: ACCENT_GREEN }} />
          </View>
          <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            {step === 8 ? config.copy.resultStep : config.copy.stepOf(step, TOTAL_STEPS)}
          </Text>
        </View>
        <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <View ref={headingRef} accessibilityRole="header" {...(Platform.OS === 'web' ? ({ tabIndex: -1 } as object) : null)}>
            <Text className="text-black text-[28px] leading-8" style={{ fontFamily: 'Poppins_700Bold' }}>{heading}</Text>
          </View>
          {helper ? <Text className="text-gray-500 text-base leading-6 mt-2 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>{helper}</Text> : null}

          {step === 1 ? (
            <View accessibilityRole="radiogroup">
              {config.propertyTypes.map((item) => (
                <ChoiceCard key={item.id} title={item.title} helper={item.helper} selected={propertyType === item.id} Icon={item.id === 'Duplex' ? HardHat : House} onPress={() => chooseProperty(item.id)} />
              ))}
            </View>
          ) : null}
          {step === 2 ? (
            <View accessibilityRole="radiogroup">
              {config.locations.map((item) => (
                <ChoiceCard key={item.id} title={item.title} helper={item.helper} selected={location === item.id} Icon={House} onPress={() => chooseLocation(item.id)} />
              ))}
            </View>
          ) : null}
          {step === 3 ? (
            <View accessibilityRole="radiogroup">
              {config.sizes.map((item) => (
                <ChoiceCard key={item.id} title={item.title} helper={item.helper} selected={sizeBand === item.id} Icon={House} onPress={() => chooseSize(item.id)} />
              ))}
            </View>
          ) : null}
          {step === 4 ? (
            <View accessibilityRole="radiogroup">
              {config.finishes.map((item) => (
                <ChoiceCard key={item.id} title={item.title} helper={item.suggested ? `${item.helper} Suggested.` : item.helper} selected={finishLevel === item.id} Icon={Brush} onPress={() => chooseFinish(item.id)} />
              ))}
            </View>
          ) : null}
          {step === 5 ? (
            <View>
              {config.spaces.map((item) => {
                const selected = spaces.some((space) => space.space === item.id);
                const Icon = spaceIcon(item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleSpace(item.id)}
                    className="bmh-calc-focus flex-row items-center border rounded-2xl px-4 py-4 mb-3 min-h-[72px]"
                    style={{ borderColor: selected ? '#000' : '#E5E7EB', backgroundColor: selected ? '#F5F5F5' : '#F3F4F6' }}
                  >
                    <Icon size={22} color="#111" />
                    <View className="flex-1 mx-3">
                      <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>{item.title}</Text>
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{item.helper}</Text>
                    </View>
                    <View className="w-6 h-6 rounded-full border items-center justify-center" style={{ borderColor: selected ? '#000' : '#D1D5DB', backgroundColor: selected ? '#000' : 'transparent' }}>
                      {selected ? <Check size={14} color="#fff" /> : null}
                    </View>
                  </Pressable>
                );
              })}
              {spacesError ? <Text className="text-red-700 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{spacesError}</Text> : null}
            </View>
          ) : null}
          {step === 6 ? (
            <View>
              {spaces.map((choice) => (
                <View key={choice.space} className="mb-4">
                  <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>{choice.space}</Text>
                  <View accessibilityRole="radiogroup" className="flex-row flex-wrap">
                    {config.workTypes.map((work) => {
                      const selected = choice.workType === work.id;
                      return (
                        <Pressable
                          key={work.id}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          onPress={() => setWork(choice.space, work.id)}
                          className="bmh-calc-focus rounded-full px-4 min-h-12 justify-center mr-2 mb-2 border"
                          style={{ backgroundColor: selected ? '#000' : '#fff', borderColor: selected ? '#000' : '#D1D5DB' }}
                        >
                          <Text style={{ fontFamily: 'Poppins_500Medium', color: selected ? '#fff' : '#111', fontSize: 16 }}>{work.title}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {step === 7 && result ? (
            <View>
              <View className="flex-row flex-wrap">
                {config.contingency.options.map((value) => {
                  const selected = !otherOpen && contingency === value;
                  return (
                    <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => chooseContingency(value)} className="bmh-calc-focus rounded-2xl border px-4 py-3 mr-2 mb-2 min-h-12 min-w-[72px] items-center" style={{ borderColor: selected ? '#000' : '#E5E7EB', backgroundColor: selected ? '#111' : '#F3F4F6' }}>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', color: selected ? '#fff' : '#111', fontSize: 16 }}>{value === 0 ? config.copy.none : `${value}%`}</Text>
                      {value === config.contingency.default ? <Text style={{ fontFamily: 'Poppins_400Regular', color: selected ? '#fff' : '#6B7280', fontSize: 12 }}>{config.copy.suggested}</Text> : null}
                    </Pressable>
                  );
                })}
                <Pressable accessibilityRole="radio" accessibilityState={{ selected: otherOpen }} onPress={() => { setOtherOpen(true); setOtherDigits(String(contingency)); }} className="bmh-calc-focus rounded-2xl border px-4 py-3 mb-2 min-h-12 min-w-[72px] items-center" style={{ borderColor: otherOpen ? '#000' : '#E5E7EB', backgroundColor: otherOpen ? '#111' : '#F3F4F6' }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', color: otherOpen ? '#fff' : '#111', fontSize: 16 }}>{config.copy.other}</Text>
                </Pressable>
              </View>
              <Text className="text-black text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {contingency === 0 ? config.copy.contingencyNone(formatNaira(result.subtotal)) : config.copy.contingencyLive(formatNaira(result.contingencyAmount), formatNaira(result.subtotal))}
              </Text>
              {contingency === 0 ? <Text className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.noneNote}</Text> : null}
              {otherOpen && !coarse ? (
                <TextInput
                  value={otherDigits}
                  onChangeText={(value) => {
                    const digits = value.replace(/\D/g, '').slice(0, 2);
                    setOtherDigits(digits);
                    setContingency(Math.min(config.contingency.otherMax, Number(digits || '0')));
                  }}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  accessibilityLabel="Other percentage"
                  className="mt-4 border border-gray-300 rounded-xl px-4 text-black"
                  style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 28, minHeight: 64 }}
                />
              ) : null}
            </View>
          ) : null}
          {step === 8 && result && propertyType && location && sizeBand && finishLevel ? (
            <View>
              <View className="bg-black rounded-2xl p-4 mb-4">
                <Image source={logo} style={{ width: 36, height: 36 }} accessibilityLabel="BuildMyHouse" />
                <Text className="text-white text-sm mt-3" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.planTitle}</Text>
                <Text className="text-white text-3xl mt-1" style={{ fontFamily: 'Poppins_700Bold' }}>{formatNaira(result.total)}</Text>
                <Text className="text-white/80 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.keptAside(formatNaira(result.contingencyAmount), contingency)}</Text>
                <Text className="text-white/80 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.forTheWork(formatNaira(result.subtotal))}</Text>
                <Text className="text-white/70 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>{propertyType} · {location} · {sizeBand} · {finishLevel}</Text>
              </View>
              {([
                ['Property', propertyType, 1],
                ['Location', location, 2],
                ['Size', sizeBand, 3],
                ['Finish', finishLevel, 4],
                ['Areas', `${spaces.length} selected`, 5],
                ['Work', 'Repairs, upgrades, or full redos', 6],
                ['Kept aside', `${contingency}%`, 7],
              ] as const).map(([label, value, target]) => (
                <View key={label} className="flex-row items-center justify-between py-3 border-b border-gray-200">
                  <View className="flex-1 mr-3">
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{label}</Text>
                    <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{value}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${config.copy.edit} ${label}`} onPress={() => { setEditMode(true); go(target, 'push'); }} className="bmh-calc-focus min-h-12 justify-center px-2">
                    <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.edit}</Text>
                  </Pressable>
                </View>
              ))}
              <View className="mt-5">
                {result.rows.map((row) => (
                  <View key={row.space} className="flex-row items-start justify-between py-3 border-b border-gray-100">
                    <View className="flex-1 mr-3">
                      <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{row.space}</Text>
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{row.workType}</Text>
                    </View>
                    <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>{formatNaira(row.estimate)}</Text>
                  </View>
                ))}
              </View>
              {contingency > 0 ? (
                <View className="mt-4">
                  <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.keptAsideStop(formatNaira(result.contingencyAmount))}</Text>
                  <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.keptAsideNote}</Text>
                </View>
              ) : null}
              {costly.length ? (
                <View className="mt-4 bg-gray-100 rounded-2xl p-4">
                  <Text className="text-black mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.highCost}</Text>
                  {costly.map((row) => (
                    <Text key={row.space} className="text-gray-700 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{row.space} · {formatNaira(row.estimate)}</Text>
                  ))}
                </View>
              ) : null}
              <Pressable accessibilityRole="button" onPress={() => setRemindersOpen((open) => !open)} className="bmh-calc-focus min-h-12 justify-center mt-3">
                <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.remindersToggle}</Text>
              </Pressable>
              {remindersOpen ? pageContent.smartWarnings.items.map((item) => (
                <Text key={item} className="text-gray-600 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>• {item}</Text>
              )) : null}
              <Text className="text-gray-500 text-xs mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>{config.copy.disclaimer}</Text>
              {exportError ? <Text className="text-red-700 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>{exportError}</Text> : null}
              <View className="flex-row justify-between mt-5 mb-3">
                <ActionButton label={busy === 'pdf' ? config.copy.preparing : config.copy.downloadPdf} Icon={Download} disabled={busy !== null} onPress={() => runExport('pdf')} />
                <ActionButton label={busy === 'image' ? config.copy.preparing : config.copy.saveImage} Icon={ImageIcon} disabled={busy !== null} onPress={() => runExport('image')} />
                <ActionButton label={busy === 'whatsapp' ? config.copy.preparing : config.copy.shareWhatsapp} Icon={Share2} disabled={busy !== null} onPress={() => runExport('whatsapp')} />
              </View>
              <Pressable
                accessibilityRole="link"
                onPress={() => {
                  trackWebEvent('rbp_calc_start_project_click');
                  router.push(config.startProjectHref as never);
                }}
                className="bmh-calc-focus rounded-full min-h-12 items-center justify-center"
                style={{ backgroundColor: ACCENT_GREEN }}
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.startProject}</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
        {keyboardInset > 80 ? null : (
          <View className="px-4 pt-2 bg-white" style={{ paddingBottom: 16 }}>
            <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{announcement}</Text>
            {summary && step >= 5 ? (
              <Pressable accessibilityRole="button" onPress={jumpFromPill} className="bmh-calc-focus rounded-full bg-black px-4 py-3 mb-2">
                <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_500Medium' }}>{summary}</Text>
              </Pressable>
            ) : null}
            {step === 5 || step === 6 || (step === 7 && otherOpen) ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (step === 5) {
                    if (!spaces.length) {
                      setSpacesError(config.copy.spacesEmpty);
                      return;
                    }
                    trackWebEvent('rbp_calc_step_complete', { step: 5 });
                    if (editMode) go(8, 'replace');
                    else go(6);
                    return;
                  }
                  if (step === 6) {
                    trackWebEvent('rbp_calc_step_complete', { step: 6 });
                    if (editMode) go(8, 'replace');
                    else go(7);
                    return;
                  }
                  const value = Math.min(config.contingency.otherMax, Math.max(0, Number(otherDigits || '0')));
                  setContingency(value);
                  trackWebEvent('rbp_calc_step_complete', { step: 7 });
                  if (editMode) go(8, 'replace');
                  else go(8);
                }}
                className="bmh-calc-focus rounded-full min-h-14 items-center justify-center"
                style={{ backgroundColor: step === 5 && !spaces.length ? '#E5E7EB' : '#000' }}
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: step === 5 && !spaces.length ? '#9CA3AF' : '#fff' }}>
                  {editMode ? config.copy.backToEstimate : step === 7 ? config.copy.seeEstimate : config.copy.next}
                </Text>
              </Pressable>
            ) : null}
            {coarse && step === 7 && otherOpen ? (
              <Keypad
                onDigit={(digit) => {
                  setOtherDigits((current) => {
                    const next = `${current}${digit}`.replace(/\D/g, '').slice(0, 2);
                    setContingency(Math.min(config.contingency.otherMax, Number(next || '0')));
                    return next;
                  });
                }}
                onDelete={() => {
                  setOtherDigits((current) => {
                    const next = current.slice(0, -1);
                    setContingency(Math.min(config.contingency.otherMax, Number(next || '0')));
                    return next;
                  });
                }}
              />
            ) : null}
          </View>
        )}
        {confirm ? <Confirm onYes={startOver} onNo={() => setConfirm(false)} /> : null}
        <View pointerEvents="none" style={{ position: 'fixed', left: 0, top: 0, width: 1080, height: 0, overflow: 'hidden' }} accessibilityElementsHidden>
          <View ref={shareRef} collapsable={false} style={{ width: 1080, backgroundColor: '#fff', padding: 48 }}>
            <Image source={logo} style={{ width: 64, height: 64 }} />
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, marginTop: 8, color: '#111' }}>BuildMyHouse</Text>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 42, marginTop: 16, color: '#111' }}>{config.copy.planTitle}</Text>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 56, color: '#111' }}>{result ? formatNaira(result.total) : ''}</Text>
            {result?.rows.map((row) => (
              <Text key={row.space} style={{ fontFamily: 'Poppins_500Medium', fontSize: 22, marginTop: 10, color: '#111' }}>
                {row.space} · {row.workType} · {formatNaira(row.estimate)}
              </Text>
            ))}
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 18, marginTop: 24, color: '#111' }}>{config.copy.disclaimer}</Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 18, color: '#111' }}>{config.toolUrl}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return lockToViewport(screen);
}

function ChoiceCard({ title, helper, selected, onPress, Icon }: { title: string; helper: string; selected: boolean; onPress: () => void; Icon: typeof House }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="bmh-calc-focus flex-row items-center border rounded-2xl px-4 py-4 mb-3 min-h-[72px]"
      style={{ borderColor: selected ? '#000' : '#E5E7EB', backgroundColor: selected ? '#F3F4F6' : '#F3F4F6' }}
    >
      <Icon size={22} color="#111" />
      <View className="flex-1 mx-3">
        <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>{title}</Text>
        <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{helper}</Text>
      </View>
      <View className="w-6 h-6 rounded-full border items-center justify-center" style={{ borderColor: selected ? '#000' : '#D1D5DB', backgroundColor: selected ? '#000' : '#fff' }}>
        {selected ? <Check size={14} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

function ActionButton({ label, Icon, disabled, onPress }: { label: string; Icon: typeof Download; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className="bmh-calc-focus items-center justify-center min-h-12 flex-1">
      <Icon size={22} color="#111" />
      <Text className="text-black text-xs text-center mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>{label}</Text>
    </Pressable>
  );
}

function Keypad({ onDigit, onDelete }: { onDigit: (digit: string) => void; onDelete: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <View className="flex-row flex-wrap mt-2">
      {keys.map((key) => (
        <Pressable
          key={key || 'blank'}
          accessibilityRole="button"
          accessibilityLabel={key === '⌫' ? 'Delete' : key ? key : undefined}
          disabled={!key}
          onPress={() => {
            if (key === '⌫') onDelete();
            else if (key) onDigit(key);
          }}
          className="bmh-calc-focus items-center justify-center"
          style={{ width: '33.33%', minHeight: 56 }}
        >
          <Text className="text-black text-2xl" style={{ fontFamily: 'Poppins_500Medium' }}>{key}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Confirm({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <View className="absolute inset-0 bg-black/40 items-center justify-center px-6" style={{ zIndex: 20 }}>
      <View className="bg-white rounded-2xl p-4 w-full">
        <Text className="text-black text-base mb-4" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.startOverConfirm}</Text>
        <Pressable accessibilityRole="button" onPress={onYes} className="bmh-calc-focus bg-black rounded-full min-h-12 items-center justify-center mb-2">
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{config.copy.startOverYes}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onNo} className="bmh-calc-focus min-h-12 items-center justify-center">
          <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{config.copy.cancel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
