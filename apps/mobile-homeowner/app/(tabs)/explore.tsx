import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Animated, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User, Filter, Search, Heart, Bed, Bath, Maximize, Star, ChevronDown } from "lucide-react-native";
import { useState, useRef, useCallback, useMemo } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDesigns } from '@/hooks';
import { getBackendAssetUrl } from '@/lib/image';
import NotificationBell from '@/components/NotificationBell';
import { useWebSeo } from '@/lib/seo';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getFloatingTabBarMetrics,
  getScreenHorizontalPadding,
  getTabContentBottomPadding,
  getTwoColumnCardWidth,
  getTabListingChrome,
} from "@/lib/responsive-layout";
import { cardShadowStyle } from "@/lib/card-styles";

// Helper to get full image URL from backend
const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const backendOrigin = apiUrl
    ? apiUrl.replace(/\/api\/?$/, '')
    : (__DEV__ ? 'http://localhost:3001' : 'https://api.buildmyhouse.app');
  return `${backendOrigin}${imageUrl}`;
};

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
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: string]: number}>({});
  const filterAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  
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
    if (currentScrollY > lastScrollY.current && currentScrollY > 50 && showFilters) {
      Animated.timing(filterAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      setShowFilters(false);
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

  const cardWidth = getTwoColumnCardWidth(screenWidth);

  const tabFilters = useMemo<Record<'repairs' | 'upgrades' | 'renovation' | 'full_builds', string[]>>(
    () => ({
      repairs: [
        'All',
        'Electricals',
        'Plumbing Fixes',
        'Roof Leak Repair',
        'Drainage Fix',
        'Bathroom Repair',
        'Gate/Fence Repair',
      ],
      upgrades: [
        'All',
        'Kitchen Upgrade',
        'Bedroom Upgrade',
        'Security Gate Upgrade',
        'Door Upgrade',
        'Bathroom Upgrade',
        'Lighting Upgrade',
      ],
      renovation: [
        'All',
        'Room-by-Room',
        'Occupied Home',
        'Family Home Rehab',
        'Rental Prep',
        'Interior Refresh',
      ],
      full_builds: [
        'All',
        'Bungalow Build',
        'Duplex Build',
        'Blockwork + Roofing',
        'Shell to Finish',
        'Turnkey Build',
      ],
    }),
    [],
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

  // Filter GC plans based on search query + active tab + active filter
  const filteredDesigns = useMemo(() => {
    const tabKeywords: Record<'repairs' | 'upgrades' | 'renovation' | 'full_builds', string[]> = {
      repairs: ['repair', 'fix', 'electrical', 'plumbing', 'roof', 'drainage', 'maintenance'],
      upgrades: ['upgrade', 'interior', 'kitchen', 'bedroom', 'gate', 'door', 'lighting'],
      renovation: ['renovation', 'rehab', 'remodel', 'occupied', 'refresh'],
      full_builds: ['build', 'construction', 'new build', 'duplex', 'bungalow', 'foundation', 'shell'],
    };

    return (designs || []).filter((design: any) => {
      const searchable = `${design?.name || ''} ${design?.description || ''} ${design?.createdBy?.fullName || ''} ${design?.projectType || ''}`.toLowerCase();
      const matchesSearch = !searchQuery.trim() || searchable.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const matchesTab = tabKeywords[activeTab].some((word) => searchable.includes(word));
      if (!matchesTab) return false;

      if (activeFilter === 'All') return true;
      return searchable.includes(activeFilter.toLowerCase());
    });
  }, [activeFilter, activeTab, designs, searchQuery]);

  useWebSeo({
    title: 'Explore Designs, Homes & Land in Nigeria | BuildMyHouse',
    description:
      'Explore home designs, houses for sale, and land opportunities in Nigeria. Compare options and start your next project with BuildMyHouse.',
    canonicalPath: '/explore',
    robots: 'index,follow',
  });

  return (
    <View className="flex-1 bg-white">
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
          className="bg-black rounded-full items-center justify-center overflow-hidden"
          style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
        >
          {userPicture ? (
            <Image 
              source={{ uri: getBackendAssetUrl(userPicture) }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <User size={listingChrome.headerUserIconSize} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
        
        <Text 
          className="text-black"
          style={{ fontFamily: 'Poppins_600SemiBold', fontSize: listingChrome.titleFontSize }}
        >
          Projects
        </Text>
        
        <NotificationBell />
      </View>

      {/* Search & Filter */}
      <View style={{ marginBottom: listingChrome.searchSectionMarginBottom, paddingHorizontal: horizontalPadding }}>
        <View className="flex-row items-center">
          <View
            className="flex-1 bg-gray-100 rounded-2xl px-3 flex-row items-center mr-3"
            style={{ paddingVertical: listingChrome.searchBarPaddingY }}
          >
            <Search size={20} color="#737373" strokeWidth={2} />
            <TextInput
              placeholder="Search repair, upgrade, renovation, and build plans..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
          </View>
          <TouchableOpacity 
            onPress={toggleFilters}
            className={`rounded-full items-center justify-center ${showFilters ? 'bg-gray-200' : 'bg-gray-100'}`}
            style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
          >
            <Filter size={listingChrome.mobileWeb ? 20 : 22} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ marginBottom: listingChrome.tabsSectionMarginBottom, paddingHorizontal: horizontalPadding }}>
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => {
              setActiveTab('repairs');
              setActiveFilter('All');
            }}
            className={`flex-1 px-1 rounded-xl items-center ${activeTab === 'repairs' ? 'bg-black' : ''}`}
            style={{ paddingVertical: listingChrome.segmentedTabPaddingY }}
          >
            <Text className={`text-xs ${activeTab === 'repairs' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Repairs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('upgrades');
              setActiveFilter('All');
            }}
            className={`flex-1 px-1 rounded-xl items-center ${activeTab === 'upgrades' ? 'bg-black' : ''}`}
            style={{ paddingVertical: listingChrome.segmentedTabPaddingY }}
          >
            <Text className={`text-xs ${activeTab === 'upgrades' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Upgrades
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('renovation');
              setActiveFilter('All');
            }}
            className={`flex-1 px-1 rounded-xl items-center ${activeTab === 'renovation' ? 'bg-black' : ''}`}
            style={{ paddingVertical: listingChrome.segmentedTabPaddingY }}
          >
            <Text className={`text-xs ${activeTab === 'renovation' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Renovation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('full_builds');
              setActiveFilter('All');
            }}
            className={`flex-1 px-1 rounded-xl items-center ${activeTab === 'full_builds' ? 'bg-black' : ''}`}
            style={{ paddingVertical: listingChrome.segmentedTabPaddingY }}
          >
            <Text className={`text-xs ${activeTab === 'full_builds' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Full Builds
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: horizontalPadding, marginBottom: 10 }}>
        <Text className="text-gray-500 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          GC-uploaded project scopes only. These are abstract plan ideas (not tied to one physical location) you can adapt to your own project. {tabDescription[activeTab]}
        </Text>
      </View>

      {/* Animated Filter Tags */}
      <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2" contentContainerStyle={{ paddingHorizontal: horizontalPadding }}>
            {(tabFilters[activeTab] || ['All']).map((tag) => (
            <TouchableOpacity 
              key={tag}
              onPress={() => setActiveFilter(tag)}
              className={`px-4 py-2 rounded-full mr-2 ${activeFilter === tag ? 'bg-black' : 'bg-gray-100'}`}
            >
              <Text 
                className={activeFilter === tag ? 'text-white' : 'text-black'}
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
              className="text-black"
              style={{ fontFamily: 'Poppins_600SemiBold', fontSize: listingChrome.mobileWeb ? 15 : 18 }}
            >
              {activeFilter}
            </Text>
            <ChevronDown size={18} color="#000000" strokeWidth={2} style={{ marginLeft: 4 }} />
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
                <ActivityIndicator size="large" color="#000" />
                <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Loading designs...
                </Text>
              </View>
            ) : filteredDesigns.length === 0 ? (
              <View className={`items-center justify-center ${listEmptyVerticalClass}`}>
                {!currentUser && !userLoading && !searchQuery ? (
                  <>
                    <Text className="text-gray-500 text-center text-lg mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Sign in to browse designs
                    </Text>
                    <Text className="text-gray-400 text-center text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Create an account or log in to browse designs uploaded by General Contractors.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/login')}
                      className="bg-black rounded-full py-3 px-6"
                    >
                      <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Sign up / Log in
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text className="text-gray-500 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {searchQuery ? 'No project scopes found' : 'No project scopes available yet'}
                    </Text>
                    <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {searchQuery ? 'Try a different search term or filter' : 'General Contractors can upload project scopes that will appear here'}
                    </Text>
                  </>
                )}
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between pb-8">
                {filteredDesigns.map((design: any) => {
              const images = design.images || [];
              const squareMeters = design.squareMeters || (design.squareFootage * 0.092903);
              return (
                <TouchableOpacity
                  key={design.id}
                  onPress={() => router.push(`/house-summary?designId=${design.id}&designName=${design.name}`)}
                  style={[cardShadowStyle, { width: cardWidth }]}
                  className="mb-5 bg-white rounded-3xl border border-gray-200"
                >
                  <View className="overflow-hidden rounded-3xl">
                  <View className="relative">
                    {images.length > 0 ? (
                      <>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          onScroll={(e) => handleImageScroll(design.id, e)}
                          scrollEventThrottle={16}
                        >
                          {images.map((image: any, index: number) => (
                            <View key={image.id || index} style={{ width: cardWidth }} className="relative">
                              <Image
                                source={{ uri: getImageUrl(image.url) }}
                                className="h-36"
                                style={{ width: cardWidth }}
                                resizeMode="cover"
                              />
                              {image.label && (
                                <View className="absolute bottom-2 left-2 bg-black/70 rounded-full px-2 py-0.5">
                                  <Text 
                                    className="text-white text-xs"
                                    style={{ fontFamily: 'Poppins_500Medium', fontSize: 10 }}
                                  >
                                    {image.label}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </ScrollView>
                        
                        {/* Dots Indicator */}
                        {images.length > 1 && (
                          <View className="absolute bottom-2 right-2 flex-row">
                            {images.slice(0, 5).map((_: any, index: number) => (
                              <View
                                key={index}
                                className={`w-1 h-1 rounded-full mx-0.5 ${
                                  index === (activeImageIndex[design.id] || 0) ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={{ width: cardWidth, height: 144 }} className="bg-gray-200 items-center justify-center">
                        <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                          No images
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity 
                      onPress={() => toggleFavorite(design.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full items-center justify-center"
                    >
                      <Heart 
                        size={16} 
                        color={favorites.includes(design.id) ? "#000000" : "#A3A3A3"} 
                        strokeWidth={2}
                        fill={favorites.includes(design.id) ? "#000000" : "transparent"}
                      />
                    </TouchableOpacity>
                  </View>
                  <View className="p-3">
                    <Text 
                      className="text-sm text-black mb-1"
                      style={{ fontFamily: 'Poppins_700Bold' }}
                      numberOfLines={1}
                    >
                      {design.name}
                    </Text>
                    
                    <View className="flex-row items-center mb-1">
                      <Star size={12} color="#000000" strokeWidth={2} fill="#000000" />
                      <Text 
                        className="text-black ml-1 text-xs"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {design.rating.toFixed(1)}
                      </Text>
                      <Text 
                        className="text-gray-500 ml-1 text-xs"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        ({design.reviews})
                      </Text>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <Bed size={12} color="#737373" strokeWidth={2} />
                      <Text 
                        className="text-gray-500 ml-1 mr-2 text-xs"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {design.bedrooms}
                      </Text>
                      <Bath size={12} color="#737373" strokeWidth={2} />
                      <Text 
                        className="text-gray-500 ml-1 mr-2 text-xs"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {design.bathrooms}
                      </Text>
                      <Maximize size={12} color="#737373" strokeWidth={2} />
                      <Text 
                        className="text-gray-500 ml-1 text-xs"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {Math.round(squareMeters)}m²
                      </Text>
                    </View>

                    <Text 
                      className="text-black text-base"
                      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                    >
                      ₦{design.estimatedCost.toLocaleString()}
                    </Text>
                  </View>
                  </View>
                </TouchableOpacity>
              );
                })}
              </View>
            )}

        {listingChrome.mobileWeb && (
          <InternalLinksBlock
            compact
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
