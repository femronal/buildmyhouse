import { Pressable, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import LagosRepairServicePage from '@/components/landing/LagosRepairServicePage';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { isLagosRepairSlug } from '@/lib/lagos-repair-services';
import { useWebSeo } from '@/lib/seo';

function UnknownLagosServicePage() {
  useWebSeo({
    title: 'Repair Services in Lagos | BuildMyHouse',
    description: 'Browse verified repair services in Lagos or start a tracked repair.',
    canonicalPath: '/start-repair',
    robots: 'noindex,follow',
  });

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />
        <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
          <Text className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            Service not found
          </Text>
          <Text className="text-sm mt-2 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Try a popular Lagos repair page or start a tracked repair.
          </Text>
          <Link href={'/start-repair' as any} asChild>
            <Pressable className="rounded-full px-4 py-2.5 bg-black self-start" accessibilityRole="link">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                Start a Tracked Repair
              </Text>
            </Pressable>
          </Link>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}

export default function LagosRepairServiceRoute() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  if (!isLagosRepairSlug(slug)) {
    return <UnknownLagosServicePage />;
  }

  return <LagosRepairServicePage slug={slug} />;
}
