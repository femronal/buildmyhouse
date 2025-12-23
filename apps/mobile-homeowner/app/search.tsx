import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search as SearchIcon, Package, HardHat, Star, Shield, Home } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useSearch, useSearchSuggestions } from '@/hooks/useMarketplace';

export default function SearchScreen() {
  const router = useRouter();
  const { initialQuery } = useLocalSearchParams<{ initialQuery?: string }>();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery || '');
  const [activeTab, setActiveTab] = useState<'all' | 'materials' | 'contractors'>('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useSearch({ 
    query: debouncedSearch,
    limit: 50 
  });

  const { data: suggestions } = useSearchSuggestions(searchQuery);

  const materials = searchResults?.materials?.data || [];
  const contractors = searchResults?.contractors?.data || [];
  const showResults = debouncedSearch.length > 0;

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/explore')} 
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

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center mb-4">
          <SearchIcon size={20} color="#737373" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-black"
            style={{ fontFamily: 'Poppins_400Regular', fontSize: 16 }}
            placeholder="Search materials, contractors..."
            placeholderTextColor="#A3A3A3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>

        {/* Filter Tabs */}
        <View className="flex-row">
          {[
            { key: 'all', label: 'All' },
            { key: 'materials', label: 'Materials' },
            { key: 'contractors', label: 'Contractors' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`mr-2 px-4 py-2 rounded-full ${
                activeTab === tab.key ? 'bg-black' : 'bg-gray-100'
              }`}
            >
              <Text 
                className={`text-sm ${activeTab === tab.key ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {!showResults ? (
          <View className="items-center py-12">
            <SearchIcon size={64} color="#D4D4D4" strokeWidth={1.5} />
            <Text className="text-gray-500 mt-4 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
              Search for materials and contractors
            </Text>
          </View>
        ) : isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : (
          <>
            {/* Materials Results */}
            {(activeTab === 'all' || activeTab === 'materials') && materials.length > 0 && (
              <View className="mb-6">
                <Text className="text-2xl text-black mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Materials ({materials.length})
                </Text>
                {materials.map((material: any) => (
                  <TouchableOpacity
                    key={material.id}
                    onPress={() => router.push({ pathname: '/material-detail', params: { id: material.id } })}
                    className="bg-gray-50 rounded-2xl mb-3 overflow-hidden border border-gray-200 flex-row"
                  >
                    <Image 
                      source={{ uri: material.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' }} 
                      className="w-24 h-24 bg-gray-100" 
                      resizeMode="cover" 
                    />
                    <View className="flex-1 p-4 justify-center">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-base text-black flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {material.name}
                        </Text>
                        {material.verified && (
                          <View className="bg-black rounded-full p-1">
                            <Shield size={12} color="#FFFFFF" strokeWidth={2.5} />
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {material.brand}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Star size={14} color="#000000" strokeWidth={2} fill="#000000" />
                          <Text className="text-black ml-1 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {material.rating.toFixed(1)}
                          </Text>
                          <Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                            ({material.reviews})
                          </Text>
                        </View>
                        <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                          ₦{material.price.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Contractors Results */}
            {(activeTab === 'all' || activeTab === 'contractors') && contractors.length > 0 && (
              <View className="mb-6">
                <Text className="text-2xl text-black mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Contractors ({contractors.length})
                </Text>
                {contractors.map((contractor: any) => (
                  <TouchableOpacity
                    key={contractor.id}
                    onPress={() => router.push({ pathname: '/contractor-detail', params: { id: contractor.id } })}
                    className="bg-gray-50 rounded-2xl mb-3 overflow-hidden border border-gray-200"
                  >
                    <View className="flex-row p-4">
                      <Image 
                        source={{ uri: contractor.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' }} 
                        className="w-20 h-20 rounded-2xl bg-gray-100" 
                        resizeMode="cover" 
                      />
                      <View className="flex-1 ml-4 justify-center">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-lg text-black flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {contractor.name}
                          </Text>
                          {contractor.verified && (
                            <View className="bg-black rounded-full p-1">
                              <Shield size={12} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {contractor.specialty}
                        </Text>
                        <View className="flex-row items-center">
                          <Star size={14} color="#000000" strokeWidth={2} fill="#000000" />
                          <Text className="text-black ml-1 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {contractor.rating.toFixed(1)}
                          </Text>
                          <Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                            ({contractor.reviews}) • {contractor.projects} projects
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* No Results */}
            {materials.length === 0 && contractors.length === 0 && (
              <View className="items-center py-12">
                <SearchIcon size={64} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-500 mt-4 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No results found
                </Text>
                <Text className="text-gray-400 mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

