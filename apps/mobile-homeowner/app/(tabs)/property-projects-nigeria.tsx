import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Animated, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User, FunnelSimple, MagnifyingGlass, CaretDown, CaretUp, Info } from "phosphor-react-native";
import ProjectTypeTabs from '@/components/ProjectTypeTabs';
import { useState, useRef, useCallback, useMemo } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDesigns } from '@/hooks';
import { getBackendAssetUrl } from '@/lib/image';
import NotificationBell from '@/components/NotificationBell';
import DesignProductCard from '@/components/DesignProductCard';
import { useWebSeo } from '@/lib/seo';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { matchesKeywordPhraseQuery } from '@/lib/keyword-search';
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
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: designs = [], isLoading: designsLoading } = useDesigns();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'repairs' | 'upgrades' | 'renovation' | 'full_builds'>('repairs');
  const [isProjectsMessageExpanded, setIsProjectsMessageExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: string]: number}>({});
  const filterAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

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

  const handleImageScroll = useCallback((designId: string, event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const imageWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(contentOffset / imageWidth);
    setActiveImageIndex(prev => ({ ...prev, [designId]: index }));
  }, []);

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

  // 1 column on mobile, 3 on tablet, 4 on desktop
  const gridGap = 16;
  const gridColumns = screenWidth >= 1200 ? 4 : screenWidth >= 768 ? 3 : 1;
  const cardWidth = useMemo(
    () => (screenWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns,
    [gridColumns, horizontalPadding, screenWidth],
  );
  const cardHeight = gridColumns === 1 ? 460 : 420;

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

  const tabFilters = useMemo<Record<'repairs' | 'upgrades' | 'renovation' | 'full_builds', string[]>>(
    () => {
      const defaults = {
        repairs: [
          'Electricals',
          'Plumbing Fixes',
          'Roof Leak Repair',
          'Drainage Fix',
          'Bathroom Repair',
          'Gate/Fence Repair',
        ],
        upgrades: [
          'Kitchen Upgrade',
          'Bedroom Upgrade',
          'Security Gate Upgrade',
          'Door Upgrade',
          'Bathroom Upgrade',
          'Lighting Upgrade',
        ],
        renovation: ['Room-by-Room', 'Occupied Home', 'Family Home Rehab', 'Rental Prep', 'Interior Refresh'],
        full_builds: ['Bungalow Build', 'Duplex Build', 'Blockwork + Roofing', 'Shell to Finish', 'Turnkey Build'],
      } as const;

      const dynamicByTab: Record<'repairs' | 'upgrades' | 'renovation' | 'full_builds', string[]> = {
        repairs: [],
        upgrades: [],
        renovation: [],
        full_builds: [],
      };

      (designs || []).forEach((design: any) => {
        const filter = `${design?.projectTypeFilter || ''}`.trim();
        if (!filter) return;
        dynamicByTab[normalizeDesignTab(design)].push(filter);
      });

      const mergeFilters = (tab: 'repairs' | 'upgrades' | 'renovation' | 'full_builds') => {
        const merged = [...defaults[tab], ...dynamicByTab[tab]];
        const unique = Array.from(new Set(merged.map((item) => item.toLowerCase()))).map(
          (lower) => merged.find((item) => item.toLowerCase() === lower) as string,
        );
        return ['All', ...unique];
      };

      return {
        repairs: mergeFilters('repairs'),
        upgrades: mergeFilters('upgrades'),
        renovation: mergeFilters('renovation'),
        full_builds: mergeFilters('full_builds'),
      };
    },
    [designs, normalizeDesignTab],
  );

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

  // Filter GC plans based on keyword-aware phrase search + active tab + active filter
  const filteredDesigns = useMemo(() => {
    return (designs || []).filter((design: any) => {
      const searchable = `${design?.name || ''} ${design?.description || ''} ${design?.createdBy?.fullName || ''}`.toLowerCase();
      const matchesSearch = matchesKeywordPhraseQuery({
        query: searchQuery,
        fields: [
          design?.name,
          design?.description,
          design?.createdBy?.fullName,
          design?.projectTypeFilter,
          design?.projectTypeTag,
          design?.planType,
          ...(design?.images || []).map((image: any) => image?.label || ''),
        ],
      });
      if (!matchesSearch) return false;

      if (normalizeDesignTab(design) !== activeTab) return false;

      if (activeFilter === 'All') return true;
      const normalizedFilter = activeFilter.toLowerCase();
      const explicitFilter = `${design?.projectTypeFilter || ''}`.toLowerCase();
      return explicitFilter.includes(normalizedFilter) || searchable.includes(normalizedFilter);
    });
  }, [activeFilter, activeTab, designs, normalizeDesignTab, searchQuery]);

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
              }}
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
                        ? 'These scopes are abstract project ideas (not tied to one physical location). Use them to plan better before speaking to anyone on site. Filter by project type and compare options to find the best fit for your property. '
                        : 'These scopes are abstract project ideas you can adapt to your property.'}
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

      {/* Animated Filter Tags */}
      <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2" contentContainerStyle={{ paddingHorizontal: horizontalPadding }}>
            {(tabFilters[activeTab] || ['All']).map((tag) => (
            <TouchableOpacity 
              key={tag}
              onPress={() => setActiveFilter(tag)}
              className={`px-4 py-2 rounded-full mr-2 ${activeFilter === tag ? 'bg-white' : 'bg-white/10'}`}
            >
              <Text 
                className={activeFilter === tag ? 'text-black' : 'text-white/80'}
                style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}
              >
                {tag}
              </Text>
            </TouchableOpacity>
            ))}
          </ScrollView>
      </Animated.View>

      {/* Current Filter Indicator */}
      <View style={{ marginBottom: listingChrome.filterIndicatorMarginBottom, paddingHorizontal: horizontalPadding }}>
          <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
            <Text
              className="text-white"
              style={{ fontFamily: 'Poppins_600SemiBold', fontSize: listingChrome.mobileWeb ? 15 : 18 }}
            >
              {activeFilter}
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
            title="Popular searches in Nigeria"
            links={[
              { label: 'Construction in Lagos', href: '/construction/lagos' },
              { label: 'Renovation in Nigeria', href: '/renovation/nigeria' },
              { label: 'Interior Design in Nigeria', href: '/interior-design/nigeria' },
              { label: 'Build from UK', href: '/diaspora/build-in-nigeria-from-uk' },
            ]}
          />
        )}

        {/* GC Plans */}
            {designsLoading ? (
              <View className={`items-center justify-center ${listEmptyVerticalClass}`}>
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-white/50 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Loading designs...
                </Text>
              </View>
            ) : filteredDesigns.length === 0 ? (
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
                {filteredDesigns.map((design: any) => (
                  <DesignProductCard
                    key={design.id}
                    design={design}
                    width={cardWidth}
                    height={cardHeight}
                    onPress={() => router.push(`/house-summary?designId=${design.id}&designName=${design.name}`)}
                    isFavorite={favorites.includes(design.id)}
                    onToggleFavorite={() => toggleFavorite(design.id)}
                    activeImageIndex={activeImageIndex[design.id] || 0}
                    onImageScroll={(e) => handleImageScroll(design.id, e)}
                  />
                ))}
              </View>
            )}

        {listingChrome.mobileWeb && (
          <InternalLinksBlock
            compact
            dark
            title="Popular searches in Nigeria"
            links={[
              { label: 'Construction in Lagos', href: '/construction/lagos' },
              { label: 'Renovation in Nigeria', href: '/renovation/nigeria' },
              { label: 'Upgrade ideas in Nigeria', href: '/interior-design/nigeria' },
              { label: 'Build from UK', href: '/diaspora/build-in-nigeria-from-uk' },
            ]}
          />
        )}
      </ScrollView>
    </View>
  );
}
