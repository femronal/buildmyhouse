import { createElement, useRef, useState, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  HardHat,
  LogIn,
  MapPin,
  Phone,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react-native';
import GcDashboardMockup from '@/components/landing/GcDashboardMockup';
import GcSeoJsonLd from '@/components/landing/GcSeoJsonLd';
import {
  GC_AUDIENCE_TABS,
  GC_COMPARISON_ROWS,
  GC_CONTACT,
  GC_FAQ_ITEMS,
  GC_HERO_CONTENT,
  GC_HOW_IT_WORKS,
  GC_NAV_ITEMS,
  GC_PRIMARY,
  GC_PRIMARY_CTA,
  GC_PROJECT_CARDS,
  GC_SOCIALS,
  GC_TESTIMONIALS,
  GC_TRUST_PILLS,
  GC_VERIFICATION_STEPS,
  GC_WORKER_CATEGORIES,
  GC_BG,
  GC_SURFACE,
  HOMEOWNER_APP_URL,
  type GcAudienceTab,
} from '@/lib/gc-landing-content';

function WebWordSlider({ words }: { words: readonly string[] }) {
  const innerClass =
    words.length >= 6 ? 'gc-word-slider-inner gc-word-slider-inner-6' : 'gc-word-slider-inner';
  return createElement(
    'span',
    { className: 'gc-word-slider text-blue-400' },
    createElement(
      'span',
      { className: innerClass },
      ...words.map((word) => createElement('span', { key: word }, word)),
    ),
  );
}

function HeroHeadline({ audience }: { audience: GcAudienceTab['key'] }) {
  const hero = GC_HERO_CONTENT[audience];

  if (Platform.OS === 'web') {
    const children: ReactNode[] = [];
    if (hero.headlineLead) {
      children.push(hero.headlineLead);
      children.push(createElement('br', { key: 'br1' }));
      children.push(createElement(WebWordSlider, { key: 'slider', words: hero.rotatingKeywords }));
      children.push(createElement('br', { key: 'br2' }));
      children.push(hero.headlineSuffix);
    } else {
      children.push(createElement(WebWordSlider, { key: 'slider', words: hero.rotatingKeywords }));
      children.push(createElement('br', { key: 'br' }));
      children.push(hero.headlineSuffix);
    }
    return createElement(
      'h1',
      {
        className: 'text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08]',
        style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
      },
      ...children,
    );
  }

  return (
    <Text
      accessibilityRole="header"
      className="text-4xl text-white leading-tight"
      style={{ fontFamily: 'Poppins_600SemiBold' }}
    >
      {hero.headlineLead ? `${hero.headlineLead} ` : ''}
      {hero.headlineSuffix}
    </Text>
  );
}

function SectionHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  if (Platform.OS === 'web') {
    return createElement('h2', { className }, children);
  }
  return (
    <Text accessibilityRole="header" className={className} style={{ fontFamily: 'Poppins_600SemiBold' }}>
      {children}
    </Text>
  );
}

function AudienceTabs({
  audience,
  onSelect,
}: {
  audience: GcAudienceTab['key'];
  onSelect: (key: GcAudienceTab['key']) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-1 p-1 rounded-lg border border-blue-900/50 self-start" style={{ backgroundColor: GC_SURFACE }}>
      {GC_AUDIENCE_TABS.map((tab) => {
        const active = tab.key === audience;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            className="px-3 py-1.5 rounded-md"
            style={active ? { backgroundColor: GC_PRIMARY_CTA } : undefined}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              className={`text-xs ${active ? 'text-white' : 'text-gray-400'}`}
              style={{ fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function GcLandingPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const [audience, setAudience] = useState<GcAudienceTab['key']>('general-contractor');
  const [openFaq, setOpenFaq] = useState<string | null>(GC_FAQ_ITEMS[0]?.question ?? null);
  const hero = GC_HERO_CONTENT[audience];

  const recordSectionOffset = (key: string, y: number) => {
    sectionOffsets.current[key] = y;
  };

  const navPress = (href: string) => {
    if (href.startsWith('http')) {
      Linking.openURL(href);
      return;
    }
    const key = href.replace('#', '');
    const y = sectionOffsets.current[key];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
    }
  };

  return (
    <View className="flex-1 gc-landing-root" style={{ backgroundColor: GC_BG }}>
      <GcSeoJsonLd />
      <ScrollView ref={scrollRef} className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="gc-landing-header border-b border-blue-900/40" style={{ backgroundColor: 'rgba(10,22,40,0.92)' }}>
          <View className="max-w-7xl w-full self-center px-6 md:px-12 h-16 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <HardHat size={28} color={GC_PRIMARY} strokeWidth={2} />
              <Text className="text-xl text-white" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
                BuildMyHouse
              </Text>
              <View className="hidden lg:flex flex-row items-center gap-6 ml-8">
                {GC_NAV_ITEMS.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => navPress(item.href)}
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-gray-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <Link href={'/login' as any} asChild>
                <Pressable className="hidden md:flex px-3 py-2" accessibilityRole="link">
                  <Text className="text-sm text-gray-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Log in
                  </Text>
                </Pressable>
              </Link>
              <Link href={'/email-login' as any} asChild>
                <Pressable
                  className="px-4 py-2 rounded-xl flex-row items-center gap-2 gc-glass-btn gc-glass-btn-primary"
                  style={{ backgroundColor: GC_PRIMARY_CTA }}
                  accessibilityRole="link"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Get Verified
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        {/* Hero */}
        <View className="pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="mb-6 md:mb-8">
              <AudienceTabs audience={audience} onSelect={setAudience} />
            </View>

            <View
              className="gc-hero-grid w-full"
              style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: 'flex-start', width: '100%' }}
            >
              <View className="gc-hero-left z-10 gap-8 w-full" style={{ flex: isDesktop ? 5 : undefined }}>
                <View className="gap-6">
                  <Text
                    className="text-xs uppercase tracking-[0.18em] text-blue-300"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    For general contractors & skilled trades · Lagos, Nigeria
                  </Text>
                  <HeroHeadline audience={audience} />
                  <Text className="text-base md:text-lg text-gray-400 leading-relaxed max-w-lg" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {hero.subheadline}
                  </Text>
                </View>

                <View className="gap-4 w-full max-w-lg mt-2">
                  <View
                    className="flex-row items-center w-full rounded-xl border border-blue-900/50 px-2"
                    style={{ backgroundColor: GC_SURFACE }}
                  >
                    <View className="pl-2 pr-1">
                      <ClipboardList size={20} color="#6B7280" strokeWidth={2} />
                    </View>
                    <TextInput
                      placeholder={hero.searchPlaceholder}
                      placeholderTextColor="#6B7280"
                      editable={false}
                      className="flex-1 py-3.5 px-2 text-sm text-white gc-hero-search-input"
                      style={{ fontFamily: 'Poppins_500Medium', outlineStyle: 'none' } as any}
                    />
                    <Link href={'/email-login' as any} asChild>
                      <Pressable className="p-2 rounded-lg m-1" style={{ backgroundColor: GC_PRIMARY_CTA }} accessibilityRole="link">
                        <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
                      </Pressable>
                    </Link>
                  </View>

                  <View className="flex-row flex-wrap gap-2 pt-1">
                    {GC_WORKER_CATEGORIES.slice(0, 6).map((chip) => (
                      <View
                        key={chip}
                        className="px-3 py-1.5 rounded-full border border-blue-900/40"
                        style={{ backgroundColor: 'rgba(30,58,95,0.45)' }}
                      >
                        <Text className="text-xs text-gray-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {chip}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="flex-col sm:flex-row gap-4 pt-2">
                  <Link href={hero.primaryCta.href as any} asChild>
                    <Pressable
                      className="h-12 px-6 rounded-xl items-center justify-center flex-row gap-2 gc-glass-btn gc-glass-btn-primary"
                      style={{ backgroundColor: GC_PRIMARY_CTA }}
                      accessibilityRole="link"
                    >
                      <LogIn size={18} color="#fff" strokeWidth={2} />
                      <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {hero.primaryCta.label}
                      </Text>
                    </Pressable>
                  </Link>
                  <Pressable
                    onPress={() => navPress(hero.secondaryCta.href)}
                    className="h-12 px-6 rounded-xl border border-blue-900/50 items-center justify-center"
                    style={{ backgroundColor: GC_SURFACE }}
                    accessibilityRole="button"
                  >
                    <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {hero.secondaryCta.label}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View
                className="gc-hero-right items-center lg:items-end justify-center"
                style={{
                  flex: isDesktop ? 7 : undefined,
                  width: isDesktop ? undefined : '100%',
                  marginTop: isDesktop ? 0 : 48,
                }}
              >
                <GcDashboardMockup />
              </View>
            </View>
          </View>
        </View>

        {/* Trust bar */}
        <View className="border-y border-blue-900/30 py-10" style={{ backgroundColor: 'rgba(30,58,95,0.35)' }}>
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <Text className="text-xs text-center text-gray-400 mb-6 uppercase tracking-widest" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Built so contractors win trust with evidence — not excuses
            </Text>
            <View className="flex-row flex-wrap justify-center gap-6 md:gap-10">
              {[
                { icon: ShieldCheck, label: 'Verified profiles' },
                { icon: ClipboardList, label: 'Scoped briefs' },
                { icon: Camera, label: 'Stage evidence' },
                { icon: Wallet, label: 'Milestone pay' },
              ].map(({ icon: Icon, label }) => (
                <View key={label} className="flex-row items-center gap-2">
                  <Icon size={18} color={GC_PRIMARY} strokeWidth={2} />
                  <Text className="text-sm text-gray-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Project types gallery */}
        <View
          className="py-24 px-5 md:px-12"
          onLayout={(e) => recordSectionOffset('projects', e.nativeEvent.layout.y)}
        >
          <View className="max-w-7xl w-full self-center">
            <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4 text-center">
              Projects you can win on BuildMyHouse
            </SectionHeading>
            <Text className="text-base text-gray-400 text-center max-w-2xl self-center mb-16" style={{ fontFamily: 'Poppins_500Medium' }}>
              From urgent repairs to diaspora renovations and full builds — homeowners come with scope, photos, and expectations already structured.
            </Text>

            {isDesktop ? (
              <View className="gc-project-gallery relative min-h-[520px] flex-row items-center justify-center">
                {GC_PROJECT_CARDS.map((card, index) => (
                  <View
                    key={card.title}
                    className="gc-project-card absolute w-[240px] rounded-3xl overflow-hidden border border-blue-900/40"
                    style={{
                      backgroundColor: GC_SURFACE,
                      transform: [{ rotate: `${card.rotate}deg` }, { translateY: card.rotate % 2 === 0 ? 0 : 12 }],
                      zIndex: index + 1,
                      ...(Platform.OS === 'web'
                        ? ({ left: `${50 + (index - 2) * 14}%`, marginLeft: -120 } as any)
                        : {}),
                    }}
                  >
                    <Image source={{ uri: card.image }} className="h-36 w-full" resizeMode="cover" />
                    <View className="p-5">
                      <Text className="text-lg text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {card.title}
                      </Text>
                      <Text className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {card.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
                <View className="flex-row gap-4 px-2">
                  {GC_PROJECT_CARDS.map((card) => (
                    <View
                      key={card.title}
                      className="w-[260px] rounded-3xl overflow-hidden border border-blue-900/40"
                      style={{ backgroundColor: GC_SURFACE }}
                    >
                      <Image source={{ uri: card.image }} className="h-36 w-full" resizeMode="cover" />
                      <View className="p-5">
                        <Text className="text-lg text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {card.title}
                        </Text>
                        <Text className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {card.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        {/* WhatsApp comparison */}
        <View className="py-24 border-y border-blue-900/30" style={{ backgroundColor: 'rgba(5,11,20,0.6)' }}>
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="max-w-3xl self-center mb-16">
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4 text-center">
                Stop running your business on scattered WhatsApp threads.
              </SectionHeading>
              <Text className="text-base text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                WhatsApp is fine for chatting. When scope, evidence, milestones, and payment approvals matter, you need a workflow clients can trust.
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-8 max-w-5xl self-center">
              <View className="w-full md:w-[47%] rounded-2xl p-8 border border-red-900/30" style={{ backgroundColor: 'rgba(30,58,95,0.35)' }}>
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  <XCircle size={22} color="#f87171" strokeWidth={2} />
                  <Text className="text-xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    The old way
                  </Text>
                </View>
                {GC_COMPARISON_ROWS.slice(0, 5).map((row) => (
                  <View key={row.oldWay} className="flex-row items-start gap-3 mb-4">
                    <XCircle size={16} color="#f87171" strokeWidth={2} style={{ marginTop: 2 }} />
                    <Text className="text-sm text-gray-400 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {row.oldWay}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="w-full md:w-[47%] rounded-2xl p-8 border border-blue-500/30" style={{ backgroundColor: GC_PRIMARY_CTA }}>
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-white/20">
                  <CheckCircle2 size={22} color="#fff" strokeWidth={2} />
                  <Text className="text-xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    The BuildMyHouse way
                  </Text>
                </View>
                {GC_COMPARISON_ROWS.map((row) => (
                  <View key={row.platformWay} className="flex-row items-start gap-3 mb-4">
                    <CheckCircle2 size={16} color="#fff" strokeWidth={2} style={{ marginTop: 2 }} />
                    <Text className="text-sm text-blue-50 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {row.platformWay}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View
          className="py-24 px-6 md:px-12"
          onLayout={(e) => recordSectionOffset('how-it-works', e.nativeEvent.layout.y)}
        >
          <View className="max-w-7xl w-full self-center">
            <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4 text-center">
              How BuildMyHouse works for contractors
            </SectionHeading>
            <Text className="text-base text-gray-400 text-center max-w-2xl self-center mb-14" style={{ fontFamily: 'Poppins_500Medium' }}>
              Four moves from verification to milestone pay — the same loop whether you are a GC or a specialist trade.
            </Text>
            <View className="flex-row flex-wrap gap-6">
              {GC_HOW_IT_WORKS.map((step, index) => (
                <View
                  key={step.title}
                  className="w-full md:w-[48%] rounded-2xl p-8 border border-blue-900/40"
                  style={{ backgroundColor: GC_SURFACE }}
                >
                  <Text className="text-xs text-blue-300 mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text className="text-xl text-white mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {step.title}
                  </Text>
                  <Text className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {step.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Verification */}
        <View
          className="py-24 border-y border-blue-900/30 px-6 md:px-12"
          style={{ backgroundColor: 'rgba(30,58,95,0.25)' }}
          onLayout={(e) => recordSectionOffset('verification', e.nativeEvent.layout.y)}
        >
          <View className="max-w-7xl w-full self-center">
            <View className="flex-row flex-wrap gap-10 items-center">
              <View className="w-full lg:w-[45%]">
                <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                  Verification that homeowners actually trust
                </SectionHeading>
                <Text className="text-base text-gray-400 leading-relaxed mb-8" style={{ fontFamily: 'Poppins_500Medium' }}>
                  We verify where you work — not just your profile photo. That badge is what turns a referral into a platform-backed professional.
                </Text>
                <Link href={'/email-login' as any} asChild>
                  <Pressable
                    className="h-12 px-8 rounded-xl self-start justify-center"
                    style={{ backgroundColor: GC_PRIMARY_CTA }}
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Start Verification
                    </Text>
                  </Pressable>
                </Link>
              </View>
              <View className="w-full lg:w-[50%] gap-4">
                {GC_VERIFICATION_STEPS.map((step, index) => (
                  <View
                    key={step.title}
                    className="rounded-2xl p-5 border border-blue-900/40 flex-row gap-4"
                    style={{ backgroundColor: GC_BG }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                      style={{ backgroundColor: GC_SURFACE }}
                    >
                      <Text className="text-sm text-blue-300" style={{ fontFamily: 'Poppins_700Bold' }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base text-white mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {step.title}
                      </Text>
                      <Text className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {step.body}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Testimonials */}
        <View className="py-24 px-6 md:px-12">
          <View className="max-w-7xl w-full self-center">
            <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-14 text-center">
              Contractors who switched to structured work
            </SectionHeading>
            <View className="flex-row flex-wrap gap-6">
              {GC_TESTIMONIALS.map((item) => (
                <View
                  key={item.name}
                  className="w-full md:w-[31%] rounded-2xl p-8 border border-blue-900/40"
                  style={{ backgroundColor: GC_SURFACE }}
                >
                  <Text className="text-sm text-gray-300 leading-relaxed mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                    “{item.quote}”
                  </Text>
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {item.detail}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Trust pills + homeowner cross-link */}
        <View className="py-16 border-t border-blue-900/30 px-6 md:px-12" style={{ backgroundColor: 'rgba(5,11,20,0.5)' }}>
          <View className="max-w-7xl w-full self-center">
            <View className="flex-row flex-wrap gap-2 mb-10">
              {GC_TRUST_PILLS.map((pill) => (
                <View key={pill} className="px-3 py-1.5 rounded-full border border-blue-900/40" style={{ backgroundColor: GC_SURFACE }}>
                  <Text className="text-xs text-gray-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {pill}
                  </Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => Linking.openURL(HOMEOWNER_APP_URL)}
              className="flex-row items-center gap-2 self-start"
              accessibilityRole="link"
            >
              <Text className="text-sm text-blue-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                Looking for a worker instead? Visit the homeowner app
              </Text>
              <ExternalLink size={16} color={GC_PRIMARY} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* FAQ */}
        <View
          className="py-24 px-6 md:px-12"
          onLayout={(e) => recordSectionOffset('faq', e.nativeEvent.layout.y)}
        >
          <View className="max-w-3xl w-full self-center">
            <SectionHeading className="text-3xl font-semibold tracking-tight text-white mb-10 text-center">
              Frequently asked questions
            </SectionHeading>
            <View className="gap-4">
              {GC_FAQ_ITEMS.map((item) => {
                const open = openFaq === item.question;
                return (
                  <View
                    key={item.question}
                    className="rounded-xl border border-blue-900/40 overflow-hidden"
                    style={{ backgroundColor: GC_SURFACE }}
                  >
                    <Pressable
                      onPress={() => setOpenFaq(open ? null : item.question)}
                      className="flex-row justify-between items-center p-5"
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                    >
                      <Text className="text-white flex-1 pr-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {item.question}
                      </Text>
                      <ChevronDown
                        size={18}
                        color="#9CA3AF"
                        strokeWidth={2}
                        style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
                      />
                    </Pressable>
                    {open ? (
                      <Text className="text-gray-400 text-sm px-5 pb-5 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {item.answer}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Footer CTA */}
        <View className="py-10 md:py-16 px-4 sm:px-6">
          <View className="max-w-7xl w-full self-center">
            <View
              className="gc-footer-card relative overflow-hidden rounded-[40px] border border-blue-500/20 p-6 sm:p-10 md:p-14"
              style={{ backgroundColor: GC_PRIMARY_CTA }}
            >
              {Platform.OS === 'web' ? (
                createElement(
                  'h2',
                  { className: 'gc-footer-headline', style: { fontFamily: 'Poppins_600SemiBold' } },
                  createElement('span', { key: 'l1', style: { display: 'block', color: '#fff' } }, 'Ready to win clearer projects'),
                  createElement(
                    'span',
                    { key: 'l2', style: { display: 'block', color: 'rgba(255,255,255,0.75)' } },
                    'with evidence clients trust?',
                  ),
                )
              ) : (
                <Text className="text-white text-3xl" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Ready to win clearer projects with evidence clients trust?
                </Text>
              )}

              <Text className="text-sm md:text-base text-blue-100 mt-5 max-w-xl" style={{ fontFamily: 'Poppins_500Medium' }}>
                Verified profile. Scoped requests. Stage evidence. Milestone pay. Start on BuildMyHouse.
              </Text>

              <View className="flex-row flex-wrap gap-8 mt-10">
                <View className="w-full md:w-[30%]">
                  <Text className="text-sm text-blue-100" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Talk to us
                  </Text>
                  <Pressable onPress={() => Linking.openURL(`tel:${GC_CONTACT.phoneTel}`)} className="flex-row items-center gap-3 mt-2">
                    <Phone size={20} color="#fff" strokeWidth={2} />
                    <Text className="text-xl md:text-2xl text-white tracking-tight" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {GC_CONTACT.phoneDisplay}
                    </Text>
                  </Pressable>
                </View>

                <View className="w-full md:w-[30%]">
                  <Text className="text-sm text-blue-100" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Get started
                  </Text>
                  <Link href={'/email-login' as any} asChild>
                    <Pressable
                      className="self-start flex-row items-center gap-2 bg-white rounded-full px-5 py-3 mt-2"
                      accessibilityRole="link"
                    >
                      <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: GC_PRIMARY_CTA }}>
                        Create contractor account
                      </Text>
                      <ArrowRight size={16} color={GC_PRIMARY_CTA} strokeWidth={2.5} />
                    </Pressable>
                  </Link>
                </View>

                <View className="w-full md:w-[30%]">
                  <Text className="text-sm text-blue-100" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Follow along
                  </Text>
                  <View className="flex-row flex-wrap items-center gap-3 mt-2">
                    {GC_SOCIALS.map((social) => (
                      <Pressable
                        key={social.id}
                        onPress={() => Linking.openURL(social.href)}
                        accessibilityRole="link"
                        accessibilityLabel={social.label}
                        className="px-3 py-2 rounded-full bg-white/15 border border-white/20"
                      >
                        <Text className="text-xs text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {social.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View className="h-px bg-white/20 mt-10" />

              <View className="flex-row flex-wrap gap-8 mt-8">
                <View className="w-full md:w-[48%]">
                  <Text className="text-sm text-blue-100" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Explore
                  </Text>
                  <View className="flex-row flex-wrap mt-3">
                    {GC_NAV_ITEMS.map((item) => (
                      <View key={item.label} className="w-1/2 mb-2 pr-2">
                        <Pressable onPress={() => navPress(item.href)} accessibilityRole="button">
                          <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                            {item.label}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="w-full md:w-[48%]">
                  <Text className="text-sm text-blue-100" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Fine print
                  </Text>
                  <View className="mt-3 gap-2">
                    <Link href={'/terms-conditions' as any} asChild>
                      <Pressable accessibilityRole="link">
                        <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                          Terms & Conditions
                        </Text>
                      </Pressable>
                    </Link>
                    <Link href={'/privacy-security' as any} asChild>
                      <Pressable accessibilityRole="link">
                        <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                          Privacy Notice
                        </Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(GC_CONTACT.mapsQuery)}`)}
                className="flex-row items-start gap-2 mt-8 self-start max-w-lg"
              >
                <MapPin size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} style={{ marginTop: 2 }} />
                <Text className="text-xs text-blue-100 flex-1 leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {GC_CONTACT.address}
                </Text>
              </Pressable>

              <Text className="text-xs text-blue-100 text-center mt-6" style={{ fontFamily: 'Poppins_500Medium' }}>
                © {new Date().getFullYear()} BuildMyHouse Technologies — Built with care in Lagos, Nigeria
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
