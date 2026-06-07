import { Linking, Pressable, Text, View } from 'react-native';
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
    <View className="flex-1 bg-white px-5 py-10 md:px-10">
      <View className="max-w-3xl w-full self-center">
        <SeoHeading level={1} className="text-4xl mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Join as a verified worker on BuildMyHouse
        </SeoHeading>
        <Text className="text-base leading-7 mb-5" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
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
      </View>
    </View>
  );
}
