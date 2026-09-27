import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AirplaneTilt,
  ArrowLeft,
  Bathtub,
  Bed,
  Buildings,
  CalendarBlank,
  Clock,
  CookingPot,
  Door,
  Drop,
  Fan,
  ForkKnife,
  House,
  HouseLine,
  Lightning,
  MapPin,
  PaintBrush,
  Question as QuestionIcon,
  SquaresFour,
  Storefront,
  Sun,
  User,
  Users,
  WhatsappLogo,
  Wrench,
  type Icon,
} from 'phosphor-react-native';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import StartBuildIcon from '@/components/start/StartBuildIcon';
import StartStepMotion from '@/components/start/StartStepMotion';
import StartInteriorIcon from '@/components/start/StartInteriorIcon';
import StartRepairIcon from '@/components/start/StartRepairIcon';
import StartUpgradeIcon from '@/components/start/StartUpgradeIcon';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LAGOS_VENDOR_AREAS } from '@buildmyhouse/shared-types';
import { usePageOwnedSeo, useWebSeo } from '@/lib/seo';
import {
  DIAL_CODES,
  HUB,
  READY_MADE_PLANS_HREF,
  REPAIR_FEE_LINE,
  START_PATHS,
  START_REASSURANCE,
  NOTE_MIN_LENGTH,
  NOTE_REQUIRED_HELPER,
  getPath,
  guardHref,
  hrefAfterAnswer,
  hrefAfterChoice,
  normalizeWhatsApp,
  noteIsRequired,
  previousHref,
  progressFor,
  reviewRows,
  seoForPathname,
  startStructuredData,
  stepById,
  stepHref,
  type AnswerValue,
  type FlowOption,
  type FlowStep,
  type PathId,
  type StartPath,
} from '@/lib/start-project/flow';
import { messageForDraft, saveStartRequest, startWhatsAppUrl, trackStart } from '@/lib/start-project/save';
import {
  answersFor,
  clearStartDraft,
  clearStartIdentity,
  readStartRetry,
  rememberStartRetry,
  setStartAnswer,
  setStartContact,
  setStartReference,
  useStartDraft,
} from '@/lib/start-project/store';

const GREEN = '#16A34A';
const MUTED = '#6B7280';
const LINE = '#E5E7EB';

const ICONS: Record<string, Icon> = {
  plumbing: Wrench,
  electrical: Lightning,
  roofing: HouseLine,
  leaks: Drop,
  doors: Door,
  painting: PaintBrush,
  ac: Fan,
  other: QuestionIcon,
  today: Clock,
  'this-week': CalendarBlank,
  'this-month': CalendarBlank,
  'not-sure': QuestionIcon,
  lagos: MapPin,
  abuja: MapPin,
  ogun: MapPin,
  rivers: MapPin,
  oyo: MapPin,
  me: User,
  family: Users,
  abroad: AirplaneTilt,
  morning: Sun,
  afternoon: Sun,
  evening: Sun,
  any: Clock,
  tomorrow: CalendarBlank,
  kitchen: CookingPot,
  bathroom: Bathtub,
  flooring: SquaresFour,
  'whole-house': House,
  tenants: Users,
  empty: House,
  documents: House,
  'in-progress': Clock,
  'not-yet': QuestionIcon,
  approved: HouseLine,
  'not-approved': HouseLine,
  'ready-made': HouseLine,
  bungalow: House,
  duplex: Buildings,
  flats: Buildings,
  commercial: Storefront,
  living: House,
  bedroom: Bed,
  'whole-home': House,
  office: Storefront,
  design: PaintBrush,
  'design-furnish': PaintBrush,
  furnishing: ForkKnife,
  asap: Clock,
  later: CalendarBlank,
  planning: QuestionIcon,
};

function one(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function openStartHref(router: { push: (href: never) => void; replace?: (href: never) => void }, href: string, replace = false) {
  const [pathname, query] = href.split('?');
  const parts = pathname.split('/').filter(Boolean);
  const from = new URLSearchParams(query || '').get('from');
  const go = replace && router.replace ? router.replace : router.push;
  if (parts[0] !== 'start') {
    go(href as never);
    return;
  }
  if (parts.length === 1) {
    go('/start' as never);
    return;
  }
  const params: Record<string, string> = { path: parts[1] };
  if (from) params.from = from;
  if (parts.length === 2) {
    go({ pathname: '/start/[path]', params } as never);
    return;
  }
  params.step = parts[2];
  go({ pathname: '/start/[path]/[step]', params } as never);
}

function selectedIds(value: AnswerValue | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return [value];
  return [];
}

export default function StartProjectPage() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const pathname = usePathname() || '/start';
  const params = useLocalSearchParams<{ path?: string; step?: string; from?: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { draft, hydrated } = useStartDraft();
  const pathParam = one(params.path);
  const stepParam = one(params.step);
  const fromReview = one(params.from) === 'review';
  const path = getPath(pathParam) || getPath(pathname.split('/')[2]);
  const isHub = pathname === '/start' || (!path && !pathParam);
  const step = path ? (stepParam === 'sent' ? null : stepById(path, stepParam)) : null;
  const isSent = stepParam === 'sent' && !!path;
  const seo = useMemo(() => seoForPathname(pathname), [pathname]);

  usePageOwnedSeo();
  useWebSeo({
    ...(seo || {
      title: HUB.seoTitle,
      description: HUB.seoDescription,
      canonicalPath: '/start',
      robots: 'noindex,follow' as const,
    }),
    jsonLd: startStructuredData(pathname) || undefined,
    markdownAlternatePath:
      pathname === '/start'
        ? '/start.md'
        : /^\/start\/(repair|upgrade|build|interiors)$/.test(pathname)
          ? `${pathname}.md`
          : undefined,
  });

  useEffect(() => {
    if (pathname.startsWith('/start/') && !path) openStartHref(router, '/start', true);
  }, [pathname, path, router]);

  useEffect(() => {
    if (!path || isSent) return;
    if (stepParam && !step) openStartHref(router, stepHref(path.id, path.steps[0].id), true);
  }, [path, step, stepParam, isSent, router]);

  useEffect(() => {
    if (!hydrated || !path || !step) return;
    const href = guardHref(path, step.id, answersFor(path.id), {
      name: draft.name,
      whatsapp: draft.whatsapp,
    });
    if (href && href !== pathname) openStartHref(router, href, true);
  }, [hydrated, path, step, draft.name, draft.whatsapp, pathname, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;
    if (isHub) trackStart('start_step_view', { path: 'hub', step: 'hub' });
    else if (isSent && path) trackStart('start_step_view', { path: path.id, step: 'sent' });
    else if (path && step?.kind === 'review') trackStart('start_review_view', { path: path.id, step: 'review' });
    else if (path && step) trackStart('start_step_view', { path: path.id, step: step.id });
  }, [hydrated, isHub, isSent, path, step]);

  const progress = progressFor(path, isSent ? 'sent' : step?.id || null);
  const wide = width >= 1024;
  const column = isHub ? 960 : 640;

  const backHref = isHub
    ? '/'
    : fromReview && step && step.kind !== 'review' && path
      ? stepHref(path.id, 'review')
      : previousHref(path, step?.id || null);

  return (
    <View
      className="flex-1 bg-white bmh-start-screen"
      style={
        {
          backgroundColor: '#fff',
          ...(Platform.OS === 'web' ? {} : { paddingBottom: insets.bottom }),
        } as never
      }
    >
      <DirectorySiteHeader />
      <View className="px-4 pt-4" style={{ maxWidth: column, width: '100%', alignSelf: 'center' }}>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => openStartHref(router, backHref)}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ borderWidth: 1, borderColor: LINE }}
          >
            <ArrowLeft size={18} color="#000" />
          </Pressable>
          <View className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: LINE }}>
            <View
              style={
                {
                  width: `${Math.round(progress.fraction * 100)}%`,
                  height: 4,
                  backgroundColor: GREEN,
                  ...(Platform.OS === 'web'
                    ? { transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1)' }
                    : {}),
                } as never
              }
            />
          </View>
          {progress.label ? (
            <Text
              style={{
                fontFamily: 'Poppins_500Medium',
                fontSize: 13,
                color: MUTED,
                flexShrink: 1,
                textAlign: 'right',
              }}
            >
              {progress.label}
            </Text>
          ) : null}
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <StartStepMotion pathname={pathname}>
          <View style={{ maxWidth: column, width: '100%', alignSelf: 'center', paddingTop: 28 }}>
            {isHub ? <Hub wide={wide} /> : null}
            {path && step && (step.kind !== 'review' || hydrated) ? (
              <Question
                path={path}
                step={step}
                answers={answersFor(path.id)}
                draftName={draft.name}
                draftWhatsapp={draft.whatsapp}
                dialCode={draft.dialCode}
                fromReview={fromReview}
                showIntro={!stepParam}
                wide={wide}
              />
            ) : null}
            {path && isSent && hydrated ? (
              <Sent pathId={path.id} answers={answersFor(path.id)} name={draft.name} reference={draft.reference} />
            ) : null}
          </View>
        </StartStepMotion>
      </ScrollView>
    </View>
  );
}

function Hub({ wide }: { wide: boolean }) {
  return (
    <View>
      <SeoHeading
        level={1}
        style={
          {
            fontFamily: 'Poppins_700Bold',
            fontSize: wide ? '40px' : '32px',
            color: '#000',
            lineHeight: wide ? '48px' : '40px',
            margin: 0,
          } as never
        }
      >
        {HUB.question}
      </SeoHeading>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: MUTED, marginTop: 12, lineHeight: 24 }}>
        {HUB.intro}
      </Text>
      <View className="flex-row flex-wrap justify-between" style={{ marginTop: 28 }}>
        {(Object.values(START_PATHS)).map((item) => (
          <Link key={item.id} href={`/start/${item.id}` as never} asChild>
            <Pressable
              accessibilityRole="link"
              style={{
                width: wide ? '23.5%' : '48%',
                minHeight: 148,
                borderWidth: 1,
                borderColor: LINE,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                backgroundColor: '#fff',
              }}
            >
              <PathIcon id={item.id} />
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#000', marginTop: 16 }}>
                {item.title}
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: MUTED, marginTop: 6, lineHeight: 20 }}>
                {item.cardDescription}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

function PathIcon({ id }: { id: PathId }) {
  if (id === 'repair') return <StartRepairIcon />;
  if (id === 'upgrade') return <StartUpgradeIcon />;
  if (id === 'build') return <StartBuildIcon />;
  return <StartInteriorIcon />;
}

function Question({
  path,
  step,
  answers,
  draftName,
  draftWhatsapp,
  dialCode,
  fromReview,
  showIntro,
  wide,
}: {
  path: StartPath;
  step: FlowStep;
  answers: Record<string, AnswerValue>;
  draftName: string;
  draftWhatsapp: string;
  dialCode: string;
  fromReview: boolean;
  showIntro: boolean;
  wide: boolean;
}) {
  if (step.kind === 'review') {
    return <Review path={path} answers={answers} name={draftName} whatsapp={draftWhatsapp} />;
  }
  if (step.kind === 'contact') {
    return <Contact path={path} name={draftName} whatsapp={draftWhatsapp} dialCode={dialCode} />;
  }
  if (step.kind === 'note' || step.kind === 'area') {
    return <TextStep path={path} step={step} answers={answers} fromReview={fromReview} showIntro={showIntro} wide={wide} />;
  }
  return (
    <ChoiceStep
      path={path}
      step={step}
      answers={answers}
      fromReview={fromReview}
      showIntro={showIntro}
      wide={wide}
    />
  );
}

function Heading({
  title,
  helper,
  intro,
  fee,
  wide,
}: {
  title: string;
  helper?: string;
  intro?: string;
  fee?: boolean;
  wide: boolean;
}) {
  return (
    <View>
      <SeoHeading
        level={1}
        style={
          {
            fontFamily: 'Poppins_700Bold',
            fontSize: wide ? '36px' : '30px',
            color: '#000',
            lineHeight: wide ? '44px' : '38px',
            margin: 0,
          } as never
        }
      >
        {title}
      </SeoHeading>
      {intro ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: MUTED, marginTop: 12, lineHeight: 24 }}>
          {intro}
        </Text>
      ) : null}
      {helper ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: MUTED, marginTop: intro ? 8 : 12, lineHeight: 24 }}>
          {helper}
        </Text>
      ) : null}
      {fee ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: MUTED, marginTop: 10 }}>
          {REPAIR_FEE_LINE}
        </Text>
      ) : null}
    </View>
  );
}

function ChoiceStep({
  path,
  step,
  answers,
  fromReview,
  showIntro,
  wide,
}: {
  path: StartPath;
  step: FlowStep;
  answers: Record<string, AnswerValue>;
  fromReview: boolean;
  showIntro: boolean;
  wide: boolean;
}) {
  const router = useRouter();
  const chosen = selectedIds(answers[step.id]);
  const [pending, setPending] = useState<string | null>(null);
  const multi = step.kind === 'multi';
  const destination = hrefAfterAnswer(path, step.id, fromReview);

  const chooseOne = (optionId: string) => {
    const plan = hrefAfterChoice(path, step.id, answers[step.id], optionId, fromReview, answers);
    setStartAnswer(path.id, step.id, optionId);
    if (plan.clearArea) setStartAnswer(path.id, 'area', '');
    setPending(optionId);
    trackStart('start_answer', { path: path.id, step: step.id, value: optionId });
    setTimeout(() => openStartHref(router, plan.href), 200);
  };

  const toggle = (optionId: string) => {
    const next = chosen.includes(optionId) ? chosen.filter((id) => id !== optionId) : [...chosen, optionId];
    setStartAnswer(path.id, step.id, next);
  };

  return (
    <View>
      <Heading
        title={step.question}
        helper={step.helper}
        intro={showIntro ? path.intro : undefined}
        fee={path.id === 'repair' && showIntro}
        wide={wide}
      />
      <View style={{ marginTop: 24 }}>
        {(step.options || []).map((option) => {
          const on = chosen.includes(option.id) || pending === option.id;
          const card = <OptionCard option={option} selected={on} />;
          if (multi) {
            return (
              <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => toggle(option.id)}>
                {card}
              </Pressable>
            );
          }
          return (
            <Link
              key={option.id}
              href={destination as never}
              onPress={(event) => {
                event.preventDefault();
                chooseOne(option.id);
              }}
              asChild
            >
              <Pressable accessibilityRole="link" accessibilityState={{ selected: on }}>
                {card}
              </Pressable>
            </Link>
          );
        })}
      </View>
      {multi ? (
        <Continue
          label="Continue"
          disabled={!chosen.length}
          onPress={() => {
            const plan = hrefAfterChoice(path, step.id, answers[step.id], chosen, fromReview, answers);
            if (plan.clearArea) setStartAnswer(path.id, 'area', '');
            trackStart('start_answer', { path: path.id, step: step.id, value: chosen.join(',') });
            openStartHref(router, plan.href);
          }}
        />
      ) : null}
    </View>
  );
}

function OptionCard({ option, selected }: { option: FlowOption; selected: boolean }) {
  const Icon = ICONS[option.id] || QuestionIcon;
  return (
    <View
      style={{
        minHeight: 72,
        borderWidth: 1,
        borderColor: selected ? '#000' : LINE,
        backgroundColor: selected ? '#000' : '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Icon size={22} color={selected ? '#fff' : '#000'} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: selected ? '#fff' : '#000' }}>
          {option.title}
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: selected ? '#E5E7EB' : MUTED, marginTop: 2, lineHeight: 20 }}>
          {option.description}
        </Text>
      </View>
    </View>
  );
}

function TextStep({
  path,
  step,
  answers,
  fromReview,
  showIntro,
  wide,
}: {
  path: StartPath;
  step: FlowStep;
  answers: Record<string, AnswerValue>;
  fromReview: boolean;
  showIntro: boolean;
  wide: boolean;
}) {
  const router = useRouter();
  const current = typeof answers[step.id] === 'string' ? (answers[step.id] as string) : '';
  const [text, setText] = useState(current);
  const destination = hrefAfterAnswer(path, step.id, fromReview);
  const state = typeof answers.state === 'string' ? answers.state : '';
  const lagos = step.kind === 'area' && state === 'lagos';
  const noteRequired = step.kind === 'note' && noteIsRequired(path, answers);
  const helper = noteRequired
    ? NOTE_REQUIRED_HELPER
    : step.kind === 'area' && state === 'other'
      ? 'Type the state and the area, if you know them.'
      : step.helper;
  const continueDisabled = noteRequired ? text.trim().length < NOTE_MIN_LENGTH : !text.trim();

  useEffect(() => setText(current), [current]);

  const go = (value: string) => {
    setStartAnswer(path.id, step.id, value.trim());
    trackStart('start_answer', { path: path.id, step: step.id, value: value.trim() ? 'provided' : 'skipped' });
    openStartHref(router, destination);
  };

  return (
    <View>
      <Heading title={step.question} helper={helper} intro={showIntro ? path.intro : undefined} wide={wide} />
      {lagos ? (
        <View className="flex-row flex-wrap" style={{ marginTop: 20, gap: 8 }}>
          {LAGOS_VENDOR_AREAS.map((area) => {
            const on = text === area.label;
            return (
              <Pressable
                key={area.key}
                onPress={() => setText(area.label)}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: on ? '#000' : LINE,
                  backgroundColor: on ? '#000' : '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: on ? '#fff' : '#000' }}>{area.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={noteRequired ? NOTE_REQUIRED_HELPER : step.kind === 'note' ? 'Optional note' : 'Area or LGA'}
        placeholderTextColor="#9CA3AF"
        multiline={step.kind === 'note'}
        style={{
          marginTop: 16,
          minHeight: step.kind === 'note' ? 120 : 56,
          borderWidth: 1,
          borderColor: LINE,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontFamily: 'Poppins_400Regular',
          fontSize: 16,
          color: '#000',
          textAlignVertical: 'top',
        }}
      />
      <Continue label="Continue" disabled={continueDisabled} onPress={() => go(text)} />
      {noteRequired ? null : (
        <Pressable accessibilityRole="button" onPress={() => go('')} style={{ marginTop: 14, alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: MUTED }}>Skip</Text>
        </Pressable>
      )}
    </View>
  );
}

function Contact({
  path,
  name,
  whatsapp,
  dialCode,
}: {
  path: StartPath;
  name: string;
  whatsapp: string;
  dialCode: string;
}) {
  const router = useRouter();
  const [localName, setLocalName] = useState(name);
  const [localPhone, setLocalPhone] = useState(whatsapp.replace(dialCode, ''));
  const [code, setCode] = useState(dialCode || '+234');
  const [error, setError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const normalized = normalizeWhatsApp(code, localPhone);
  const ready = localName.trim().length >= 2 && !!normalized;
  const phoneDigits = localPhone.replace(/\D/g, '');
  const showPhoneError =
    !normalized &&
    localPhone.trim().length > 0 &&
    (phoneTouched || phoneDigits.length >= 11 || localPhone.includes('+'));

  useEffect(() => {
    setLocalName(name);
    if (dialCode) setCode(dialCode);
    if (!whatsapp) return;
    const prefix = dialCode || '+234';
    setLocalPhone(whatsapp.startsWith(prefix) ? whatsapp.slice(prefix.length) : whatsapp);
  }, [name, whatsapp, dialCode]);

  return (
    <View>
      <Heading title="How should we reach you?" helper="Your name and the WhatsApp number you want us to message." wide={false} />
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#000', marginTop: 24 }}>Your name</Text>
      <TextInput
        value={localName}
        onChangeText={setLocalName}
        placeholder="Ada Okafor"
        placeholderTextColor="#9CA3AF"
        autoComplete="name"
        style={inputStyle}
      />
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#000', marginTop: 18 }}>WhatsApp number</Text>
      <View className="flex-row flex-wrap" style={{ marginTop: 10, gap: 8 }}>
        {DIAL_CODES.map((item) => {
          const on = code === item.code;
          return (
            <Pressable
              key={item.code}
              onPress={() => setCode(item.code)}
              style={{
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: on ? '#000' : LINE,
                backgroundColor: on ? '#000' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: on ? '#fff' : '#000' }}>
                {item.code} {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={localPhone}
        onChangeText={(value) => {
          setLocalPhone(value);
          setError('');
        }}
        onBlur={() => setPhoneTouched(true)}
        placeholder="801 234 5678"
        placeholderTextColor="#9CA3AF"
        keyboardType="phone-pad"
        autoComplete="tel"
        style={inputStyle}
      />
      {showPhoneError || error ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#B91C1C', marginTop: 8 }}>
          {showPhoneError ? 'Please check this number.' : error}
        </Text>
      ) : null}
      <Continue
        label="Review your request"
        disabled={!ready}
        onPress={() => {
          const next = normalizeWhatsApp(code, localPhone);
          if (!next) {
            setPhoneTouched(true);
            setError('Please check this number.');
            return;
          }
          const matchedCode = DIAL_CODES.find((item) => next.startsWith(item.code))?.code || code;
          setStartContact({ name: localName.trim(), whatsapp: next, dialCode: matchedCode });
          trackStart('start_answer', { path: path.id, step: 'contact', value: 'provided' });
          openStartHref(router, stepHref(path.id, 'review'));
        }}
      />
    </View>
  );
}

const inputStyle = {
  marginTop: 8,
  minHeight: 56,
  borderWidth: 1,
  borderColor: LINE,
  borderRadius: 16,
  paddingHorizontal: 16,
  fontFamily: 'Poppins_400Regular',
  fontSize: 16,
  color: '#000',
} as const;

function Continue({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const button = (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 56,
        borderRadius: 999,
        backgroundColor: disabled ? '#E5E7EB' : '#000',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: disabled ? '#9CA3AF' : '#fff' }}>{label}</Text>
    </Pressable>
  );
  if (Platform.OS !== 'web') {
    return <View style={{ marginTop: 20 }}>{button}</View>;
  }
  return (
    <View
      ref={(node) => {
        const el = node as unknown as { classList?: { add: (name: string) => void } } | null;
        el?.classList?.add('bmh-start-continue');
      }}
      style={{ marginTop: 20, zIndex: 2 }}
    >
      {button}
    </View>
  );
}

function Review({
  path,
  answers,
  name,
  whatsapp,
}: {
  path: StartPath;
  answers: Record<string, AnswerValue>;
  name: string;
  whatsapp: string;
}) {
  const router = useRouter();
  const { draft } = useStartDraft();
  const [sending, setSending] = useState(false);
  const rows = reviewRows(path, answers, { name, whatsapp });
  const showPlans = path.id === 'build' && answers.plans === 'ready-made';

  const send = async () => {
    if (sending) return;
    setSending(true);
    const popup = Platform.OS === 'web' && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    const reference = await saveStartRequest({
      pathId: path.id,
      answers,
      name,
      whatsapp,
      utm: draft.utm,
      referrer: draft.referrer,
    });
    if (reference) setStartReference(reference);
    const url = startWhatsAppUrl(messageForDraft(path.id, answers, name, reference));
    rememberStartRetry(url);
    clearStartIdentity();
    trackStart('start_send_whatsapp', { path: path.id, saved: !!reference });
    if (popup) popup.location.href = url;
    else if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    else await Linking.openURL(url);
    setSending(false);
    openStartHref(router, stepHref(path.id, 'sent'));
  };

  return (
    <View>
      <Heading title="Check your request" helper={START_REASSURANCE} wide={false} />
      {path.id === 'repair' ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: MUTED, marginTop: 8 }}>{REPAIR_FEE_LINE}</Text>
      ) : null}
      <View style={{ marginTop: 24, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' }}>
        {rows.map((row, index) => (
          <View
            key={`${row.stepId}-${row.label}`}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: LINE,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: MUTED }}>{row.label}</Text>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#000', marginTop: 2 }}>{row.value}</Text>
            </View>
            <Link href={stepHref(path.id, row.stepId, true) as never} asChild>
              <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: GREEN }}>Change</Text>
              </Pressable>
            </Link>
          </View>
        ))}
      </View>
      {showPlans ? (
        <Link href={READY_MADE_PLANS_HREF as never} asChild>
          <Pressable accessibilityRole="link" style={{ marginTop: 16, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#000' }}>Browse ready-made plans</Text>
          </Pressable>
        </Link>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={sending}
        onPress={() => void send()}
        style={{
          marginTop: 24,
          minHeight: 56,
          borderRadius: 999,
          backgroundColor: GREEN,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <WhatsappLogo size={20} color="#fff" weight="fill" />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#fff' }}>
          {sending ? 'Opening WhatsApp…' : 'Send your request to WhatsApp'}
        </Text>
      </Pressable>
    </View>
  );
}

function Sent({
  pathId,
  answers,
  name,
  reference,
}: {
  pathId: PathId;
  answers: Record<string, AnswerValue>;
  name: string;
  reference: string | null;
}) {
  const router = useRouter();
  const url = readStartRetry() || startWhatsAppUrl(messageForDraft(pathId, answers, name, reference));
  return (
    <View>
      <SeoHeading
        level={1}
        style={
          { fontFamily: 'Poppins_700Bold', fontSize: '32px', color: '#000', lineHeight: '40px', margin: 0 } as never
        }
      >
        Request ready on WhatsApp
      </SeoHeading>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: MUTED, marginTop: 12, lineHeight: 24 }}>
        Press send in WhatsApp. An agent will reply to plan the next step.
      </Text>
      {reference ? (
        <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#000', marginTop: 16 }}>Reference {reference}</Text>
      ) : null}
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(url)} style={{ marginTop: 28, minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: GREEN }}>Didn't open? Tap here</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          clearStartDraft();
          openStartHref(router, '/start', true);
        }}
        style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#000' }}>Start another request</Text>
      </Pressable>
    </View>
  );
}
