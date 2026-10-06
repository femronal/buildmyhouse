import { Text, View } from 'react-native';

/** Native fallback. The animated cover renders on web. */
export default function PropertyPurchaseLottieCover({
  className = 'mb-4',
  height = 320,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <View
      className={`w-full overflow-hidden rounded-2xl border border-black bg-white items-center justify-center ${className}`.trim()}
      style={{ height }}
      accessibilityLabel="Illustration of a property purchase being reviewed and approved"
    >
      <Text className="text-gray-600 text-sm text-center px-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        Property purchase illustration
      </Text>
    </View>
  );
}
