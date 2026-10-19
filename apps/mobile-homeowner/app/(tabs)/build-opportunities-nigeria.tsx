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
  User,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Info,
} from "phosphor-react-native";
import OpportunityDetailView from '@/components/OpportunityDetailView';
import { ListingFilterBar } from '@/components/directory/ListingFilterBar';
import type { DirectoryFilterSection } from '@/components/directory/DirectoryFilterSheet';
import OpportunityProductCard, { OpportunityCardSkeleton } from '@/components/OpportunityProductCard';
import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRentalsForLease, type RentalListing } from '@/hooks/useRentalsForLease';
import { useRequestRentalInspection } from '@/hooks/useRentalInspection';
import { useHousesForSale, type HouseForSale } from '@/hooks/useHousesForSale';
import { useLandsForSale, type LandForSale } from '@/hooks/useLandsForSale';
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
import { locationMatchesState, secondaryListingLabel, sourceLabel, specsLine } from '@/lib/opportunity-card';

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
  priceAmount: number;
  sourceLabel: string;
  secondaryLabel?: string;
  specsLine?: string;
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
  profileData: Record<string, unknown>;
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
  const { data: rentalsForLease = [], isLoading: rentalsLoading } = useRentalsForLease();
  const { data: housesForSale = [], isLoading: housesLoading } = useHousesForSale();
  const { data: landsForSale = [], isLoading: landsLoading } = useLandsForSale();
  const listingsLoading = rentalsLoading || housesLoading || landsLoading;
  const requestInspectionMutation = useRequestRentalInspection();
  const scheduleHouseViewingMutation = useScheduleHouseViewing();
  const scheduleLandViewingMutation = useScheduleLandViewing();
  const userPicture = currentUser?.pictureUrl;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [listingKind, setListingKind] = useState<'all' | 'rental' | 'house' | 'land'>('all');
  const [priceBand, setPriceBand] = useState('all');
  const [bedsFilter, setBedsFilter] = useState('any');
  const [activeTab, setActiveTab] = useState<BuildOpportunityCategoryKey>('residential');
  const [isBuildMessageExpanded, setIsBuildMessageExpanded] = useState(false);

  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<BuildOpportunity | null>(null);
  const [rentRequestSuccess, setRentRequestSuccess] = useState(false);

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

  const GRID_MAX_WIDTH = 1280;
  const gridGap = 16;
  const gridColumns = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const contentWidth = Math.min(screenWidth, GRID_MAX_WIDTH);
  const cardWidth = useMemo(
    () => (contentWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns,
    [gridColumns, horizontalPadding, contentWidth],
  );

  useWebSeo({
    title: 'Build Opportunities in Nigeria | Land, Homes & Investment Properties | BuildMyHouse',
    description:
      'Find your next build in Nigeria. Browse verified rentals, houses for sale, land, and redevelopment opportunities in Lagos, Ogun, and across Nigeria.',
    canonicalPath: '/build-opportunities-nigeria',
    robots: 'index,follow',
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY > lastScrollY.current + 2 && currentScrollY > 24) {
      setHeaderCollapsed(true);
    } else if (currentScrollY <= 4) {
      setHeaderCollapsed(false);
    }
    lastScrollY.current = currentScrollY;
  };

  const allOpportunities = useMemo<BuildOpportunity[]>(() => {
    const rentalOpportunities: BuildOpportunity[] = rentalsForLease.map((listing: RentalListing) => ({
      id: listing.id,
      source: 'rental',
      title: listing.title,
      subtitle: `Rental • ${formatBuildOpportunityKey(listing.propertyType)}`,
      opportunityCategory: listing.opportunityCategory || 'residential',
      opportunityType: listing.opportunityType || undefined,
      location: listing.location,
      priceLabel: `${formatNaira(listing.annualRent)}/yr`,
      priceAmount: listing.annualRent,
      sourceLabel: sourceLabel('rental'),
      secondaryLabel: secondaryListingLabel({
        source: 'rental',
        title: listing.title,
        propertyType: listing.propertyType,
      }) || undefined,
      specsLine: specsLine({
        source: 'rental',
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        size: listing.sizeSqm,
        sizeUnit: 'm²',
      }) || undefined,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sizeLabel: listing.sizeSqm > 0 ? `${listing.sizeSqm}m²` : '',
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
      profileData: {
        opportunityCategory: listing.opportunityCategory,
        title: listing.title,
        location: listing.location,
        description: listing.description,
        propertyType: listing.propertyType,
        annualRent: listing.annualRent,
        serviceCharge: listing.serviceCharge,
        cautionDeposit: listing.cautionDeposit,
        legalFeePercent: listing.legalFeePercent,
        agencyFeePercent: listing.agencyFeePercent,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sizeSqm: listing.sizeSqm,
        furnishing: listing.furnishing,
        paymentPattern: listing.paymentPattern,
        power: listing.power,
        water: listing.water,
        internet: listing.internet,
        parking: listing.parking,
        security: listing.security,
        rules: listing.rules,
        inspectionWindow: listing.inspectionWindow,
        proximity: listing.proximity,
        latitude: (listing as { latitude?: number }).latitude,
        longitude: (listing as { longitude?: number }).longitude,
        verificationDocs: listing.verificationDocs,
      },
      images: listing.images || [],
    }));

    const houseOpportunities: BuildOpportunity[] = housesForSale.map((house: HouseForSale) => ({
      id: house.id,
      source: 'house',
      title: house.name,
      subtitle: `House • ${formatBuildOpportunityKey(house.propertyType || 'residential')}`,
      opportunityCategory: house.opportunityCategory || 'residential',
      opportunityType: house.opportunityType || undefined,
      location: house.location,
      priceLabel: formatNaira(house.price),
      priceAmount: house.price,
      sourceLabel: sourceLabel('house'),
      secondaryLabel: secondaryListingLabel({
        source: 'house',
        title: house.name,
        propertyType: house.propertyType,
      }) || undefined,
      specsLine: specsLine({
        source: 'house',
        bedrooms: house.bedrooms,
        bathrooms: house.bathrooms,
        size: house.squareMeters,
        sizeUnit: 'm²',
      }) || undefined,
      bedrooms: house.bedrooms,
      bathrooms: house.bathrooms,
      sizeLabel: house.squareMeters && house.squareMeters > 0 ? `${house.squareMeters}m²` : '',
      serviceHint: house.condition ? `Condition: ${house.condition}` : undefined,
      verificationDocs: house.documents,
      extraDocs: house.amenities,
      profileData: {
        opportunityCategory: house.opportunityCategory,
        name: house.name,
        location: house.location,
        description: house.description,
        price: house.price,
        bedrooms: house.bedrooms,
        bathrooms: house.bathrooms,
        squareFootage: house.squareFootage,
        squareMeters: house.squareMeters,
        propertyType: house.propertyType,
        yearBuilt: house.yearBuilt,
        condition: house.condition,
        parking: house.parking,
        documents: house.documents,
        latitude: (house as { latitude?: number }).latitude,
        longitude: (house as { longitude?: number }).longitude,
        amenities: house.amenities,
        nearbyFacilities: house.nearbyFacilities,
      },
      images: house.images || [],
    }));

    const landOpportunities: BuildOpportunity[] = landsForSale.map((land: LandForSale) => ({
      id: land.id,
      source: 'land',
      title: land.name,
      subtitle: `Land • ${formatBuildOpportunityKey(land.zoningType || 'development')}`,
      opportunityCategory: land.opportunityCategory || 'residential',
      opportunityType: land.opportunityType || undefined,
      location: land.location,
      priceLabel: formatNaira(land.price),
      priceAmount: land.price,
      sourceLabel: sourceLabel('land'),
      secondaryLabel: secondaryListingLabel({
        source: 'land',
        title: land.name,
        zoningType: land.zoningType,
        opportunityType: land.opportunityType,
      }) || undefined,
      specsLine: specsLine({
        source: 'land',
        size: land.sizeSqm,
        sizeUnit: 'sqm',
      }) || undefined,
      sizeLabel: land.sizeSqm > 0 ? `${land.sizeSqm} sqm` : '',
      serviceHint: land.roadAccess ? `Road access: ${land.roadAccess}` : undefined,
      verificationDocs: land.documents,
      extraDocs: land.restrictions,
      profileData: {
        opportunityCategory: land.opportunityCategory,
        name: land.name,
        location: land.location,
        description: land.description,
        price: land.price,
        sizeSqm: land.sizeSqm,
        titleDocument: land.titleDocument,
        zoningType: land.zoningType,
        topography: land.topography,
        roadAccess: land.roadAccess,
        ownershipType: land.ownershipType,
        documents: land.documents,
        latitude: (land as { latitude?: number }).latitude,
        longitude: (land as { longitude?: number }).longitude,
        nearbyLandmarks: land.nearbyLandmarks,
        restrictions: land.restrictions,
      },
      images: land.images || [],
    }));

    return [...rentalOpportunities, ...houseOpportunities, ...landOpportunities];
  }, [rentalsForLease, housesForSale, landsForSale]);

  const opportunityExtraFilters = useMemo<DirectoryFilterSection[]>(() => {
    const chip = (key: string, label: string, active: boolean, onPress: () => void) => ({ key, label, active, href: '', onPress });
    return [
      {
        id: 'listing',
        title: 'Type',
        chips: (['all', 'rental', 'house', 'land'] as const).map((kind) =>
          chip(`type-${kind}`, kind === 'all' ? 'All' : kind === 'house' ? 'For sale' : kind === 'land' ? 'Land' : 'Rental', listingKind === kind, () => setListingKind(kind)),
        ),
      },
      {
        id: 'price',
        title: 'Price range',
        chips: [
          chip('price-all', 'Any', priceBand === 'all', () => setPriceBand('all')),
          chip('price-under', 'Under ₦20m', priceBand === 'under-20', () => setPriceBand('under-20')),
          chip('price-mid', '₦20m to ₦100m', priceBand === '20-100', () => setPriceBand('20-100')),
          chip('price-over', 'Over ₦100m', priceBand === 'over-100', () => setPriceBand('over-100')),
        ],
      },
      ...(listingKind === 'land' ? [] : [{
        id: 'beds',
        title: 'Bedrooms',
        chips: ['any', '1', '2', '3', '4', '5'].map((value) =>
          chip(`beds-${value}`, value === 'any' ? 'Any' : value === '5' ? '5+' : value, bedsFilter === value, () => setBedsFilter(value)),
        ),
      }]),
    ];
  }, [listingKind, priceBand, bedsFilter]);

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
      const filterMatch = activeFilter === 'All'
        || (activeFilter === 'land' ? listing.source === 'land' : listing.opportunityType === activeFilter);
      const stateMatch = locationMatchesState(listing.location, stateFilter);
      const kindMatch = listingKind === 'all' || listing.source === listingKind;
      const priceMatch = priceBand === 'all'
        || (priceBand === 'under-20' && listing.priceAmount < 20_000_000)
        || (priceBand === '20-100' && listing.priceAmount >= 20_000_000 && listing.priceAmount <= 100_000_000)
        || (priceBand === 'over-100' && listing.priceAmount > 100_000_000);
      const bedsMatch = listing.source === 'land' || bedsFilter === 'any'
        || (bedsFilter === '5' ? Number(listing.bedrooms) >= 5 : Number(listing.bedrooms) === Number(bedsFilter));
      return tabMatch && queryMatch && filterMatch && stateMatch && kindMatch && priceMatch && bedsMatch;
    });
  }, [activeTab, searchQuery, activeFilter, stateFilter, listingKind, priceBand, bedsFilter, allOpportunities]);

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
                  placeholder="Search by location or type (e.g. land in Mowe)"
                  placeholderTextColor="#8a8a8a"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-white"
                  style={{ fontFamily: 'Poppins_400Regular', outlineStyle: 'none' } as any}
                />
              </View>
            </View>
            <ListingFilterBar
              quick={['duplex', 'bungalow', 'terrace', 'apartment_block', 'mini_estate', 'land'].map((value) => ({
                label: value === 'land' ? 'Land' : formatBuildOpportunityKey(value),
                value,
                count: 1,
              }))}
              serviceTitle="Service"
              serviceOptions={(availableFilters.filter((tag) => tag !== 'All')).map((tag) => ({
                label: formatBuildOpportunityKey(tag),
                value: tag,
                count: allOpportunities.filter((item) => item.opportunityType === tag && (item.opportunityCategory || 'residential') === activeTab).length || (allOpportunities.some((item) => item.opportunityType === tag) ? 1 : 0),
              }))}
              serviceValue={activeFilter}
              onService={(value) => {
                setActiveFilter(value);
                router.setParams({ type: value === 'All' ? '' : value });
              }}
              stateValue={stateFilter}
              onState={(value) => {
                setStateFilter(value);
                router.setParams({ state: value === 'All' ? '' : value });
              }}
              areaValue="All"
              onArea={() => undefined}
              extraSections={opportunityExtraFilters}
              activeCount={[activeFilter !== 'All', stateFilter !== 'All', listingKind !== 'all', priceBand !== 'all', bedsFilter !== 'any'].filter(Boolean).length}
              resultCount={filteredListings.length}
              noun="opportunity"
              onClear={() => {
                setActiveFilter('All');
                setStateFilter('All');
                setListingKind('all');
                setPriceBand('all');
                setBedsFilter('any');
                router.setParams({ type: '', state: '', listing: '', price: '', beds: '' });
              }}
            />
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

        {listingsLoading ? (
          <View className="pb-8" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: gridGap, alignSelf: 'center', width: contentWidth - horizontalPadding * 2 + horizontalPadding * 0 }}>
            {Array.from({ length: gridColumns * 2 }).map((_, index) => (
              <OpportunityCardSkeleton key={index} width={cardWidth} />
            ))}
          </View>
        ) : filteredListings.length === 0 ? (
          <View className={`items-center justify-center ${listEmptyVerticalClass}`}>
            <Text className="text-white/70 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {stateFilter === 'All' ? 'No opportunities match this filter' : `No opportunities in ${stateFilter} yet. Try all of Nigeria.`}
            </Text>
            <Text className="text-white/40 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              Try another category, filter, or location keyword.
            </Text>
          </View>
        ) : (
          <View className="pb-8" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: gridGap, alignSelf: 'center', maxWidth: contentWidth, width: '100%' }}>
            {filteredListings.map((listing) => (
              <OpportunityProductCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  location: listing.location,
                  priceLabel: listing.priceLabel,
                  specsLine: listing.specsLine,
                  sourceLabel: listing.sourceLabel,
                  secondaryLabel: listing.secondaryLabel,
                  images: listing.images || [],
                }}
                width={cardWidth}
                onPress={() => openRentModal(listing)}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={() => toggleFavorite(listing.id)}
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

                {selectedOpportunity ? (
                  <OpportunityDetailView
                    entity={selectedOpportunity.source === 'rental' ? 'rental' : selectedOpportunity.source === 'house' ? 'house' : 'land'}
                    data={selectedOpportunity.profileData}
                    title={selectedOpportunity.title}
                    priceLabel={selectedOpportunity.priceLabel}
                    location={selectedOpportunity.location}
                    sourceLabel={selectedOpportunity.sourceLabel}
                    images={(selectedOpportunity.images || []).map((img: any) => ({
                      url: getBackendAssetUrl(img.thumbnailUrl || img.url) || img.url,
                      label: img.label,
                    }))}
                    onRequestInspection={requestRentInspection}
                    requesting={requestInspectionMutation.isPending || scheduleHouseViewingMutation.isPending || scheduleLandViewingMutation.isPending}
                  />
                ) : null}
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

