import { Linking, Pressable, Text, View } from 'react-native';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { FOR_CONTRACTOR_URL, LANDING_BORDER, LANDING_INK, LANDING_MUTED, WORKER_CATEGORIES } from '@/lib/home-landing-content';
import { useWebSeo } from '@/lib/seo';

export default function ForContractorsPage() {
  useWebSeo({
    title: 'For Contractors | BuildMyHouse',
    description:
      'Join BuildMyHouse as a verified artisan, repairer, renovator, or contractor. Receive better project requests from homeowners who value structured execution.',
    canonicalPath: '/for-contractors',
    robots: 'index,follow',
  });

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />

        <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          For Contractors
        </Text>
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Join as a verified worker on BuildMyHouse
        </SeoHeading>
        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          If you are a skilled artisan, repairer, renovator, interior specialist, or general contractor, BuildMyHouse helps
          you receive clearer project requests from homeowners who care about documented work and accountability.
        </Text>

        <View className="flex-row flex-wrap mb-6">
          {WORKER_CATEGORIES.map((item) => (
            <View key={item} className="rounded-full px-3 py-1.5 mr-2 mb-2 border" style={{ borderColor: LANDING_BORDER }}>
              <Text className="text-xs" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => Linking.openURL(FOR_CONTRACTOR_URL)}
          className="self-start rounded-full bg-black px-5 py-3"
          accessibilityRole="button"
          accessibilityLabel="Open contractor portal"
        >
          <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
            Continue to Contractor Portal
          </Text>
        </Pressable>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
