import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  useWindowDimensions,
  TextInput,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  X,
  Check,
  SealCheck,
  Lightning,
  Drop,
  Shield,
  WifiHigh,
  Car,
  Lock,
  Clock,
  User,
  FunnelSimple,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Info,
} from "phosphor-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import ImageCarousel from '@/components/ImageCarousel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRentalsForLease } from '@/hooks/useRentalsForLease';
import { useRequestRentalInspection } from '@/hooks/useRentalInspection';
import { useHousesForSale } from '@/hooks/useHousesForSale';
import { useLandsForSale } from '@/hooks/useLandsForSale';
import { useScheduleHouseViewing } from '@/hooks/useHouseViewing';
import { useScheduleLandViewing } from '@/hooks/useLandViewing';
import { getBackendAssetUrl } from '@/lib/image';
import NotificationBell from '@/components/NotificationBell';
import { useWebSeo } from '@/lib/seo';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getFloatingTabBarMetrics,
  getScreenHorizontalPadding,
  getTabContentBottomPadding,
  getTabListingChrome,
} from "@/lib/responsive-layout";
import {
  BUILD_OPPORTUNITY_FILTERS,
  formatBuildOpportunityKey,
  type BuildOpportunityCategoryKey,
} from "@/lib/build-opportunity-taxonomy";
import { matchesKeywordPhraseQuery } from "@/lib/keyword-search";
import ProjectTypeTabs, { type UnderlineTabItem } from '@/components/ProjectTypeTabs';
import OpportunityProductCard from '@/components/OpportunityProductCard';

const OPPORTUNITY_TABS: UnderlineTabItem<BuildOpportunityCategoryKey>[] = [
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'heavy_civil_construction', label: 'Heavy Civil' },
  { key: 'industrial_construction', label: 'Industrial' },
  { key: 'environmental_construction', label: 'Environmental' },
];

type BuildOpportunity = {
  id: string;
  source: 'rental' | 'house' | 'land';
  title: string;
  subtitle?: string;
  opportunityCategory?: string | null;
  opportunityType?: string | null;
  location: string;
  priceLabel: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeLabel: string;
  serviceHint?: string;
  annualRent?: number;
  serviceCharge?: number;
  cautionDeposit?: number;
  legalFeePercent?: number;
  agencyFeePercent?: number;
  power?: string | null;
  water?: string | null;
  internet?: string | null;
  parking?: string | null;
  security?: string | null;
  rules?: string | null;
  inspectionWindow?: string | null;
  verificationDocs?: string[];
  extraDocs?: string[];
  images: { id?: string; url: string; label?: string | null; order?: number }[];
};

const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;

export default function RentScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarMetrics = useMemo(
    () => getFloatingTabBarMetrics(screenWidth, insets.bottom),
    [screenWidth, insets.bottom],
  );
  const horizontalPadding = useMemo(
    () => getScreenHorizontalPadding(screenWidth),
    [screenWidth],
  );
  const listingChrome = useMemo(
    () => getTabListingChrome(screenWidth, insets.top),
    [screenWidth, insets.top],
  );
  const tabContentBottomPadding = useMemo(
    () => getTabContentBottomPadding(tabBarMetrics, { webCompact: listingChrome.mobileWeb }),
    [tabBarMetrics, listingChrome.mobileWeb],
  );
  const listEmptyVerticalClass = listingChrome.mobileWeb ? 'py-12' : 'py-24';
  const { data: currentUser } = useCurrentUser();
  const { data: rentalsForLease = [] } = useRentalsForLease();
  const { data: housesForSale = [] } = useHousesForSale();
  const { data: landsForSale = [] } = useLandsForSale();
  const requestInspectionMutation = useRequestRentalInspection();
  const scheduleHouseViewingMutation = useScheduleHouseViewing();
  const scheduleLandViewingMutation = useScheduleLandViewing();
  const userPicture = currentUser?.pictureUrl;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<BuildOpportunityCategoryKey>('residential');
  const [isBuildMessageExpanded, setIsBuildMessageExpanded] = useState(false);

  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<BuildOpportunity | null>(null);
  const [rentRequestSuccess, setRentRequestSuccess] = useState(false);

  const filterAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  // Collapsible header chrome (headline, tabs, search, notice) — collapses on
  // scroll down, restores when the list is scrolled back to the very top.
  const headerAnim = useRef(new Animated.Value(1)).current;
  const headerCollapsedRef = useRef(false);
  const [collapsibleHeight, setCollapsibleHeight] = useState(0);

  const setHeaderCollapsed = (collapsed: boolean) => {
    if (headerCollapsedRef.current === collapsed) return;
    headerCollapsedRef.current = collapsed;
    Animated.timing(headerAnim, {
      toValue: collapsed ? 0 : 1,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

  // 1 column on mobile, 3 on tablet, 4 on desktop
  const gridGap = 16;
  const gridColumns = screenWidth >= 1200 ? 4 : screenWidth >= 768 ? 3 : 1;
  const cardWidth = useMemo(
    () => (screenWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns,
    [gridColumns, horizontalPadding, screenWidth],
  );
  const cardHeight = gridColumns === 1 ? 460 : 420;

  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});
  const handleImageScroll = (id: string, event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveImageIndex((prev) => (prev[id] === index ? prev : { ...prev, [id]: index }));
  };

  const filterHeight = useMemo(
    () =>
      filterAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, listingChrome.mobileWeb ? 52 : 60],
      }),
    [filterAnim, listingChrome.mobileWeb],
  );
  const filterOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  useWebSeo({
    title: 'Build Opportunities in Nigeria | BuildMyHouse',
    description:
      'Browse location-specific build opportunities curated by BuildMyHouse admin for verified properties in Nigeria.',
    canonicalPath: '/rent',
    robots: 'index,follow',
  });

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    Animated.timing(filterAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowFilters(!showFilters);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY > lastScrollY.current + 2 && currentScrollY > 24) {
      setHeaderCollapsed(true);
      if (showFilters) {
        Animated.timing(filterAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
        setShowFilters(false);
      }
    } else if (currentScrollY <= 4) {
      setHeaderCollapsed(false);
    }
    lastScrollY.current = currentScrollY;
  };

  const allOpportunities = useMemo<BuildOpportunity[]>(() => {
    const rentalOpportunities: BuildOpportunity[] = rentalsForLease.map((listing) => ({
      id: listing.id,
      source: 'rental',
      title: listing.title,
      subtitle: `Rental • ${formatBuildOpportunityKey(listing.propertyType)}`,
      opportunityCategory: listing.opportunityCategory || 'residential',
      opportunityType: listing.opportunityType || undefined,
      location: listing.location,
      priceLabel: `${formatNaira(listing.annualRent)}/yr`,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sizeLabel: `${listing.sizeSqm}m²`,
      serviceHint: `Service: ${formatNaira(listing.serviceCharge)}`,
      annualRent: listing.annualRent,
      serviceCharge: listing.serviceCharge,
      cautionDeposit: listing.cautionDeposit,
      legalFeePercent: listing.legalFeePercent,
      agencyFeePercent: listing.agencyFeePercent,
      power: listing.power,
      water: listing.water,
      internet: listing.internet,
      parking: listing.parking,
      security: listing.security,
      rules: listing.rules,
      inspectionWindow: listing.inspectionWindow,
      verificationDocs: listing.verificationDocs,
      images: listing.images || [],
    }));

    const houseOpportunities: BuildOpportunity[] = housesForSale.map((house) => ({
      id: house.id,
      source: 'house',
      title: house.name,
      subtitle: `House • ${formatBuildOpportunityKey(house.propertyType || 'residential')}`,
      opportunityCategory: house.opportunityCategory || 'residential',
      opportunityType: house.opportunityType || undefined,
      location: house.location,
      priceLabel: formatNaira(house.price),
      bedrooms: house.bedrooms,
      bathrooms: house.bathrooms,
      sizeLabel: `${house.squareMeters ?? Math.round(house.squareFootage * 0.092903)}m²`,
      serviceHint: house.condition ? `Condition: ${house.condition}` : undefined,
      verificationDocs: house.documents,
      extraDocs: house.amenities,
      images: house.images || [],
    }));

    const landOpportunities: BuildOpportunity[] = landsForSale.map((land) => ({
      id: land.id,
      source: 'land',
      title: land.name,
      subtitle: `Land • ${formatBuildOpportunityKey(land.zoningType || 'development')}`,
      opportunityCategory: land.opportunityCategory || 'residential',
      opportunityType: land.opportunityType || undefined,
      location: land.location,
      priceLabel: formatNaira(land.price),
      sizeLabel: `${land.sizeSqm} sqm`,
      serviceHint: land.roadAccess ? `Road access: ${land.roadAccess}` : undefined,
      verificationDocs: land.documents,
      extraDocs: land.restrictions,
      images: land.images || [],
    }));

    return [...rentalOpportunities, ...houseOpportunities, ...landOpportunities];
  }, [rentalsForLease, housesForSale, landsForSale]);

  const availableFilters = useMemo(() => {
    const baseFilters = BUILD_OPPORTUNITY_FILTERS[activeTab] || [];
    const observed = new Set<string>();
    allOpportunities.forEach((item) => {
      if ((item.opportunityCategory || 'residential') === activeTab && item.opportunityType) {
        observed.add(item.opportunityType);
      }
    });
    return ['All', ...Array.from(new Set([...baseFilters, ...Array.from(observed)]))];
  }, [activeTab, allOpportunities]);

  const filteredListings = useMemo(() => {
    const query = searchQuery.trim();
    return allOpportunities.filter((listing) => {
      const tabMatch = (listing.opportunityCategory || 'residential') === activeTab;
      const queryMatch = matchesKeywordPhraseQuery({
        query,
        fields: [
          listing.title,
          listing.location,
          listing.subtitle,
          listing.opportunityType,
          listing.opportunityCategory,
          listing.serviceHint,
          ...(listing.verificationDocs || []),
          ...(listing.extraDocs || []),
        ],
      });
      const filterMatch = activeFilter === 'All' || listing.opportunityType === activeFilter;
      return tabMatch && queryMatch && filterMatch;
    });
  }, [activeTab, searchQuery, activeFilter, allOpportunities]);

  useEffect(() => {
    if (!availableFilters.includes(activeFilter)) {
      setActiveFilter('All');
    }
  }, [availableFilters, activeFilter]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const openRentModal = (listing: BuildOpportunity) => {
    setSelectedOpportunity(listing);
    setRentRequestSuccess(false);
    setShowRentModal(true);
  };

  const requestRentInspection = async () => {
    if (!selectedOpportunity?.id) return;
    try {
      if (selectedOpportunity.source === 'rental') {
        await requestInspectionMutation.mutateAsync(selectedOpportunity.id);
      } else if (selectedOpportunity.source === 'house') {
        await scheduleHouseViewingMutation.mutateAsync(selectedOpportunity.id);
      } else {
        await scheduleLandViewingMutation.mutateAsync(selectedOpportunity.id);
      }
      setRentRequestSuccess(true);
      setTimeout(() => {
        setShowRentModal(false);
        setRentRequestSuccess(false);
      }, 2000);
    } catch (error: any) {
      Alert.alert('Request failed', error?.message || 'Could not request property inspection. Please try again.');
    }
  };

  return (
    <View className="flex-1 bmh-dark-page" style={{ backgroundColor: '#050505' }}>
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingTop: listingChrome.headerPaddingTop,
          paddingBottom: listingChrome.headerPaddingBottom,
          paddingHorizontal: horizontalPadding,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          className="bg-white/10 border border-white/15 rounded-full items-center justify-center overflow-hidden"
          style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
        >
          {userPicture ? (
            <Image source={{ uri: getBackendAssetUrl(userPicture) }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <User size={listingChrome.headerUserIconSize} color="#FFFFFF" weight="bold" />
          )}
        </TouchableOpacity>

        <NotificationBell dark />
      </View>

      {/* Collapsible chrome: headline, tabs, search, notice */}
      <Animated.View
        style={{
          opacity: headerAnim,
          overflow: 'hidden',
          ...(collapsibleHeight > 0
            ? {
                height: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, collapsibleHeight],
                }),
              }
            : null),
        }}
      >
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - collapsibleHeight) > 1 && !headerCollapsedRef.current) {
              setCollapsibleHeight(h);
            }
          }}
        >
          {/* Editorial headline + tabs */}
          <View
            className="flex-row flex-wrap items-end justify-between gap-y-3"
            style={{ paddingHorizontal: horizontalPadding, marginBottom: listingChrome.tabsSectionMarginBottom }}
          >
            <View>
              <Text
                className="text-[10px] text-white/40 uppercase mb-1"
                style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 3 }}
              >
                Verified Opportunities
              </Text>
              <Text
                className="text-[26px] md:text-4xl text-white tracking-tight leading-tight"
                style={{ fontFamily: 'Poppins_500Medium' }}
                accessibilityRole="header"
              >
                Find Your{'\n'}
                <Text style={{ color: '#5c5c5c' }}>Next Build.</Text>
              </Text>
            </View>

            <ProjectTypeTabs
              dark
              tabs={OPPORTUNITY_TABS}
              activeTab={activeTab}
              onSelect={setActiveTab}
              scrollable
            />
          </View>

          {/* Search & Filter */}
          <View style={{ marginBottom: listingChrome.searchSectionMarginBottom, paddingHorizontal: horizontalPadding }}>
            <View className="flex-row items-center">
              <View
                className="flex-1 bg-white/5 border border-white/15 rounded-full px-4 flex-row items-center mr-3"
                style={{ paddingVertical: listingChrome.searchBarPaddingY }}
              >
                <MagnifyingGlass size={18} color="#8a8a8a" weight="regular" />
                <TextInput
                  placeholder="Search by phrases and keywords (e.g. AC repair in Akoka)"
                  placeholderTextColor="#8a8a8a"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-white"
                  style={{ fontFamily: 'Poppins_400Regular', outlineStyle: 'none' } as any}
                />
              </View>
              <TouchableOpacity
                onPress={toggleFilters}
                className={`rounded-full items-center justify-center border ${showFilters ? 'bg-white border-white' : 'bg-white/5 border-white/15'}`}
                style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
              >
                <FunnelSimple size={listingChrome.mobileWeb ? 18 : 20} color={showFilters ? '#000000' : '#FFFFFF'} weight="bold" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginBottom: 12, paddingHorizontal: horizontalPadding }}>
            <View className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <TouchableOpacity
                onPress={() => setIsBuildMessageExpanded((prev) => !prev)}
                className="flex-row items-start justify-between"
                activeOpacity={0.85}
              >
                <View className="flex-row items-start flex-1 pr-2">
                  <View className="w-5 h-5 rounded-full bg-white/10 items-center justify-center mr-2 mt-0.5">
                    <Info size={11} color="#d4d4d4" weight="bold" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white mb-1" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 10 }}>
                      Location-verified build opportunities
                    </Text>
                    <Text className="text-white/60" style={{ fontFamily: 'Poppins_400Regular', fontSize: 10, lineHeight: 14 }}>
                      {isBuildMessageExpanded
                        ? 'These scopes are tied to real properties and curated by BuildMyHouse admin. You may purchase the property first, then continue with transparent remote monitoring on BuildMyHouse or outside the app if you prefer.'
                        : 'These scopes are tied to real properties curated by BuildMyHouse admin.'}
                    </Text>
                  </View>
                </View>
                <View className="pl-1 pt-0.5">
                  {isBuildMessageExpanded ? (
                    <CaretUp size={16} color="#d4d4d4" weight="bold" />
                  ) : (
                    <CaretDown size={16} color="#d4d4d4" weight="bold" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2" contentContainerStyle={{ paddingHorizontal: horizontalPadding }}>
          {availableFilters.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => setActiveFilter(tag)}
              className={`px-4 py-2 rounded-full mr-2 ${activeFilter === tag ? 'bg-white' : 'bg-white/10'}`}
            >
              <Text className={activeFilter === tag ? 'text-black' : 'text-white/80'} style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}>
                {tag === 'All' ? 'All' : formatBuildOpportunityKey(tag)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={{ marginBottom: listingChrome.filterIndicatorMarginBottom, paddingHorizontal: horizontalPadding }}>
        <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
          <Text
            className="text-white"
            style={{ fontFamily: 'Poppins_600SemiBold', fontSize: listingChrome.mobileWeb ? 15 : 18 }}
          >
            {activeFilter === 'All' ? 'All' : formatBuildOpportunityKey(activeFilter)}
          </Text>
          <CaretDown size={16} color="#FFFFFF" weight="bold" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: tabContentBottomPadding, paddingHorizontal: horizontalPadding }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {!listingChrome.mobileWeb && (
          <InternalLinksBlock
            dark
            title="Need more options?"
            links={[
              { label: 'Homes for Rent (Guide)', href: '/homes-for-rent/nigeria' },
              { label: 'Houses for Sale', href: '/houses-for-sale/nigeria' },
              { label: 'Land for Sale', href: '/land-for-sale/nigeria' },
              { label: 'Construction in Nigeria', href: '/construction/nigeria' },
            ]}
          />
        )}

        {filteredListings.length === 0 ? (
          <View className={`items-center justify-center ${listEmptyVerticalClass}`}>
            <Text className="text-white/70 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              No opportunities match this filter
            </Text>
            <Text className="text-white/40 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              Try another category, filter, or location keyword.
            </Text>
          </View>
        ) : (
          <View className="pb-8" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }}>
            {filteredListings.map((listing) => (
              <OpportunityProductCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  subtitle: listing.subtitle,
                  location: listing.location,
                  priceLabel: listing.priceLabel,
                  bedrooms: listing.bedrooms,
                  bathrooms: listing.bathrooms,
                  sizeLabel: listing.sizeLabel,
                  serviceHint: listing.serviceHint,
                  tagLabel: formatBuildOpportunityKey(listing.opportunityType || listing.source),
                  images: listing.images || [],
                }}
                width={cardWidth}
                height={cardHeight}
                onPress={() => openRentModal(listing)}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={() => toggleFavorite(listing.id)}
                activeImageIndex={activeImageIndex[listing.id] || 0}
                onImageScroll={(event) => handleImageScroll(listing.id, event)}
              />
            ))}
          </View>
        )}

        {listingChrome.mobileWeb && (
          <InternalLinksBlock
            compact
            dark
            title="Need more options?"
            links={[
              { label: 'Homes for Rent (Guide)', href: '/homes-for-rent/nigeria' },
              { label: 'Houses for Sale', href: '/houses-for-sale/nigeria' },
              { label: 'Land for Sale', href: '/land-for-sale/nigeria' },
              { label: 'Construction in Nigeria', href: '/construction/nigeria' },
            ]}
          />
        )}
      </ScrollView>

      <Modal
        visible={showRentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            {!rentRequestSuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-xl text-black flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {selectedOpportunity?.title}
                  </Text>
                  <TouchableOpacity onPress={() => setShowRentModal(false)}>
                    <X size={24} color="#000000" weight="bold" />
                  </TouchableOpacity>
                </View>

                <ImageCarousel
                  images={
                    selectedOpportunity?.images?.length
                      ? selectedOpportunity.images.map((img: any, index: number) => ({
                          url: getBackendAssetUrl(img.url) || img.url,
                          label: img.label || (index === 0 ? 'Exterior' : 'Interior'),
                        }))
                      : [
                          {
                            url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
                            label: 'Exterior',
                          },
                        ]
                  }
                  height={192}
                />

                <View className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mt-4 mb-3">
                  <Text className="text-blue-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    This opportunity is tied to a real location and should be inspected before any commitment.
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Opportunity Snapshot
                  </Text>
                  <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Price: {selectedOpportunity?.priceLabel || 'N/A'}
                  </Text>
                  {typeof selectedOpportunity?.annualRent === 'number' ? (
                    <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Annual rent: {formatNaira(selectedOpportunity.annualRent)}
                    </Text>
                  ) : null}
                  {typeof selectedOpportunity?.serviceCharge === 'number' ? (
                    <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Service charge: {formatNaira(selectedOpportunity.serviceCharge)}
                    </Text>
                  ) : null}
                  {typeof selectedOpportunity?.cautionDeposit === 'number' ? (
                    <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Caution deposit: {formatNaira(selectedOpportunity.cautionDeposit)}
                    </Text>
                  ) : null}
                  {typeof selectedOpportunity?.legalFeePercent === 'number' ? (
                    <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Legal fee: {selectedOpportunity.legalFeePercent}%
                    </Text>
                  ) : null}
                  <Text className="text-gray-700 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    BuildMyHouse fee: {selectedOpportunity?.agencyFeePercent || 2}%
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Confirm key checks before proceeding.
                  </Text>
                  {[
                    { label: `Power: ${selectedOpportunity?.power || 'N/A'}`, icon: Lightning },
                    { label: `Water: ${selectedOpportunity?.water || 'N/A'}`, icon: Drop },
                    { label: `Security: ${selectedOpportunity?.security || 'N/A'}`, icon: Shield },
                    { label: `Internet: ${selectedOpportunity?.internet || 'N/A'}`, icon: WifiHigh },
                    { label: `Parking: ${selectedOpportunity?.parking || 'N/A'}`, icon: Car },
                    { label: `Rules: ${selectedOpportunity?.rules || 'N/A'}`, icon: Lock },
                    { label: `Inspection window: ${selectedOpportunity?.inspectionWindow || 'By arrangement'}`, icon: Clock },
                  ].map((item) => (
                    <View key={item.label} className="flex-row items-start mb-2">
                      <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-2 mt-0.5">
                        <item.icon size={13} color="#374151" weight="bold" />
                      </View>
                      <Text className="text-gray-700 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    BuildMyHouse Verification Checks
                  </Text>
                  <View className="flex-row flex-wrap">
                    {((selectedOpportunity?.verificationDocs || []).concat(selectedOpportunity?.extraDocs || [])).map((doc: string) => (
                      <View key={doc} className="bg-black rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                        <SealCheck size={12} color="#FFFFFF" weight="bold" />
                        <Text className="text-white text-xs ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {doc}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={requestRentInspection}
                  disabled={
                    requestInspectionMutation.isPending ||
                    scheduleHouseViewingMutation.isPending ||
                    scheduleLandViewingMutation.isPending
                  }
                  className="bg-black rounded-full py-4 px-8 mb-2"
                >
                  <Text className="text-white text-base text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {(requestInspectionMutation.isPending ||
                      scheduleHouseViewingMutation.isPending ||
                      scheduleLandViewingMutation.isPending)
                      ? 'Submitting...'
                      : 'Request Property Inspection'}
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-500 text-xs text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  BuildMyHouse will coordinate inspection and next steps for this location-specific scope.
                </Text>
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
                  <Check size={32} color="#FFFFFF" weight="bold" />
                </View>
                <Text className="text-xl text-black mb-2 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Inspection Requested!
                </Text>
                <Text className="text-gray-500 text-center text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  You will receive homeowner inspection details soon.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

