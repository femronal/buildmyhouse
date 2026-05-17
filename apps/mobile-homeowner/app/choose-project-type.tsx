import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Upload, Home } from "lucide-react-native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getScreenHorizontalPadding } from "@/lib/responsive-layout";

export default function ChooseProjectTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = useMemo(() => getScreenHorizontalPadding(width), [width]);

  // Get address data from location screen
  const addressData = {
    address: params.address as string,
    street: params.street as string,
    city: params.city as string,
    state: params.state as string,
    zipCode: params.zipCode as string,
    country: params.country as string,
    latitude: params.latitude as string,
    longitude: params.longitude as string,
  };

  const handleChooseDesign = () => {
    router.push({
      pathname: '/design-library',
      params: addressData,
    });
  };

  const handleUploadPlan = () => {
    router.push({
      pathname: '/upload-plan',
      params: addressData,
    });
  };

  return (
    <View className="flex-1 bg-white">
      <View style={{ paddingHorizontal: horizontalPadding, paddingTop: Math.max(16, insets.top + 8), paddingBottom: 16 }}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
          className="mb-6"
        >
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>

        <Text 
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Start Your Project
        </Text>
        <Text 
          className="text-sm text-gray-500 leading-5"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Choose how you want to begin. We’ll guide the rest.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Option 1: Choose from Designs */}
        <TouchableOpacity
          onPress={handleChooseDesign}
          className="bg-white border-2 border-gray-200 rounded-3xl p-6 mb-4 active:opacity-80"
        >
          <View className="flex-row items-start mb-4">
            <View className="w-16 h-16 bg-black rounded-2xl items-center justify-center mr-4">
              <Home size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text 
                className="text-xl text-black mb-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Browse Verified Project Ideas
              </Text>
              <Text 
                className="text-sm text-gray-600 leading-5"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Explore ready project options from verified General Contractors and move faster with proven direction.
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-gray-400 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Verified by professionals
                </Text>
              </View>
              <View className="flex-row items-center mb-1">
                <Text className="text-gray-400 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Clear scope and cost guidance
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-400 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Fast project kickoff
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Option 2: Upload Your Plan */}
        <TouchableOpacity
          onPress={handleUploadPlan}
          className="bg-black rounded-3xl p-6 mb-8 active:opacity-80"
        >
          <View className="flex-row items-start mb-4">
            <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mr-4">
              <Upload size={32} color="#000000" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text 
                className="text-xl text-white mb-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Upload Your Own Project Brief
              </Text>
              <Text 
                className="text-sm text-white/70 leading-5"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Share your photos, goals, and project details. BuildMyHouse turns it into a structured scope you can execute with confidence.
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-white/70 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-white/80 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  AI-ready project intake
                </Text>
              </View>
              <View className="flex-row items-center mb-1">
                <Text className="text-white/70 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-white/80 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Personalized scope guidance
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-white/70 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-white/80 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Built for repairs, upgrades, renovations, and full builds
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
