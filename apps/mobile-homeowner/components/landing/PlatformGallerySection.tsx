import { createElement, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowUpRight, ArrowSquareOut } from 'phosphor-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { PLATFORM_LADDER_GALLERY } from '@/lib/home-landing-content';

type PlatformGallerySectionProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
};

function GalleryHeadline() {
  if (Platform.OS === 'web') {
    return createElement(
      'h2',
      {
        className:
          'mx-auto max-w-3xl text-center bmh-gallery-fade-in text-3xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-white',
        style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
      },
      'What can you do on ',
      createElement(
        'span',
        {
          className: 'block bmh-platform-gradient-text',
          style: { fontFamily: 'Poppins_600SemiBold' },
        },
        'BuildMyHouse?',
      ),
    );
  }

  return (
    <View className="max-w-3xl self-center">
      <SeoHeading
        level={2}
        className="text-3xl leading-tight tracking-tight text-white text-center"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        What can you do on BuildMyHouse?
      </SeoHeading>
    </View>
  );
}

function CardLabel({ title }: { title: string }) {
  return (
    <View className="absolute -top-3 left-3 z-20 bg-white rounded-full px-3 py-1.5 flex-row items-center gap-1 shadow-sm">
      <Text className="text-xs text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {title}
      </Text>
      <ArrowUpRight size={12} color="#000000" weight="bold" />
    </View>
  );
}

export default function PlatformGallerySection({ onLayout }: PlatformGallerySectionProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cardWidth = isDesktop ? 168 : isTablet ? 148 : 136;
  const cardHeight = Math.round(cardWidth * (4 / 3));

  const renderCard = (item: (typeof PLATFORM_LADDER_GALLERY)[number], index: number) => {
    const isHovered = hoveredIndex === index;
    const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
    const layout = isDesktop ? item.layout : { rotate: index % 2 === 0 ? -2 : 2, translateY: 4 };

    return (
      <Link key={item.href} href={item.href as any} asChild>
        <Pressable
          onHoverIn={Platform.OS === 'web' ? () => setHoveredIndex(index) : undefined}
          onHoverOut={Platform.OS === 'web' ? () => setHoveredIndex((current) => (current === index ? null : current)) : undefined}
          accessibilityRole="link"
          accessibilityLabel={`${item.title}. ${item.description}`}
          style={{
            width: cardWidth,
            marginRight: isDesktop ? 0 : 12,
            opacity: isDimmed ? 0.42 : 1,
            transform: [
              { rotate: `${layout.rotate}deg` },
              { translateY: isHovered ? layout.translateY - 6 : layout.translateY },
              { scale: isHovered ? 1.05 : 1 },
            ],
            zIndex: isHovered ? 20 : 10 - Math.abs(index - 2),
          }}
          className="bmh-platform-card relative"
        >
          <CardLabel title={item.title} />
          <View
            className="overflow-hidden rounded-2xl border border-white/10 bg-black"
            style={{
              width: cardWidth,
              height: cardHeight,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: isHovered ? 0.45 : 0.28,
              shadowRadius: isHovered ? 24 : 14,
              elevation: 8,
            }}
          >
            <Image
              source={item.image}
              contentFit="cover"
              contentPosition={item.imageFocus ?? 'center'}
              style={{ width: '100%', height: '100%' }}
              accessibilityLabel={item.title}
              transition={200}
            />
          </View>
        </Pressable>
      </Link>
    );
  };

  return (
    <View className="bg-black py-20 md:py-28" onLayout={onLayout}>
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <GalleryHeadline />

        <View className="mt-12 md:mt-16 max-w-5xl w-full self-center">
          {isDesktop ? (
            <View className="flex-row items-end justify-center gap-3 md:gap-4 bmh-gallery-fade-in-delayed">
              {PLATFORM_LADDER_GALLERY.map((item, index) => renderCard(item, index))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 16, paddingBottom: 8 }}
              className="bmh-gallery-fade-in-delayed"
            >
              {PLATFORM_LADDER_GALLERY.map((item, index) => renderCard(item, index))}
            </ScrollView>
          )}
        </View>

        <Text
          className="mx-auto mt-8 max-w-xl text-center text-base text-neutral-400 leading-relaxed bmh-gallery-fade-in-late"
          style={{ fontFamily: 'Poppins_500Medium' }}
        >
          From urgent Friday evening plumbing disasters to full ground-up builds. Start small, build trust, scale up.
        </Text>

        <View className="mt-8 flex-row flex-wrap items-center justify-center gap-3 bmh-gallery-fade-in-late">
          <Link href={'/location?mode=explore' as any} asChild>
            <Pressable
              className="h-11 px-6 rounded-full bg-white justify-center min-w-[180px] bmh-platform-primary-cta"
              accessibilityRole="link"
            >
              <Text className="text-sm text-black text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Find a Verified Worker
              </Text>
            </Pressable>
          </Link>
          <Link href={'/services/home-renovation-nigeria' as any} asChild>
            <Pressable
              className="h-11 px-5 rounded-full border border-white/15 justify-center flex-row items-center gap-2 bmh-platform-secondary-cta"
              accessibilityRole="link"
            >
              <Text className="text-sm text-neutral-100" style={{ fontFamily: 'Poppins_500Medium' }}>
                Browse service guides
              </Text>
              <ArrowSquareOut size={15} color="#e5e5e5" weight="regular" />
            </Pressable>
          </Link>
        </View>

        {/* Crawlable text links for SEO — compact, not a second grid */}
        <View className="mt-10 flex-row flex-wrap justify-center gap-x-5 gap-y-2 px-2">
          {PLATFORM_LADDER_GALLERY.map((item) => (
            <Link key={`seo-${item.href}`} href={item.href as any} asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-xs text-neutral-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {item.title} in Lagos, Nigeria
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </View>
  );
}
