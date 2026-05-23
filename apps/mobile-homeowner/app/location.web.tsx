import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MapPin, ArrowRight, ArrowLeft, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { geocodeAddress, AddressDetails } from '@/services/addressService';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getScreenHorizontalPadding } from "@/lib/responsive-layout";

// Simple web version without maps (maps don't work on web)
export default function LocationScreenWeb() {
  const router = useRouter();
  useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = useMemo(() => getScreenHorizontalPadding(width), [width]);
  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);
  const [locationLookupMessage, setLocationLookupMessage] = useState<string | null>(null);
  const mapsApiKey = GOOGLE_MAPS_CONFIG.apiKey?.trim() ?? "";
  const hasMapsApiKey =
    mapsApiKey.length > 0 &&
    mapsApiKey !== "YOUR_API_KEY_HERE" &&
    mapsApiKey !== "your_google_maps_api_key_here" &&
    !mapsApiKey.toLowerCase().includes("demo");

  const geocodeWithOpenStreetMap = async (query: string): Promise<AddressDetails | null> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) {
      throw new Error(`Address lookup failed: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) return null;

    const addr = first.address || {};
    const streetParts = [addr.house_number, addr.road].filter(Boolean);
    const city = addr.city || addr.town || addr.village || addr.county || '';

    return {
      formattedAddress: first.display_name || query,
      street: streetParts.join(' '),
      city,
      state: addr.state || '',
      zipCode: addr.postcode || '',
      country: addr.country || '',
      latitude: Number(first.lat),
      longitude: Number(first.lon),
    };
  };

  const handleGeocode = async () => {
    if (!address.trim()) return;
    
    setIsGeocoding(true);
    setLocationLookupMessage(null);
    try {
      const addressDetails = hasMapsApiKey
        ? await geocodeAddress(address)
        : await geocodeWithOpenStreetMap(address);
      
      if (addressDetails) {
        setSelectedAddress(addressDetails);
        setLocationLookupMessage(null);
        // Don't show alert on web, the UI already shows success
      } else {
        setSelectedAddress(null);
        setLocationLookupMessage(
          'We could not find that location. Please enter a valid, more specific address (for example: street, area, and city).',
        );
      }
    } catch (error: any) {
      const errorMessage = String(error?.message || '');
      if (
        errorMessage.toLowerCase().includes('no results') ||
        errorMessage.toLowerCase().includes('invalid address')
      ) {
        setSelectedAddress(null);
        setLocationLookupMessage(
          'We could not find that location. Please enter a valid, more specific address (for example: street, area, and city).',
        );
      } else {
        Alert.alert(
          'Geocoding Error',
          error.message || 'Could not geocode this address. Please check your internet connection and try again.'
        );
      }
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
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(16, insets.top + 8),
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} className="mb-6">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>

      <View className="mb-8">
        <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
          Where is this project located?
        </Text>
        <Text className="text-sm text-gray-500 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          Set the location to begin.
        </Text>
        <Text
          className="text-sm text-gray-700 leading-6 mt-4"
          style={{ fontFamily: 'Poppins_500Medium' }}
        >
          From repairs and upgrades to renovations and full builds, your address anchors everything—matching, planning, and oversight.
        </Text>
      </View>

      {/* Address Input */}
      <View className="mb-4">
        <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center border border-gray-200">
          <MapPin size={22} color="#000000" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-base text-black"
            style={{ fontFamily: 'Poppins_400Regular', outlineStyle: 'none' } as any}
            placeholder="Enter project address"
            placeholderTextColor="#A3A3A3"
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              setLocationLookupMessage(null);
              setSelectedAddress(null);
            }}
            onSubmitEditing={handleGeocode}
          />
        </View>
        <View className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <Text className="text-[11px] text-gray-600 leading-4" style={{ fontFamily: 'Poppins_500Medium' }}>
            Your address is encrypted and only visible to your assigned GC and BuildMyHouse admin for dispute resolution.
          </Text>
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
                Search Address
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {locationLookupMessage ? (
        <View className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
          <Text className="text-red-700 text-xs leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
            {locationLookupMessage}
          </Text>
        </View>
      ) : null}

      <View className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
        <Text className="text-black text-sm mb-1.5" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          One platform. Every project type.
        </Text>
        <Text className="text-gray-600 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          Initiate with precision. Execute with confidence—wherever you are.
        </Text>
      </View>

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
      </ScrollView>
    </View>
  );
}


