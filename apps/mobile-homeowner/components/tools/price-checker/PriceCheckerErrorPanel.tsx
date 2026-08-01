import { Pressable, Text, View } from 'react-native';
import { PriceCheckerError } from '@/lib/price-checker/state';
import { pc } from './theme';

type Props = {
  error: PriceCheckerError;
  connectionLost?: boolean;
  requestId?: string | null;
  onRetry: () => void;
  onEdit: () => void;
};

export function PriceCheckerErrorPanel({ error, connectionLost, requestId, onRetry, onEdit }: Props) {
  return (
    <View>
      <Text className="mb-2 text-2xl text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
        {connectionLost ? 'We lost connection while checking prices' : 'Something went wrong'}
      </Text>
      <Text className="mb-5 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }} accessibilityLiveRegion="polite">
        {connectionLost ? 'Your answers are safe. You can retry or edit your request.' : error.message}
      </Text>
      {requestId ? (
        <Text className="mb-4 text-xs text-slate-500" style={{ fontFamily: 'JetBrainsMono_500Medium' }} selectable>
          Reference: {requestId.slice(0, 8)}
        </Text>
      ) : null}
      <Pressable
        onPress={onRetry}
        className="mb-3 min-h-[48px] items-center justify-center rounded-2xl"
        style={{ backgroundColor: pc.green }}
        accessibilityRole="button"
      >
        <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Retry
        </Text>
      </Pressable>
      <Pressable onPress={onEdit} className="min-h-[44px] items-center justify-center" accessibilityRole="button">
        <Text className="text-sm text-slate-400" style={{ fontFamily: 'Poppins_500Medium' }}>
          Edit answers
        </Text>
      </Pressable>
    </View>
  );
}
