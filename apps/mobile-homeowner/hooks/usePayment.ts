import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  paymentService,
  CreatePaymentIntentData,
  PaymentMethodSummary,
} from '@/services/paymentService';

/**
 * Create payment intent for project activation
 */
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (data: CreatePaymentIntentData) => paymentService.createPaymentIntent(data),
  });
}

/**
 * List saved payment methods for the current user
 */
export function usePaymentMethods() {
  return useQuery<PaymentMethodSummary[]>({
    queryKey: ['payments', 'methods'],
    queryFn: () => paymentService.listPaymentMethods(),
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Create SetupIntent data for Stripe PaymentSheet
 */
export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: () => paymentService.createSetupIntent(),
  });
}

/**
 * Create a Stripe-hosted setup flow (Checkout setup mode) to save a card.
 */
export function useCreateSetupCheckoutSession() {
  return useMutation({
    mutationFn: (params?: { successUrl?: string; cancelUrl?: string }) =>
      paymentService.createSetupCheckoutSession(params),
  });
}

/**
 * Set default payment method (by DB id)
 */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) => paymentService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'methods'] });
    },
  });
}

/**
 * Get current user's payments across all their projects
 */
export function useUserPayments() {
  return useQuery({
    queryKey: ['payments', 'my'],
    queryFn: () => paymentService.getUserPayments(),
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Get structured payments: one activation per project + sub-payments (materials, team members)
 */
export function useUserPaymentsStructured() {
  return useQuery({
    queryKey: ['payments', 'my-structured'],
    queryFn: () => paymentService.getUserPaymentsStructured(),
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}


