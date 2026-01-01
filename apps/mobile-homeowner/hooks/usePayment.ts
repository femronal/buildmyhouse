import { useMutation } from '@tanstack/react-query';
import { paymentService, CreatePaymentIntentData } from '@/services/paymentService';

/**
 * Create payment intent for project activation
 */
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (data: CreatePaymentIntentData) => paymentService.createPaymentIntent(data),
  });
}


