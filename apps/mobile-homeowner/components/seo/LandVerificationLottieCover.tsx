import { Text, View } from 'react-native';

/** Native fallback — full Lottie cover renders on web. */
export default function LandVerificationLottieCover({ className = 'mb-8' }: { className?: string }) {
  return (
    <View
      className={`overflow-hidden rounded-3xl border border-gray-200 bg-[#f3f0e8] px-5 py-10 items-center ${className}`.trim()}
      accessibilityLabel="Land for sale duotone illustration"
    >
      <Text className="text-gray-600 text-sm text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
        Cover illustration available in the web article.
      </Text>
    </View>
  );
}
