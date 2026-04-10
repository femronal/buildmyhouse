import { Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';
import type { ProjectOverview } from '@/lib/demo-project-monitoring';

type Props = {
  overview: ProjectOverview;
};

export default function ProjectOverviewCard({ overview }: Props) {
  return (
    <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        Project overview
      </SeoHeading>
      <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {overview.projectName}
      </Text>
      <Text className="text-xs text-gray-500 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
        {overview.location} • {overview.type}
      </Text>

      <View className="mb-2">
        <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
          Current stage
        </Text>
        <Text className="text-sm text-gray-800" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {overview.currentStage}
        </Text>
      </View>

      <View className="mb-2">
        <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
          Completion
        </Text>
        <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <View className="h-2 bg-blue-600" style={{ width: `${overview.completion}%` }} />
        </View>
        <Text className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
          {overview.completion}% complete
        </Text>
      </View>

      <Text className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
        {overview.budgetBand}
      </Text>
      <Text className="text-[11px] text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
        {overview.lastUpdate}
      </Text>
    </View>
  );
}

