import { Text, View } from 'react-native';
import { formatElapsed, useElapsedTimer } from '@/hooks/useElapsedTimer';
import { pc } from './theme';

type Props = {
  running: boolean;
  resetKey: string | null;
  /** Seed from backend elapsedSeconds when restoring a run. */
  seededSeconds?: number;
  compact?: boolean;
};

export function ElapsedResearchTimer({ running, resetKey, seededSeconds = 0, compact = false }: Props) {
  const elapsed = useElapsedTimer(running, resetKey, seededSeconds);
  return (
    <View
      style={{
        marginBottom: compact ? 12 : 24,
        width: '100%',
        maxWidth: compact ? 180 : 240,
        borderRadius: compact ? 16 : 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.4)',
        padding: compact ? 4 : 6,
        backgroundColor: pc.charcoalSoft,
        alignSelf: 'center',
      }}
      accessibilityRole="timer"
      accessibilityLabel={`Elapsed ${formatElapsed(elapsed)}`}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: compact ? 12 : 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.05)',
          paddingHorizontal: compact ? 16 : 24,
          paddingVertical: compact ? 10 : 20,
          backgroundColor: '#080b09',
        }}
      >
        <Text
          style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: compact ? 9 : 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#64748b',
            marginBottom: 2,
          }}
        >
          Elapsed
        </Text>
        <Text
          style={{
            fontFamily: 'JetBrainsMono_500Medium',
            color: pc.green,
            fontSize: compact ? 28 : 48,
            letterSpacing: 2,
          }}
        >
          {formatElapsed(elapsed)}
        </Text>
      </View>
    </View>
  );
}
