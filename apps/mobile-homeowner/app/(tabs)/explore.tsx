import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Animated, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User, Filter, Search, Heart, Bed, Bath, Maximize, Star, ChevronDown, Home, LandPlot } from "lucide-react-native";
import { useState, useRef, useCallback, useMemo } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDesigns, useHousesForSale, useLandsForSale } from '@/hooks';
import { getBackendAssetUrl } from '@/lib/image';
import NotificationBell from '@/components/NotificationBell';

const { width: screenWidth } = Dimensions.get('window');

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

export default function ExploreScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: designs = [], isLoading: designsLoading } = useDesigns();
  const { data: housesForSale = [], isLoading: housesLoading } = useHousesForSale();
  const { data: landsForSale = [] } = useLandsForSale();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'designs' | 'houses' | 'lands'>('designs');
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

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const filterOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardWidth = (screenWidth - 48 - 12) / 2;

  // Filter designs, houses, and lands based on search query
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter((design: any) => 
      design.name?.toLowerCase().includes(query) ||
      design.description?.toLowerCase().includes(query) ||
      design.createdBy?.fullName?.toLowerCase().includes(query)
    );
  }, [designs, searchQuery]);

  const filteredHouses = useMemo(() => {
    if (!searchQuery.trim()) return housesForSale;
    const query = searchQuery.toLowerCase();
    return housesForSale.filter((house: any) => 
      house.name?.toLowerCase().includes(query) ||
      house.location?.toLowerCase().includes(query) ||
      house.propertyType?.toLowerCase().includes(query)
    );
  }, [housesForSale, searchQuery]);

  const filteredLands = useMemo(() => {
    if (!searchQuery.trim()) return landsForSale;
    const query = searchQuery.toLowerCase();
    return landsForSale.filter((land: any) => 
      land.name?.toLowerCase().includes(query) ||
      land.location?.toLowerCase().includes(query)
    );
  }, [landsForSale, searchQuery]);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          className="w-12 h-12 bg-black rounded-full items-center justify-center overflow-hidden"
        >
          {userPicture ? (
            <Image 
              source={{ uri: getBackendAssetUrl(userPicture) }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <User size={24} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
        
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Explore
        </Text>
        
        <NotificationBell />
      </View>

      {/* Search & Filter */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center mr-3">
            <Search size={20} color="#737373" strokeWidth={2} />
            <TextInput
              placeholder="Search plans, estates, and land..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900"
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

      {/* Tabs */}
      <View className="px-6 mb-4">
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('designs')}
            className={`flex-1 py-2.5 px-4 rounded-xl items-center ${activeTab === 'designs' ? 'bg-black' : ''}`}
          >
            <Text className={`text-sm ${activeTab === 'designs' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Plans
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('houses')}
            className={`flex-1 py-2.5 px-4 rounded-xl items-center ${activeTab === 'houses' ? 'bg-black' : ''}`}
          >
            <Text className={`text-sm ${activeTab === 'houses' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Estates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('lands')}
            className={`flex-1 py-2.5 px-4 rounded-xl items-center ${activeTab === 'lands' ? 'bg-black' : ''}`}
          >
            <Text className={`text-sm ${activeTab === 'lands' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Land
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Filter Tags (only for designs) */}
      {activeTab === 'designs' && (
        <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-2">
            {['All', '2 Beds', '3 Beds', '4+ Beds', 'Under ₦300k', 'Luxury'].map((tag) => (
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
      )}

      {/* Current Filter Indicator (only for designs) */}
      {activeTab === 'designs' && (
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
        {/* Designs Tab */}
        {activeTab === 'designs' && (
          <>
            {designsLoading ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#000" />
                <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Loading designs...
                </Text>
              </View>
            ) : filteredDesigns.length === 0 ? (
              <View className="items-center justify-center py-20">
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
                      {searchQuery ? 'No designs found' : 'No designs available yet'}
                    </Text>
                    <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {searchQuery ? 'Try a different search term' : 'General Contractors can upload design plans that will appear here'}
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
                  className="mb-5 bg-white rounded-3xl overflow-hidden border border-gray-200"
                  style={{ width: cardWidth }}
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
                </TouchableOpacity>
              );
                })}
              </View>
            )}
          </>
        )}

        {/* Houses for Sale Tab */}
        {activeTab === 'houses' && (
          <>
            {filteredHouses.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Text className="text-gray-500 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {searchQuery ? 'No houses found' : 'No houses available'}
                </Text>
                <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {searchQuery ? 'Try a different search term' : 'Check back later for available properties'}
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between pb-8">
                {filteredHouses.map((house: any) => (
                  <TouchableOpacity
                    key={house.id}
                    onPress={() => router.push(`/house-detail?houseId=${house.id}`)}
                    className="mb-5 bg-white rounded-3xl overflow-hidden border border-gray-200"
                    style={{ width: cardWidth }}
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: house.images?.[0]?.url ? getImageUrl(house.images[0].url) : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80' }}
                        className="h-40"
                        style={{ width: cardWidth }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => toggleFavorite(`house-${house.id}`)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full items-center justify-center"
                      >
                        <Heart size={18} color={favorites.includes(`house-${house.id}`) ? "#EF4444" : "#000000"} strokeWidth={2} fill={favorites.includes(`house-${house.id}`) ? "#EF4444" : "none"} />
                      </TouchableOpacity>
                    </View>
                    <View className="p-4">
                      <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {house.name}
                      </Text>
                      <View className="flex-row items-center mb-2">
                        <Star size={14} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                        <Text className="text-gray-500 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          0.0 (0)
                        </Text>
                      </View>
                      <View className="flex-row items-center mb-3">
                        <Bed size={14} color="#737373" strokeWidth={2} />
                        <Text className="text-gray-600 text-xs ml-1 mr-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {house.bedrooms}
                        </Text>
                        <Bath size={14} color="#737373" strokeWidth={2} />
                        <Text className="text-gray-600 text-xs ml-1 mr-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {house.bathrooms}
                        </Text>
                        <Maximize size={14} color="#737373" strokeWidth={2} />
                        <Text className="text-gray-600 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {(house.squareMeters ?? house.squareFootage)}m²
                        </Text>
                      </View>
                      <Text className="text-black text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                        ₦{house.price.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Lands for Rent Tab */}
        {activeTab === 'lands' && (
          <>
            {filteredLands.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Text className="text-gray-500 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {searchQuery ? 'No lands found' : 'No lands available'}
                </Text>
                <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {searchQuery ? 'Try a different search term' : 'Check back later for available properties'}
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between pb-8">
                {filteredLands.map((land: any) => (
                  <TouchableOpacity
                    key={land.id}
                    onPress={() => router.push(`/land-detail?landId=${land.id}`)}
                    className="mb-5 bg-white rounded-3xl overflow-hidden border border-gray-200"
                    style={{ width: cardWidth }}
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: land.images?.[0]?.url ? getImageUrl(land.images[0].url) : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' }}
                        className="h-40"
                        style={{ width: cardWidth }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => toggleFavorite(`land-${land.id}`)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full items-center justify-center"
                      >
                        <Heart size={18} color={favorites.includes(`land-${land.id}`) ? "#EF4444" : "#000000"} strokeWidth={2} fill={favorites.includes(`land-${land.id}`) ? "#EF4444" : "none"} />
                      </TouchableOpacity>
                    </View>
                    <View className="p-4">
                      <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {land.name}
                      </Text>
                      <Text className="text-gray-500 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {land.location}
                      </Text>
                      <View className="flex-row items-center mb-3">
                        <LandPlot size={14} color="#737373" strokeWidth={2} />
                        <Text className="text-gray-600 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {land.sizeSqm} sqm
                        </Text>
                      </View>
                      <Text className="text-black text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                        ₦{land.price.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
