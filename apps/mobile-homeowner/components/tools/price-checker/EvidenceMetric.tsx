import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { prefersReducedMotion } from './theme';

type Props = {
  label: string;
  value: number | null;
  waitingLabel?: string;
};

/** Counts from the previous real value to the new real value — never from invented zeros after every render. */
export function EvidenceMetric({ label, value, waitingLabel = 'Waiting' }: Props) {
  const [display, setDisplay] = useState<number | null>(value);
  const previous = useRef<number | null>(value);

  useEffect(() => {
    if (value === null) {
      setDisplay(null);
      previous.current = null;
      return;
    }
    if (prefersReducedMotion() || previous.current === null || previous.current === value) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const from = previous.current;
    const to = value;
    const steps = 8;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      const next = Math.round(from + ((to - from) * step) / steps);
      setDisplay(next);
      if (step >= steps) {
        clearInterval(id);
        previous.current = to;
      }
    }, 40);
    return () => clearInterval(id);
  }, [value]);

  return (
    <View className="min-w-[96px]">
      <Text className="text-lg text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {display === null ? waitingLabel : display.toLocaleString('en-NG')}
      </Text>
      <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
        {label}
      </Text>
    </View>
  );
}
