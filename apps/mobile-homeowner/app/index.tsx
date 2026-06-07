import { View, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { needsHomeownerIntroOnboarding } from '@/lib/onboarding';
import HomeLandingScreen from '@/components/HomeLandingScreen';

export default function StartScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) return;

    if (needsHomeownerIntroOnboarding(currentUser)) {
      router.replace('/onboarding-intro');
      return;
    }
    router.replace('/(tabs)/home');
  }, [currentUser, isLoading, router]);

  if (Platform.OS === 'web' && !currentUser) {
    return <HomeLandingScreen />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (currentUser) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return <HomeLandingScreen />;
}
