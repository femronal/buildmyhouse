import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Upload, Home, FileText } from "lucide-react-native";

export default function ChooseProjectTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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
      <View className="px-6 pt-16 pb-4">
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
          Choose Your Project Type
        </Text>
        <Text 
          className="text-sm text-gray-500 leading-5"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Select how you'd like to proceed with your project
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
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
                Choose from Existing Designs
              </Text>
              <Text 
                className="text-sm text-gray-600 leading-5"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Browse and select from designs uploaded by verified General Contractors. Get started quickly with proven designs.
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-gray-400 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Pre-designed by professionals
                </Text>
              </View>
              <View className="flex-row items-center mb-1">
                <Text className="text-gray-400 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Cost estimates included
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-400 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Quick project setup
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
                Upload Your Own Plan
              </Text>
              <Text 
                className="text-sm text-white/70 leading-5"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Upload your architectural plans and get AI-powered analysis, cost estimates, and construction timeline.
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-white/70 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-white/80 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  AI-powered plan analysis
                </Text>
              </View>
              <View className="flex-row items-center mb-1">
                <Text className="text-white/70 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-white/80 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Custom cost breakdown
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-white/70 text-xs mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>✓</Text>
                <Text className="text-white/80 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Detailed construction phases
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
