import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EGBEDA_WINDOW_CASE_STUDY_PATH } from '@/lib/aluminium-window-repair-egbeda-case-study';
import { SeoHeading } from '@/components/seo/SeoHeading';

type EgbedaWindowCaseStudyCardProps = {
  className?: string;
};

export default function EgbedaWindowCaseStudyCard({ className = '' }: EgbedaWindowCaseStudyCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel="Read the Egbeda aluminium window repair case study"
      onPress={() => router.push(EGBEDA_WINDOW_CASE_STUDY_PATH as any)}
      className={`rounded-3xl border border-gray-200 bg-white p-5 md:p-6 ${className}`.trim()}
      style={{ borderLeftWidth: 4, borderLeftColor: '#059669' }}
    >
      <Text
        className="text-[11px] uppercase tracking-[0.14em] text-emerald-700 mb-2"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Real project story
      </Text>
      <SeoHeading
        level={3}
        className="text-black text-xl mb-3"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        She thought the window needed replacement.
      </SeoHeading>
      <Text className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
        Inspection showed it only needed repair.
      </Text>
      <Text className="text-gray-600 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        See how BuildMyHouse scoped, documented and tracked the aluminium window job in Egbeda, Lagos.
      </Text>
      <View className="self-start rounded-full bg-black px-4 py-2">
        <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Read the case study
        </Text>
      </View>
    </TouchableOpacity>
  );
}
