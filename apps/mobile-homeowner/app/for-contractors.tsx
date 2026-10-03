import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, WORKER_CATEGORIES } from '@/lib/home-landing-content';
import { useWebSeo } from '@/lib/seo';

export default function ForContractorsPage() {
  useWebSeo({
    title: 'For Contractors | BuildMyHouse',
    description:
      'If you do repairs, cleaning, building work, design or engineering, or you sell building materials, tell us what you do in a few taps. A BuildMyHouse agent will reply on WhatsApp.',
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
          Join BuildMyHouse
        </SeoHeading>
        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          If you do repairs, cleaning, building work, design or engineering, or you sell building materials, tell us what you do in a few taps. A BuildMyHouse agent will reply on WhatsApp.
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

        <Link href="/join" asChild>
          <Pressable
            className="self-start rounded-full bg-black px-5 py-3"
            accessibilityRole="link"
            accessibilityLabel="Join BuildMyHouse"
          >
            <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
              Join BuildMyHouse
            </Text>
          </Pressable>
        </Link>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
