import { Text, View } from 'react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { COMPARISON_ROWS, LANDING_BORDER, LANDING_INK, LANDING_MUTED, TRUST_POINTS } from '@/lib/home-landing-content';

export default function TrustSection() {
  return (
    <View className="mt-14">
      <SeoHeading level={2} className="text-3xl mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        Why Nigerians should trust BuildMyHouse
      </SeoHeading>
      <Text className="text-base leading-7 mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
        Not just referrals. Not just WhatsApp updates. BuildMyHouse is designed to reduce confusion, improve visibility,
        and support better decision-making with evidence and stage control.
      </Text>

      <View className="flex-row flex-wrap">
        {TRUST_POINTS.map((point) => (
          <View
            key={point}
            className="w-full md:w-[32%] rounded-xl border px-4 py-3 mr-2 mb-2 bg-white"
            style={{ borderColor: LANDING_BORDER }}
          >
            <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
              {point}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-10">
        <SeoHeading level={3} className="text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Stop managing property work with scattered WhatsApp messages
        </SeoHeading>
        <Text className="text-base leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          WhatsApp is useful for talking. But when money, scope, stages, materials, and approvals are involved, you need
          more structure.
        </Text>

        <View className="rounded-2xl border overflow-hidden" style={{ borderColor: LANDING_BORDER }}>
          <View className="flex-row bg-[#F9FAFB] border-b" style={{ borderColor: LANDING_BORDER }}>
            <View className="w-1/2 p-3 border-r" style={{ borderColor: LANDING_BORDER }}>
              <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                Old way
              </Text>
            </View>
            <View className="w-1/2 p-3">
              <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                BuildMyHouse way
              </Text>
            </View>
          </View>
          {COMPARISON_ROWS.map((row) => (
            <View key={row.oldWay} className="flex-row border-b last:border-b-0" style={{ borderColor: LANDING_BORDER }}>
              <View className="w-1/2 p-3 border-r" style={{ borderColor: LANDING_BORDER }}>
                <Text className="text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                  {row.oldWay}
                </Text>
              </View>
              <View className="w-1/2 p-3">
                <Text className="text-sm leading-6" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                  {row.platformWay}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
