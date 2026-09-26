import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { usePageOwnedSeo, useWebSeo } from '@/lib/seo';

export default function BookRepairRedirect() {
  const router = useRouter();
  usePageOwnedSeo();
  useWebSeo({
    title: 'Start a home repair in Nigeria | BuildMyHouse',
    description: 'Start a home repair in Nigeria. Tell us what needs fixing and send the request on WhatsApp.',
    canonicalPath: '/start/repair',
    robots: 'noindex,follow',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({ pathname: '/start/[path]', params: { path: 'repair' } } as never);
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Link href={'/start/repair' as never}>
        <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16 }}>Continue to start a repair</Text>
      </Link>
    </View>
  );
}
