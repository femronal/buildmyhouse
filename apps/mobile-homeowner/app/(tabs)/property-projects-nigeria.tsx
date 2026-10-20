import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Animated, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListingFilterBar } from '@/components/directory/ListingFilterBar';
import { User, MagnifyingGlass, CaretDown, CaretUp, Info } from "phosphor-react-native";
import ProjectTypeTabs from '@/components/ProjectTypeTabs';
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDesignCatalog } from '@/hooks';
import { getBackendAssetUrl } from '@/lib/image';
import NotificationBell from '@/components/NotificationBell';
import DesignProductCard, { DesignCardSkeleton } from '@/components/DesignProductCard';
import { useWebSeo } from '@/lib/seo';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { matchesKeywordPhraseQuery } from '@/lib/keyword-search';
import {
  ALL_LOCATIONS_FILTER,
  designMatchesLocationFilter,
  getDesignLocationLabel,
  getDesignLocationSearchFields,
} from '@/lib/design-location';
import { locationMatchesState } from '@/lib/opportunity-card';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getFloatingTabBarMetrics,
  getScreenHorizontalPadding,
  getTabContentBottomPadding,
  getTabListingChrome,
} from "@/lib/responsive-layout";

export default function ExploreScreen() {
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
  const listEmptyVerticalClass = listingChrome.mobileWeb ? 'py-10' : 'py-20';
  const params = useLocalSearchParams<{ service?: string; state?: string; lga?: string }>();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState(typeof params.service === 'string' && params.service ? params.service : 'All');
  const [activeLocationFilter, setActiveLocationFilter] = useState(typeof params.lga === 'string' && params.lga ? params.lga : ALL_LOCATIONS_FILTER);
  const [stateFilter, setStateFilter] = useState(typeof params.state === 'string' && params.state ? params.state : 'All');
  const [activeTab, setActiveTab] = useState<'repairs' | 'upgrades' | 'renovation' | 'full_builds'>('repairs');
  const catalog = useDesignCatalog({
    tab: activeTab,
    q: debouncedSearch,
    service: activeFilter === 'All' ? undefined : activeFilter,
    state: stateFilter !== 'All' ? stateFilter : undefined,
    lga: activeLocationFilter !== ALL_LOCATIONS_FILTER ? activeLocationFilter : undefined,
  });
  const catalogPages = catalog.data?.pages || [];
  const serverFiltered = catalogPages[0]?.serverFiltered === true;
  const designs = catalogPages.flatMap((page) => page.items || []);
  const serviceFacets = catalogPages[0]?.facets?.services || [];
  const designsLoading = catalog.isLoading;
  const [localCount, setLocalCount] = useState(16);
  useEffect(() => {
    setLocalCount(16);
  }, [activeTab, activeFilter, activeLocationFilter, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [isProjectsMessageExpanded, setIsProjectsMessageExpanded] = useState(false);
  const lastScrollY = useRef(0);
  const loadingMoreRef = useRef(false);

  // Collapsible header chrome (headline, tabs, search, notice) — collapses on
  // scroll down, restores when the list is scrolled back to the very top.
  const headerAnim = useRef(new Animated.Value(1)).current;
  const headerCollapsedRef = useRef(false);
  const [collapsibleHeight, setCollapsibleHeight] = useState(0);

  const setHeaderCollapsed = useCallback(
    (collapsed: boolean) => {
      if (headerCollapsedRef.current === collapsed) return;
      headerCollapsedRef.current = collapsed;
      Animated.timing(headerAnim, {
        toValue: collapsed ? 0 : 1,
        duration: 280,
        useNativeDriver: false,
      }).start();
    },
    [headerAnim],
  );

  const userPicture = currentUser?.pictureUrl;

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const { layoutMeasurement, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + currentScrollY >= contentSize.height - 480 && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      if (serverFiltered && catalog.hasNextPage && !catalog.isFetchingNextPage) {
        void catalog.fetchNextPage();
      } else if (!serverFiltered) {
        setLocalCount((count) => count + 16);
      }
      setTimeout(() => {
        loadingMoreRef.current = false;
      }, 500);
    }
    if (currentScrollY > lastScrollY.current + 2 && currentScrollY > 24) {
      setHeaderCollapsed(true);
    } else if (currentScrollY <= 4) {
      setHeaderCollapsed(false);
    }
    lastScrollY.current = currentScrollY;
  };

  // 2 columns on mobile, 3 on tablet, 4 on desktop
  const gridGap = 16;
  const gridColumns = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const cardWidth = useMemo(
    () => (screenWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns,
    [gridColumns, horizontalPadding, screenWidth],
  );
  const normalizeDesignTab = useCallback((design: any): 'repairs' | 'upgrades' | 'renovation' | 'full_builds' => {
    const explicitTag = `${design?.projectTypeTag || ''}`.toLowerCase();
    if (explicitTag === 'repair') return 'repairs';
    if (explicitTag === 'upgrades') return 'upgrades';
    if (explicitTag === 'renovation') return 'renovation';
    if (explicitTag === 'full_builds') return 'full_builds';

    const apiPlanType = `${design?.planType || ''}`.toLowerCase();
    if (apiPlanType === 'interior_design') return 'upgrades';
    if (apiPlanType === 'homebuilding') return 'full_builds';

    const searchable = `${design?.name || ''} ${design?.description || ''}`.toLowerCase();
    const likelyRepair = ['repair', 'fix', 'electrical', 'plumbing', 'roof', 'drainage'].some((keyword) =>
      searchable.includes(keyword),
    );
    return likelyRepair ? 'repairs' : 'renovation';
  }, []);

  const serviceOptions = useMemo(() => {
    const fromFacets = (serviceFacets || [])
      .filter((item) => item.count > 0 || item.label === activeFilter)
      .map((item) => ({ label: item.label, value: item.label, count: item.count }));
    if (fromFacets.length > 0) return fromFacets;

    // Fallback when server facets are missing (legacy full list response).
    const counts = new Map<string, { label: string; count: number }>();
    (designs || []).forEach((design: any) => {
      const tags: string[] = Array.isArray(design?.createdBy?.contractorProfile?.specialtyTags)
        ? design.createdBy.contractorProfile.specialtyTags
        : [];
      const seen = new Set<string>();
      tags.forEach((tag) => {
        const label = `${tag || ''}`.trim();
        if (!label) return;
        const key = label.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { label, count: 1 });
      });
    });
    return Array.from(counts.values())
      .filter((item) => item.count > 0 || item.label === activeFilter)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .map((item) => ({ label: item.label, value: item.label, count: item.count }));
  }, [serviceFacets, designs, activeFilter]);

  useEffect(() => {
    if (activeFilter === 'All') return;
    const stillVisible = serviceOptions.some((item) => item.value === activeFilter);
    if (!stillVisible) {
      setActiveFilter('All');
      router.setParams({ service: '' });
    }
  }, [activeTab, serviceOptions, activeFilter, router]);

  const tabDescription = useMemo<Record<'repairs' | 'upgrades' | 'renovation' | 'full_builds', string>>(
    () => ({
      repairs:
        'GC-uploaded repair scopes you can adapt to your own property before speaking to anyone on site.',
      upgrades:
        'Practical upgrade scope ideas to improve existing spaces without jumping straight into full renovation.',
      renovation:
        'Phased renovation scope ideas for homeowners who want clearer budget and stage discipline.',
      full_builds:
        'Full build plan ideas with clearer execution direction for bigger projects when you are ready.',
    }),
    [],
  );

  // Filter GC plans based on keyword-aware phrase search + active tab + specialty/location
  const filteredDesigns = useMemo(() => {
    if (serverFiltered) return designs || [];
    return (designs || []).filter((design: any) => {
      const matchesSearch = matchesKeywordPhraseQuery({
        query: searchQuery,
        fields: [
          design?.name,
          design?.description,
          design?.createdBy?.fullName,
          design?.projectTypeFilter,
          design?.projectTypeTag,
          design?.planType,
          ...(design?.createdBy?.contractorProfile?.specialtyTags || []),
          ...getDesignLocationSearchFields(design),
          ...(design?.images || []).map((image: any) => image?.label || ''),
        ],
      });
      if (!matchesSearch) return false;

      if (!designMatchesLocationFilter(design, activeLocationFilter, stateFilter)) return false;
      if (!locationMatchesState(getDesignLocationLabel(design), stateFilter)) return false;

      if (normalizeDesignTab(design) !== activeTab) return false;

      if (activeFilter === 'All') return true;
      const normalizedFilter = activeFilter.toLowerCase();
      const tags: string[] = Array.isArray(design?.createdBy?.contractorProfile?.specialtyTags)
        ? design.createdBy.contractorProfile.specialtyTags
        : [];
      return tags.some((tag) => `${tag || ''}`.toLowerCase() === normalizedFilter);
    });
  }, [activeFilter, activeLocationFilter, stateFilter, activeTab, designs, normalizeDesignTab, searchQuery, serverFiltered]);
  const visibleDesigns = serverFiltered ? filteredDesigns : filteredDesigns.slice(0, localCount);
  const canLoadMore = serverFiltered ? !!catalog.hasNextPage : filteredDesigns.length > visibleDesigns.length;

  useWebSeo({
    title: 'Property Projects in Nigeria | Repairs, Renovation & Builds | BuildMyHouse',
    description:
      'Pick your project in Nigeria — browse verified repair, upgrade, renovation, and full build scopes in Lagos and nationwide. Compare scopes and start property work with BuildMyHouse.',
    canonicalPath: '/property-projects-nigeria',
    robots: 'index,follow',
  });

  return (
    <View className="flex-1 bmh-dark-page" style={{ backgroundColor: '#050505' }}>
      {/* Header */}
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
            <Image 
              source={{ uri: getBackendAssetUrl(userPicture) }} 
              className="w-full h-full"
              resizeMode="cover"
            />
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
                Catalog
              </Text>
              <Text
                className="text-[26px] md:text-4xl text-white tracking-tight leading-tight"
                style={{ fontFamily: 'Poppins_500Medium' }}
                accessibilityRole="header"
              >
                Pick Your{'\n'}
                <Text style={{ color: '#5c5c5c' }}>Project.</Text>
              </Text>
            </View>

            <ProjectTypeTabs
              dark
              activeTab={activeTab}
              onSelect={(key) => {
                setActiveTab(key);
                setActiveFilter('All');
                setActiveLocationFilter(ALL_LOCATIONS_FILTER);
              }}
            />
          </View>

          {/* Search & Filter */}
          <View style={{ marginBottom: listingChrome.searchSectionMarginBottom, paddingHorizontal: horizontalPadding }}>
            <View className="flex-row items-center" style={{ marginBottom: 20 }}>
              <View
                className="flex-1 bg-white/5 border border-white/15 rounded-full px-4 flex-row items-center"
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
            </View>
            <ListingFilterBar
              quick={serviceOptions.slice(0, 6)}
              serviceTitle="Service"
              serviceOptions={serviceOptions}
              serviceValue={activeFilter}
              onService={(value) => {
                setActiveFilter(value);
                router.setParams({ service: value === 'All' ? '' : value });
              }}
              stateValue={stateFilter}
              onState={(value) => {
                setStateFilter(value);
                setActiveLocationFilter(ALL_LOCATIONS_FILTER);
                router.setParams({ state: value === 'All' ? '' : value, lga: '' });
              }}
              areaValue={activeLocationFilter === ALL_LOCATIONS_FILTER ? 'All' : activeLocationFilter}
              onArea={(value) => {
                const next = value === 'All' ? ALL_LOCATIONS_FILTER : value;
                setActiveLocationFilter(next);
                router.setParams({ lga: value === 'All' ? '' : value });
              }}
              activeCount={[activeFilter !== 'All', stateFilter !== 'All', activeLocationFilter !== ALL_LOCATIONS_FILTER].filter(Boolean).length}
              resultCount={catalogPages[0]?.total ?? filteredDesigns.length}
              noun="project"
              onClear={() => {
                setActiveFilter('All');
                setStateFilter('All');
                setActiveLocationFilter(ALL_LOCATIONS_FILTER);
                router.setParams({ service: '', state: '', lga: '' });
              }}
            />
          </View>

          <View style={{ paddingHorizontal: horizontalPadding, marginBottom: 12 }}>
            <View className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <TouchableOpacity
                onPress={() => setIsProjectsMessageExpanded((prev) => !prev)}
                className="flex-row items-start justify-between"
                activeOpacity={0.85}
              >
                <View className="flex-row items-start flex-1 pr-2">
                  <View className="w-6 h-6 rounded-full bg-white/10 items-center justify-center mr-2 mt-0.5">
                    <Info size={14} color="#d4d4d4" weight="bold" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white mb-1" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 10 }}>
                      GC-uploaded project scopes
                    </Text>
                    <Text className="text-white/60" style={{ fontFamily: 'Poppins_400Regular', fontSize: 10, lineHeight: 14 }}>
                      {isProjectsMessageExpanded
                        ? 'Each scope uses the contractor service location (state and area). Search or filter by state and LGA, and by the contractor specialties present in the listings. '
                        : 'Each scope shows a service location. Search or filter by state and specialty to find a fit.'}
                      {isProjectsMessageExpanded ? tabDescription[activeTab] : ''}
                    </Text>
                  </View>
                </View>
                <View className="pl-1 pt-0.5">
                  {isProjectsMessageExpanded ? (
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
        {designsLoading ? (
              <View className="pb-8" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }}>
                {Array.from({ length: gridColumns * 2 }).map((_, index) => (
                  <DesignCardSkeleton key={index} width={cardWidth} />
                ))}
              </View>
            ) : visibleDesigns.length === 0 ? (
              <View className={`items-center justify-center ${listEmptyVerticalClass}`}>
                {!currentUser && !userLoading && !searchQuery ? (
                  <>
                    <Text className="text-white/70 text-center text-lg mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Sign in to browse designs
                    </Text>
                    <Text className="text-white/40 text-center text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Create an account or log in to browse designs uploaded by General Contractors.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/login')}
                      className="bg-white rounded-full py-3 px-6"
                    >
                      <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Sign up / Log in
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text className="text-white/70 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {searchQuery ? 'No project scopes found' : 'No project scopes available yet'}
                    </Text>
                    <Text className="text-white/40 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {searchQuery ? 'Try a different search term or filter' : 'General Contractors can upload project scopes that will appear here'}
                    </Text>
                  </>
                )}
              </View>
            ) : (
              <View className="pb-8" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }}>
                {visibleDesigns.map((design: any) => (
                  <DesignProductCard
                    key={design.id}
                    design={design}
                    width={cardWidth}
                    onPress={async () => {
                      const destinationPath = `/house-summary?designId=${encodeURIComponent(design.id)}&designName=${encodeURIComponent(design.name || '')}`;
                      const canContinue = await requireAuthToContinue({
                        router,
                        currentUser,
                        userLoading,
                        destinationPath,
                      });
                      if (canContinue) {
                        router.push(destinationPath as any);
                      }
                    }}
                    isFavorite={favorites.includes(design.id)}
                    onToggleFavorite={() => toggleFavorite(design.id)}
                  />
                ))}
              </View>
            )}

        {canLoadMore ? (
          <TouchableOpacity
            onPress={() => {
              if (serverFiltered) void catalog.fetchNextPage();
              else setLocalCount((count) => count + 16);
            }}
            className="self-center mt-2 mb-6 rounded-full bg-white px-5 py-3"
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#111111' }}>
              {catalog.isFetchingNextPage ? 'Loading more' : 'Load more'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <InternalLinksBlock
          compact={listingChrome.mobileWeb}
          dark
          title="Popular searches in Nigeria"
          links={[
            { label: 'Construction in Lagos', href: '/construction/lagos' },
            { label: 'Renovation in Nigeria', href: '/renovation/nigeria' },
            { label: 'Interior Design in Nigeria', href: '/interior-design/nigeria' },
            { label: 'Build from UK', href: '/diaspora/build-in-nigeria-from-uk' },
          ]}
        />
      </ScrollView>
    </View>
  );
}
