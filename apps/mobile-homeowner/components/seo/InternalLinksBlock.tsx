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
  /** White-on-dark variant for dark pages. */
  dark?: boolean;
};

export default function InternalLinksBlock({
  title = 'Explore related pages',
  links,
  compact = false,
  dark = false,
}: InternalLinksBlockProps) {
  const router = useRouter();

  const chip = (item: InternalLinkItem) => (
    <TouchableOpacity
      key={item.href}
      onPress={() => router.push(item.href as any)}
      className={`${dark ? 'bg-white/10' : 'bg-gray-100'} rounded-full ${compact ? 'px-2.5 py-1.5 mr-2' : 'px-3 py-2'}`}
    >
      <Text
        className={`${dark ? 'text-white/80' : 'text-gray-800'} text-xs`}
        style={{ fontFamily: 'Poppins_500Medium', fontSize: compact ? 11 : 12 }}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={dark ? undefined : cardShadowStyle}
      className={`${dark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl ${compact ? 'p-2.5 mb-3' : 'p-4 mb-5'}`}
    >
      <SeoHeading
        level={2}
        className={`${dark ? 'text-white' : 'text-black'} ${compact ? 'text-sm mb-2' : 'text-base mb-3'}`}
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

