import { View, Text } from 'react-native';
import { cardShadowStyle } from '@/lib/card-styles';
import { SeoHeading } from '@/components/seo/SeoHeading';

export type TrustBlock = {
  key: 'proof_of_process' | 'common_mistakes' | 'helpful_resources' | 'cta';
  title: string;
  description?: string;
  bullets?: string[];
};

type Props = {
  blocks: TrustBlock[];
};

export default function TrustBlocks({ blocks }: Props) {
  return (
    <View className="mb-3">
      {blocks.map((block) => (
        <View
          key={block.key}
          style={cardShadowStyle}
          className="bg-white border border-gray-200 rounded-2xl p-4 mb-4"
        >
          <SeoHeading level={2} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {block.title}
          </SeoHeading>
          {block.description ? (
            <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {block.description}
            </Text>
          ) : null}
          {block.bullets?.map((item) => (
            <View key={item} className="flex-row items-start mb-1.5 pl-1">
              <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                •
              </Text>
              <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

