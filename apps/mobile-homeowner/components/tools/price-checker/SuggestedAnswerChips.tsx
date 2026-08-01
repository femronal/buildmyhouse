import { Pressable, Text, View } from 'react-native';
import { pc } from './theme';

type Props = {
  options: string[];
  onSelect: (value: string) => void;
  allowUnknown?: boolean;
  onUnknown?: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export function SuggestedAnswerChips({
  options,
  onSelect,
  allowUnknown,
  onUnknown,
  disabled,
  compact = false,
}: Props) {
  if (options.length === 0 && !allowUnknown) return null;

  const chip = (label: string, onPress: () => void, emphasize?: boolean) => (
    <Pressable
      key={label}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: compact ? 36 : 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: emphasize ? pc.greenBorder : 'rgba(255,255,255,0.1)',
        paddingHorizontal: compact ? 12 : 16,
        paddingVertical: compact ? 6 : 8,
        backgroundColor: emphasize ? 'rgba(5,150,105,0.12)' : 'rgba(255,255,255,0.06)',
        opacity: disabled ? 0.5 : 1,
        maxWidth: '100%',
      }}
    >
      <Text
        style={{
          fontFamily: emphasize ? 'Poppins_600SemiBold' : 'Poppins_500Medium',
          fontSize: compact ? 12 : 14,
          color: emphasize ? '#6ee7b7' : '#fff',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={{
        marginBottom: compact ? 10 : 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {options.map((option) => chip(option, () => onSelect(option)))}
      {allowUnknown && onUnknown ? chip("I don’t know", onUnknown, true) : null}
    </View>
  );
}
