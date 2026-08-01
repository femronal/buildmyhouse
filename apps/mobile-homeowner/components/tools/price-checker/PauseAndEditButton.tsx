import { Pressable, Text, View } from 'react-native';
import { pc } from './theme';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  /** frank label when research is cancelled rather than truly paused */
  duringResearch?: boolean;
};

export function PauseAndEditButton({ onPress, disabled, duringResearch }: Props) {
  const label = duringResearch ? 'Stop and edit answers' : 'Pause and edit answers';
  return (
    <View className="mb-8 items-center">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="h-14 w-14 items-center justify-center rounded-full border border-black/70"
        style={{
          backgroundColor: pc.charcoalDeep,
          minWidth: 56,
          minHeight: 56,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            backgroundColor: pc.red,
          }}
        />
      </Pressable>
      <Text className="mt-2 text-xs text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
        {label}
      </Text>
    </View>
  );
}
