import { Text, View } from 'react-native';

/** Native fallback. The animated cover renders on web. */
export default function BrandedLottieCover({
  className = 'mb-4',
  height = 220,
  label = 'Illustration',
}: {
  className?: string;
  height?: number;
  label?: string;
  animationUrl?: string;
  placeholder?: 'house' | 'schedule';
}) {
  return (
    <View
      className={`w-full overflow-hidden rounded-2xl border border-black bg-white items-center justify-center ${className}`.trim()}
      style={{ height }}
      accessibilityLabel={label}
    >
      <Text className="text-gray-600 text-sm text-center px-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        {label}
      </Text>
    </View>
  );
}
