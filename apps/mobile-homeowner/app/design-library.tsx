import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Home, Bed, Bath, Maximize, Star } from "lucide-react-native";
import { useState } from "react";

const designs = [
  {
    id: 1,
    name: "Modern Minimalist",
    rooms: 3,
    baths: 2,
    sqm: 180,
    cost: 285000,
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    id: 2,
    name: "Classic Colonial",
    rooms: 4,
    baths: 3,
    sqm: 240,
    cost: 385000,
    rating: 4.9,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
  {
    id: 3,
    name: "Contemporary Ranch",
    rooms: 3,
    baths: 2,
    sqm: 200,
    cost: 310000,
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  },
  {
    id: 4,
    name: "Urban Loft",
    rooms: 2,
    baths: 2,
    sqm: 150,
    cost: 245000,
    rating: 4.6,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80",
  },
];

export default function DesignLibraryScreen() {
  const router = useRouter();
  const [selectedDesign, setSelectedDesign] = useState<typeof designs[0] | null>(null);

  const handleUseDesign = () => {
    setSelectedDesign(null);
    router.push('/house-summary');
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
          Browse our curated collection of house plans
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row flex-wrap justify-between pb-8">
          {designs.map((design) => (
            <TouchableOpacity
              key={design.id}
              onPress={() => setSelectedDesign(design)}
              className="w-[48%] mb-6 bg-white rounded-2xl overflow-hidden border border-gray-200"
            >
              <Image
                source={{ uri: design.image }}
                className="w-full h-40"
                resizeMode="cover"
              />
              <View className="p-4">
                <Text 
                  className="text-lg text-black mb-2"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  {design.name}
                </Text>
                
                <View className="flex-row items-center mb-2">
                  <Star size={14} color="#000000" strokeWidth={2} fill="#000000" />
                  <Text 
                    className="text-black ml-1 text-sm"
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
                  <Bed size={16} color="#737373" strokeWidth={2} />
                  <Text 
                    className="text-sm text-gray-500 ml-2 mr-4"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {design.rooms} bed
                  </Text>
                  <Bath size={16} color="#737373" strokeWidth={2} />
                  <Text 
                    className="text-sm text-gray-500 ml-2"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {design.baths} bath
                  </Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Maximize size={16} color="#737373" strokeWidth={2} />
                  <Text 
                    className="text-sm text-gray-500 ml-2"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {design.sqm} m²
                  </Text>
                </View>
                <Text 
                  className="text-xl text-black"
                  style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                >
                  ${design.cost.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Design Detail Modal */}
      <Modal
        visible={!!selectedDesign}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDesign(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            {selectedDesign && (
              <ScrollView>
                <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
                
                <View className="flex-row justify-between items-start mb-6">
                  <View className="flex-1">
                    <Text 
                      className="text-3xl text-black mb-2"
                      style={{ fontFamily: 'Poppins_800ExtraBold' }}
                    >
                      {selectedDesign.name}
                    </Text>
                    <Text 
                      className="text-2xl text-black"
                      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                    >
                      ${selectedDesign.cost.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedDesign(null)}>
                    <Text 
                      className="text-gray-400 text-3xl"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedDesign.image }}
                  className="w-full h-64 rounded-2xl mb-6"
                  resizeMode="cover"
                />

                <View className="flex-row justify-around mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <View className="items-center">
                    <Bed size={24} color="#000000" strokeWidth={2} />
                    <Text 
                      className="text-black mt-2"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {selectedDesign.rooms} Bedrooms
                    </Text>
                  </View>
                  <View className="items-center">
                    <Bath size={24} color="#000000" strokeWidth={2} />
                    <Text 
                      className="text-black mt-2"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {selectedDesign.baths} Bathrooms
                    </Text>
                  </View>
                  <View className="items-center">
                    <Maximize size={24} color="#000000" strokeWidth={2} />
                    <Text 
                      className="text-black mt-2"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {selectedDesign.sqm} m²
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleUseDesign}
                  className="bg-black rounded-full py-5 px-8"
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    Use This Plan
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
