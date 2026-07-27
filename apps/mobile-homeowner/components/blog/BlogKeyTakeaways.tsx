import { Text, View } from 'react-native';

type BlogKeyTakeawaysProps = {
  items: string[];
  title?: string;
};

/** Scannable key takeaways box shown near the top of long posts. */
export default function BlogKeyTakeaways({
  items,
  title = 'Key takeaways',
}: BlogKeyTakeawaysProps) {
  if (!items.length) return null;

  return (
    <View className="mb-5 rounded-2xl border border-[#059669]/25 bg-[#ecfdf5] px-4 py-4 md:px-5">
      <Text
        className="text-[11px] uppercase tracking-wide text-[#047857] mb-2.5"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {title}
      </Text>
      <View className="gap-2">
        {items.map((item) => (
          <View key={item} className="flex-row gap-2.5">
            <Text className="text-[#059669] mt-0.5" style={{ fontFamily: 'Poppins_700Bold' }}>
              ✓
            </Text>
            <Text
              className="flex-1 text-gray-800 text-[15px] leading-6"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
