import { TouchableOpacity, View, Text, ScrollView } from 'react-native';
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
  /** Tighter padding + single-row horizontal chips (mobile web listing screens). */
  compact?: boolean;
};

export default function InternalLinksBlock({
  title = 'Explore related pages',
  links,
  compact = false,
}: InternalLinksBlockProps) {
  const router = useRouter();

  const chip = (item: InternalLinkItem) => (
    <TouchableOpacity
      key={item.href}
      onPress={() => router.push(item.href as any)}
      className={`bg-gray-100 rounded-full ${compact ? 'px-2.5 py-1.5 mr-2' : 'px-3 py-2'}`}
    >
      <Text
        className="text-gray-800 text-xs"
        style={{ fontFamily: 'Poppins_500Medium', fontSize: compact ? 11 : 12 }}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={cardShadowStyle}
      className={`bg-white border border-gray-200 rounded-2xl ${compact ? 'p-2.5 mb-3' : 'p-4 mb-5'}`}
    >
      <SeoHeading
        level={2}
        className={`text-black ${compact ? 'text-sm mb-2' : 'text-base mb-3'}`}
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {title}
      </SeoHeading>
      {compact ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
          {links.map(chip)}
        </ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-2">{links.map(chip)}</View>
      )}
    </View>
  );
}

