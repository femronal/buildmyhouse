import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getAuthToken } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { needsContractorIntroOnboarding } from "@/lib/onboarding";

export default function ContractorStartScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    const redirect = async () => {
      if (isLoading) return;
      const token = await getAuthToken();
      if (token) {
        if (needsContractorIntroOnboarding(currentUser)) {
          router.replace('/contractor/onboarding');
          return;
        }
        router.replace('/contractor/gc-dashboard');
      } else {
        router.replace('/login');
      }
    };
    void redirect();
  }, [currentUser, isLoading, router]);

  return (
    <View className="flex-1 bg-[#0A1628] justify-center items-center">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
