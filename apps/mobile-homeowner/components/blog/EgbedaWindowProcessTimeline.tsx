import { Text, View, useWindowDimensions } from 'react-native';
import {
  EGBEDA_WINDOW_PROCESS_STEPS,
} from '@/lib/aluminium-window-repair-egbeda-case-study';
import { SeoHeading } from '@/components/seo/SeoHeading';

export default function EgbedaWindowProcessTimeline() {
  const { width } = useWindowDimensions();
  const horizontal = width >= 900;

  return (
    <View
      className="my-8 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 md:p-7"
      accessibilityLabel="How BuildMyHouse managed the Egbeda aluminium window repair"
    >
      <Text
        className="text-[11px] uppercase tracking-[0.14em] text-emerald-700 mb-2"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Trust loop
      </Text>
      <SeoHeading
        level={3}
        className="text-black text-xl mb-5 md:text-2xl"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        How BuildMyHouse managed the repair
      </SeoHeading>

      <View className={horizontal ? 'flex-row flex-wrap gap-3' : 'flex-col gap-3'}>
        {EGBEDA_WINDOW_PROCESS_STEPS.map((step, index) => (
          <View
            key={step}
            className={
              horizontal
                ? 'w-[31%] min-w-[200px] rounded-2xl border border-emerald-100 bg-white px-4 py-3'
                : 'rounded-2xl border border-emerald-100 bg-white px-4 py-3'
            }
          >
            <Text
              className="text-emerald-700 text-xs mb-1"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text className="text-gray-900 text-sm leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
