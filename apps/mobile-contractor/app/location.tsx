import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MapPin, ArrowRight, ArrowLeft, Navigation } from "lucide-react-native";
import { useState } from "react";

export default function LocationScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const [address, setAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleContinue = () => {
    if (mode === 'explore') {
      router.push('/design-library');
    } else {
      router.push('/upload-plan');
    }
  };

  const handleMapPress = () => {
    // Simulate selecting a location
    setSelectedLocation({ lat: 6.5244, lng: 3.3792 });
    if (!address) {
      setAddress("Lekki Phase 1, Lagos, Nigeria");
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} className="mb-6">
        <ArrowLeft size={28} color="#000000" strokeWidth={2} />
      </TouchableOpacity>

      <View className="mb-8">
        <Text 
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Where are you building?
        </Text>
        <Text 
          className="text-sm text-gray-500 leading-5"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Enter your project address to get started
        </Text>
      </View>

      {/* Address Input */}
      <View className="mb-4">
        <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center border border-gray-200">
          <MapPin size={22} color="#000000" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-base text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
            placeholder="123 Main Street, City, State"
            placeholderTextColor="#A3A3A3"
            value={address}
            onChangeText={setAddress}
          />
        </View>
      </View>

      {/* Map with satellite imagery */}
      <TouchableOpacity 
        onPress={handleMapPress}
        className="flex-1 rounded-2xl mb-6 overflow-hidden border border-gray-200"
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: "https://maps.googleapis.com/maps/api/staticmap?center=6.5244,3.3792&zoom=15&size=600x400&maptype=satellite&key=AIzaSyDemo" }}
          className="w-full h-full"
          resizeMode="cover"
          defaultSource={{ uri: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600&q=80" }}
        />
        {/* Fallback satellite-style map image */}
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600&q=80" }}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
        
        {/* Map overlay */}
        <View className="absolute inset-0 items-center justify-center">
          {selectedLocation ? (
            <View className="items-center">
              <View className="w-10 h-10 bg-black rounded-full items-center justify-center shadow-lg">
                <MapPin size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
              </View>
              <View className="w-1 h-4 bg-black" />
            </View>
          ) : (
            <View className="bg-white/90 rounded-2xl px-4 py-3 items-center">
              <Navigation size={24} color="#000000" strokeWidth={2} />
              <Text 
                className="text-black mt-2 text-sm"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                Tap to drop a pin
              </Text>
            </View>
          )}
        </View>

        {/* Location info overlay */}
        {selectedLocation && (
          <View className="absolute bottom-4 left-4 right-4 bg-white rounded-xl p-3 shadow-lg">
            <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>Selected Location</Text>
            <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{address || "Tap to select"}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Continue Button */}
      <TouchableOpacity
        onPress={handleContinue}
        disabled={!address}
        className={`rounded-full py-4 px-8 mb-6 ${
          address ? 'bg-black' : 'bg-gray-200'
        }`}
      >
        <View className="flex-row items-center justify-center">
          <Text 
            className={`text-base mr-2 ${address ? 'text-white' : 'text-gray-400'}`}
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Continue
          </Text>
          <ArrowRight size={22} color={address ? "#FFFFFF" : "#A3A3A3"} strokeWidth={2} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
