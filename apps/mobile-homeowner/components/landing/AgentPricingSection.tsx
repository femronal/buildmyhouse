import { createElement, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  AppWindow,
  ArrowUpRight,
  Drop,
  HouseLine,
  Lightning,
  Waves,
  type Icon,
} from 'phosphor-react-native';
import WebLandmark from '@/components/seo/WebLandmark';
import { PLATFORM_SERVICE_FEE_OFFER, REPAIR_PRICING_GUIDE } from '@/lib/agent-seo-content';

function formatNgn(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

const PRICING_ICONS: Icon[] = [Drop, Lightning, HouseLine, Waves, AppWindow];

type PricingGuideItem = (typeof REPAIR_PRICING_GUIDE)[number];

function SemanticHeading({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: object;
}) {
  if (Platform.OS === 'web') {
    return createElement('h3', { className, style: { margin: 0, ...style } }, children);
  }

  return (
    <Text accessibilityRole="header" className={className} style={style}>
      {children}
    </Text>
  );
}

function PricingServiceCard({ item, index }: { item: PricingGuideItem; index: number }) {
  const IconComponent = PRICING_ICONS[index] ?? Drop;
  const indexLabel = `{ ${String(index + 1).padStart(2, '0')} }`;
  const priceLabel = `${formatNgn(item.lowNgn)} – ${formatNgn(item.highNgn)} ${item.unit}`;
  const feeLabel = `Platform fee: ${formatNgn(PLATFORM_SERVICE_FEE_OFFER.price)}`;

  const card = (
    <View className="bmh-pricing-card group h-full">
      <Text className="bmh-pricing-card-index text-[11px] text-neutral-400" style={{ fontFamily: 'Poppins_400Regular' }}>
        {indexLabel}
      </Text>

      <View className="mt-6">
        <View className="bmh-pricing-card-icon h-10 w-10 rounded-lg bg-neutral-100 items-center justify-center">
          <IconComponent size={20} color="#171717" weight="regular" />
        </View>

        <SemanticHeading
          className="mt-4 text-neutral-900 text-base tracking-tight bmh-pricing-card-title"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          {item.service}
        </SemanticHeading>

        <Text
          className="mt-2 text-neutral-800 text-sm bmh-pricing-card-price"
          style={{ fontFamily: 'JetBrainsMono_500Medium' }}
        >
          {priceLabel}
        </Text>

        <Text className="mt-1 text-neutral-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
          {feeLabel}
        </Text>

        <Text className="mt-3 text-neutral-500 text-sm leading-relaxed bmh-pricing-card-note" style={{ fontFamily: 'Poppins_400Regular' }}>
          {item.note}
        </Text>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return createElement('li', { className: 'bmh-pricing-grid-item' }, createElement('article', null, card));
  }

  return card;
}

function FeaturedBookCard() {
  const card = (
    <Link href={'/book-repair' as any} asChild>
      <Pressable
        className="bmh-pricing-card-featured group h-full min-h-[220px]"
        accessibilityRole="link"
        accessibilityLabel="Book repair online — verified contractors with milestone payments"
      >
        <View className="relative z-[1] flex-1">
          <Text className="text-[11px] text-white/75" style={{ fontFamily: 'Poppins_400Regular' }}>
            {'{ 06 }'}
          </Text>

          <Text className="mt-6 text-white text-base tracking-tight" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Book repair online
          </Text>
          <Text className="mt-2 text-white/85 text-sm leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
            Verified contractors · Milestone payments · Platform fee ₦0 for now
          </Text>

          <View className="mt-8 h-9 w-9 rounded-full bg-white items-center justify-center bmh-pricing-card-featured-btn">
            <ArrowUpRight size={16} color="#171717" weight="bold" />
          </View>
        </View>
      </Pressable>
    </Link>
  );

  if (Platform.OS === 'web') {
    return createElement('li', { className: 'bmh-pricing-grid-item' }, createElement('article', null, card));
  }

  return card;
}

function PricingGrid() {
  const cards = (
    <>
      {REPAIR_PRICING_GUIDE.map((item, index) => (
        <PricingServiceCard key={item.service} item={item} index={index} />
      ))}
      <FeaturedBookCard />
    </>
  );

  if (Platform.OS === 'web') {
    return createElement('ul', { className: 'bmh-pricing-grid' }, cards);
  }

  return <View className="bmh-pricing-grid">{cards}</View>;
}

export default function AgentPricingSection() {
  return (
    <WebLandmark tag="section" id="pricing" className="py-16 md:py-24 bg-white border-t border-neutral-100">
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <View className="items-center mb-8 md:mb-10">
          {Platform.OS === 'web'
            ? createElement(
                'p',
                {
                  className: 'text-neutral-500 text-xs uppercase tracking-[0.2em] mb-2 text-center',
                  style: { fontFamily: 'Poppins_500Medium', margin: 0 },
                },
                'Nigeria repair ranges',
              )
            : (
                <Text
                  className="text-neutral-500 text-xs uppercase tracking-widest mb-2 text-center"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  Nigeria repair ranges
                </Text>
              )}

          {Platform.OS === 'web'
            ? createElement(
                'h2',
                {
                  className: 'text-3xl md:text-4xl text-black tracking-tight text-center',
                  style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
                },
                'Repair pricing you can compare',
              )
            : (
                <Text
                  accessibilityRole="header"
                  className="text-3xl text-black tracking-tight text-center"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Repair pricing you can compare
                </Text>
              )}

          {Platform.OS === 'web'
            ? createElement(
                'p',
                {
                  className: 'text-base text-neutral-600 max-w-2xl mt-4 leading-relaxed text-center mx-auto',
                  style: { fontFamily: 'Poppins_400Regular', margin: 0 },
                },
                'Directional Nigeria contractor ranges below. BuildMyHouse service fee on repairs is free for now — you pay the verified contractor quote only.',
              )
            : (
                <Text
                  className="text-base text-neutral-600 max-w-2xl mt-4 leading-relaxed text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Directional Nigeria contractor ranges below. BuildMyHouse service fee on repairs is{' '}
                  <Text style={{ fontFamily: 'Poppins_700Bold' }}>free for now</Text> — you pay the verified contractor
                  quote only.
                </Text>
              )}
        </View>

        <PricingGrid />

        <View className="flex-col sm:flex-row gap-3 mt-8 md:mt-10 justify-center">
          <Link href={'/pricing/repairs' as any} asChild>
            <Pressable
              className="h-11 px-5 rounded-lg border border-neutral-200 bg-white items-center justify-center"
              accessibilityRole="link"
            >
              <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                Full pricing guide
              </Text>
            </Pressable>
          </Link>
          <Link href={'/book-repair' as any} asChild>
            <Pressable
              className="h-11 px-5 rounded-lg bg-black items-center justify-center bmh-glass-btn bmh-glass-btn-dark"
              accessibilityRole="link"
            >
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                Book repair online
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </WebLandmark>
  );
}
