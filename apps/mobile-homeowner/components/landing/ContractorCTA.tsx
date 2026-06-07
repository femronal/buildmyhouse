import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, WORKER_CATEGORIES } from '@/lib/home-landing-content';

export default function ContractorCTA() {
  return (
    <View className="mt-14 border rounded-3xl p-6 bg-white" style={{ borderColor: LANDING_BORDER }}>
      <SeoHeading level={2} className="text-3xl mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        Are you a skilled artisan, repairer, renovator, or contractor?
      </SeoHeading>
      <Text className="text-base leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
        Join BuildMyHouse, get verified, receive better project requests, and build trust with homeowners who value
        documented work.
      </Text>

      <View className="flex-row flex-wrap mb-5">
        {WORKER_CATEGORIES.map((category) => (
          <View key={category} className="rounded-full px-3 py-1.5 mr-2 mb-2 border" style={{ borderColor: LANDING_BORDER }}>
            <Text className="text-xs" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
              {category}
            </Text>
          </View>
        ))}
      </View>

      <Link href={'/for-contractors' as any} asChild>
        <Pressable className="self-start rounded-full px-5 py-3 bg-black" accessibilityRole="link">
          <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
            Get Hired on BuildMyHouse
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
