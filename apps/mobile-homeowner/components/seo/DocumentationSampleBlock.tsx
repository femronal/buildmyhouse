import { Text, View } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';
import type { DocumentationSampleItem } from '@/components/seo/proof-of-process-types';

type Props = {
  items: DocumentationSampleItem[];
};

export default function DocumentationSampleBlock({ items }: Props) {
  return (
    <View className="mb-5">
      <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        Documentation sample block
      </SeoHeading>
      <View className="gap-3">
        {items.map((item) => (
          <View key={item.title} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="text-sm text-black mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {item.title}
            </Text>
            <Text className="text-xs text-blue-700 mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
              {item.caption}
            </Text>
            <Text className="text-sm text-gray-700 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              {item.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

