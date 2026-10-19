import { Platform, Pressable, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MapPin } from 'phosphor-react-native';
import { getDesignImageUrl } from '@/components/DesignProductCard';

const ACCENT = '#22c55e';

export type OpportunityCardListing = {
  id: string;
  title: string;
  location: string;
  priceLabel: string;
  specsLine?: string;
  sourceLabel: string;
  secondaryLabel?: string;
  images: { id?: string; url: string; thumbnailUrl?: string | null }[];
};

export function OpportunityCardSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E5E5', overflow: 'hidden' }}>
      <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: '#E5E7EB' }} />
      <View style={{ padding: 10, gap: 8 }}>
        <View style={{ height: 14, width: '46%', borderRadius: 6, backgroundColor: '#E5E7EB' }} />
        <View style={{ height: 12, width: '88%', borderRadius: 6, backgroundColor: '#E5E7EB' }} />
        <View style={{ height: 12, width: '62%', borderRadius: 6, backgroundColor: '#E5E7EB' }} />
      </View>
    </View>
  );
}

export default function OpportunityProductCard({
  listing,
  width,
  onPress,
  isFavorite,
  onToggleFavorite,
}: {
  listing: OpportunityCardListing;
  width: number;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const image = listing.images?.[0];
  const full = image?.url ? getDesignImageUrl(image.url) : '';
  const thumb = image?.thumbnailUrl ? getDesignImageUrl(image.thumbnailUrl) : full;

  return (
    <Pressable
      onPress={onPress}
      style={{ width, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E5E5', overflow: 'hidden' }}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, view opportunity details`}
    >
      <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: '#F5F5F5' }}>
        {thumb ? (
          Platform.OS === 'web' ? (
            <img
              alt={listing.title}
              src={thumb}
              srcSet={thumb !== full ? `${thumb} 600w, ${full} 1200w` : undefined}
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
          )
        ) : null}
        <View className="absolute top-2 left-2 bg-white rounded-full px-2 py-1">
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: '#111111' }}>{listing.sourceLabel}</Text>
        </View>
        {onToggleFavorite ? (
          <TouchableOpacity
            onPress={onToggleFavorite}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white items-center justify-center"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart size={16} color={isFavorite ? ACCENT : '#111111'} weight={isFavorite ? 'fill' : 'regular'} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: ACCENT }} numberOfLines={1}>
          {listing.priceLabel}
        </Text>
        {listing.secondaryLabel ? (
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
            {listing.secondaryLabel}
          </Text>
        ) : null}
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111111', marginTop: 4 }} numberOfLines={2}>
          {listing.title}
        </Text>
        <View className="flex-row items-center mt-1">
          <MapPin size={12} color="#6B7280" weight="fill" />
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280', marginLeft: 4, flex: 1 }} numberOfLines={1}>
            {listing.location}
          </Text>
        </View>
        {listing.specsLine ? (
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#374151', marginTop: 4 }} numberOfLines={1}>
            {listing.specsLine}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
