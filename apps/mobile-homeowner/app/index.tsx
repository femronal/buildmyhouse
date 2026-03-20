import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function StartScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  // Make root route deterministic for web users:
  // signed-in users go to home, signed-out users go to login.
  useEffect(() => {
    if (isLoading) return;
    if (currentUser) {
      router.replace('/(tabs)/home');
      return;
    }
    router.replace('/login');
  }, [currentUser, isLoading, router]);

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}
