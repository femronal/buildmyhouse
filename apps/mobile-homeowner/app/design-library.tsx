import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Home, Filter, Search, ChevronDown } from "lucide-react-native";
import { useState, useRef, useCallback, useMemo } from "react";
import { useDesigns } from '@/hooks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesignProductCard from '@/components/DesignProductCard';
import { matchesKeywordPhraseQuery } from '@/lib/keyword-search';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getScreenHorizontalPadding } from "@/lib/responsive-layout";

export default function DesignLibraryScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = useMemo(() => getScreenHorizontalPadding(screenWidth), [screenWidth]);
  const contentBottomPadding = Math.max(24, insets.bottom + 16);
  const params = useLocalSearchParams();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: designs = [], isLoading: designsLoading } = useDesigns();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'repairs' | 'upgrades' | 'renovation' | 'full_builds'>('repairs');
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: string]: number}>({});
  const filterAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  // Extract location params
  const locationParams = useMemo(() => {
    return {
      address: params.address as string,
      street: params.street as string,
      city: params.city as string,
      state: params.state as string,
      zipCode: params.zipCode as string,
      country: params.country as string,
      latitude: params.latitude as string,
      longitude: params.longitude as string,
    };
  }, [params]);

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

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const filterOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // 1 column on mobile, 3 on tablet, 4 on desktop
  const gridGap = 16;
  const gridColumns = screenWidth >= 1200 ? 4 : screenWidth >= 768 ? 3 : 1;
  const cardWidth = (screenWidth - horizontalPadding * 2 - gridGap * (gridColumns - 1)) / gridColumns;
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

  // Filter designs based on search query and active filter
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

  const handleUseDesign = (design: any) => {
    // Build query params with location data and design info
    const queryParams = new URLSearchParams({
      designId: design.id,
      designName: design.name,
      ...(locationParams.address && { address: locationParams.address }),
      ...(locationParams.street && { street: locationParams.street }),
      ...(locationParams.city && { city: locationParams.city }),
      ...(locationParams.state && { state: locationParams.state }),
      ...(locationParams.zipCode && { zipCode: locationParams.zipCode }),
      ...(locationParams.country && { country: locationParams.country }),
      ...(locationParams.latitude && { latitude: locationParams.latitude }),
      ...(locationParams.longitude && { longitude: locationParams.longitude }),
    });
    
    // Small delay to ensure modal closes smoothly before navigation
    setTimeout(() => {
      router.push(`/house-summary?${queryParams.toString()}`);
    }, 100);
  };

  return (
    <View className="flex-1 bg-white">
      <View
        className="pb-2"
        style={{ paddingTop: Math.max(8, insets.top + 2), paddingHorizontal: horizontalPadding }}
      >
        <View className="flex-row items-center mb-2">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mr-2"
          >
            <ArrowLeft size={19} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-9 h-9 bg-black rounded-full items-center justify-center"
          >
            <Home size={17} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <Text 
          className="text-2xl text-black mb-1"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Choose Your Design
        </Text>
        <Text 
          className="text-xs text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Browse designs uploaded by General Contractors
        </Text>
      </View>

      {/* Search & Filter */}
      <View className="mb-2" style={{ paddingHorizontal: horizontalPadding }}>
        <View className="flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-xl px-3 h-11 flex-row items-center mr-2">
            <Search size={18} color="#737373" strokeWidth={2} />
            <TextInput
              placeholder="Search designs..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-black text-sm"
              style={{ fontFamily: 'Poppins_400Regular', paddingVertical: 0 }}
            />
          </View>
          <TouchableOpacity 
            onPress={toggleFilters}
            className={`w-10 h-10 rounded-full items-center justify-center ${showFilters ? 'bg-gray-200' : 'bg-gray-100'}`}
          >
            <Filter size={19} color="#000000" strokeWidth={2.3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Project Type Tabs */}
      <View className="mb-2" style={{ paddingHorizontal: horizontalPadding }}>
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => {
              setActiveTab('repairs');
              setActiveFilter('All');
            }}
            className={`flex-1 px-1 rounded-lg items-center ${activeTab === 'repairs' ? 'bg-black' : ''}`}
            style={{ paddingVertical: 8 }}
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
            className={`flex-1 px-1 rounded-lg items-center ${activeTab === 'upgrades' ? 'bg-black' : ''}`}
            style={{ paddingVertical: 8 }}
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
            className={`flex-1 px-1 rounded-lg items-center ${activeTab === 'renovation' ? 'bg-black' : ''}`}
            style={{ paddingVertical: 8 }}
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
            className={`flex-1 px-1 rounded-lg items-center ${activeTab === 'full_builds' ? 'bg-black' : ''}`}
            style={{ paddingVertical: 8 }}
          >
            <Text className={`text-xs ${activeTab === 'full_builds' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Full Builds
            </Text>
          </TouchableOpacity>
        </View>
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
      {activeFilter !== 'All' && (
        <View className="mb-3" style={{ paddingHorizontal: horizontalPadding }}>
          <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
            <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{activeFilter}</Text>
            <ChevronDown size={18} color="#000000" strokeWidth={2} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: contentBottomPadding, paddingHorizontal: horizontalPadding }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {designsLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Loading designs...
            </Text>
          </View>
        ) : filteredDesigns.length === 0 ? (
          <View className="items-center justify-center py-20">
            {!currentUser && !userLoading && !searchQuery && activeFilter === 'All' ? (
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
                  {searchQuery || activeFilter !== 'All' ? 'No designs match your filters' : 'No designs available yet'}
                </Text>
                <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {searchQuery || activeFilter !== 'All' 
                    ? 'Try adjusting your search, project type, or filters'
                    : 'General Contractors can upload design plans that will appear here'}
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
                onPress={() => handleUseDesign(design)}
                activeImageIndex={activeImageIndex[design.id] || 0}
                onImageScroll={(e) => handleImageScroll(design.id, e)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
