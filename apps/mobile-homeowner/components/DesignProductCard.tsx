import { Platform, Pressable, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MapPin, Star } from 'phosphor-react-native';
import { getDesignLocationTag } from '@/lib/design-location';

const ACCENT = '#22c55e';

export const getDesignImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
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

const showsSize = (tag: UiProjectTag) => tag === 'renovation' || tag === 'full_builds';

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

export function DesignCardSkeleton({ width }: { width: number }) {
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

function CardPhoto({ thumb, full, label }: { thumb: string; full: string; label: string }) {
  if (Platform.OS === 'web') {
    const srcSet = thumb && full && thumb !== full ? `${thumb} 600w, ${full} 1200w` : undefined;
    return (
      <img
        alt={label}
        src={thumb || full}
        srcSet={srcSet}
        sizes="(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw"
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <Image
      source={{ uri: thumb || full }}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={thumb || full}
    />
  );
}

export default function DesignProductCard({
  design,
  width,
  onPress,
  isFavorite,
  onToggleFavorite,
}: DesignProductCardProps) {
  const image = (design.images || [])[0];
  const full = image ? getDesignImageUrl(image.url) : '';
  const thumb = image?.thumbnailUrl ? getDesignImageUrl(image.thumbnailUrl) : full;
  const tag = resolveUiProjectTag(design);
  const categoryLabel = `${design?.projectTypeFilter || ''}`.trim() || (tag === 'repair' ? 'Repair' : tag === 'upgrades' ? 'Upgrade' : tag === 'renovation' ? 'Renovation' : 'Full build');
  const gcName = `${design?.createdBy?.contractorProfile?.name || design?.createdBy?.fullName || ''}`.trim();
  const verified = !!design?.createdBy?.contractorProfile?.verified;
  const reviews = Number(design?.reviews || design?.createdBy?.contractorProfile?.reviews || 0);
  const ratingValue = Number(design?.reviews ? design.rating : design?.createdBy?.contractorProfile?.rating || 0);
  const { label: locationLabel } = getDesignLocationTag(design);
  const specNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const squareMeters = specNumber(design.squareMeters) || (specNumber(design.squareFootage) ? Math.round(Number(design.squareFootage) * 0.092903) : null);
  const sizeLine = showsSize(tag)
    ? [
        specNumber(design.bedrooms) ? `${specNumber(design.bedrooms)} bed` : null,
        specNumber(design.bathrooms) ? `${specNumber(design.bathrooms)} bath` : null,
        squareMeters ? `${squareMeters} m2` : null,
      ].filter(Boolean).join(' · ')
    : '';

  return (
    <Pressable
      onPress={onPress}
      style={{ width, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E5E5', overflow: 'hidden' }}
      accessibilityRole="button"
      accessibilityLabel={`${design.name}, view project details`}
    >
      <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: '#F3F4F6' }}>
        {full ? (
          <CardPhoto thumb={thumb} full={full} label={design.name || 'Project photo'} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Poppins_400Regular', color: '#6B7280', fontSize: 12 }}>No photo yet</Text>
          </View>
        )}
        {onToggleFavorite ? (
          <TouchableOpacity
            onPress={onToggleFavorite}
            style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart size={16} color={isFavorite ? '#111111' : '#111111'} weight={isFavorite ? 'fill' : 'regular'} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', color: ACCENT, fontSize: 16 }}>
          ₦{(design.estimatedCost || 0).toLocaleString()}
        </Text>
        <Text numberOfLines={2} style={{ fontFamily: 'Poppins_600SemiBold', color: '#111111', fontSize: 14, lineHeight: 18, marginTop: 2 }}>
          {design.name}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: 'Poppins_500Medium', color: '#374151', fontSize: 11, marginTop: 6 }}>
          {categoryLabel}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
          <MapPin size={12} color="#6B7280" weight="fill" />
          <Text numberOfLines={1} style={{ fontFamily: 'Poppins_400Regular', color: '#4B5563', fontSize: 12, flex: 1 }}>
            {locationLabel}
          </Text>
        </View>
        {gcName ? (
          <Text numberOfLines={1} style={{ fontFamily: 'Poppins_500Medium', color: '#111111', fontSize: 12, marginTop: 4 }}>
            {gcName}{verified ? ' ✓' : ''}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
          {reviews > 0 ? (
            <>
              <Star size={12} color="#111111" weight="fill" />
              <Text style={{ fontFamily: 'Poppins_500Medium', color: '#111111', fontSize: 12 }}>
                {ratingValue.toFixed(1)} ({reviews})
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: 'Poppins_500Medium', color: '#111111', fontSize: 12 }}>New</Text>
          )}
          {sizeLine ? (
            <Text numberOfLines={1} style={{ fontFamily: 'Poppins_400Regular', color: '#6B7280', fontSize: 11, flex: 1 }}>
              {sizeLine}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
