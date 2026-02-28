import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Shield, Wrench, Users } from "lucide-react-native";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push('/contractor/gc-profile'))}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
          About BuildMyHouse
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
          <Text className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Built for trusted construction delivery
          </Text>
          <Text className="text-gray-300 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            BuildMyHouse helps homeowners and contractors plan, execute, and track projects with transparency,
            secure documentation, staged payments, and clear accountability.
          </Text>
        </View>

        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-3">
          <View className="flex-row items-center mb-2">
            <Wrench size={18} color="#60A5FA" strokeWidth={2} />
            <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Core capabilities
            </Text>
          </View>
          <Text className="text-gray-400 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            Stage-by-stage project tracking, material/team documentation, milestone payments, design publishing,
            and operational dashboards for contractors and admins.
          </Text>
        </View>

        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-3">
          <View className="flex-row items-center mb-2">
            <Shield size={18} color="#60A5FA" strokeWidth={2} />
            <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Trust & safety
            </Text>
          </View>
          <Text className="text-gray-400 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            We enforce verification checks, dispute review processes, and fraud safeguards to protect users and project outcomes.
          </Text>
        </View>

        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-8">
          <View className="flex-row items-center mb-2">
            <Users size={18} color="#60A5FA" strokeWidth={2} />
            <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Version & support
            </Text>
          </View>
          <Text className="text-gray-400 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            Contractor App v1.0.0. For legal, privacy, or support matters, please use Help & Support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
