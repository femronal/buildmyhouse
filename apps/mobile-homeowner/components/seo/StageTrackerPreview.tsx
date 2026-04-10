import { Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';
import type { StageTrackerItem } from '@/lib/demo-project-monitoring';

type Props = {
  items: StageTrackerItem[];
};

function dotColor(status: StageTrackerItem['status']) {
  if (status === 'completed') return 'bg-green-500';
  if (status === 'in_progress') return 'bg-blue-600';
  return 'bg-gray-400';
}

function statusLabel(status: StageTrackerItem['status']) {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In progress';
  return 'Up next';
}

export default function StageTrackerPreview({ items }: Props) {
  return (
    <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
      <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        Stage tracker
      </SeoHeading>
      {items.map((item, index) => (
        <View key={`${item.stage}-${index}`} className="flex-row items-start mb-3">
          <View className={`w-2.5 h-2.5 rounded-full mt-1.5 mr-3 ${dotColor(item.status)}`} />
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {item.stage}
              </Text>
              <Text className="text-[11px] text-gray-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                {statusLabel(item.status)}
              </Text>
            </View>
            <Text className="text-xs text-gray-600 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {item.note}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

