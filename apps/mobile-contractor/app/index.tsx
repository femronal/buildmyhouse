import { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthToken } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { needsContractorIntroOnboarding } from '@/lib/onboarding';
import GcLandingScreen from '@/components/GcLandingScreen';

export default function ContractorStartScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAuthToken().then((token) => {
      if (!cancelled) setHasToken(Boolean(token));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || hasToken === null) return;
    if (!hasToken) {
      if (Platform.OS !== 'web') {
        router.replace('/login');
      }
      return;
    }

    if (needsContractorIntroOnboarding(currentUser)) {
      router.replace('/contractor/onboarding');
      return;
    }
    router.replace('/contractor/gc-dashboard');
  }, [currentUser, hasToken, isLoading, router]);

  if (Platform.OS === 'web' && hasToken === false && !isLoading) {
    return <GcLandingScreen />;
  }

  if (isLoading || hasToken === null || hasToken) {
    return (
      <View className="flex-1 bg-[#0A1628] justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A1628] justify-center items-center">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
