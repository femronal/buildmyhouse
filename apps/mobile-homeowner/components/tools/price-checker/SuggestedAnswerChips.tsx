import { Pressable, ScrollView, Text, View } from 'react-native';
import { pc } from './theme';

type Props = {
  options: string[];
  onSelect: (value: string) => void;
  allowUnknown?: boolean;
  onUnknown?: () => void;
  disabled?: boolean;
};

export function SuggestedAnswerChips({ options, onSelect, allowUnknown, onUnknown, disabled }: Props) {
  if (options.length === 0 && !allowUnknown) return null;
  return (
    <View className="mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={option}
            className="min-h-[44px] items-center justify-center rounded-full border border-white/10 px-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', opacity: disabled ? 0.5 : 1 }}
          >
            <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              {option}
            </Text>
          </Pressable>
        ))}
        {allowUnknown && onUnknown ? (
          <Pressable
            onPress={onUnknown}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="I don't know"
            className="min-h-[44px] items-center justify-center rounded-full border px-4"
            style={{ borderColor: pc.greenBorder, backgroundColor: 'rgba(5,150,105,0.12)', opacity: disabled ? 0.5 : 1 }}
          >
            <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: '#6ee7b7' }}>
              I don’t know
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
