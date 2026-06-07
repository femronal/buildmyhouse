import { Text, View } from 'react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { HOW_IT_WORKS_STEPS, LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';

export default function HowItWorks() {
  return (
    <View className="mt-14">
      <SeoHeading level={2} className="text-3xl mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        How BuildMyHouse works
      </SeoHeading>
      <Text className="text-base leading-7 mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
        Built around intake, verified supply, stage updates, and owner approval with evidence.
      </Text>

      <View className="flex-row flex-wrap">
        {HOW_IT_WORKS_STEPS.map((step, idx) => (
          <View
            key={step.title}
            className="w-full md:w-[48.8%] rounded-2xl border bg-white p-4 mb-3 md:mr-[1.2%]"
            style={{ borderColor: LANDING_BORDER }}
          >
            <Text className="text-xs uppercase mb-1" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_MUTED }}>
              0{idx + 1}
            </Text>
            <SeoHeading level={3} className="text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              {step.title}
            </SeoHeading>
            <Text className="text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              {step.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
