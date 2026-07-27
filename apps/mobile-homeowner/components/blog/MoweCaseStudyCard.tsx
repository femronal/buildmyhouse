import { Text, View } from 'react-native';
import { moweCaseStudy } from '@/lib/amala-joint-tracking-story';
import { SeoHeading } from '@/components/seo/SeoHeading';

const rows = [
  { label: 'Location', value: moweCaseStudy.location },
  { label: 'Problem', value: moweCaseStudy.problem },
  { label: 'Initial estimate', value: moweCaseStudy.initialEstimate },
  { label: 'Agreed professional cost', value: moweCaseStudy.agreedProfessionalCost },
  { label: 'Client total', value: moweCaseStudy.clientTotal },
  { label: 'Evidence', value: moweCaseStudy.evidence },
  { label: 'Completion', value: moweCaseStudy.completion },
] as const;

export default function MoweCaseStudyCard() {
  return (
    <View
      className="my-6 rounded-3xl border border-gray-200 bg-white p-5 md:p-7"
      accessibilityLabel="Mowe plumbing project case study"
    >
      <Text
        className="text-[11px] uppercase tracking-[0.14em] text-[#059669] mb-2"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Project example
      </Text>
      <SeoHeading
        level={3}
        className="text-black text-xl mb-4 md:text-2xl"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {moweCaseStudy.heading}
      </SeoHeading>
      <View className="gap-3">
        {rows.map((row) => (
          <View key={row.label} className="border-b border-gray-100 pb-3">
            <Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              {row.label}
            </Text>
            <Text className="text-gray-900 text-base leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
      <Text className="text-gray-500 text-sm leading-6 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        {moweCaseStudy.disclaimer}
      </Text>
    </View>
  );
}
