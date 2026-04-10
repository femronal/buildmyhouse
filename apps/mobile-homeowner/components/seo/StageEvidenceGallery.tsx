import { Image, ScrollView, Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';
import type { StageEvidenceItem } from '@/components/seo/proof-of-process-types';

type Props = {
  items: StageEvidenceItem[];
};

export default function StageEvidenceGallery({ items }: Props) {
  return (
    <View className="mb-5">
      <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        Stage evidence gallery
      </SeoHeading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[cardShadowStyle, { width: 250, marginRight: 12 }]}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
          >
            <Image source={{ uri: item.imageUrl }} className="w-full h-36" resizeMode="cover" />
            <View className="p-3">
              <Text className="text-xs uppercase text-blue-700 mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {item.stageLabel}
              </Text>
              <Text className="text-[11px] text-gray-500 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item.date}
              </Text>
              <Text className="text-sm text-gray-700 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item.explanation}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

