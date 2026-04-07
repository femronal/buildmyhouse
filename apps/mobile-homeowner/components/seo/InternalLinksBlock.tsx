import { TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { cardShadowStyle } from '@/lib/card-styles';

export type InternalLinkItem = {
  label: string;
  href: string;
};

type InternalLinksBlockProps = {
  title?: string;
  links: InternalLinkItem[];
};

export default function InternalLinksBlock({
  title = 'Explore related pages',
  links,
}: InternalLinksBlockProps) {
  const router = useRouter();

  return (
    <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
      <SeoHeading level={2} className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      <View className="flex-row flex-wrap gap-2">
        {links.map((item) => (
          <TouchableOpacity
            key={item.href}
            onPress={() => router.push(item.href as any)}
            className="bg-gray-100 rounded-full px-3 py-2"
          >
            <Text className="text-gray-800 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

