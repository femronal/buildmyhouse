import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Keyboard } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MapPin, ArrowRight, ArrowLeft, Navigation, Search } from "lucide-react-native";
import { useState, useRef } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { reverseGeocode, AddressDetails } from '@/services/addressService';

// Native version (iOS/Android) with full Google Maps
export default function LocationScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const autocompleteRef = useRef<any>(null);
  
  const [region, setRegion] = useState(GOOGLE_MAPS_CONFIG.defaultRegion);
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);
  const [markerCoordinate, setMarkerCoordinate] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleContinue = () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a valid address to continue');
      return;
    }

    // Store address in route params for next screen
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

    if (mode === 'explore') {
      router.push({
        pathname: '/design-library',
        params: addressData,
      });
    } else {
      router.push({
        pathname: '/upload-plan',
        params: addressData,
      });
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoordinate({ latitude, longitude });
    setIsGeocoding(true);

    // Reverse geocode the coordinates
    const addressDetails = await reverseGeocode(latitude, longitude);
    
    if (addressDetails) {
      setSelectedAddress(addressDetails);
      
      // Update the autocomplete input
      if (autocompleteRef.current) {
        autocompleteRef.current.setAddressText(addressDetails.formattedAddress);
      }
      
      // Animate map to the selected location
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } else {
      Alert.alert('Error', 'Could not get address details for this location');
    }

    setIsGeocoding(false);
  };

  const handlePlaceSelect = async (data: any, details: any) => {
    if (!details?.geometry?.location) return;

    const { lat, lng } = details.geometry.location;
    const coordinate = { latitude: lat, longitude: lng };
    
    setMarkerCoordinate(coordinate);
    setIsGeocoding(true);

    // Get full address details
    const addressDetails = await reverseGeocode(lat, lng);
    
    if (addressDetails) {
      setSelectedAddress(addressDetails);
      
      // Animate map to the selected location
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }

    setIsGeocoding(false);
    Keyboard.dismiss();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-16 pb-4 bg-white z-10">
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
          className="mb-4"
        >
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>

        <View className="mb-4">
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
            Search or tap on the map to select your project location
          </Text>
        </View>

        {/* Google Places Autocomplete */}
        <View className="mb-2 z-20">
          <GooglePlacesAutocomplete
            ref={autocompleteRef}
            placeholder="Search for an address..."
            fetchDetails={true}
            onPress={handlePlaceSelect}
            query={{
              key: GOOGLE_MAPS_CONFIG.apiKey,
              language: 'en',
              components: 'country:ng', // Restrict to Nigeria, change as needed
            }}
            styles={{
              container: {
                flex: 0,
              },
              textInputContainer: {
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                paddingHorizontal: 4,
              },
              textInput: {
                height: 48,
                color: '#000',
                fontSize: 16,
                fontFamily: 'Poppins_400Regular',
                backgroundColor: 'transparent',
              },
              predefinedPlacesDescription: {
                color: '#1faadb',
              },
              listView: {
                backgroundColor: 'white',
                borderRadius: 12,
                marginTop: 4,
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              row: {
                padding: 12,
                height: 'auto',
                minHeight: 48,
              },
              description: {
                fontFamily: 'Poppins_400Regular',
                fontSize: 14,
              },
            }}
            enablePoweredByContainer={false}
            renderLeftButton={() => (
              <View className="absolute left-4 top-3 z-10">
                <Search size={20} color="#9CA3AF" strokeWidth={2} />
              </View>
            )}
            textInputProps={{
              placeholderTextColor: '#A3A3A3',
              style: { paddingLeft: 36 },
            }}
          />
        </View>
      </View>

      {/* Map */}
      <View className="flex-1 relative">
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          mapType="standard"
        >
          {markerCoordinate && (
            <Marker
              coordinate={markerCoordinate}
              title={selectedAddress?.formattedAddress || 'Selected Location'}
              description={selectedAddress ? `${selectedAddress.city}, ${selectedAddress.state}` : undefined}
            >
              <View className="items-center">
                <View className="w-10 h-10 bg-black rounded-full items-center justify-center shadow-lg">
                  <MapPin size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                </View>
                <View className="w-1 h-4 bg-black" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Geocoding Indicator */}
        {isGeocoding && (
          <View className="absolute top-4 left-0 right-0 items-center">
            <View className="bg-white rounded-full px-4 py-2 flex-row items-center shadow-lg">
              <ActivityIndicator size="small" color="#000" />
              <Text className="ml-2 text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                Getting address...
              </Text>
            </View>
          </View>
        )}

        {/* Selected Location Info */}
        {selectedAddress && !isGeocoding && (
          <View className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg">
            <View className="flex-row items-start">
              <MapPin size={20} color="#000" strokeWidth={2} className="mr-2 mt-1" />
              <View className="flex-1">
                <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Selected Location
                </Text>
                <Text className="text-gray-600 text-xs leading-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {selectedAddress.formattedAddress}
                </Text>
                {selectedAddress.city && selectedAddress.state && (
                  <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {selectedAddress.city}, {selectedAddress.state}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Instructions Overlay (when no location selected) */}
        {!markerCoordinate && !isGeocoding && (
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <View className="bg-white/95 rounded-2xl px-6 py-4 items-center shadow-lg">
              <Navigation size={28} color="#000000" strokeWidth={2} />
              <Text 
                className="text-black mt-3 text-base text-center"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Tap on the map
              </Text>
              <Text 
                className="text-gray-500 text-sm text-center mt-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                or search to select location
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Continue Button */}
      <View className="px-6 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedAddress || isGeocoding}
          className={`rounded-full py-4 px-8 ${
            selectedAddress && !isGeocoding ? 'bg-black' : 'bg-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Text 
              className={`text-base mr-2 ${
                selectedAddress && !isGeocoding ? 'text-white' : 'text-gray-400'
              }`}
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Continue
            </Text>
            <ArrowRight 
              size={22} 
              color={selectedAddress && !isGeocoding ? "#FFFFFF" : "#A3A3A3"} 
              strokeWidth={2} 
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
