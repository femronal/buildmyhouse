/**
 * Legacy / edge-case dialog. Stage 7 primary free-limit response is
 * `PriceCheckPaymentModal` (guest pay for this request). This dialog is only
 * shown if the state machine still lands on `usage_limit_reached`.
 */
import { Modal, Pressable, Text, View } from 'react-native';
import { UsageStatusDto } from '@/lib/price-checker/types';
import { pc } from './theme';

type Props = {
  visible: boolean;
  usage: UsageStatusDto | null;
  onClose: () => void;
  onContinueToPayment: () => void;
};

export function UsageLimitDialog({ visible, usage, onClose, onContinueToPayment }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md rounded-3xl bg-white p-6">
          <Text className="mb-2 text-xl text-neutral-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Free allowance used for this period
          </Text>
          <Text className="mb-4 text-sm leading-relaxed text-neutral-600" style={{ fontFamily: 'Poppins_400Regular' }}>
            {usage
              ? `You have used ${usage.used} of ${usage.limit} free price reports in the last 24 hours.`
              : 'You have reached the free price-report allowance for this period.'}{' '}
            You can pay for the reports in this request only — no account required.
          </Text>
          {usage?.resetsAt ? (
            <Text className="mb-4 text-xs text-neutral-500">
              Free allowance resets around {new Date(usage.resetsAt).toLocaleString('en-NG')}
            </Text>
          ) : null}
          <Pressable
            onPress={onContinueToPayment}
            className="mb-3 min-h-[48px] items-center justify-center rounded-2xl"
            style={{ backgroundColor: pc.green }}
            accessibilityRole="button"
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Continue to payment
            </Text>
          </Pressable>
          <Pressable onPress={onClose} className="min-h-[44px] items-center justify-center" accessibilityRole="button">
            <Text className="text-neutral-600" style={{ fontFamily: 'Poppins_500Medium' }}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
