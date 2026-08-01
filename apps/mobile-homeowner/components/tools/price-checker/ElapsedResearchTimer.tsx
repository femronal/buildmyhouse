import { Text, View } from 'react-native';
import { formatElapsed, useElapsedTimer } from '@/hooks/useElapsedTimer';
import { pc } from './theme';

type Props = {
  running: boolean;
  resetKey: string | null;
  /** Seed from backend elapsedSeconds when restoring a run. */
  seededSeconds?: number;
};

export function ElapsedResearchTimer({ running, resetKey, seededSeconds = 0 }: Props) {
  const elapsed = useElapsedTimer(running, resetKey, seededSeconds);
  return (
    <View
      className="mx-auto mb-6 w-full max-w-[240px] rounded-[1.5rem] border border-black/40 p-1.5"
      style={{ backgroundColor: pc.charcoalSoft }}
      accessibilityRole="timer"
      accessibilityLabel={`Elapsed ${formatElapsed(elapsed)}`}
    >
      <View
        className="items-center justify-center rounded-[1.25rem] border border-white/5 px-6 py-5"
        style={{ backgroundColor: '#080b09' }}
      >
        <Text className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Elapsed
        </Text>
        <Text
          className="text-5xl tracking-widest"
          style={{ fontFamily: 'JetBrainsMono_500Medium', color: pc.green }}
        >
          {formatElapsed(elapsed)}
        </Text>
      </View>
    </View>
  );
}
