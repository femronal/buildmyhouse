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
        className={`bmh-start-repair-grid max-w-5xl w-full self-center mx-auto my-10 md:my-20 px-4 md:px-8 ${
          isDesktop ? 'flex-row' : 'flex-col'
        }`}
        style={{ minHeight: isDesktop ? 600 : undefined }}
      >
        {/* Left */}
        <View className={`${isDesktop ? 'w-[58%]' : 'w-full'} z-10 flex-col justify-center py-8 md:py-12 md:pr-8`}>
          {headline}

          <Text
            className="text-base md:text-lg text-neutral-500 max-w-xl leading-relaxed mt-8 mb-10"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Verified workers, staged updates, and photo evidence before you pay — for plumbing, electrical, roof leaks,
            and urgent Lagos repairs.
          </Text>

          <View className="flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8 mb-12 md:mb-16">
            <Link href={'/choose-project-type' as any} asChild>
              <Pressable
                className="bmh-start-repair-cta group px-8 py-4 rounded-lg bg-neutral-900 flex-row items-center gap-2"
                accessibilityRole="link"
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Start your repair
                </Text>
                <ArrowUpRight size={16} color="#ffffff" strokeWidth={2.5} />
              </Pressable>
            </Link>

            <View className="flex-row items-center gap-4">
              <View className="flex-row -space-x-3">
                {['#111827', '#374151', '#6B7280'].map((color, index) => (
                  <View
                    key={color}
                    className="w-10 h-10 rounded-full border-2 border-white items-center justify-center"
                    style={{ backgroundColor: color, marginLeft: index === 0 ? 0 : -12 }}
                  >
                    <Text className="text-[10px] text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {['HO', 'GC', 'BM'][index]}
                    </Text>
                  </View>
                ))}
              </View>
              <View>
                <View className="flex-row items-center gap-0.5 mb-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} size={14} color="#111827" fill="#111827" strokeWidth={0} />
                  ))}
                  <Star size={14} color="#D1D5DB" fill="#D1D5DB" strokeWidth={0} />
                </View>
                <Text className="text-xs text-neutral-600" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Evidence before payment
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap items-center gap-6 opacity-60">
            {TRUST_STRIP.map((label) => (
              <Text key={label} className="text-sm text-neutral-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* Right visual */}
        <View
          className={`bmh-start-repair-visual relative overflow-hidden bg-neutral-50/50 ${
            isDesktop ? 'w-[42%] min-h-[600px]' : 'w-full h-[500px] mt-4'
          } rounded-2xl`}
        >
          <Image
            source={{ uri: HERO_IMAGE }}
            accessibilityLabel="Verified electrician working on a Lagos home repair"
            className="absolute inset-0 w-full h-full bmh-start-repair-hero-image"
            resizeMode="contain"
          />

          <View className="absolute top-1/2 left-1/2 w-[420px] h-[420px] -ml-[210px] -mt-[210px] rounded-full bmh-start-repair-glow opacity-70" />

          {/* Glass stripes */}
          <View className="absolute inset-0 flex-row pointer-events-none">
            <View className="w-1/4 h-full border-r border-white/10" />
            <View className="w-1/4 h-full border-r border-white/10 bg-white/5" />
            <View className="w-1/4 h-full border-r border-white/10 bg-white/10" />
            <View className="w-1/4 h-full bg-white/15" />
          </View>

          {/* Stacked cards */}
          <View className="absolute inset-x-0 bottom-8 md:bottom-10 items-center justify-end pointer-events-none z-30">
            <View className="w-72 md:w-80 h-64 relative bmh-start-repair-stack">
              {STAGE_CARDS.map((card, index) => {
                const state = cardState(index, activeCard, STAGE_CARDS.length);
                const Icon = card.icon;
                return (
                  <View
                    key={card.id}
                    className={`bmh-start-repair-stack-card bmh-start-repair-stack-card--${state} absolute inset-0 flex-col justify-between rounded-3xl p-5 border border-white/10`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 items-center justify-center">
                          <Icon size={18} color="#f4f4f5" strokeWidth={2} />
                        </View>
                        <View>
                          <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {card.title}
                          </Text>
                          <Text className="text-xs text-zinc-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                            {card.subtitle}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-zinc-50" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>

                    <View className="w-full h-28 rounded-lg overflow-hidden border border-white/5 bg-zinc-800">
                      <Image source={{ uri: card.image }} className="w-full h-full opacity-90" resizeMode="cover" />
                    </View>

                    <View className="w-full h-px mt-4 overflow-hidden rounded-full bg-white/10">
                      {state === 'active' ? (
                        <View className="h-full bg-white rounded-full bmh-start-repair-progress" />
                      ) : (
                        <View className="h-full bg-white/20 rounded-full w-0" />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Caption */}
          <View className="absolute bottom-2 inset-x-0 items-center pointer-events-none z-30">
            <View className="rounded-full px-4 py-1.5 flex-row items-center gap-2 border border-white/10 bg-neutral-950/50">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <Text className="text-xs text-neutral-200" style={{ fontFamily: 'Poppins_500Medium' }}>
                Tracked repair stages — scope, match, approve
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
