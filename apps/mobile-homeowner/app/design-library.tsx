import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Animated, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Home, Bed, Bath, Maximize, Star, Filter, Search, ChevronDown } from "lucide-react-native";
import { useState, useRef, useCallback, useMemo } from "react";
import { useDesigns } from '@/hooks';

// Helper to get full image URL from backend
const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  // If relative path, prepend backend URL
  const API_BASE_URL = __DEV__ 
    ? 'http://localhost:3001' 
    : 'https://api.buildmyhouse.com';
  return `${API_BASE_URL}${imageUrl}`;
};

export default function DesignLibraryScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams();
  const { data: designs = [], isLoading: designsLoading } = useDesigns();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
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

  const cardWidth = (screenWidth - 48 - 12) / 2;

  // Filter designs based on search query and active filter
  const filteredDesigns = useMemo(() => {
    let filtered = designs;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((design: any) => 
        design.name.toLowerCase().includes(query) ||
        design.description?.toLowerCase().includes(query)
      );
    }

    // Filter by active filter tag
    if (activeFilter !== 'All') {
      switch (activeFilter) {
        case '2 Beds':
          filtered = filtered.filter((d: any) => d.bedrooms === 2);
          break;
        case '3 Beds':
          filtered = filtered.filter((d: any) => d.bedrooms === 3);
          break;
        case '4+ Beds':
          filtered = filtered.filter((d: any) => d.bedrooms >= 4);
          break;
        case 'Under $300k':
          filtered = filtered.filter((d: any) => d.estimatedCost < 300000);
          break;
        case 'Luxury':
          filtered = filtered.filter((d: any) => d.estimatedCost >= 500000);
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [designs, searchQuery, activeFilter]);

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
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-black rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <Text 
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Choose Your Design
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Browse designs uploaded by General Contractors
        </Text>
      </View>

      {/* Search & Filter */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center mr-3">
            <Search size={20} color="#737373" strokeWidth={2} />
            <TextInput
              placeholder="Search designs..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
          </View>
          <TouchableOpacity 
            onPress={toggleFilters}
            className={`w-12 h-12 rounded-full items-center justify-center ${showFilters ? 'bg-gray-200' : 'bg-gray-100'}`}
          >
            <Filter size={22} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Filter Tags */}
      <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-2">
          {['All', '2 Beds', '3 Beds', '4+ Beds', 'Under $300k', 'Luxury'].map((tag) => (
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
        <View className="px-6 mb-3">
          <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
            <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{activeFilter}</Text>
            <ChevronDown size={18} color="#000000" strokeWidth={2} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        className="flex-1 px-6" 
        contentContainerStyle={{ paddingBottom: 100 }}
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
            <Text className="text-gray-500 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {searchQuery || activeFilter !== 'All' ? 'No designs match your filters' : 'No designs available yet'}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {searchQuery || activeFilter !== 'All' 
                ? 'Try adjusting your search or filters'
                : 'General Contractors can upload design plans that will appear here'}
            </Text>
          </View>
        ) : (
        <View className="flex-row flex-wrap justify-between pb-8">
            {filteredDesigns.map((design: any) => {
              const images = design.images || [];
              const squareMeters = design.squareMeters || (design.squareFootage * 0.092903);
              return (
            <TouchableOpacity
              key={design.id}
                  onPress={() => handleUseDesign(design)}
              className="w-[48%] mb-6 bg-white rounded-2xl overflow-hidden border border-gray-200"
            >
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
                                className="h-40"
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
                      <View style={{ width: cardWidth, height: 160 }} className="bg-gray-200 items-center justify-center">
                        <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                          No images
                        </Text>
                      </View>
                    )}
                  </View>
              <View className="p-4">
                <Text 
                  className="text-lg text-black mb-2"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                      numberOfLines={1}
                >
                  {design.name}
                </Text>
                
                <View className="flex-row items-center mb-2">
                  <Star size={14} color="#000000" strokeWidth={2} fill="#000000" />
                  <Text 
                    className="text-black ml-1 text-sm"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                        {design.rating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text 
                    className="text-gray-500 ml-1 text-xs"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                        ({design.reviews || 0})
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <Bed size={16} color="#737373" strokeWidth={2} />
                  <Text 
                    className="text-sm text-gray-500 ml-2 mr-4"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                        {design.bedrooms} bed
                  </Text>
                  <Bath size={16} color="#737373" strokeWidth={2} />
                  <Text 
                    className="text-sm text-gray-500 ml-2"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                        {design.bathrooms} bath
                  </Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Maximize size={16} color="#737373" strokeWidth={2} />
                  <Text 
                    className="text-sm text-gray-500 ml-2"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                        {Math.round(squareMeters)} m²
                  </Text>
                </View>
                <Text 
                  className="text-xl text-black"
                  style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                >
                      ${design.estimatedCost?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
