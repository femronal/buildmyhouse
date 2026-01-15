import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MapPin, ArrowRight, ArrowLeft, Search } from "lucide-react-native";
import { useState } from "react";
import { geocodeAddress, AddressDetails } from '@/services/addressService';

// Simple web version without maps (maps don't work on web)
export default function LocationScreenWeb() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);

  const handleGeocode = async () => {
    if (!address.trim()) return;
    
    setIsGeocoding(true);
    try {
      const addressDetails = await geocodeAddress(address);
      
      if (addressDetails) {
        setSelectedAddress(addressDetails);
        // Don't show alert on web, the UI already shows success
      } else {
        Alert.alert('Error', 'Could not find this address. Please try a different one.');
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      Alert.alert(
        'Geocoding Error',
        error.message || 'Could not geocode this address. Please check your internet connection and try again.'
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleContinue = () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please enter and geocode a valid address');
      return;
    }

    const addressData = {
      address: selectedAddress.formattedAddress,
      street: selectedAddress.street,
      city: selectedAddress.city,
      state: selectedAddress.state,
      zipCode: selectedAddress.zipCode,
      country: selectedAddress.country,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
    };

    // Always go to choice page first, regardless of mode
    router.push({
      pathname: '/choose-project-type',
      params: addressData,
    });
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} className="mb-6">
        <ArrowLeft size={28} color="#000000" strokeWidth={2} />
      </TouchableOpacity>

      <View className="mb-8">
        <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
          Where are you building?
        </Text>
        <Text className="text-sm text-gray-500 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          Enter your project address below
        </Text>
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
          <Text className="text-yellow-800 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
            📱 For the full map experience, use the iOS or Android app
          </Text>
        </View>
      </View>

      {/* Address Input */}
      <View className="mb-4">
        <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center border border-gray-200">
          <MapPin size={22} color="#000000" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-base text-black"
            style={{ fontFamily: 'Poppins_400Regular', outlineStyle: 'none' } as any}
            placeholder="123 Main Street, City, State, ZIP"
            placeholderTextColor="#A3A3A3"
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={handleGeocode}
          />
        </View>
      </View>

      {/* Geocode Button */}
      <TouchableOpacity
        onPress={handleGeocode}
        disabled={!address.trim() || isGeocoding}
        className={`rounded-full py-4 px-8 mb-6 ${
          address.trim() && !isGeocoding ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <View className="flex-row items-center justify-center">
          {isGeocoding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Search size={20} color={address.trim() ? "#FFFFFF" : "#A3A3A3"} strokeWidth={2} />
              <Text 
                className={`text-base ml-2 ${address.trim() ? 'text-white' : 'text-gray-400'}`}
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Find Address
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Selected Address Display */}
      {selectedAddress && (
        <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <MapPin size={20} color="#059669" strokeWidth={2} className="mr-2 mt-1" />
            <View className="flex-1">
              <Text className="text-green-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                ✓ Address Found
              </Text>
              <Text className="text-green-800 text-xs leading-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                {selectedAddress.formattedAddress}
              </Text>
              <Text className="text-green-700 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                Coordinates: {selectedAddress.latitude.toFixed(6)}, {selectedAddress.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        onPress={handleContinue}
        disabled={!selectedAddress}
        className={`rounded-full py-4 px-8 ${
          selectedAddress ? 'bg-black' : 'bg-gray-200'
        }`}
      >
        <View className="flex-row items-center justify-center">
          <Text 
            className={`text-base mr-2 ${selectedAddress ? 'text-white' : 'text-gray-400'}`}
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Continue
          </Text>
          <ArrowRight size={22} color={selectedAddress ? "#FFFFFF" : "#A3A3A3"} strokeWidth={2} />
        </View>
      </TouchableOpacity>
    </View>
  );
}


