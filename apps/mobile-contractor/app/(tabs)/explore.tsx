import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Animated, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { User, Bell, Filter, Search, Heart, Bed, Bath, Maximize, Star, ChevronDown } from "lucide-react-native";
import { useState, useRef, useCallback } from "react";

const { width: screenWidth } = Dimensions.get('window');

const designImages = {
  1: [
    { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", label: "Living Room" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Kitchen" },
    { url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", label: "Master Bedroom" },
    { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", label: "Bathroom" },
  ],
  2: [
    { url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80", label: "Living Room" },
    { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80", label: "Dining Room" },
    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80", label: "Bathroom" },
    { url: "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=600&q=80", label: "Studio" },
  ],
  3: [
    { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80", label: "Living Room" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Kitchen" },
    { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80", label: "Bedroom" },
  ],
  4: [
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80", label: "Open Plan" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Kitchen" },
    { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", label: "Bathroom" },
  ],
  5: [
    { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80", label: "Grand Living" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Gourmet Kitchen" },
    { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80", label: "Master Suite" },
    { url: "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=600&q=80", label: "Home Office" },
    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80", label: "Spa Bathroom" },
  ],
  6: [
    { url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", label: "Cozy Living" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Kitchen" },
    { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80", label: "Bedroom" },
  ],
};

const designs = [
  { id: 1, name: "Modern Minimalist", rooms: 3, baths: 2, sqm: 180, cost: 285000, rating: 4.8, reviews: 124 },
  { id: 2, name: "Classic Colonial", rooms: 4, baths: 3, sqm: 240, cost: 385000, rating: 4.9, reviews: 89 },
  { id: 3, name: "Contemporary Ranch", rooms: 3, baths: 2, sqm: 200, cost: 310000, rating: 4.7, reviews: 156 },
  { id: 4, name: "Urban Loft", rooms: 2, baths: 2, sqm: 150, cost: 245000, rating: 4.6, reviews: 203 },
  { id: 5, name: "Luxury Villa", rooms: 5, baths: 4, sqm: 350, cost: 550000, rating: 4.9, reviews: 67 },
  { id: 6, name: "Cozy Cottage", rooms: 2, baths: 1, sqm: 120, cost: 185000, rating: 4.5, reviews: 312 },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [favorites, setFavorites] = useState<number[]>([2, 4]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: number]: number}>({});
  const filterAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const toggleFavorite = (id: number) => {
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

  const handleImageScroll = useCallback((designId: number, event: any) => {
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

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          className="w-12 h-12 bg-black rounded-full items-center justify-center"
        >
          <User size={24} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Explore
        </Text>
        
        <TouchableOpacity 
          onPress={() => router.push('/notifications')}
          className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
        >
          <Bell size={24} color="#000000" strokeWidth={2.5} />
          <View className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full" />
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center mr-3">
            <Search size={20} color="#737373" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Search house plans..."
              placeholderTextColor="#A3A3A3"
              value={searchQuery}
              onChangeText={setSearchQuery}
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
      <View className="px-6 mb-3">
        <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
          <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_700Bold' }}>{activeFilter}</Text>
          <ChevronDown size={18} color="#000000" strokeWidth={2} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-6" 
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="flex-row flex-wrap justify-between pb-8">
          {designs.map((design) => {
            const images = designImages[design.id as keyof typeof designImages];
            return (
              <TouchableOpacity
                key={design.id}
                onPress={() => router.push('/house-summary')}
                className="mb-5 bg-white rounded-3xl overflow-hidden border border-gray-200"
                style={{ width: cardWidth }}
              >
                <View className="relative">
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => handleImageScroll(design.id, e)}
                    scrollEventThrottle={16}
                  >
                    {images.map((image, index) => (
                      <View key={index} style={{ width: cardWidth }} className="relative">
                        <Image
                          source={{ uri: image.url }}
                          className="h-36"
                          style={{ width: cardWidth }}
                          resizeMode="cover"
                        />
                        <View className="absolute bottom-2 left-2 bg-black/70 rounded-full px-2 py-0.5">
                          <Text 
                            className="text-white text-xs"
                            style={{ fontFamily: 'Poppins_500Medium', fontSize: 10 }}
                          >
                            {image.label}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  
                  {/* Dots Indicator */}
                  <View className="absolute bottom-2 right-2 flex-row">
                    {images.slice(0, 5).map((_, index) => (
                      <View
                        key={index}
                        className={`w-1 h-1 rounded-full mx-0.5 ${
                          index === (activeImageIndex[design.id] || 0) ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </View>

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
                      {design.rating}
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
                      {design.rooms}
                    </Text>
                    <Bath size={12} color="#737373" strokeWidth={2} />
                    <Text 
                      className="text-gray-500 ml-1 mr-2 text-xs"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {design.baths}
                    </Text>
                    <Maximize size={12} color="#737373" strokeWidth={2} />
                    <Text 
                      className="text-gray-500 ml-1 text-xs"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {design.sqm}m²
                    </Text>
                  </View>

                  <Text 
                    className="text-black text-base"
                    style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                  >
                    ${design.cost.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
