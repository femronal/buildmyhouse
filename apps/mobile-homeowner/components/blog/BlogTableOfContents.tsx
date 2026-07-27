import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { scrollToReadingAnchor, type BlogTocItem } from '@/lib/blog-reading-chrome';

type BlogTableOfContentsProps = {
  items: BlogTocItem[];
  title?: string;
  /** Prefer H2-only TOC for long posts; keep H3 when few sections. */
  preferH2Only?: boolean;
};

export default function BlogTableOfContents({
  items,
  title = 'In this article',
  preferH2Only = true,
}: BlogTableOfContentsProps) {
  const h2Only = preferH2Only ? items.filter((item) => item.level === 2) : items;
  const visible = (h2Only.length >= 2 ? h2Only : items).slice(0, 12);
  if (visible.length < 2) return null;

  return (
    <View className="mb-6 rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-4 md:px-5">
      <Text
        className="text-[11px] uppercase tracking-wide text-gray-500 mb-3"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {title}
      </Text>
      <View className="gap-2">
        {visible.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="link"
            accessibilityLabel={`Jump to ${item.title}`}
            onPress={() => {
              if (Platform.OS === 'web') scrollToReadingAnchor(item.id);
            }}
            className="flex-row gap-2.5 py-0.5 active:opacity-70"
          >
            <Text className="text-gray-400 text-sm w-5" style={{ fontFamily: 'Poppins_500Medium' }}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text
              className={`flex-1 text-gray-800 text-sm leading-6 ${item.level === 3 ? 'pl-2' : ''}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
