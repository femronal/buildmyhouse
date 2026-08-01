/**
 * Stage 7 — post-payment confirmation before research starts.
 * Item count is locked; users may review/edit specs but not expand the batch.
 */
import { Pressable, Text, View } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';
import { formatNairaFromKobo } from '@/lib/price-checker/api';
import { PaymentStatusDto, PriceCheckPaymentQuote } from '@/lib/price-checker/types';
import { UnderstandingRow } from '@/lib/price-checker/state';
import { pc } from './theme';

type Props = {
  quote: PriceCheckPaymentQuote | null;
  paymentStatus: PaymentStatusDto | null;
  understanding: UnderstandingRow[];
  welcomeBack?: boolean;
  onStartResearch: () => void;
  onReviewDetails: () => void;
  starting?: boolean;
};

export function PaidBatchConfirmation({
  quote,
  paymentStatus,
  understanding,
  welcomeBack,
  onStartResearch,
  onReviewDetails,
  starting,
}: Props) {
  const chargeable = paymentStatus?.chargeableItemCount ?? quote?.chargeableItemCount ?? 0;
  const freeApplied = paymentStatus?.freeItemCountApplied ?? quote?.freeItemCountApplied ?? 0;
  const amountKobo = paymentStatus?.amountPaidKobo ?? quote?.totalKobo ?? null;
  const reference = paymentStatus?.reference ?? null;
  const materialRows = understanding.filter((r) => r.state === 'provided' || r.state === 'unknown');

  return (
    <View accessibilityLiveRegion="polite">
      <View className="mb-3 flex-row items-center gap-2">
        <CheckCircle size={28} color={pc.green} weight="fill" />
        <Text className="text-2xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {welcomeBack ? 'Welcome back. Your payment is confirmed.' : 'Payment confirmed'}
        </Text>
      </View>
      <Text className="mb-5 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
        {welcomeBack
          ? 'You can continue the price check without signing in.'
          : 'Your request is ready. Check the materials below before research begins.'}
      </Text>

      <View
        className="mb-5 rounded-2xl border p-4"
        style={{ backgroundColor: pc.charcoalDeep, borderColor: pc.greenBorder }}
      >
        <Text className="text-[11px] uppercase tracking-[0.16em] text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Paid request
        </Text>
        <Text className="mt-2 text-base text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
          {chargeable} paid report{chargeable === 1 ? '' : 's'}
          {freeApplied > 0 ? ` · ${freeApplied} free included` : ''}
        </Text>
        {amountKobo != null ? (
          <Text className="mt-1 text-sm text-slate-300" style={{ fontFamily: 'Poppins_400Regular' }}>
            Amount paid: {formatNairaFromKobo(amountKobo)}
          </Text>
        ) : null}
        {reference ? (
          <Text className="mt-1 text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
            Payment reference: {reference}
          </Text>
        ) : null}
        <Text className="mt-3 text-xs leading-relaxed text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
          The number of reports in this paid request is locked. You can edit specifications or location below, but you
          cannot add or remove materials without a new payment.
        </Text>
      </View>

      <View className="mb-5 gap-2">
        {materialRows.map((row) => (
          <View key={row.key} className="flex-row justify-between gap-3 border-b border-white/5 pb-2">
            <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
              {row.label}
            </Text>
            <Text className="flex-1 text-right text-sm text-slate-200" style={{ fontFamily: 'Poppins_400Regular' }}>
              {row.value ?? '—'}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onStartResearch}
        disabled={starting}
        className="min-h-[52px] items-center justify-center rounded-2xl"
        style={{ backgroundColor: pc.green, opacity: starting ? 0.7 : 1 }}
        accessibilityRole="button"
        accessibilityLabel="Start price research"
      >
        <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {starting ? 'Starting…' : 'Start price research'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onReviewDetails}
        className="mt-2 min-h-[44px] items-center justify-center"
        accessibilityRole="button"
      >
        <Text className="text-slate-300" style={{ fontFamily: 'Poppins_500Medium' }}>
          Review details
        </Text>
      </Pressable>
    </View>
  );
}
