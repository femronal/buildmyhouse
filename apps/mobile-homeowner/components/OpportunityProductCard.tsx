import { View, Text, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, Heart, MapPin } from 'phosphor-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { getBackendAssetUrl } from '@/lib/image';

const CARD_BG = '#151515';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80';

export type OpportunityCardListing = {
  id: string;
  title: string;
  subtitle?: string;
  location: string;
  priceLabel: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeLabel: string;
  serviceHint?: string;
  tagLabel: string;
  images: { id?: string; url: string }[];
};

export type OpportunityProductCardProps = {
  listing: OpportunityCardListing;
  width: number;
  height?: number;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  activeImageIndex?: number;
  onImageScroll?: (event: any) => void;
};

/**
 * Editorial opportunity card — full-bleed photo on a dark canvas, fade-to-black
 * footer with category attribution, title, location, meta, price, and type tag.
 */
export default function OpportunityProductCard({
  listing,
  width,
  height = 420,
  onPress,
  isFavorite,
  onToggleFavorite,
  activeImageIndex = 0,
  onImageScroll,
}: OpportunityProductCardProps) {
  const images = listing.images?.length ? listing.images : [{ url: FALLBACK_IMAGE }];
  const gradientId = `bmh-opp-fade-${listing.id}`;

  const metaParts = [
    typeof listing.bedrooms === 'number' ? `${listing.bedrooms} bed` : null,
    typeof listing.bathrooms === 'number' ? `${listing.bathrooms} bath` : null,
    listing.sizeLabel || null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      className="bmh-product-card rounded-[28px] overflow-hidden"
      style={{ width, height, backgroundColor: CARD_BG }}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title} — view opportunity details`}
    >
      {/* Full-bleed image (swipeable when multiple) */}
      <View style={StyleSheet.absoluteFill}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onImageScroll}
          scrollEventThrottle={16}
        >
          {images.map((image, index) => (
            <Image
              key={image.id || index}
              source={{ uri: getBackendAssetUrl(image.url) || image.url }}
              className="bmh-product-card-img"
              style={{ width, height, opacity: 0.85 }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
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
          {images.slice(0, 5).map((_, index) => (
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
          {listing.subtitle || 'Verified opportunity'}
        </Text>

        <Text
          className="text-white text-[22px] leading-7 tracking-tight mb-2"
          style={{ fontFamily: 'Poppins_500Medium' }}
          numberOfLines={2}
        >
          {listing.title}
        </Text>

        <View className="flex-row items-center gap-1 mb-1">
          <MapPin size={11} color="#ffffff" weight="fill" />
          <Text
            className="text-xs text-white/70 flex-1"
            style={{ fontFamily: 'Poppins_500Medium' }}
            numberOfLines={1}
          >
            {listing.location}
          </Text>
        </View>

        {metaParts.length > 0 ? (
          <Text className="text-xs text-white/40" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>
            {metaParts.join('  ·  ')}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between border-t border-white/10 mt-3 pt-3.5">
          <Text
            className="text-lg text-white flex-shrink"
            style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {listing.priceLabel}
          </Text>
          <Text
            className="text-[10px] text-white/50 uppercase pl-2"
            style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 1.5 }}
            numberOfLines={1}
          >
            {listing.tagLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
