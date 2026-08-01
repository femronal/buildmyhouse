/**
 * Paystack return route for Price Checker guest checkout.
 *
 * Reads only the Paystack `reference` (and optional `trxref`), verifies via
 * BuildMyHouse backend, restores the checkout snapshot, then redirects to the
 * stable Price Checker URL with payment status query params.
 *
 * Never treats the callback visit itself as proof of payment.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { priceCheckerApi } from '@/lib/price-checker/api';
import { priceCheckerAnalytics } from '@/lib/price-checker/analytics';
import { loadCheckoutSnapshot } from '@/lib/price-checker/session';
import { isPaymentSuccessStatus } from '@/lib/price-checker/state';
import { pc } from '@/components/tools/price-checker/theme';

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function PriceCheckerPaymentCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reference?: string | string[]; trxref?: string | string[] }>();
  const [message, setMessage] = useState('Confirming your payment…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reference = firstParam(params.reference) || firstParam(params.trxref);
      const snap = await loadCheckoutSnapshot();
      const orderFromSnap = snap?.paymentOrderId ?? null;

      if (!reference) {
        setMessage('No payment reference was returned. Returning to Price Checker…');
        priceCheckerAnalytics.paymentAbandoned();
        router.replace(
          (orderFromSnap
            ? `/tools/price-checker?payment=abandoned&order=${encodeURIComponent(orderFromSnap)}`
            : '/tools/price-checker?payment=abandoned') as any,
        );
        return;
      }

      try {
        const status = await priceCheckerApi.verifyPayment({ reference });
        if (cancelled) return;
        const orderId = status.paymentOrderId ?? orderFromSnap ?? '';

        if (isPaymentSuccessStatus(status.status)) {
          priceCheckerAnalytics.paymentSucceeded(
            status.chargeableItemCount,
            status.freeItemCountApplied,
            status.amountPaidKobo ?? 0,
          );
          router.replace(
            (`/tools/price-checker?payment=confirmed&order=${encodeURIComponent(orderId)}&reference=${encodeURIComponent(reference)}`) as any,
          );
          return;
        }

        if (status.status === 'pending' || status.status === 'initialized') {
          priceCheckerAnalytics.paymentPending();
          router.replace(
            (`/tools/price-checker?payment=processing&order=${encodeURIComponent(orderId)}&reference=${encodeURIComponent(reference)}`) as any,
          );
          return;
        }

        if (status.status === 'amount_mismatch') {
          priceCheckerAnalytics.paymentAmountMismatch();
          router.replace(
            (`/tools/price-checker?payment=failed&order=${encodeURIComponent(orderId)}`) as any,
          );
          return;
        }

        if (status.status === 'abandoned') {
          priceCheckerAnalytics.paymentAbandoned();
          router.replace(
            (`/tools/price-checker?payment=abandoned&order=${encodeURIComponent(orderId)}`) as any,
          );
          return;
        }

        priceCheckerAnalytics.paymentFailed();
        router.replace(
          (`/tools/price-checker?payment=failed&order=${encodeURIComponent(orderId)}`) as any,
        );
      } catch {
        if (cancelled) return;
        setMessage('We’re still confirming your payment. Returning to Price Checker…');
        priceCheckerAnalytics.paymentPending();
        const orderQ = orderFromSnap ? `&order=${encodeURIComponent(orderFromSnap)}` : '';
        router.replace(
          (`/tools/price-checker?payment=processing${orderQ}&reference=${encodeURIComponent(reference)}`) as any,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.reference, params.trxref, router]);

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: pc.pageBg }}>
      <View
        className="w-full max-w-md items-center rounded-[2rem] border p-8"
        style={{ backgroundColor: pc.charcoalSoft, borderColor: pc.panelBorder }}
      >
        <ActivityIndicator color={pc.green} size="large" />
        <Text className="mt-4 text-center text-lg text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
          {message}
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
          Do not close this window.
        </Text>
      </View>
    </View>
  );
}
