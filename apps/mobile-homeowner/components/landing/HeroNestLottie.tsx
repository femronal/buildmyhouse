import { Text, View } from 'react-native';

/** Native fallback :  full Lottie renders on web. */
export default function HeroNestLottie() {
  return (
    <View
      className="w-full max-w-[420px] self-center items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 px-6 py-12"
      accessibilityLabel="Woodpecker building a nest. A symbol of careful, intentional home-building."
      accessibilityRole="image"
    >
      <Text className="text-slate-500 text-sm text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
        Building with care, from afar.
      </Text>
    </View>
  );
}
