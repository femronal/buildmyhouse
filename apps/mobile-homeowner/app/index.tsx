import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { needsHomeownerIntroOnboarding } from '@/lib/onboarding';
import HomeLandingScreen from '@/components/HomeLandingScreen';
import { useWebSeo } from '@/lib/seo';

export default function StartScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  useWebSeo({
    title: 'BuildMyHouse Technologies Nigeria | Construction, Renovation, Interior Design',
    description:
      'BuildMyHouse Technologies helps homeowners and diaspora clients in Nigeria plan projects clearly, track stage progress, verify updates, and make smarter payment decisions.',
    canonicalPath: '/',
    robots: 'index,follow',
  });

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) return;

    if (needsHomeownerIntroOnboarding(currentUser)) {
      router.replace('/onboarding-intro');
      return;
    }
    router.replace('/(tabs)/home');
  }, [currentUser, isLoading, router]);

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
