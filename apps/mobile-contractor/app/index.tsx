import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getAuthToken } from "@/lib/auth";

export default function ContractorStartScreen() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const token = await getAuthToken();
      if (token) {
        router.replace('/contractor/gc-dashboard');
      } else {
        router.replace('/login');
      }
    };
    redirect();
  }, [router]);

  return (
    <View className="flex-1 bg-[#0A1628] justify-center items-center">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
