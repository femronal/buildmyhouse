import { createElement, useRef, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import {
  Airplane,
  ArrowRight,
  Camera,
  CaretDown,
  CheckCircle,
  ClipboardText,
  Hammer,
  Lifebuoy,
  MapPin,
  Phone,
  ShieldCheck,
  XCircle,
} from 'phosphor-react-native';
import LogoText from '@/components/LogoText';
import PhoneDashboardMockup from '@/components/landing/PhoneDashboardMockup';
import LandingMobileNav from '@/components/landing/LandingMobileNav';
import SEOJsonLd from '@/components/landing/SEOJsonLd';
import SocialBrandIcon, { type SocialBrandId } from '@/components/landing/SocialBrandIcon';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import LandingServiceSearchBar from '@/components/landing/LandingServiceSearchBar';
import AgentToolsSection from '@/components/landing/AgentToolsSection';
import PlatformGallerySection from '@/components/landing/PlatformGallerySection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import TrustpilotReviewSection from '@/components/landing/TrustpilotReviewSection';
import RotatingKeyword from '@/components/landing/RotatingKeyword';
import WebLandmark from '@/components/seo/WebLandmark';
import { useLandingServiceLinks } from '@/hooks/useLandingServiceLinks';
import {
  AUDIENCE_TABS,
  COMPARISON_ROWS,
  COMPARISON_SECTION,
  CONTROL_PROMISE,
  FAQ_ITEMS,
  FOOTER_CLOSE,
  HERO_AUDIENCE_CONTENT,
  NAV_ITEMS,
  OFFER_SECTION,
  PROMISED_LAND,
  WORKSHEET_SECTION,
  BUILDMYHOUSE_CONTACT,
  BUILDMYHOUSE_SOCIALS,
  type AudienceTab,
} from '@/lib/home-landing-content';
import { trackWebEvent } from '@/lib/analytics';

function WebWordSlider({
  words,
  emphasized = false,
}: {
  words: readonly string[];
  emphasized?: boolean;
}) {
  const innerClass =
    words.length >= 6 ? 'bmh-word-slider-inner bmh-word-slider-inner-6' : 'bmh-word-slider-inner';
  const wordClass = emphasized ? 'bmh-hero-rotate-emphasis' : undefined;

  return createElement(
    'span',
    { className: 'bmh-word-slider text-black' },
    createElement(
      'span',
      { className: innerClass },
      ...words.map((word) => createElement('span', { key: word, className: wordClass }, word)),
    ),
  );
}

function HeroHeadlineBlock({ audience }: { audience: AudienceTab['key'] }) {
  const hero = HERO_AUDIENCE_CONTENT[audience];
  const emphasizeRotate = audience !== 'need-worker';

  if (hero.staticHeadline) {
    if (Platform.OS === 'web') {
      return createElement(
        'h1',
        {
          className:
            'text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-black leading-[1.1]',
          style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
        },
        hero.staticHeadline,
      );
    }
    return (
      <Text
        accessibilityRole="header"
        className="text-4xl text-black leading-tight"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {hero.staticHeadline}
      </Text>
    );
  }

  if (Platform.OS === 'web') {
    const children: ReactNode[] = [];

    if (hero.headlineLead) {
      children.push(`${hero.headlineLead}`);
      children.push(createElement('br', { key: 'br1' }));
      children.push(createElement(WebWordSlider, { key: 'slider', words: hero.rotatingKeywords }));
      children.push(createElement('br', { key: 'br2' }));
      children.push(hero.headlineSuffix);
    } else {
      children.push(createElement(WebWordSlider, { key: 'slider', words: hero.rotatingKeywords, emphasized: emphasizeRotate }));
      children.push(createElement('br', { key: 'br' }));
      children.push(hero.headlineSuffix);
    }

    return createElement(
      'h1',
      {
        className:
          'text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-black leading-[1.1]',
        style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
      },
      ...children,
    );
  }

  if (hero.headlineLead) {
    return (
      <Text
        accessibilityRole="header"
        className="text-4xl text-black leading-tight"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {hero.headlineLead}{' '}
        <RotatingKeyword words={hero.rotatingKeywords} />
        {' '}
        {hero.headlineSuffix}
      </Text>
    );
  }

  return (
    <Text
      accessibilityRole="header"
      className="text-4xl text-black leading-tight"
      style={{ fontFamily: 'Poppins_600SemiBold' }}
    >
      <RotatingKeyword words={hero.rotatingKeywords} />
      {'\n'}
      {hero.headlineSuffix}
    </Text>
  );
}

function AudienceTabBar({
  audience,
  onSelect,
  isDesktop,
}: {
  audience: AudienceTab['key'];
  onSelect: (key: AudienceTab['key']) => void;
  isDesktop: boolean;
}) {
  const mobileLabels: Record<AudienceTab['key'], string> = {
    diaspora: 'From abroad',
    'need-worker': 'Need work done',
    'get-hired': 'Get hired',
  };

  const renderTab = (tab: AudienceTab, compact?: boolean) => {
    const active = tab.key === audience;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onSelect(tab.key)}
        className={`px-3 py-1.5 rounded-md ${active ? 'bg-black' : ''}`}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
      >
        <Text
          className={`text-xs text-center ${active ? 'text-white' : 'text-slate-500'}`}
          style={{ fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
        >
          {compact ? mobileLabels[tab.key] : tab.label}
        </Text>
      </Pressable>
    );
  };

  if (isDesktop) {
    return (
      <View
        className="flex-row items-center gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100 self-start"
        style={{ alignSelf: 'flex-start' }}
      >
        {AUDIENCE_TABS.map((tab) => renderTab(tab))}
      </View>
    );
  }

  return (
    <View
      className="bmh-audience-tabs-wrap w-full"
      style={{
        width: '100%',
        padding: 4,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignSelf: 'stretch',
      }}
    >
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: 4,
          rowGap: 4,
        }}
      >
        {AUDIENCE_TABS.map((tab) => renderTab(tab, true))}
      </View>
    </View>
  );
}

function FooterHeadline() {
  if (Platform.OS === 'web') {
    return createElement(
      'h2',
      { className: 'bmh-footer-headline', style: { fontFamily: 'Poppins_600SemiBold' } },
      createElement('span', { key: 'l1', style: { display: 'block' } }, FOOTER_CLOSE.line1),
      createElement(
        'span',
        { key: 'l2', style: { display: 'block', color: 'rgba(255,255,255,0.6)' } },
        FOOTER_CLOSE.line2,
      ),
    );
  }
  return (
    <Text
      accessibilityRole="header"
      className="text-white"
      style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 40, lineHeight: 42, letterSpacing: -1 }}
    >
      {FOOTER_CLOSE.line1}
      {'\n'}
      <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{FOOTER_CLOSE.line2}</Text>
    </Text>
  );
}

function SectionHeading({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  if (Platform.OS === 'web') {
    return createElement('h2', { className }, children);
  }
  return (
    <Text accessibilityRole="header" className={className} style={{ fontFamily: 'Poppins_600SemiBold' }}>
      {children}
    </Text>
  );
}

export default function HomeLandingPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const showTabletNav = width >= 768 && width < 1024;
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const [audience, setAudience] = useState<AudienceTab['key']>('diaspora');
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_ITEMS[0]?.question ?? null);
  const heroContent = HERO_AUDIENCE_CONTENT[audience];
  const { popularLinks, popularChips } = useLandingServiceLinks();

  const recordSectionOffset = (key: string, y: number) => {
    sectionOffsets.current[key] = y;
  };

  const navPress = (href: string) => {
    const key = href.replace('#', '');
    const y = sectionOffsets.current[key];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
    }
  };

  const selectAudience = (key: AudienceTab['key']) => {
    setAudience(key);
    trackWebEvent('diaspora_tab_selected', { audience: key });
  };

  const trackPrimaryCta = (placement: string, href: string) => {
    trackWebEvent('homepage_primary_cta_clicked', { placement, href });
    if (href.includes('book-repair') || href.includes('diaspora')) {
      trackWebEvent('homepage_project_started', { placement, href });
    }
  };

  const trackSecondaryCta = (placement: string, href: string) => {
    trackWebEvent('homepage_secondary_cta_clicked', { placement, href });
  };

  return (
    <View className="flex-1 bg-white bmh-landing-root">
      <SEOJsonLd />
      <ScrollView ref={scrollRef} className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <WebLandmark tag="header" className="bg-white/90 border-b border-slate-100 bmh-landing-header">
          <View className="max-w-7xl w-full self-center px-6 md:px-12 h-16 flex-row items-center justify-between">
            <View className="flex-row items-center gap-8 flex-1">
              <Link href={'/' as any} asChild>
                <Pressable accessibilityRole="link">
                  <LogoText variant="black" size="md" />
                </Pressable>
              </Link>
              <WebLandmark tag="nav" aria-label="Primary" className="bmh-landing-primary-nav hidden lg:flex flex-row items-center gap-6">
                {NAV_ITEMS.filter((item) => item.label !== 'How It Works').map((item) =>
                  item.href.startsWith('#') ? (
                    <Pressable key={item.label} onPress={() => navPress(item.href)}>
                      <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ) : (
                    <Link key={item.label} href={item.href as any} asChild>
                      <Pressable accessibilityRole="link">
                        <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    </Link>
                  ),
                )}
              </WebLandmark>
            </View>
            <View className="flex-row items-center gap-4">
              <Link href={'/email-login' as any} asChild>
                <Pressable className="hidden md:flex" accessibilityRole="link">
                  <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Log in
                  </Text>
                </Pressable>
              </Link>
              {/* Mobile: Login → app auth. Desktop: primary homeowner CTA. */}
              <Link href={'/email-login' as any} asChild>
                <Pressable
                  className="md:hidden bg-black px-4 py-2 rounded-lg bmh-glass-btn bmh-glass-btn-dark"
                  accessibilityRole="link"
                  accessibilityLabel="Login"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Login
                  </Text>
                </Pressable>
              </Link>
              <Link href={'/book-repair' as any} asChild>
                <Pressable
                  onPress={() => trackPrimaryCta('header', '/book-repair')}
                  className="hidden md:flex bg-black px-4 py-2 rounded-lg bmh-glass-btn bmh-glass-btn-dark"
                  accessibilityRole="link"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Start a Project
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
          {showTabletNav ? <LandingMobileNav onNavPress={navPress} /> : null}
        </WebLandmark>

        <WebLandmark tag="main">
        {/* Hero */}
        <View className="pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="mb-6 md:mb-8">
              <AudienceTabBar audience={audience} onSelect={selectAudience} isDesktop={isDesktop} />
            </View>

            <View
              className="bmh-hero-grid w-full"
              style={{
                flexDirection: isDesktop ? 'row' : 'column',
                alignItems: 'flex-start',
                width: '100%',
              }}
            >
            <View className="bmh-hero-left z-10 gap-8 w-full" style={{ flex: isDesktop ? 5 : undefined }}>
              <View className="gap-6">
                {heroContent.eyebrow ? (
                  <Text
                    className="text-[11px] uppercase tracking-[0.18em] text-slate-500"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {heroContent.eyebrow}
                  </Text>
                ) : null}
                <HeroHeadlineBlock audience={audience} />

                <Text className="text-base md:text-lg text-slate-500 leading-relaxed max-w-lg" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {heroContent.subheadline}
                </Text>
              </View>

              <View className="gap-4 w-full max-w-lg mt-6">
                <LandingServiceSearchBar
                  links={popularLinks}
                  placeholder={heroContent.searchPlaceholder}
                  variant="hero"
                />

                <View className="flex-row flex-wrap gap-2 pt-1">
                  {popularChips.slice(0, 5).map((chip) => (
                    <Link key={chip.href} href={chip.href as any} asChild>
                      <Pressable className="px-3 py-1.5 rounded-full border border-slate-200 bg-white" accessibilityRole="link">
                        <Text className="text-xs text-slate-600" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {chip.label}
                        </Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>

              <View className="flex-col sm:flex-row gap-4 pt-4">
                <Link href={heroContent.primaryCta.href as any} asChild>
                  <Pressable
                    onPress={() => trackPrimaryCta('hero', heroContent.primaryCta.href)}
                    className="h-12 px-6 rounded-lg bg-black items-center justify-center bmh-glass-btn bmh-glass-btn-dark"
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {heroContent.primaryCta.label}
                    </Text>
                  </Pressable>
                </Link>
                {heroContent.secondaryCta.href.startsWith('#') ? (
                  <Pressable
                    onPress={() => {
                      trackSecondaryCta('hero', heroContent.secondaryCta.href);
                      navPress(heroContent.secondaryCta.href);
                    }}
                    className="h-12 px-6 rounded-lg bg-white border border-slate-200 items-center justify-center bmh-glass-btn bmh-glass-btn-light"
                    accessibilityRole="button"
                  >
                    <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {heroContent.secondaryCta.label}
                    </Text>
                  </Pressable>
                ) : (
                  <Link href={heroContent.secondaryCta.href as any} asChild>
                    <Pressable
                      onPress={() => trackSecondaryCta('hero', heroContent.secondaryCta.href)}
                      className="h-12 px-6 rounded-lg bg-white border border-slate-200 items-center justify-center bmh-glass-btn bmh-glass-btn-light"
                      accessibilityRole="link"
                    >
                      <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {heroContent.secondaryCta.label}
                      </Text>
                    </Pressable>
                  </Link>
                )}
              </View>

              {heroContent.reassurance ? (
                <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {heroContent.reassurance}
                </Text>
              ) : null}

              {heroContent.tertiaryLink ? (
                <Link href={heroContent.tertiaryLink.href as any} asChild>
                  <Pressable className="flex-row items-center gap-1 mt-2" accessibilityRole="link">
                    <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {heroContent.tertiaryLink.label}
                    </Text>
                    <ArrowRight size={14} color="#64748b" weight="regular" />
                  </Pressable>
                </Link>
              ) : null}
            </View>

            <View
              className="bmh-hero-right items-center lg:items-end justify-center"
              style={{
                flex: isDesktop ? 7 : undefined,
                width: isDesktop ? undefined : '100%',
                marginTop: isDesktop ? 0 : width < 768 ? 20 : 36,
                paddingTop: isDesktop ? 8 : 0,
              }}
            >
              <Text
                className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-3 self-center lg:self-end"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                {PROMISED_LAND.caption}
              </Text>
              <PhoneDashboardMockup />
            </View>
            </View>
          </View>
        </View>

        {/* Control Promise */}
        <View className="border-y border-slate-100 bg-slate-50 py-10">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <Text
              className="text-xs text-center text-slate-500 mb-2 uppercase tracking-widest"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {CONTROL_PROMISE.heading}
            </Text>
            <Text
              className="text-sm text-center text-slate-500 mb-6 max-w-2xl self-center leading-relaxed"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              {CONTROL_PROMISE.supporting}
            </Text>
            <View className="flex-row flex-wrap justify-center gap-6 md:gap-12">
              {[
                { icon: ShieldCheck, label: 'Verified Workers' },
                { icon: ClipboardText, label: 'Scope Before Work' },
                { icon: Camera, label: 'Evidence Before Payment' },
                { icon: Lifebuoy, label: 'Dispute Support' },
              ].map(({ icon: Icon, label }) => (
                <View key={label} className="flex-row items-center gap-2">
                  <Icon size={20} color="#16a34a" weight="regular" />
                  <Text className="text-sm text-slate-600" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* WhatsApp comparison — early in the argument */}
        <View className="py-24 bg-white border-b border-slate-100">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="max-w-3xl self-center mb-16">
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 text-center">
                {COMPARISON_SECTION.heading}
              </SectionHeading>
              <Text className="text-base text-slate-500 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                {COMPARISON_SECTION.supporting}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-8 max-w-5xl self-center">
              <View className="w-full md:w-[47%] bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                  <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                    <XCircle size={20} color="#ef4444" weight="fill" />
                  </View>
                  <Text className="text-xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {COMPARISON_SECTION.oldHeading}
                  </Text>
                </View>
                {COMPARISON_ROWS.map((row) => (
                  <View key={row.oldWay} className="flex-row items-start gap-3 mb-4">
                    <XCircle size={18} color="#f87171" weight="fill" style={{ marginTop: 2 }} />
                    <Text className="text-sm text-slate-600 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {row.oldWay}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="w-full md:w-[47%] bg-black rounded-2xl p-8 border border-white/10">
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                    <CheckCircle size={20} color="#fff" weight="fill" />
                  </View>
                  <Text className="text-xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {COMPARISON_SECTION.newHeading}
                  </Text>
                </View>
                {COMPARISON_ROWS.map((row) => (
                  <View key={row.platformWay} className="flex-row items-start gap-3 mb-4">
                    <CheckCircle size={18} color="#4ade80" weight="fill" style={{ marginTop: 2 }} />
                    <Text className="text-sm text-slate-300 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {row.platformWay}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Promised land / product proof */}
        <View className="py-20 bg-slate-50 border-b border-slate-100">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="max-w-3xl self-center mb-10">
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 text-center">
                {PROMISED_LAND.heading}
              </SectionHeading>
              <Text className="text-base text-slate-500 text-center leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                {PROMISED_LAND.supporting}
              </Text>
            </View>
            <View className="items-center">
              <PhoneDashboardMockup />
            </View>
          </View>
        </View>

        {/* Service ladder gallery */}
        <PlatformGallerySection
          nativeID="services"
          onLayout={(e) => recordSectionOffset('services', e.nativeEvent.layout.y)}
        />

        {/* How it works */}
        <HowItWorksSection
          nativeID="how-it-works"
          onLayout={(e) => recordSectionOffset('how-it-works', e.nativeEvent.layout.y)}
        />

        {/* Dual audience — diaspora first */}
        <View
          nativeID="diaspora"
          className="py-24 bg-black border-y border-white/10"
          onLayout={(e) => recordSectionOffset('diaspora', e.nativeEvent.layout.y)}
        >
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-16 text-center">
              Built for Nigerians abroad — and useful at home too.
            </SectionHeading>
            <View className="flex-row flex-wrap gap-6">
              <View className="w-full md:w-[48%] bg-black rounded-2xl p-10 border border-white/10">
                <View className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-6">
                  <Airplane size={24} color="#fff" weight="regular" />
                </View>
                <Text className="text-2xl text-white mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Managing property work from abroad?
                </Text>
                <Text className="text-slate-400 leading-relaxed mb-8" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Whether you&apos;re in London, Toronto, Houston, Dubai or elsewhere, distance should not mean surrendering control. Keep scope, stages, evidence and project communication in one structured workflow.
                </Text>
                <Link href={'/book-repair' as any} asChild>
                  <Pressable
                    onPress={() => trackPrimaryCta('diaspora_card', '/book-repair')}
                    className="h-12 px-6 rounded-lg bg-white self-start justify-center bmh-glass-btn bmh-glass-btn-light"
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Start a Tracked Project
                    </Text>
                  </Pressable>
                </Link>
              </View>
              <View className="w-full md:w-[48%] bg-black rounded-2xl p-10 border border-white/10">
                <View className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-6">
                  <MapPin size={24} color="#fff" weight="regular" />
                </View>
                <Text className="text-2xl text-white mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Already in Nigeria?
                </Text>
                <Text className="text-slate-400 leading-relaxed mb-8" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Use the same system to find verified workers and manage repairs, upgrades and renovations with better documentation.
                </Text>
                <Link href={'/location?mode=explore' as any} asChild>
                  <Pressable
                    onPress={() => trackSecondaryCta('local_card', '/location?mode=explore')}
                    className="h-12 px-6 rounded-lg bg-white self-start justify-center bmh-glass-btn bmh-glass-btn-light"
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Find a Verified Worker
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </View>

        {/* Offer */}
        <View className="py-24 bg-white border-b border-slate-100">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="max-w-3xl self-center mb-12">
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 text-center">
                {OFFER_SECTION.heading}
              </SectionHeading>
              <Text className="text-base text-slate-500 text-center leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                {OFFER_SECTION.supporting}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-4 max-w-5xl self-center mb-10">
              {OFFER_SECTION.components.map((item, index) => (
                <View
                  key={item.title}
                  className="w-full sm:w-[47%] lg:w-[23%] lg:flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <Text className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {item.title}
                  </Text>
                  <Text className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>
            <View className="items-center">
              <Link href={OFFER_SECTION.primaryCta.href as any} asChild>
                <Pressable
                  onPress={() => trackPrimaryCta('offer', OFFER_SECTION.primaryCta.href)}
                  className="h-12 px-8 rounded-lg bg-black justify-center bmh-glass-btn bmh-glass-btn-dark"
                  accessibilityRole="link"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {OFFER_SECTION.primaryCta.label}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        {/* Free worksheet */}
        <View className="py-20 bg-slate-50 border-b border-slate-100">
          <View className="max-w-3xl w-full self-center px-6 md:px-12 items-center">
            <Text
              className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {WORKSHEET_SECTION.eyebrow}
            </Text>
            <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 text-center">
              {WORKSHEET_SECTION.heading}
            </SectionHeading>
            <Text className="text-base text-slate-500 text-center leading-relaxed mb-8" style={{ fontFamily: 'Poppins_500Medium' }}>
              {WORKSHEET_SECTION.supporting}
            </Text>
            <Link href={WORKSHEET_SECTION.cta.href as any} asChild>
              <Pressable
                onPress={() => trackWebEvent('worksheet_clicked', { href: WORKSHEET_SECTION.cta.href })}
                className="h-12 px-8 rounded-lg bg-black justify-center bmh-glass-btn bmh-glass-btn-dark"
                accessibilityRole="link"
              >
                <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {WORKSHEET_SECTION.cta.label}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <TestimonialsSection onHowItWorksPress={() => navPress('#how-it-works')} />

        <TrustpilotReviewSection />

        <AgentToolsSection onLayout={(e) => recordSectionOffset('tools', e.nativeEvent.layout.y)} />

        {/* Popular services */}
        <View className="py-16 border-t border-slate-100 bg-white">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <Text className="text-sm text-black mb-6 uppercase tracking-wide" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Popular Services in Nigeria
            </Text>
            <View className="flex-row flex-wrap gap-y-4 gap-x-8">
              {popularLinks.map((link) => (
                <Link key={link.href} href={link.href as any} asChild>
                  <Pressable
                    onPress={() => trackWebEvent('service_category_clicked', { href: link.href })}
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {link.label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        </View>

        {/* Contractor CTA — lower importance */}
        <View
          nativeID="contractors"
          className="py-24 bg-white"
          onLayout={(e) => recordSectionOffset('contractors', e.nativeEvent.layout.y)}
        >
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="bg-slate-50 rounded-3xl p-8 md:p-16 border border-slate-200 max-w-4xl self-center items-center">
              <View className="w-16 h-16 rounded-2xl bg-white border border-slate-200 items-center justify-center mb-6">
                <Hammer size={28} color="#000000" weight="regular" />
              </View>
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-4 text-center">
                Are you a skilled artisan, repairer, renovator, or contractor?
              </SectionHeading>
              <Text className="text-base text-slate-500 max-w-2xl mb-8 text-center leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                Join BuildMyHouse, get verified and become eligible for structured project opportunities.
              </Text>
              <Link href={'/for-contractors' as any} asChild>
                <Pressable
                  onPress={() => trackWebEvent('contractor_cta_clicked', { href: '/for-contractors' })}
                  className="h-12 px-8 rounded-lg bg-black justify-center bmh-glass-btn bmh-glass-btn-dark"
                  accessibilityRole="link"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Get Verified on BuildMyHouse
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        {/* FAQ */}
        <View className="py-24 bg-slate-50 border-t border-slate-100">
          <View className="max-w-3xl w-full self-center px-6 md:px-12">
            <SectionHeading className="text-3xl font-semibold tracking-tight text-black mb-10 text-center">
              Frequently Asked Questions
            </SectionHeading>
            <View className="gap-4">
              {FAQ_ITEMS.map((item) => {
                const open = openFaq === item.question;
                return (
                  <View key={item.question} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <Pressable
                      onPress={() => {
                        const next = open ? null : item.question;
                        setOpenFaq(next);
                        if (next) trackWebEvent('faq_opened', { question: item.question });
                      }}
                      className="flex-row justify-between items-center p-5"
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                    >
                      <Text className="text-black flex-1 pr-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {item.question}
                      </Text>
                      <CaretDown size={18} color="#64748b" weight="bold" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
                    </Pressable>
                    {open ? (
                      <Text className="text-slate-500 text-sm px-5 pb-5 leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {item.answer}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        </WebLandmark>

        {/* Footer — dark CTA card */}
        <WebLandmark tag="footer" className="py-10 md:py-16 bg-white border-t border-slate-100 px-4 sm:px-6">
          <View className="max-w-7xl w-full self-center">
            <View
              className="bmh-footer-card relative overflow-hidden rounded-[40px] border border-white/10 p-6 sm:p-10 md:p-14"
              style={{ backgroundColor: '#0a0a0a' }}
            >
              <FooterHeadline />

              <Text className="text-sm md:text-base text-white/60 mt-5 max-w-xl" style={{ fontFamily: 'Poppins_500Medium' }}>
                {FOOTER_CLOSE.supporting}
              </Text>

              <View className="flex-row flex-wrap gap-8 mt-10">
                <View className="w-full md:w-[30%]">
                  <Text className="text-sm text-white/60" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Talk to Us
                  </Text>
                  <Link href={`tel:${BUILDMYHOUSE_CONTACT.phoneTel}` as any} asChild>
                    <Pressable className="flex-row items-center gap-3 mt-2" accessibilityRole="link">
                      <Phone size={20} color="#ffffff" weight="regular" />
                      <Text className="text-xl md:text-2xl text-white tracking-tight" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {BUILDMYHOUSE_CONTACT.phoneDisplay}
                      </Text>
                    </Pressable>
                  </Link>
                </View>

                <View className="w-full md:w-[30%]">
                  <Text className="text-sm text-white/60" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Next step
                  </Text>
                  <Link href={FOOTER_CLOSE.ctaHref as any} asChild>
                    <Pressable
                      onPress={() => trackPrimaryCta('footer', FOOTER_CLOSE.ctaHref)}
                      className="self-start flex-row items-center gap-2 bg-white rounded-full px-5 py-3 mt-2 bmh-glass-btn bmh-glass-btn-light"
                      accessibilityRole="link"
                    >
                      <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {FOOTER_CLOSE.ctaLabel}
                      </Text>
                      <ArrowRight size={16} color="#000000" weight="bold" />
                    </Pressable>
                  </Link>
                </View>

                <View className="w-full md:w-[30%]">
                  <Text className="text-sm text-white/60" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Follow Along
                  </Text>
                  <View className="flex-row flex-wrap items-center gap-3 mt-2">
                    {BUILDMYHOUSE_SOCIALS.map((social) => (
                      <Pressable
                        key={social.id}
                        onPress={() => Linking.openURL(social.href)}
                        accessibilityRole="link"
                        accessibilityLabel={social.label}
                        className="w-12 h-12 rounded-full bg-white items-center justify-center bmh-glass-btn bmh-glass-btn-light"
                      >
                        <SocialBrandIcon brand={social.id as SocialBrandId} size={20} color="#000000" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View className="h-px bg-white/10 mt-10" />

              <View className="flex-row flex-wrap gap-8 mt-8">
                <View className="w-full md:w-[48%]">
                  <Text className="text-sm text-white/60" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Explore
                  </Text>
                  <View className="flex-row flex-wrap mt-3">
                    {NAV_ITEMS.map((item) => (
                      <View key={item.label} className="w-1/2 mb-2 pr-2">
                        {item.href.startsWith('#') ? (
                          <Pressable onPress={() => navPress(item.href)} accessibilityRole="button">
                            <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                              {item.label}
                            </Text>
                          </Pressable>
                        ) : (
                          <Link href={item.href as any} asChild>
                            <Pressable accessibilityRole="link">
                              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                                {item.label}
                              </Text>
                            </Pressable>
                          </Link>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                <View className="w-full md:w-[48%]">
                  <Text className="text-sm text-white/60" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Fine Print
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

              <Link
                href={`https://maps.google.com/?q=${encodeURIComponent(BUILDMYHOUSE_CONTACT.mapsQuery)}` as any}
                asChild
              >
                <Pressable className="flex-row items-start gap-2 mt-8 self-start max-w-lg" accessibilityRole="link">
                  <MapPin size={16} color="rgba(255,255,255,0.5)" weight="regular" style={{ marginTop: 2 }} />
                  <Text className="text-xs text-white/50 flex-1 leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {BUILDMYHOUSE_CONTACT.address}
                  </Text>
                </Pressable>
              </Link>

              <Text className="text-xs text-white/70 text-center mt-6" style={{ fontFamily: 'Poppins_500Medium' }}>
                © {new Date().getFullYear()} BuildMyHouse — Built with care in Lagos, Nigeria
              </Text>
            </View>
          </View>
        </WebLandmark>
      </ScrollView>
    </View>
  );
}
