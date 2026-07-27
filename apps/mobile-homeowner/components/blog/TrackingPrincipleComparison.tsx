import { Text, View } from 'react-native';
import { trackingPrincipleComparison } from '@/lib/amala-joint-tracking-story';
import { SeoHeading } from '@/components/seo/SeoHeading';

type ColumnProps = {
  title: string;
  steps: readonly string[];
};

function ComparisonColumn({ title, steps }: ColumnProps) {
  return (
    <View className="flex-1 rounded-3xl border border-gray-200 bg-[#fafaf8] p-5 md:p-6">
      <Text
        className="text-[11px] uppercase tracking-[0.14em] text-gray-500 mb-3"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {title}
      </Text>
      <View className="gap-3">
        {steps.map((step, index) => (
          <View key={step} className="flex-row items-start gap-3">
            <View className="mt-0.5 h-6 w-6 rounded-full bg-[#059669] items-center justify-center">
              <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                {index + 1}
              </Text>
            </View>
            <Text className="flex-1 text-gray-800 text-base leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function TrackingPrincipleComparison() {
  return (
    <View className="my-6" accessibilityLabel="Comparison of Amala Joint and BuildMyHouse tracking stages">
      <SeoHeading
        level={3}
        className="text-black text-lg mb-4 md:text-xl"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        The same principle, different scale
      </SeoHeading>
      <View className="flex-col gap-4 md:flex-row">
        <ComparisonColumn
          title={trackingPrincipleComparison.amala.title}
          steps={trackingPrincipleComparison.amala.steps}
        />
        <ComparisonColumn
          title={trackingPrincipleComparison.buildMyHouse.title}
          steps={trackingPrincipleComparison.buildMyHouse.steps}
        />
      </View>
    </View>
  );
}
