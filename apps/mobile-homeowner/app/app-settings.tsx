import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, ChevronRight, Info } from "lucide-react-native";
import Constants from "expo-constants";

export default function AppSettingsScreen() {
  const router = useRouter();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/profile"))} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_700Bold" }}>
          App Settings
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-gray-50 rounded-3xl p-6 border border-gray-200 mb-6">
          <Text className="text-gray-600 text-sm mb-4" style={{ fontFamily: "Poppins_400Regular" }}>
            Manage how BuildMyHouse works for you.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/notification-settings" as any)}
            className="bg-white rounded-2xl p-4 border border-gray-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Bell size={20} color="#000000" strokeWidth={2} />
              </View>
              <View className="ml-3">
                <Text className="text-black" style={{ fontFamily: "Poppins_600SemiBold" }}>
                  Notifications
                </Text>
                <Text className="text-gray-500 text-sm" style={{ fontFamily: "Poppins_400Regular" }}>
                  Push, email, and project updates
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#737373" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex-row items-center">
          <Info size={18} color="#6B7280" strokeWidth={2} />
          <Text className="text-gray-600 text-sm ml-2" style={{ fontFamily: "Poppins_400Regular" }}>
            BuildMyHouse v{appVersion}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
