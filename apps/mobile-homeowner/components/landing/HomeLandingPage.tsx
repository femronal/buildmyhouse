import { createElement, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Hammer,
  Home,
  MapPin,
  Phone,
  Plane,
  Search,
  ShieldCheck,
  Sofa,
  Sparkles,
  LifeBuoy,
  Wrench,
  XCircle,
} from 'lucide-react-native';
import Logo from '@/components/Logo';
import PhoneDashboardMockup from '@/components/landing/PhoneDashboardMockup';
import LandingMobileNav from '@/components/landing/LandingMobileNav';
import SEOJsonLd from '@/components/landing/SEOJsonLd';
import {
  AUDIENCE_TABS,
  COMPARISON_ROWS,
  FAQ_ITEMS,
  HERO_KEYWORDS,
  HERO_SUBHEADLINE,
  HOW_IT_WORKS_STEPS,
  NAV_ITEMS,
  PLATFORM_LADDER,
  POPULAR_CHIPS,
  POPULAR_SERVICE_LINKS,
  BUILDMYHOUSE_CONTACT,
  type AudienceTab,
} from '@/lib/home-landing-content';

function WebWordSlider() {
  return createElement(
    'span',
    { className: 'bmh-word-slider text-slate-950' },
    createElement(
      'span',
      { className: 'bmh-word-slider-inner' },
      ...HERO_KEYWORDS.map((word) => createElement('span', { key: word }, word)),
    ),
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
    'need-worker': 'Need a worker',
    'get-hired': 'Get hired',
    diaspora: 'From abroad',
  };

  const renderTab = (tab: AudienceTab, compact?: boolean) => {
    const active = tab.key === audience;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onSelect(tab.key)}
        className={`px-3 py-1.5 rounded-md ${active ? 'bg-white border border-slate-200' : ''}`}
      >
        <Text
          className={`text-xs text-center ${active ? 'text-slate-900' : 'text-slate-500'}`}
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
  const [audience, setAudience] = useState<AudienceTab['key']>('need-worker');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_ITEMS[0]?.question ?? null);

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

  const ladderIcons = [Wrench, Sparkles, Home, Sofa, Building2];

  return (
    <View className="flex-1 bg-white bmh-landing-root">
      <SEOJsonLd />
      <ScrollView ref={scrollRef} className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white/90 border-b border-slate-100 bmh-landing-header">
          <View className="max-w-7xl w-full self-center px-6 md:px-12 h-16 flex-row items-center justify-between">
            <View className="flex-row items-center gap-8 flex-1">
              <Link href={'/' as any} asChild>
                <Pressable accessibilityRole="link">
                  <Logo size="md" />
                </Pressable>
              </Link>
              <View className="hidden lg:flex flex-row items-center gap-6">
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
              </View>
            </View>
            <View className="flex-row items-center gap-4">
              <Link href={'/email-login' as any} asChild>
                <Pressable className="hidden md:flex" accessibilityRole="link">
                  <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Log in
                  </Text>
                </Pressable>
              </Link>
              <Link href={'/location?mode=explore' as any} asChild>
                <Pressable className="bg-slate-900 px-4 py-2 rounded-lg" accessibilityRole="link">
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Get Started
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
          {showTabletNav ? <LandingMobileNav onNavPress={navPress} /> : null}
        </View>

        {/* Hero */}
        <View className="pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
          <View
            className="max-w-7xl w-full self-center px-6 md:px-12 bmh-hero-grid"
            style={{
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'flex-start' : 'stretch',
              width: '100%',
            }}
          >
            <View className="bmh-hero-left z-10 gap-8 w-full" style={{ flex: isDesktop ? 5 : undefined }}>
              <AudienceTabBar audience={audience} onSelect={setAudience} isDesktop={isDesktop} />

              <View className="gap-6 mt-6">
                {Platform.OS === 'web' ? (
                  createElement(
                    'h1',
                    {
                      className:
                        'text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-950 leading-[1.1]',
                      style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
                    },
                    'Find verified',
                    createElement('br'),
                    createElement(WebWordSlider),
                    createElement('br'),
                    'in Nigeria.',
                  )
                ) : (
                  <Text
                    accessibilityRole="header"
                    className="text-4xl text-slate-950 leading-tight"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Find verified {HERO_KEYWORDS[0]} in Nigeria.
                  </Text>
                )}

                <Text className="text-base md:text-lg text-slate-500 leading-relaxed max-w-lg" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {HERO_SUBHEADLINE}
                </Text>
              </View>

              <View className="gap-4 w-full max-w-lg mt-6">
                <View className="flex-row items-center w-full bg-white rounded-xl border border-slate-200 px-2">
                  <View className="pl-2 pr-1">
                    <Search size={20} color="#94a3b8" />
                  </View>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="What do you need fixed, upgraded, or built?"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 py-3.5 px-2 text-sm text-slate-900"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  />
                  <Link href={'/location?mode=explore' as any} asChild>
                    <Pressable className="bg-slate-900 p-2 rounded-lg m-1" accessibilityRole="link">
                      <ArrowRight size={18} color="#fff" />
                    </Pressable>
                  </Link>
                </View>

                <View className="flex-row flex-wrap gap-2 pt-1">
                  {POPULAR_CHIPS.slice(0, 5).map((chip) => (
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
                <Link href={'/location?mode=explore' as any} asChild>
                  <Pressable className="h-12 px-6 rounded-lg bg-slate-900 items-center justify-center" accessibilityRole="link">
                    <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Hire a Verified Worker
                    </Text>
                  </Pressable>
                </Link>
                <Link href={'/for-contractors' as any} asChild>
                  <Pressable className="h-12 px-6 rounded-lg bg-white border border-slate-200 items-center justify-center" accessibilityRole="link">
                    <Text className="text-sm text-slate-900" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Get Hired on BuildMyHouse
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <Link href={'/diaspora/build-in-nigeria-from-abroad' as any} asChild>
                <Pressable className="flex-row items-center gap-1 mt-2" accessibilityRole="link">
                  <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Managing from abroad? Start a tracked project
                  </Text>
                  <ArrowRight size={14} color="#64748b" />
                </Pressable>
              </Link>
            </View>

            <View
              className="bmh-hero-right items-center lg:items-end justify-center"
              style={{
                flex: isDesktop ? 7 : undefined,
                width: isDesktop ? undefined : '100%',
                marginTop: isDesktop ? 0 : 48,
                paddingTop: isDesktop ? 8 : 0,
              }}
            >
              <PhoneDashboardMockup />
            </View>
          </View>
        </View>

        {/* Trust bar */}
        <View className="border-y border-slate-100 bg-slate-50 py-10">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <Text className="text-xs text-center text-slate-500 mb-6 uppercase tracking-widest" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Built to help property owners move from unclear promises to structured property work
            </Text>
            <View className="flex-row flex-wrap justify-center gap-6 md:gap-12">
              {[
                { icon: ShieldCheck, label: 'Verified Workers' },
                { icon: ClipboardList, label: 'Scope Before Work' },
                { icon: Camera, label: 'Evidence Before Payment' },
                { icon: LifeBuoy, label: 'Dispute Support' },
              ].map(({ icon: Icon, label }) => (
                <View key={label} className="flex-row items-center gap-2">
                  <Icon size={20} color="#94a3b8" />
                  <Text className="text-sm text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Service ladder */}
        <View className="py-24" onLayout={(e) => recordSectionOffset('services', e.nativeEvent.layout.y)}>
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="max-w-2xl mb-16">
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-4">
                What can you do on BuildMyHouse?
              </SectionHeading>
              <Text className="text-base text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                From urgent Friday evening plumbing disasters to full ground-up builds. Start small, build trust, scale up.
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-6">
              {PLATFORM_LADDER.map((item, idx) => {
                const Icon = ladderIcons[idx] ?? Wrench;
                return (
                  <Link key={item.href} href={item.href as any} asChild>
                    <Pressable className="w-full md:w-[48%] lg:w-[31%] p-8 rounded-2xl border border-slate-200 bg-white" accessibilityRole="link">
                      <View className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center mb-6">
                        <Icon size={24} color="#0f172a" />
                      </View>
                      <Text className="text-lg text-slate-950 mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {item.title}
                      </Text>
                      <Text className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {item.description}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          </View>
        </View>

        {/* WhatsApp comparison */}
        <View className="py-24 bg-slate-50 border-y border-slate-100">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="max-w-3xl self-center mb-16">
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-4 text-center">
                Stop managing property work with scattered WhatsApp messages.
              </SectionHeading>
              <Text className="text-base text-slate-500 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                WhatsApp is useful for talking. But when money, scope, stages, materials, and approvals are involved, you need more structure.
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-8 max-w-5xl self-center">
              <View className="w-full md:w-[47%] bg-white rounded-2xl p-8 border border-slate-200">
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                  <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                    <XCircle size={20} color="#ef4444" />
                  </View>
                  <Text className="text-xl text-slate-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    The Old Way
                  </Text>
                </View>
                {COMPARISON_ROWS.slice(0, 5).map((row) => (
                  <View key={row.oldWay} className="flex-row items-start gap-3 mb-4">
                    <XCircle size={18} color="#f87171" style={{ marginTop: 2 }} />
                    <Text className="text-sm text-slate-600 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {row.oldWay}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="w-full md:w-[47%] bg-slate-900 rounded-2xl p-8 border border-slate-800">
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-slate-800">
                  <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                    <CheckCircle size={20} color="#fff" />
                  </View>
                  <Text className="text-xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    The BuildMyHouse Way
                  </Text>
                </View>
                {COMPARISON_ROWS.map((row) => (
                  <View key={row.platformWay} className="flex-row items-start gap-3 mb-4">
                    <CheckCircle size={18} color="#4ade80" style={{ marginTop: 2 }} />
                    <Text className="text-sm text-slate-300 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {row.platformWay}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View className="py-24" onLayout={(e) => recordSectionOffset('how-it-works', e.nativeEvent.layout.y)}>
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-16 text-center">
              How BuildMyHouse works
            </SectionHeading>
            <View className="flex-row flex-wrap gap-8">
              {HOW_IT_WORKS_STEPS.map((step, idx) => (
                <View key={step.title} className="w-full md:w-[22%] items-center">
                  <View className="w-16 h-16 rounded-full bg-white border border-slate-200 items-center justify-center mb-6">
                    <Text className="text-xl text-slate-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text className="text-lg text-slate-900 mb-2 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {step.title.replace(/^Step \d+: /, '')}
                  </Text>
                  <Text className="text-sm text-slate-500 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {step.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Dual audience */}
        <View className="py-24 bg-slate-950 border-y border-slate-900">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-16 text-center">
              Built for Nigerians at home and abroad
            </SectionHeading>
            <View className="flex-row flex-wrap gap-6">
              <View className="w-full md:w-[48%] bg-slate-900 rounded-2xl p-10 border border-slate-800">
                <View className="w-12 h-12 rounded-xl bg-slate-800 items-center justify-center mb-6">
                  <MapPin size={24} color="#fff" />
                </View>
                <Text className="text-2xl text-white mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Need a reliable repairer without stories?
                </Text>
                <Text className="text-slate-400 leading-relaxed mb-8" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Use BuildMyHouse to find verified workers for repairs, upgrades, renovations, and property fixes around you.
                </Text>
                <Link href={'/location?mode=explore' as any} asChild>
                  <Pressable className="h-12 px-6 rounded-lg bg-white self-start justify-center" accessibilityRole="link">
                    <Text className="text-sm text-slate-950" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Find a Verified Worker
                    </Text>
                  </Pressable>
                </Link>
              </View>
              <View
                className="w-full md:w-[48%] bg-slate-900 rounded-2xl p-10 border border-slate-800"
                onLayout={(e) => recordSectionOffset('diaspora', e.nativeEvent.layout.y)}
              >
                <View className="w-12 h-12 rounded-xl bg-slate-800 items-center justify-center mb-6">
                  <Plane size={24} color="#fff" />
                </View>
                <Text className="text-2xl text-white mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Managing property work from abroad?
                </Text>
                <Text className="text-slate-400 leading-relaxed mb-8" style={{ fontFamily: 'Poppins_500Medium' }}>
                  If you live in the UK, US, Canada, UAE, or Europe, distance should not mean losing control. Track stages, evidence, and communication in one place.
                </Text>
                <Link href={'/diaspora/build-in-nigeria-from-abroad' as any} asChild>
                  <Pressable className="h-12 px-6 rounded-lg bg-white self-start justify-center" accessibilityRole="link">
                    <Text className="text-sm text-slate-950" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Start a Tracked Project
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </View>

        {/* Contractor CTA */}
        <View className="py-24 bg-white" onLayout={(e) => recordSectionOffset('contractors', e.nativeEvent.layout.y)}>
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <View className="bg-slate-50 rounded-3xl p-8 md:p-16 border border-slate-200 max-w-4xl self-center items-center">
              <View className="w-16 h-16 rounded-2xl bg-white border border-slate-200 items-center justify-center mb-6">
                <Hammer size={28} color="#0f172a" />
              </View>
              <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-4 text-center">
                Are you a skilled artisan, repairer, renovator, or contractor?
              </SectionHeading>
              <Text className="text-base text-slate-500 max-w-2xl mb-8 text-center leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                Join BuildMyHouse, get verified, receive better project requests, and build trust with homeowners who value documented work.
              </Text>
              <Link href={'/for-contractors' as any} asChild>
                <Pressable className="h-12 px-8 rounded-lg bg-slate-900 justify-center" accessibilityRole="link">
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Get Hired on BuildMyHouse
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        {/* Popular services */}
        <View className="py-16 border-t border-slate-100 bg-white">
          <View className="max-w-7xl w-full self-center px-6 md:px-12">
            <Text className="text-sm text-slate-900 mb-6 uppercase tracking-wide" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Popular Services in Nigeria
            </Text>
            <View className="flex-row flex-wrap gap-y-4 gap-x-8">
              {POPULAR_SERVICE_LINKS.map((link) => (
                <Link key={link.href} href={link.href as any} asChild>
                  <Pressable accessibilityRole="link">
                    <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {link.label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        </View>

        {/* FAQ */}
        <View className="py-24 bg-slate-50 border-t border-slate-100">
          <View className="max-w-3xl w-full self-center px-6 md:px-12">
            <SectionHeading className="text-3xl font-semibold tracking-tight text-slate-950 mb-10 text-center">
              Frequently Asked Questions
            </SectionHeading>
            <View className="gap-4">
              {FAQ_ITEMS.map((item) => {
                const open = openFaq === item.question;
                return (
                  <View key={item.question} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <Pressable
                      onPress={() => setOpenFaq(open ? null : item.question)}
                      className="flex-row justify-between items-center p-5"
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                    >
                      <Text className="text-slate-900 flex-1 pr-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {item.question}
                      </Text>
                      <ChevronDown size={18} color="#64748b" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
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

        {/* Final CTA */}
        <View className="py-24 bg-white border-t border-slate-100 items-center px-6 md:px-12">
          <SectionHeading className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-6 text-center">
            Ready to fix, upgrade, renovate, or build in Nigeria?
          </SectionHeading>
          <Text className="text-base text-slate-500 mb-8 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
            Start with BuildMyHouse.
          </Text>
          <Link href={'/location?mode=explore' as any} asChild>
            <Pressable className="h-12 px-8 rounded-lg bg-slate-900 justify-center" accessibilityRole="link">
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                Start Your Project
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Footer */}
        <View className="bg-white border-t border-slate-100 py-12 px-6 md:px-12">
          <View className="max-w-7xl w-full self-center gap-8">
            <View className="flex-row flex-wrap justify-between items-center gap-6">
              <Logo size="sm" />
              <View className="flex-row gap-6">
                <Link href={'/terms-conditions' as any} asChild>
                  <Pressable accessibilityRole="link">
                    <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Terms
                    </Text>
                  </Pressable>
                </Link>
                <Link href={'/privacy-security' as any} asChild>
                  <Pressable accessibilityRole="link">
                    <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Privacy
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            <View className="gap-3">
              <Link
                href={`https://maps.google.com/?q=${encodeURIComponent(BUILDMYHOUSE_CONTACT.mapsQuery)}` as any}
                asChild
              >
                <Pressable className="flex-row items-start gap-2.5 max-w-lg" accessibilityRole="link">
                  <MapPin size={16} color="#64748b" style={{ marginTop: 2 }} />
                  <Text className="text-sm text-slate-500 flex-1 leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {BUILDMYHOUSE_CONTACT.address}
                  </Text>
                </Pressable>
              </Link>
              <Link href={`tel:${BUILDMYHOUSE_CONTACT.phoneTel}` as any} asChild>
                <Pressable className="flex-row items-center gap-2.5 self-start" accessibilityRole="link">
                  <Phone size={16} color="#64748b" />
                  <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {BUILDMYHOUSE_CONTACT.phoneDisplay}
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Text className="text-xs text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
              © {new Date().getFullYear()} BuildMyHouse. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
