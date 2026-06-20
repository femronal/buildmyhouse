import { createElement, useEffect, useState } from 'react';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { ArrowUpRight, Camera, ShieldCheck, Star, Wrench } from 'lucide-react-native';
import { SeoContentBackButton } from '@/components/seo/SeoContentLayout';

const HERO_IMAGE = '/electrical-service-hero.jpg';

const STAGE_CARDS = [
  {
    id: 'scope',
    title: 'Scope the fault',
    subtitle: 'Photo intake',
    icon: Camera,
    image: '/plumbing-service-hero.jpg',
  },
  {
    id: 'match',
    title: 'Match verified',
    subtitle: 'Lagos repair pro',
    icon: Wrench,
    image: HERO_IMAGE,
  },
  {
    id: 'approve',
    title: 'Approve stages',
    subtitle: 'Evidence before pay',
    icon: ShieldCheck,
    image: '/engineer-at-buildmyhouse.png',
  },
] as const;

const TRUST_STRIP = ['Plumbing', 'Electrical', 'Roof leaks', 'Drainage'] as const;

function cardState(index: number, active: number, total: number): 'active' | 'next' | 'last' {
  const offset = (index - active + total) % total;
  if (offset === 0) return 'active';
  if (offset === 1) return 'next';
  return 'last';
}

export default function StartRepairHeroPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % STAGE_CARDS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const headline = isDesktop ? (
    createElement(
      'h1',
      {
        className: 'bmh-start-repair-headline text-neutral-900',
        style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
      },
      createElement('span', { className: 'font-light block' }, 'Fix it'),
      createElement(
        'span',
        { className: 'bmh-start-repair-serif italic font-medium block ml-1 md:ml-2', style: { fontFamily: 'Georgia, serif' } },
        'with proof',
      ),
    )
  ) : (
    <Text accessibilityRole="header" className="text-5xl text-neutral-900 leading-[0.95]" style={{ fontFamily: 'Poppins_600SemiBold' }}>
      Fix it{'\n'}
      <Text style={{ fontFamily: 'Georgia', fontStyle: 'italic' }}>with proof</Text>
    </Text>
  );

  return (
    <View className="flex-1 bg-white min-h-screen">
      <View className="absolute top-4 left-4 z-50">
        <SeoContentBackButton fallbackHref="/" />
      </View>

      <View
        className={`bmh-start-repair-grid max-w-6xl w-full self-center mx-auto px-4 md:px-8 ${
          isDesktop ? 'flex-row items-center gap-10 lg:gap-14 py-16 md:py-24' : 'flex-col py-10'
        }`}
      >
        {/* Left */}
        <View className={`${isDesktop ? 'flex-1 max-w-[540px]' : 'w-full'} z-10 flex-col justify-center`}>
          {headline}

          <Text
            className="text-base md:text-lg text-neutral-500 max-w-lg leading-relaxed mt-6 md:mt-8 mb-8 md:mb-10"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Verified workers, staged updates, and photo evidence before you pay — for plumbing, electrical, roof leaks,
            and urgent Lagos repairs.
          </Text>

          <View className="flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-8 mb-10 md:mb-14">
            <Link href={'/choose-project-type' as any} asChild>
              <Pressable
                className="bmh-start-repair-cta group px-7 py-3.5 rounded-xl bg-neutral-900 flex-row items-center gap-2"
                accessibilityRole="link"
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Start your repair
                </Text>
                <ArrowUpRight size={16} color="#ffffff" strokeWidth={2.5} />
              </Pressable>
            </Link>

            <View className="flex-row items-center gap-3.5">
              <View className="flex-row">
                {['#111827', '#374151', '#6B7280'].map((color, index) => (
                  <View
                    key={color}
                    className="w-9 h-9 rounded-full border-2 border-white items-center justify-center"
                    style={{ backgroundColor: color, marginLeft: index === 0 ? 0 : -10 }}
                  >
                    <Text className="text-[9px] text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {['HO', 'GC', 'BM'][index]}
                    </Text>
                  </View>
                ))}
              </View>
              <View>
                <View className="flex-row items-center gap-0.5 mb-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} size={13} color="#111827" fill="#111827" strokeWidth={0} />
                  ))}
                  <Star size={13} color="#D1D5DB" fill="#D1D5DB" strokeWidth={0} />
                </View>
                <Text className="text-[11px] text-neutral-600" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Evidence before payment
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap items-center gap-x-8 gap-y-3 opacity-50">
            {TRUST_STRIP.map((label) => (
              <Text key={label} className="text-sm text-neutral-800" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* Right visual — Aura-style portrait panel with bottom glass card */}
        <View
          className={`bmh-start-repair-visual relative overflow-hidden bg-neutral-100 ${
            isDesktop ? 'w-full max-w-[380px] shrink-0' : 'w-full mt-8'
          }`}
        >
          <Image
            source={{ uri: HERO_IMAGE }}
            accessibilityLabel="Verified electrician working on a Lagos home repair"
            className="absolute inset-0 w-full h-full bmh-start-repair-hero-image"
            resizeMode="contain"
          />

          <View className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-24 bmh-start-repair-visual-fade pointer-events-none">
            <View className="relative w-full h-[248px] bmh-start-repair-stack">
              {STAGE_CARDS.map((card, index) => {
                const state = cardState(index, activeCard, STAGE_CARDS.length);
                const Icon = card.icon;
                const isActive = state === 'active';

                return (
                  <View
                    key={card.id}
                    className={`bmh-start-repair-stack-card bmh-start-repair-stack-card--${state} absolute inset-x-0 bottom-0 rounded-[1.35rem] p-4 border border-white/15`}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-3">
                        <View className="w-9 h-9 rounded-lg border border-white/10 bg-white/10 items-center justify-center">
                          <Icon size={16} color="#fafafa" strokeWidth={2} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[13px] text-white leading-tight" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {card.title}
                          </Text>
                          <Text className="text-[11px] text-zinc-300 mt-0.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                            {card.subtitle}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[11px] text-zinc-200" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>

                    <View className="w-full h-[72px] rounded-lg overflow-hidden border border-white/10 bg-zinc-900/40 mb-3">
                      <Image source={{ uri: card.image }} className="w-full h-full" resizeMode="cover" />
                    </View>

                    <View className="w-full h-0.5 overflow-hidden rounded-full bg-white/15 mb-3">
                      {isActive ? (
                        <View className="h-full bg-white rounded-full bmh-start-repair-progress" />
                      ) : (
                        <View className="h-full w-[18%] bg-white/30 rounded-full" />
                      )}
                    </View>

                    {isActive ? (
                      <View className="rounded-full px-3 py-1.5 flex-row items-center gap-2 self-start border border-white/10 bg-black/30">
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <Text className="text-[10px] text-neutral-100" style={{ fontFamily: 'Poppins_500Medium' }}>
                          Tracked repair stages — scope, match, approve
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
