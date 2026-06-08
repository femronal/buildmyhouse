import { useMemo } from 'react';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { ArrowRight } from 'phosphor-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { cardShadowStyle } from '@/lib/card-styles';
import {
  LANDING_BORDER,
  LANDING_INK,
  LANDING_MUTED,
  PLATFORM_CARDS,
  PLATFORM_LADDER,
  POPULAR_SERVICE_LINKS,
} from '@/lib/home-landing-content';

type ServiceGridProps = {
  searchQuery: string;
};

function columnsFor(width: number) {
  if (width >= 1200) return 3;
  if (width >= 760) return 2;
  return 1;
}

export default function ServiceGrid({ searchQuery }: ServiceGridProps) {
  const { width } = useWindowDimensions();
  const columns = columnsFor(width);
  const gap = width >= 760 ? 16 : 0;

  const filteredCards = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return PLATFORM_CARDS;
    return PLATFORM_CARDS.filter((card) =>
      `${card.title} ${card.description}`.toLowerCase().includes(needle),
    );
  }, [searchQuery]);

  return (
    <View className="mt-14">
      <SeoHeading level={2} className="text-3xl mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        What can you do on BuildMyHouse?
      </SeoHeading>
      <Text className="text-base leading-7 mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
        Start with repairs, then scale to upgrades, renovations, interiors, and full builds using one workflow.
      </Text>

      <View className="flex-row flex-wrap mb-6">
        {PLATFORM_LADDER.map((pillar) => (
          <Link key={pillar.href} href={pillar.href as any} asChild>
            <Pressable
              className="w-full md:w-[48.8%] rounded-2xl border bg-white p-4 mb-3 md:mr-[1.2%]"
              style={{ borderColor: LANDING_BORDER }}
              accessibilityRole="link"
            >
              <Text className="text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                {pillar.title}
              </Text>
              <Text className="text-sm leading-6 mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                {pillar.description}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-xs mr-1" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                  Explore
                </Text>
                <ArrowRight size={14} color={LANDING_INK} weight="bold" />
              </View>
            </Pressable>
          </Link>
        ))}
      </View>

      <SeoHeading level={3} className="text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        Platform previews
      </SeoHeading>
      <Text className="text-sm leading-6 mb-5" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
        Cards below mirror how BuildMyHouse handles scope, verification, stage progress, and evidence.
      </Text>

      <View className="flex-row flex-wrap">
        {filteredCards.map((card, idx) => {
          const isLastCol = columns === 1 ? true : (idx + 1) % columns === 0;
          const widthClass = columns === 1 ? 'w-full' : columns === 2 ? 'w-[48.8%]' : 'w-[32%]';
          return (
            <Link key={card.href} href={card.href as any} asChild>
              <Pressable
                className={`mb-4 border rounded-2xl overflow-hidden bg-white ${widthClass}`}
                style={{
                  ...cardShadowStyle,
                  borderColor: LANDING_BORDER,
                  marginRight: isLastCol ? 0 : gap,
                }}
                accessibilityRole="link"
              >
                <Image source={card.image} resizeMode="cover" style={{ width: '100%', height: 180 }} />
                <View className="p-4">
                  <Text className="text-base mb-1" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                    {card.title}
                  </Text>
                  <Text className="text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                    {card.description}
                  </Text>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </View>

      <SeoHeading level={3} className="text-2xl mt-10 mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        Popular services in Lagos
      </SeoHeading>
      <View className="flex-row flex-wrap">
        {POPULAR_SERVICE_LINKS.map((link) => (
          <Link key={link.href} href={link.href as any} asChild>
            <Pressable
              className="rounded-xl px-3.5 py-2 mr-2 mb-2 border"
              style={{ borderColor: LANDING_BORDER }}
              accessibilityRole="link"
            >
              <Text className="text-sm" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
                {link.label}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
