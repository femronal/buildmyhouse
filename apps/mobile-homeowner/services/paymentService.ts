import { api } from '@/lib/api';

export interface CreatePaymentIntentData {
  amount: number;
  projectId: string;
  currency?: string;
  description?: string;
}

export interface PaymentIntentResponse {
  paymentIntent: {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: string;
  };
  payment: {
    id: string;
    amount: number;
    status: string;
  };
}

export const paymentService = {
  /**
   * Create a payment intent for project activation
   */
  createPaymentIntent: async (data: CreatePaymentIntentData): Promise<PaymentIntentResponse> => {
    try {
      const response = await api.post('/payments/intent', {
        amount: data.amount,
        projectId: data.projectId,
        currency: data.currency || 'usd',
        description: data.description || `Project activation payment for ${data.projectId}`,
      });
      return response;
    } catch (error: any) {
      // Enhance error message for 401
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        throw new Error('Authentication required. Please log out and log in again to continue with payment.');
      }
      throw error;
    }
  },
};


