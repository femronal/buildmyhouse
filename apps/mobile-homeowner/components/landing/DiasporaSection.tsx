import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { DIASPORA_USE_CASES, LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';

export default function DiasporaSection() {
  return (
    <View className="mt-14">
      <SeoHeading level={2} className="text-3xl mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        Built for Nigerians at home and abroad
      </SeoHeading>

      <View className="flex-row flex-wrap">
        <View className="w-full md:w-[49%] border rounded-2xl p-5 mb-3 md:mr-[2%]" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading level={3} className="text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            Need a reliable repairer without stories?
          </SeoHeading>
          <Text className="text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Use BuildMyHouse to find verified workers for repairs, upgrades, renovations, and property fixes across Lagos.
          </Text>
          <Link href={'/location?mode=explore' as any} asChild>
            <Pressable className="self-start rounded-full px-4 py-2 bg-black" accessibilityRole="link">
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
                Find a Verified Worker
              </Text>
            </Pressable>
          </Link>
        </View>

        <View className="w-full md:w-[49%] border rounded-2xl p-5 mb-3" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading level={3} className="text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            Managing property work in Lagos from abroad?
          </SeoHeading>
          <Text className="text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Reduce blind updates, unclear scope, and pressure-based payments. Track stages, evidence, and communication in
            one place.
          </Text>
          <Link href={'/diaspora/build-in-nigeria-from-abroad' as any} asChild>
            <Pressable className="self-start rounded-full px-4 py-2 bg-black" accessibilityRole="link">
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
                Start a Tracked Project
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <View className="mt-8 border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
        <SeoHeading level={3} className="text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Distance should not mean losing control
        </SeoHeading>
        <Text className="text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          If you live in the UK, US, Canada, UAE, Europe, or elsewhere abroad, BuildMyHouse helps you manage property
          work in Lagos with clearer scope, stage-based updates, documented communication, and evidence before payment
          decisions.
        </Text>
        <View className="flex-row flex-wrap">
          {DIASPORA_USE_CASES.map((useCase) => (
            <View
              key={useCase}
              className="rounded-xl px-3.5 py-2 mr-2 mb-2 border bg-white"
              style={{ borderColor: LANDING_BORDER }}
            >
              <Text className="text-sm" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
                {useCase}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
