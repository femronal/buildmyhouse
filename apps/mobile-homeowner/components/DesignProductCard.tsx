import { View, Text, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, Heart, Star } from 'phosphor-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

const CARD_BG = '#151515';

/** Resolve a full image URL from the backend. */
export const getDesignImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const backendOrigin = apiUrl
    ? apiUrl.replace(/\/api\/?$/, '')
    : (__DEV__ ? 'http://localhost:3001' : 'https://api.buildmyhouse.app');
  return `${backendOrigin}${imageUrl}`;
};

type UiProjectTag = 'repair' | 'upgrades' | 'renovation' | 'full_builds';

const resolveUiProjectTag = (design: any): UiProjectTag => {
  const explicitTag = `${design?.projectTypeTag || ''}`.toLowerCase();
  if (explicitTag === 'repair') return 'repair';
  if (explicitTag === 'upgrades') return 'upgrades';
  if (explicitTag === 'renovation') return 'renovation';
  if (explicitTag === 'full_builds') return 'full_builds';

  const legacyPlanType = `${design?.planType || ''}`.toLowerCase();
  if (legacyPlanType === 'interior_design') return 'upgrades';
  if (legacyPlanType === 'homebuilding') return 'full_builds';
  return 'renovation';
};

const formatTagLabel = (tag: UiProjectTag) => {
  if (tag === 'repair') return 'Repair';
  if (tag === 'upgrades') return 'Upgrade';
  if (tag === 'renovation') return 'Renovation';
  return 'Full Build';
};

export type DesignProductCardProps = {
  design: any;
  width: number;
  height?: number;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  activeImageIndex?: number;
  onImageScroll?: (event: any) => void;
};

/**
 * Editorial product card — full-bleed photo on a dark canvas, fade-to-black footer
 * with GC attribution, title, meta, price, and category. Links to project details.
 */
export default function DesignProductCard({
  design,
  width,
  height = 420,
  onPress,
  isFavorite,
  onToggleFavorite,
  activeImageIndex = 0,
  onImageScroll,
}: DesignProductCardProps) {
  const images = design.images || [];
  const squareMeters = Math.round(design.squareMeters || (design.squareFootage || 0) * 0.092903);
  const gcName = `${design?.createdBy?.fullName || ''}`.trim();
  const kicker = gcName ? `By ${gcName}` : 'Verified GC scope';
  const categoryLabel = `${design?.projectTypeFilter || ''}`.trim() || formatTagLabel(resolveUiProjectTag(design));
  const rating = design.rating ? Number(design.rating).toFixed(1) : '0.0';
  const gradientId = `bmh-card-fade-${design.id}`;

  const metaParts = [
    `${design.bedrooms ?? 0} bed`,
    `${design.bathrooms ?? 0} bath`,
    squareMeters ? `${squareMeters} m²` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      className="bmh-product-card rounded-[28px] overflow-hidden"
      style={{ width, height, backgroundColor: CARD_BG, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
      accessibilityRole="button"
      accessibilityLabel={`${design.name} — view project details`}
    >
      {/* Full-bleed image (swipeable when multiple) */}
      <View style={StyleSheet.absoluteFill}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onImageScroll}
            scrollEventThrottle={16}
          >
            {images.map((image: any, index: number) => (
              <Image
                key={image.id || index}
                source={{ uri: getDesignImageUrl(image.url) }}
                className="bmh-product-card-img"
                style={{ width, height, opacity: 0.85 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={{ width, height }} className="items-center justify-center bg-white/5">
            <Text className="text-white/30 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              No photos yet
            </Text>
          </View>
        )}
      </View>

      {/* Bottom fade for readability */}
      <Svg
        pointerEvents="none"
        width="100%"
        height="65%"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      >
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CARD_BG} stopOpacity="0" />
            <Stop offset="0.55" stopColor={CARD_BG} stopOpacity="0.78" />
            <Stop offset="1" stopColor={CARD_BG} stopOpacity="0.97" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>

      {/* Favorite (optional) */}
      {onToggleFavorite ? (
        <TouchableOpacity
          onPress={onToggleFavorite}
          className="absolute top-4 left-4 w-10 h-10 rounded-full border border-white/20 bg-black/30 items-center justify-center"
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={18} color="#ffffff" weight={isFavorite ? 'fill' : 'regular'} />
        </TouchableOpacity>
      ) : null}

      {/* Open-details arrow */}
      <View
        pointerEvents="none"
        className="bmh-product-card-arrow absolute top-4 right-4 w-10 h-10 rounded-full border border-white/20 bg-white/5 items-center justify-center"
      >
        <ArrowUpRight size={18} color="#ffffff" weight="regular" />
      </View>

      {/* Dots indicator */}
      {images.length > 1 ? (
        <View pointerEvents="none" className="absolute top-6 self-center flex-row">
          {images.slice(0, 5).map((_: any, index: number) => (
            <View
              key={index}
              className={`w-1.5 h-1.5 rounded-full mx-0.5 ${index === activeImageIndex ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </View>
      ) : null}

      {/* Bottom content */}
      <View pointerEvents="none" className="absolute bottom-0 left-0 right-0 p-5">
        <Text
          className="text-[10px] text-white/50 uppercase mb-1.5"
          style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 2 }}
          numberOfLines={1}
        >
          {kicker}
        </Text>

        <Text
          className="text-white text-[22px] leading-7 tracking-tight mb-2"
          style={{ fontFamily: 'Poppins_500Medium' }}
          numberOfLines={2}
        >
          {design.name}
        </Text>

        <View className="flex-row items-center flex-wrap gap-x-2 mb-1">
          <View className="flex-row items-center gap-1">
            <Star size={11} color="#ffffff" weight="fill" />
            <Text className="text-xs text-white/70" style={{ fontFamily: 'Poppins_500Medium' }}>
              {rating} ({design.reviews || 0})
            </Text>
          </View>
          <Text className="text-xs text-white/40" style={{ fontFamily: 'Poppins_400Regular' }}>
            ·  {metaParts.join('  ·  ')}
          </Text>
        </View>

        <View className="flex-row items-center justify-between border-t border-white/10 mt-3 pt-3.5">
          <Text className="text-lg text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
            ₦{(design.estimatedCost || 0).toLocaleString()}
          </Text>
          <Text
            className="text-[10px] text-white/50 uppercase"
            style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 1.5 }}
            numberOfLines={1}
          >
            {categoryLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
