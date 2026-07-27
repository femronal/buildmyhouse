import { View, type DimensionValue } from 'react-native';

type BlogReadingProgressProps = {
  /** 0–1 scroll completion */
  value: number;
};

/** Sticky top reading progress bar for long-form posts. */
export default function BlogReadingProgress({ value }: BlogReadingProgressProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const width = `${Math.round(clamped * 10000) / 100}%` as DimensionValue;
  return (
    <View
      className="absolute left-0 right-0 top-0 z-50 h-[3px] bg-gray-100"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      accessibilityLabel="Reading progress"
      pointerEvents="none"
    >
      <View className="h-full bg-[#059669]" style={{ width }} />
    </View>
  );
}
