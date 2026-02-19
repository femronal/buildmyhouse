import { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { HardHat, ChevronRight, Shield } from "lucide-react-native";
import { getAuthToken } from "@/lib/auth";

export default function ContractorLandingScreen() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const token = await getAuthToken();
      if (token) {
        router.replace('/contractor/gc-dashboard');
      }
    };
    check();
  }, [router]);

  return (
    <View className="flex-1 bg-[#0A1628]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Header */}
        <View className="pt-16 px-6 pb-6">
          <View className="flex-row items-center mb-2">
            <HardHat size={32} color="#3B82F6" strokeWidth={2} />
            <Text
              className="text-3xl text-white ml-3"
              style={{ fontFamily: 'Poppins_800ExtraBold' }}
            >
              BuildMyHouse
            </Text>
          </View>
          <Text className="text-blue-400 text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            General Contractor Portal
          </Text>
        </View>

        {/* Hero Section */}
        <View className="px-6 mb-6">
          <Text
            className="text-white text-2xl mb-3"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Run projects. Prove progress. Get paid.
          </Text>
          <Text
            className="text-gray-400 text-base leading-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Accept jobs, document every stage with photos/receipts, and keep homeowners updated—end to end.
          </Text>
        </View>

        {/* Account Type (MVP: GC only) */}
        <View className="px-6">
          <Text className="text-white text-2xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
            Get Started
          </Text>

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
                <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
                  General Contractor
                </Text>
                <Text className="text-gray-400 text-base" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Review projects, manage stages, upload proof
                </Text>
              </View>
              <ChevronRight size={24} color="#3B82F6" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          {/* Verification Notice */}
          <View className="bg-blue-900/30 rounded-2xl p-4 mt-2 flex-row items-center border border-blue-800">
            <Shield size={24} color="#3B82F6" strokeWidth={2} />
            <View className="flex-1 ml-3">
              <Text
                className="text-white text-sm"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Verification required before you can accept projects
              </Text>
              <Text
                className="text-gray-400 text-xs mt-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Upload your documents once and start getting matched.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer: Sign in */}
      <View className="absolute left-0 right-0 bottom-0 px-6 pb-8 pt-4 bg-[#0A1628]/95 border-t border-blue-900">
        <TouchableOpacity
          onPress={() => router.push('/login')}
          className="bg-blue-600 rounded-full py-5 px-10 active:opacity-80"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text
            className="text-white text-center text-xl"
            style={{ fontFamily: 'Poppins_800ExtraBold' }}
          >
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
