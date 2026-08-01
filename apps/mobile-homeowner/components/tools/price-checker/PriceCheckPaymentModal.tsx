/**
 * Stage 7 — guest payment modal.
 * Aura-inspired charcoal card, BuildMyHouse branding (emerald accents, no purple,
 * no subscription / Starter / $0 language). All amounts come from the server quote.
 */
import { useEffect, useId, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, Sparkle, X } from 'phosphor-react-native';
import { formatNairaFromKobo, isValidGuestEmail } from '@/lib/price-checker/api';
import { PriceCheckPaymentQuote } from '@/lib/price-checker/types';
import { pc, prefersReducedMotion } from './theme';

export type PaymentModalUiState =
  | 'quote_loading'
  | 'quote_ready'
  | 'email_invalid'
  | 'initializing'
  | 'abandoned'
  | 'failed'
  | 'pending';

type Props = {
  visible: boolean;
  quote: PriceCheckPaymentQuote | null;
  quoteLoading: boolean;
  initializing: boolean;
  uiState: PaymentModalUiState;
  initialEmail?: string | null;
  errorMessage?: string | null;
  onClose: () => void;
  onPay: (email: string) => void;
  onReviewMaterials: () => void;
  onRetryQuote?: () => void;
  onRetryPayment?: () => void;
};

const BENEFITS = [
  'Observed price range for every item',
  'Typical price and confidence score',
  'Traceable sources with check dates',
  'Location and specification matching',
  'Delivery and installation cautions',
  'Online report and downloadable PDF',
];

export function PriceCheckPaymentModal({
  visible,
  quote,
  quoteLoading,
  initializing,
  uiState,
  initialEmail,
  errorMessage,
  onClose,
  onPay,
  onReviewMaterials,
  onRetryQuote,
  onRetryPayment,
}: Props) {
  const titleId = useId();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [localInvalid, setLocalInvalid] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const reduceMotion = prefersReducedMotion();

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail ?? '');
      setLocalInvalid(false);
      setMaterialsOpen(false);
    }
  }, [visible, initialEmail]);

  // Basic focus for web accessibility
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const t = setTimeout(() => emailRef.current?.focus(), reduceMotion ? 0 : 180);
    return () => clearTimeout(t);
  }, [visible, reduceMotion, quote?.id]);

  const showReady =
    Boolean(quote) &&
    !quoteLoading &&
    uiState !== 'pending' &&
    uiState !== 'abandoned' &&
    uiState !== 'failed';
  const invalid = localInvalid || uiState === 'email_invalid';

  const handleContinue = () => {
    if (!isValidGuestEmail(email)) {
      setLocalInvalid(true);
      return;
    }
    setLocalInvalid(false);
    onPay(email.trim());
  };

  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose}>
      <View
        className="flex-1 items-center justify-center px-4 py-6"
        style={{ backgroundColor: 'rgba(17,19,24,0.62)' }}
        accessibilityViewIsModal
        {...({
          'aria-modal': true,
          role: 'dialog',
          'aria-labelledby': titleId,
        } as Record<string, unknown>)}
      >
        <Pressable
          accessibilityLabel="Dismiss payment dialog"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />

        <View
          className="w-full max-w-[440px] overflow-hidden rounded-[1.75rem] border"
          style={{
            backgroundColor: pc.charcoalSoft,
            borderColor: 'rgba(5,150,105,0.35)',
            maxHeight: '92%',
            shadowColor: pc.green,
            shadowOpacity: reduceMotion ? 0 : 0.22,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 12 },
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="mb-1 text-[11px] uppercase tracking-[0.2em]"
                  style={{ fontFamily: 'Poppins_600SemiBold', color: '#6ee7b7' }}
                >
                  Your price check
                </Text>
                <Text
                  nativeID={titleId}
                  className="text-2xl text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Unlock your price reports
                </Text>
                <Text className="mt-2 text-sm leading-relaxed text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                  See current market evidence before you buy materials or approve a contractor’s quotation.
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <X size={18} color="#e2e8f0" weight="bold" />
              </Pressable>
            </View>

            {quoteLoading || uiState === 'quote_loading' ? (
              <View className="items-center py-10">
                <ActivityIndicator color={pc.green} />
                <Text className="mt-3 text-sm text-slate-400">Preparing your payment quote…</Text>
              </View>
            ) : null}

            {uiState === 'pending' ? (
              <View className="items-center py-8">
                <ActivityIndicator color={pc.green} />
                <Text className="mt-3 text-center text-base text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                  We’re confirming your payment
                </Text>
                <Text className="mt-2 text-center text-sm text-slate-400">This normally takes a moment.</Text>
              </View>
            ) : null}

            {uiState === 'abandoned' ? (
              <View className="mb-4 rounded-2xl border border-white/10 p-4" style={{ backgroundColor: pc.charcoalDeep }}>
                <Text className="text-lg text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Payment was not completed
                </Text>
                <Text className="mt-2 text-sm text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Your materials and answers are still saved.
                </Text>
                <Pressable
                  onPress={onRetryPayment}
                  className="mt-4 min-h-[48px] items-center justify-center rounded-2xl"
                  style={{ backgroundColor: pc.green }}
                  accessibilityRole="button"
                >
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Try payment again
                  </Text>
                </Pressable>
                <Pressable onPress={onReviewMaterials} className="mt-2 min-h-[44px] items-center justify-center">
                  <Text className="text-slate-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Return to my request
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {uiState === 'failed' ? (
              <View className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: pc.redSoft, borderColor: 'rgba(185,28,28,0.25)' }}>
                <Text className="text-base" style={{ fontFamily: 'Poppins_600SemiBold', color: pc.red }}>
                  Payment could not be completed
                </Text>
                <Text className="mt-2 text-sm text-neutral-700" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {errorMessage ?? 'Your materials and answers are still saved. You can try again.'}
                </Text>
                <Pressable
                  onPress={onRetryPayment ?? onRetryQuote}
                  className="mt-4 min-h-[48px] items-center justify-center rounded-2xl"
                  style={{ backgroundColor: pc.green }}
                  accessibilityRole="button"
                >
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Try payment again
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {showReady && quote ? (
              <>
                {/* Charcoal pricing card */}
                <View
                  className="mb-5 overflow-hidden rounded-3xl border p-5"
                  style={{
                    backgroundColor: pc.charcoalDeep,
                    borderColor: pc.greenBorder,
                  }}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      right: -40,
                      bottom: -50,
                      width: 180,
                      height: 180,
                      borderRadius: 999,
                      backgroundColor: reduceMotion ? 'transparent' : 'rgba(5,150,105,0.18)',
                    }}
                  />

                  <View className="mb-4 flex-row items-center gap-3">
                    <View
                      className="h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: pc.green }}
                    >
                      <Sparkle size={20} color="#fff" weight="fill" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] uppercase tracking-[0.16em] text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Report request
                      </Text>
                      <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {quote.requestedItemCount} building-material report
                        {quote.requestedItemCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-[11px] uppercase tracking-[0.16em] text-slate-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    One-time payment
                  </Text>
                  <Text className="mt-1 text-4xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {formatNairaFromKobo(quote.totalKobo)}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                    One-time payment. No subscription or account required.
                  </Text>

                  <View className="mt-4 rounded-2xl border border-white/10 px-3 py-3" style={{ backgroundColor: 'rgba(5,150,105,0.08)' }}>
                    <Text className="text-sm text-slate-200" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {quote.requestedItemCount} material{quote.requestedItemCount === 1 ? '' : 's'} requested
                    </Text>
                    {quote.freeItemCountApplied > 0 ? (
                      <Text className="mt-1 text-sm" style={{ fontFamily: 'Poppins_400Regular', color: '#6ee7b7' }}>
                        {quote.freeItemCountApplied} free report{quote.freeItemCountApplied === 1 ? '' : 's'} applied
                      </Text>
                    ) : null}
                    <Text className="mt-1 text-sm text-slate-300" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {quote.chargeableItemCount} paid report{quote.chargeableItemCount === 1 ? '' : 's'}
                    </Text>
                  </View>

                  {quote.chargeableItemCount > 0 ? (
                    <View className="mt-3">
                      <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {formatNairaFromKobo(quote.unitPriceKobo)} × {quote.chargeableItemCount} report
                        {quote.chargeableItemCount === 1 ? '' : 's'}
                        {quote.discountKobo > 0 ? ` · Discount ${formatNairaFromKobo(quote.discountKobo)}` : ''}
                      </Text>
                      <Text className="mt-1 text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Total: {formatNairaFromKobo(quote.totalKobo)}
                      </Text>
                    </View>
                  ) : null}

                  <View className="mt-5 gap-2.5">
                    {BENEFITS.map((b) => (
                      <View key={b} className="flex-row items-start gap-2.5">
                        <View
                          className="mt-0.5 h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: 'rgba(5,150,105,0.22)' }}
                        >
                          <Check size={12} color={pc.green} weight="bold" />
                        </View>
                        <Text className="flex-1 text-sm text-slate-200" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {b}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Pressable
                  onPress={() => setMaterialsOpen((v) => !v)}
                  className="mb-4 min-h-[44px] flex-row items-center justify-between rounded-2xl border border-white/10 px-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: materialsOpen }}
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Materials included
                  </Text>
                  <Text className="text-sm text-slate-400">{materialsOpen ? 'Hide' : 'Show'}</Text>
                </Pressable>
                {materialsOpen ? (
                  <View className="mb-4 gap-2">
                    {quote.lineItems.map((item, idx) => (
                      <View
                        key={`${item.productLabel}-${idx}`}
                        className="rounded-2xl border border-white/10 px-3 py-3"
                        style={{ backgroundColor: pc.charcoalDeep }}
                      >
                        <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {idx + 1}. {item.productLabel}
                          {item.free ? ' · Free' : ''}
                        </Text>
                        <Text className="mt-0.5 text-xs text-slate-500">{item.locationLabel}</Text>
                        {!item.free ? (
                          <Text className="mt-1 text-xs text-slate-400">{formatNairaFromKobo(item.amountKobo)}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text className="mb-1.5 text-sm text-slate-300" style={{ fontFamily: 'Poppins_500Medium' }} nativeID="guest-email-label">
                  Email for receipt and report recovery
                </Text>
                <TextInput
                  ref={emailRef}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (localInvalid) setLocalInvalid(false);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="you@email.com"
                  placeholderTextColor="#64748b"
                  accessibilityLabelledBy="guest-email-label"
                  accessibilityLabel="Email for receipt and report recovery"
                  className="min-h-[48px] rounded-2xl border px-4 text-base text-white"
                  style={{
                    fontFamily: 'Poppins_400Regular',
                    backgroundColor: pc.charcoalDeep,
                    borderColor: invalid ? pc.red : 'rgba(255,255,255,0.12)',
                  }}
                />
                <Text className="mt-2 text-xs leading-relaxed text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                  We’ll use this email for your payment receipt and to help you recover these reports. Entering your email
                  does not create an account.
                </Text>
                {invalid ? (
                  <Text className="mt-2 text-sm" style={{ color: '#fca5a5', fontFamily: 'Poppins_400Regular' }} accessibilityLiveRegion="polite">
                    Please enter a valid email address.
                  </Text>
                ) : null}

                <Pressable
                  onPress={handleContinue}
                  disabled={initializing || uiState === 'initializing'}
                  className="mt-5 min-h-[52px] items-center justify-center rounded-2xl"
                  style={{ backgroundColor: pc.green, opacity: initializing ? 0.7 : 1 }}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to secure payment"
                >
                  {initializing || uiState === 'initializing' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-base text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Continue to secure payment
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={onReviewMaterials}
                  className="mt-2 min-h-[44px] items-center justify-center"
                  accessibilityRole="button"
                >
                  <Text className="text-slate-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Review my materials
                  </Text>
                </Pressable>

                <Text className="mt-4 text-center text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Payment is processed securely by Paystack.
                </Text>
                <Text className="mt-3 text-center text-[11px] leading-relaxed text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Each item receives either a source-backed price report or an honest insufficient-data result when reliable
                  evidence cannot be confirmed. Technical failures are eligible for a refund.
                </Text>
              </>
            ) : null}

            {!quoteLoading && !quote && uiState !== 'abandoned' && uiState !== 'failed' && uiState !== 'pending' ? (
              <View className="items-center py-6">
                <Text className="text-center text-sm text-slate-400">We could not load a payment quote.</Text>
                {onRetryQuote ? (
                  <Pressable
                    onPress={onRetryQuote}
                    className="mt-4 min-h-[48px] min-w-[160px] items-center justify-center rounded-2xl px-4"
                    style={{ backgroundColor: pc.green }}
                  >
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Try again
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
