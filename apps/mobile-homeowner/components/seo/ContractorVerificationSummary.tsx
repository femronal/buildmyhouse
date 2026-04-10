import { Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';
import type { ContractorVerificationSummaryData } from '@/components/seo/proof-of-process-types';

type Props = {
  data: ContractorVerificationSummaryData;
};

function statusChip(status: 'verified' | 'in_review' | 'pending') {
  if (status === 'verified') return 'bg-green-100 text-green-700';
  if (status === 'in_review') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

export default function ContractorVerificationSummary({ data }: Props) {
  return (
    <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
      <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        Contractor verification summary
      </SeoHeading>
      <Text className="text-sm text-gray-700 mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
        {data.contractorLabel}
      </Text>
      {data.checks.map((check) => (
        <View key={check.label} className="flex-row items-start justify-between mb-2 gap-2">
          <View className="flex-1 pr-2">
            <Text className="text-sm text-gray-800" style={{ fontFamily: 'Poppins_500Medium' }}>
              {check.label}
            </Text>
            {check.note ? (
              <Text className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {check.note}
              </Text>
            ) : null}
          </View>
          <Text className={`text-[11px] px-2 py-1 rounded-full ${statusChip(check.status)}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {check.status === 'in_review' ? 'In review' : check.status === 'verified' ? 'Verified' : 'Pending'}
          </Text>
        </View>
      ))}
      <Text className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
        {data.note}
      </Text>
    </View>
  );
}

