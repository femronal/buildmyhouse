import { Pressable, Text, View } from 'react-native';
import { pc } from './theme';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  /** frank label when research is cancelled rather than truly paused */
  duringResearch?: boolean;
  compact?: boolean;
};

export function PauseAndEditButton({ onPress, disabled, duringResearch, compact = false }: Props) {
  const label = duringResearch ? 'Stop and edit answers' : 'Pause and edit answers';
  const size = compact ? 44 : 56;
  return (
    <View style={{ marginBottom: compact ? 12 : 32, alignItems: 'center' }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.7)',
          backgroundColor: pc.charcoalDeep,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: compact ? 12 : 16,
            height: compact ? 12 : 16,
            borderRadius: 3,
            backgroundColor: pc.red,
          }}
        />
      </Pressable>
      <Text
        style={{
          marginTop: 6,
          fontFamily: 'Poppins_500Medium',
          fontSize: compact ? 11 : 12,
          color: '#94a3b8',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
