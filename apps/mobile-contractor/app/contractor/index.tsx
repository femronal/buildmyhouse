import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { HardHat, Wrench, Package, ChevronRight, Shield } from "lucide-react-native";

export default function ContractorLandingScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-8">
        <View className="flex-row items-center mb-2">
          <HardHat size={32} color="#3B82F6" strokeWidth={2} />
          <Text 
            className="text-3xl text-white ml-3"
            style={{ fontFamily: 'Poppins_800ExtraBold' }}
          >
            BuildMyHouse
          </Text>
        </View>
        <Text 
          className="text-blue-400 text-lg"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Contractor & Vendor Portal
        </Text>
      </View>

      {/* Hero Section */}
      <View className="px-6 mb-8">
        <Text 
          className="text-white text-2xl mb-3"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Professional Construction Management
        </Text>
        <Text 
          className="text-gray-400 text-base leading-6"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Manage projects, coordinate teams, and deliver quality construction services to homeowners.
        </Text>
      </View>

      {/* Account Type Selection */}
      <View className="px-6 flex-1">
        <Text 
          className="text-white text-2xl mb-6"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Select Your Account Type
        </Text>

        {/* General Contractor */}
        <TouchableOpacity 
          onPress={() => router.push('/contractor/onboarding?type=gc')}
          className="bg-[#1E3A5F] rounded-2xl p-6 mb-4 border-2 border-blue-900 active:opacity-80 active:border-blue-600"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-blue-600 rounded-xl items-center justify-center">
              <HardHat size={28} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View className="flex-1 ml-4">
              <Text 
                className="text-white text-2xl"
                style={{ fontFamily: 'Poppins_800ExtraBold' }}
              >
                General Contractor
              </Text>
              <Text 
                className="text-gray-400 text-lg"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                Oversee entire construction projects
              </Text>
            </View>
            <ChevronRight size={24} color="#3B82F6" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* Subcontractor */}
        <TouchableOpacity 
          onPress={() => router.push('/contractor/onboarding?type=sub')}
          className="bg-[#1E3A5F] rounded-2xl p-6 mb-4 border-2 border-blue-900 active:opacity-80 active:border-blue-600"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-orange-600 rounded-xl items-center justify-center">
              <Wrench size={28} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View className="flex-1 ml-4">
              <Text 
                className="text-white text-2xl"
                style={{ fontFamily: 'Poppins_800ExtraBold' }}
              >
                Subcontractor
              </Text>
              <Text 
                className="text-gray-400 text-lg"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                Provide specialized services
              </Text>
            </View>
            <ChevronRight size={24} color="#3B82F6" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* Product Vendor */}
        <TouchableOpacity 
          onPress={() => router.push('/contractor/onboarding?type=vendor')}
          className="bg-[#1E3A5F] rounded-2xl p-6 mb-4 border-2 border-blue-900 active:opacity-80 active:border-blue-600"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-green-600 rounded-xl items-center justify-center">
              <Package size={28} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View className="flex-1 ml-4">
              <Text 
                className="text-white text-2xl"
                style={{ fontFamily: 'Poppins_800ExtraBold' }}
              >
                Product Vendor
              </Text>
              <Text 
                className="text-gray-400 text-lg"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                Supply building materials
              </Text>
            </View>
            <ChevronRight size={24} color="#3B82F6" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* Verification Notice */}
        <View className="bg-blue-900/30 rounded-2xl p-4 mt-4 flex-row items-center border border-blue-800">
          <Shield size={24} color="#3B82F6" strokeWidth={2} />
          <View className="flex-1 ml-3">
            <Text 
              className="text-white text-sm"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Verification Required
            </Text>
            <Text 
              className="text-gray-400 text-xs"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              All professionals must pass document verification
            </Text>
          </View>
        </View>
      </View>

      {/* Already have account */}
      <View className="px-6 pb-8">
        <TouchableOpacity 
          onPress={() => router.push('/login')}
          className="bg-blue-600 rounded-full py-6 px-10 active:opacity-80"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text 
            className="text-white text-center text-2xl"
            style={{ fontFamily: 'Poppins_800ExtraBold' }}
          >
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
