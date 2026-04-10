import { Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';
import type { ChatTimelineItem } from '@/components/seo/proof-of-process-types';

type Props = {
  items: ChatTimelineItem[];
};

function actorLabel(actor: ChatTimelineItem['actor']) {
  if (actor === 'buildmyhouse') return 'BuildMyHouse';
  if (actor === 'contractor') return 'Contractor';
  return 'Homeowner';
}

function bubbleStyle(actor: ChatTimelineItem['actor']) {
  if (actor === 'homeowner') return 'bg-blue-50 border-blue-200';
  if (actor === 'contractor') return 'bg-gray-50 border-gray-200';
  return 'bg-emerald-50 border-emerald-200';
}

export default function ChatUpdateTimelineDemo({ items }: Props) {
  return (
    <View className="mb-5">
      <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        Chat and update timeline demo
      </SeoHeading>
      <Text className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
        Public preview (demo data) showing how tracked communication can look.
      </Text>
      <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-3">
        {items.map((item, index) => (
          <View key={`${item.at}-${index}`} className={`rounded-xl border p-3 mb-2 ${bubbleStyle(item.actor)}`}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs text-gray-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {actorLabel(item.actor)}
              </Text>
              <Text className="text-[11px] text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item.at}
              </Text>
            </View>
            <Text className="text-sm text-gray-800 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {item.message}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

