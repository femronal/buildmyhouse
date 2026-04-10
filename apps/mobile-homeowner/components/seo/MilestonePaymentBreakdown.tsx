import { Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';
import type { MilestonePaymentItem } from '@/components/seo/proof-of-process-types';

type Props = {
  items: MilestonePaymentItem[];
};

export default function MilestonePaymentBreakdown({ items }: Props) {
  return (
    <View className="mb-5">
      <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        Milestone payment breakdown
      </SeoHeading>
      {items.map((item, idx) => (
        <View
          key={`${item.stageName}-${idx}`}
          style={cardShadowStyle}
          className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
        >
          <Text className="text-sm uppercase text-blue-700 mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {item.stageName}
          </Text>
          <Text className="text-sm text-gray-800 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Completion: {item.completionDefinition}
          </Text>
          <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
            Evidence required:
          </Text>
          {item.requiredEvidence.map((evidence) => (
            <View key={evidence} className="flex-row items-start mb-1">
              <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                •
              </Text>
              <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {evidence}
              </Text>
            </View>
          ))}
          <Text className="text-xs text-green-700 mt-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Payment trigger: {item.paymentTrigger}
          </Text>
        </View>
      ))}
    </View>
  );
}

