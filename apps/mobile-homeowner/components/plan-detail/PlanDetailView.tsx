import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Check,
  ArrowSquareOut,
  Hammer,
  Heart,
  House,
  PaintBrush,
  Wrench,
  X,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RequestPendingNextSteps from '@/components/RequestPendingNextSteps';
import { getBackendAssetUrl } from '@/lib/image';
import { useWebSeo } from '@/lib/seo';

const ACCENT = '#22c55e';
const FAVORITES_KEY = 'bmh-plan-favorites';

type Phase = {
  name: string;
  description: string;
  duration: string;
  cost: number | null;
};

type PlanDetailViewProps = {
  design: any;
  designName?: string;
  gcRequestStatus: 'none' | 'pending' | 'accepted' | 'declined';
  rejectionReason?: string;
  showAction: boolean;
  busy: boolean;
  saveBusy?: boolean;
  payBusy?: boolean;
  onBack: () => void;
  onWorkWithContractor: () => void;
  onSaveForLater: () => void;
  onStartBuilding: () => void;
};

function asList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function positiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function plural(count: number, singular: string, pluralLabel: string) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function readPhases(design: any): Phase[] {
  let phasesData = design?.constructionPhases;
  if (typeof phasesData === 'string') {
    try {
      phasesData = JSON.parse(phasesData);
    } catch {
      return [];
    }
  }
  if (phasesData && typeof phasesData === 'object' && !Array.isArray(phasesData)) {
    if (Array.isArray(phasesData.construction_phases)) {
      phasesData = phasesData.construction_phases;
    } else {
      return [];
    }
  }
  if (!Array.isArray(phasesData)) return [];
  return phasesData
    .map((phase: any) => ({
      name: `${phase?.name || phase?.phase_name || phase?.phaseName || ''}`.trim(),
      description: `${phase?.description || ''}`.trim(),
      duration: `${phase?.estimatedDuration || phase?.time_period || phase?.timePeriod || ''}`.trim(),
      cost: positiveNumber(phase?.estimatedCost ?? phase?.estimated_cost),
    }))
    .filter((phase) => phase.name);
}

function categoryLabel(design: any) {
  const filter = `${design?.projectTypeFilter || ''}`.trim();
  if (filter) return filter;
  const tag = `${design?.projectTypeTag || ''}`.toLowerCase();
  if (tag === 'repair') return 'Repair';
  if (tag === 'upgrades') return 'Upgrade';
  if (tag === 'full_builds') return 'Full build';
  const planType = `${design?.planType || ''}`.toLowerCase();
  if (planType === 'interior_design') return 'Upgrade';
  if (planType === 'homebuilding') return 'Full build';
  return 'Renovation';
}

function CategoryIcon({ tag }: { tag: string }) {
  const color = '#111111';
  if (tag === 'repair') return <Wrench size={36} color={color} />;
  if (tag === 'upgrades') return <PaintBrush size={36} color={color} />;
  if (tag === 'full_builds') return <House size={36} color={color} />;
  return <Hammer size={36} color={color} />;
}

export default function PlanDetailView({
  design,
  designName,
  gcRequestStatus,
  rejectionReason,
  showAction,
  busy,
  saveBusy,
  payBusy,
  onBack,
  onWorkWithContractor,
  onSaveForLater,
  onStartBuilding,
}: PlanDetailViewProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth, 720);
  const name = `${design?.name || designName || 'Project plan'}`.trim();
  const description = `${design?.description || ''}`.trim();
  const duration = `${design?.estimatedDuration || ''}`.trim();
  const price = positiveNumber(design?.estimatedCost) || 0;
  const phases = useMemo(() => readPhases(design), [design]);
  const materials = asList(design?.materials);
  const features = asList(design?.features);
  const included = [...materials, ...features];
  const images = useMemo(() => {
    const list = Array.isArray(design?.images) ? [...design.images] : [];
    list.sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
    return list
      .map((image) => ({
        full: getBackendAssetUrl(image?.url) || '',
        thumb: getBackendAssetUrl(image?.thumbnailUrl || image?.url) || '',
      }))
      .filter((image) => image.full || image.thumb);
  }, [design]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [includedOpen, setIncludedOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const tag = `${design?.projectTypeTag || ''}`.toLowerCase();
  const beds = positiveNumber(design?.bedrooms);
  const baths = positiveNumber(design?.bathrooms);
  const floors = positiveNumber(design?.floors);
  const squareMeters = positiveNumber(design?.squareMeters);
  const squareFeet = positiveNumber(design?.squareFootage);
  const facts = [
    beds ? plural(beds, 'bedroom', 'bedrooms') : null,
    baths ? plural(baths, 'bathroom', 'bathrooms') : null,
    squareMeters ? `${Math.round(squareMeters)} sq m` : squareFeet ? `${Math.round(squareFeet)} sq ft` : null,
    floors ? plural(floors, 'floor', 'floors') : null,
  ].filter(Boolean) as string[];

  const profile = design?.createdBy?.contractorProfile;
  const contractorName = `${profile?.name || design?.createdBy?.fullName || ''}`.trim();
  const contractorPhoto = getBackendAssetUrl(profile?.imageUrl || design?.createdBy?.pictureUrl || undefined);
  const reviews = positiveNumber(profile?.reviews);
  const rating = positiveNumber(profile?.rating);
  const visiblePhases = stagesOpen ? phases : phases.slice(0, 5);
  const visibleIncluded = includedOpen ? included : included.slice(0, 6);

  useWebSeo({
    title: `${name} | BuildMyHouse`,
    description: description || `${name} on BuildMyHouse.`,
    canonicalPath: `/house-summary?designId=${encodeURIComponent(design?.id || '')}`,
    robots: 'noindex,follow',
  });

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(FAVORITES_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids) && ids.includes(design?.id)) setFavorite(true);
      } catch {
        // Ignore a bad local list.
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [design?.id]);

  const toggleFavorite = async () => {
    const next = !favorite;
    setFavorite(next);
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(ids) ? ids.filter((id) => id !== design?.id) : [];
      if (next && design?.id) list.push(design.id);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch {
      // The heart still reflects this visit if storage is unavailable.
    }
  };

  const sharePlan = async () => {
    const url = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.href
      : `https://buildmyhouse.app/house-summary?designId=${encodeURIComponent(design?.id || '')}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        return;
      }
      await Share.share({ message: `${name}\n${url}` });
    } catch {
      // The user dismissed the share sheet.
    }
  };

  const heroHeight = contentWidth / (4 / 3);

  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: '#ffffff' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: gcRequestStatus === 'none' && showAction ? 108 + insets.bottom : 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', height: heroHeight, backgroundColor: '#F3F4F6' }}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const width = event.nativeEvent.layoutMeasurement.width || contentWidth;
                const next = Math.round(event.nativeEvent.contentOffset.x / width);
                setPhotoIndex(next);
              }}
            >
              {images.map((image, index) => (
                <Pressable
                  key={`${image.full}-${index}`}
                  onPress={() => {
                    setPhotoIndex(index);
                    setViewerOpen(true);
                  }}
                  style={{ width: contentWidth, height: heroHeight }}
                >
                  {index === 0 || index <= photoIndex + 1 ? (
                    <PlanPhoto
                      uri={image.thumb || image.full}
                      eager={index === 0}
                      label={name}
                    />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: '#E5E7EB' }} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CategoryIcon tag={tag} />
              <Text style={{ fontFamily: 'Poppins_500Medium', color: '#6B7280', fontSize: 13 }}>
                No photos yet
              </Text>
            </View>
          )}

          <View style={{ position: 'absolute', top: Math.max(12, insets.top + 8), left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <CircleButton label="Back" onPress={onBack}>
              <ArrowLeft size={18} color="#111111" />
            </CircleButton>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <CircleButton label="Share" onPress={sharePlan}>
                <ArrowSquareOut size={18} color="#111111" />
              </CircleButton>
              <CircleButton label={favorite ? 'Remove from favourites' : 'Save'} onPress={toggleFavorite}>
                <Heart size={18} color="#111111" weight={favorite ? 'fill' : 'regular'} />
              </CircleButton>
            </View>
          </View>

          {images.length > 0 ? (
            <View style={{ position: 'absolute', right: 16, bottom: 28, backgroundColor: 'rgba(17,17,17,0.72)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontFamily: 'Poppins_500Medium', color: '#ffffff', fontSize: 12 }}>
                {photoIndex + 1} / {images.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: -16, backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ alignSelf: 'flex-start', fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#111111', backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 }}>
            {categoryLabel(design)}
          </Text>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, lineHeight: 34, color: '#111111', marginTop: 12 }}>
            {name}
          </Text>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#6B7280' }}>Estimate</Text>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 32, color: ACCENT, marginTop: 2 }}>
              ₦{price.toLocaleString()}
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#374151', marginTop: 4 }}>
              Final price is agreed with your contractor after the inspection.
            </Text>
            {duration ? (
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#111111', marginTop: 8 }}>
                {duration}
              </Text>
            ) : null}
          </View>

          {description ? (
            <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <Text
                numberOfLines={descriptionOpen ? undefined : 4}
                style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22, color: '#111111' }}
              >
                {description}
              </Text>
              {description.length > 180 ? (
                <Pressable onPress={() => setDescriptionOpen((open) => !open)}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111111', marginTop: 6, textDecorationLine: 'underline' }}>
                    {descriptionOpen ? 'Show less' : 'Read more'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {facts.length > 0 ? (
            <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {facts.map((fact) => (
                <Text key={fact} style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111111' }}>
                  {fact}
                </Text>
              ))}
            </View>
          ) : null}

          {phases.length > 0 ? (
            <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#111111' }}>
                How the work is staged
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#374151', marginTop: 6, marginBottom: 16 }}>
                Each stage is shown to you with photos and approved by you before it's paid.
              </Text>
              {visiblePhases.map((phase, index) => (
                <View key={`${phase.name}-${index}`} style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#ffffff', fontSize: 11 }}>{index + 1}</Text>
                    </View>
                    {index < visiblePhases.length - 1 ? (
                      <View style={{ width: 1, flex: 1, backgroundColor: '#111111', marginTop: 4 }} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingLeft: 12, paddingBottom: 4 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#111111' }}>{phase.name}</Text>
                    {phase.description ? (
                      <Text numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#374151', marginTop: 4 }}>
                        {phase.description}
                      </Text>
                    ) : null}
                    {(phase.duration || phase.cost) ? (
                      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                        {[phase.duration, phase.cost ? `₦${phase.cost.toLocaleString()}` : ''].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
              {phases.length > 5 ? (
                <Pressable onPress={() => setStagesOpen((open) => !open)}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111111', textDecorationLine: 'underline' }}>
                    {stagesOpen ? 'Show fewer stages' : 'Show all stages'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {included.length > 0 ? (
            <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#111111', marginBottom: 12 }}>
                What's included
              </Text>
              {visibleIncluded.map((item) => (
                <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                  <Check size={16} color={ACCENT} weight="bold" style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 21, color: '#111111' }}>
                    {item}
                  </Text>
                </View>
              ))}
              {included.length > 6 ? (
                <Pressable onPress={() => setIncludedOpen((open) => !open)}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111111', textDecorationLine: 'underline', marginTop: 4 }}>
                    {includedOpen ? 'Show less' : 'Show all'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {contractorName ? (
            <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                {contractorPhoto ? (
                  <Image source={{ uri: contractorPhoto }} style={{ width: 56, height: 56 }} contentFit="cover" />
                ) : (
                  <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#111111' }}>
                    {contractorName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#6B7280' }}>Your contractor</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#111111' }}>
                    {contractorName}
                  </Text>
                  {profile?.verified ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Check size={16} color={ACCENT} weight="bold" />
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: ACCENT }}>Verified</Text>
                    </View>
                  ) : (
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#6B7280' }}>Not verified yet</Text>
                  )}
                </View>
                {profile?.specialty ? (
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', marginTop: 2 }}>
                    {profile.specialty}
                  </Text>
                ) : null}
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#111111', marginTop: 4 }}>
                  {reviews && rating ? `${rating.toFixed(1)} (${reviews} ${reviews === 1 ? 'review' : 'reviews'})` : 'New'}
                </Text>
              </View>
            </View>
          ) : null}

          {gcRequestStatus === 'declined' ? (
            <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#7F1D1D' }}>Request declined</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#991B1B', marginTop: 4 }}>
                A contractor declined this project. It is no longer waiting for a response.
              </Text>
              {rejectionReason ? (
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#991B1B', marginTop: 8 }}>{rejectionReason}</Text>
              ) : null}
            </View>
          ) : null}

          {gcRequestStatus === 'pending' ? (
            <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#78350F' }}>Request pending review</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#92400E', marginTop: 4 }}>
                Your request has been sent to the contractor. They will review and respond within 24 to 48 hours.
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#A16207', marginTop: 8, fontStyle: 'italic' }}>
                You'll be notified as soon as a contractor accepts your project.
              </Text>
              <RequestPendingNextSteps />
            </View>
          ) : null}

          {gcRequestStatus === 'accepted' ? (
            <View style={{ marginTop: 24 }}>
              <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 12 }}>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#14532D' }}>Ready to build</Text>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#166534', marginTop: 4 }}>
                  You've selected this contractor to build your design. Review the details and proceed to payment.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={onSaveForLater}
                  disabled={saveBusy}
                  style={{ flex: 1, borderWidth: 2, borderColor: '#111111', borderRadius: 999, paddingVertical: 14, alignItems: 'center', opacity: saveBusy ? 0.5 : 1 }}
                >
                  <Text style={{ fontFamily: 'Poppins_700Bold', color: '#111111' }}>{saveBusy ? 'Saving...' : 'Save for Later'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onStartBuilding}
                  disabled={payBusy}
                  style={{ flex: 1, backgroundColor: payBusy ? '#E5E7EB' : '#111111', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Poppins_700Bold', color: '#ffffff' }}>{payBusy ? 'Processing...' : 'Pay & Start Building'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {gcRequestStatus === 'none' && showAction ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingLeft: 16, paddingRight: 72, paddingTop: 12, paddingBottom: Math.max(12, insets.bottom + 8), flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#6B7280' }}>Estimate</Text>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: ACCENT }}>₦{price.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            onPress={onWorkWithContractor}
            disabled={busy}
            style={{ backgroundColor: '#111111', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 14, opacity: busy ? 0.5 : 1 }}
          >
            <Text style={{ fontFamily: 'Poppins_700Bold', color: '#ffffff', fontSize: 14 }}>
              {busy ? 'Sending request...' : 'Work with this contractor'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <Pressable
            onPress={() => setViewerOpen(false)}
            style={{ position: 'absolute', top: Math.max(16, insets.top + 8), right: 16, zIndex: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#111111" />
          </Pressable>
          <ScrollView
            horizontal
            pagingEnabled
            contentOffset={{ x: photoIndex * windowWidth, y: 0 }}
            showsHorizontalScrollIndicator={false}
          >
            {images.map((image, index) => (
              <View key={`full-${index}`} style={{ width: windowWidth, height: '100%', justifyContent: 'center' }}>
                <Image
                  source={{ uri: image.full || image.thumb }}
                  style={{ width: windowWidth, height: windowWidth }}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function PlanPhoto({ uri, eager, label }: { uri: string; eager: boolean; label: string }) {
  if (Platform.OS === 'web') {
    return (
      <img
        alt={label}
        src={uri}
        loading={eager ? 'eager' : 'lazy'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
}

function CircleButton({ children, onPress, label }: { children: ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </Pressable>
  );
}
