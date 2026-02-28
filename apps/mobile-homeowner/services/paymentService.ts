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

export interface SetupIntentResponse {
  customerId: string;
  ephemeralKey: string;
  setupIntent: {
    id: string;
    clientSecret: string;
  };
}

export interface PaymentMethodSummary {
  id: string; // DB id
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string | null;
  stripePaymentMethodId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SetupCheckoutSessionResponse {
  id: string;
  url: string | null;
}

export interface UserPayment {
  id: string;
  projectId: string;
  stageId: string | null;
  amount: number;
  status: string;
  method: string;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { name: string };
  stage?: { name: string } | null;
}

export interface StructuredPaymentGroup {
  projectId: string;
  projectName: string;
  activationPayment: { id: string; amount: number; method: string; createdAt: string } | null;
  subPayments: Array<{
    type: 'material' | 'team_member';
    id: string;
    stageName: string;
    description: string;
    amount: number;
    createdAt: string;
  }>;
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
        currency: data.currency || 'ngn',
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

  /**
   * Create a SetupIntent for saving a card (off-session)
   */
  createSetupIntent: async (): Promise<SetupIntentResponse> => {
    return api.post('/payments/setup-intent', {});
  },

  /**
   * Create a Stripe-hosted setup flow (Checkout setup mode) to save a card.
   * Works across web + mobile since it's just a URL.
   */
  createSetupCheckoutSession: async (params?: {
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<SetupCheckoutSessionResponse> => {
    return api.post('/payments/setup-checkout', {
      successUrl: params?.successUrl,
      cancelUrl: params?.cancelUrl,
    });
  },

  /**
   * List saved payment methods for the current user
   */
  listPaymentMethods: async (): Promise<PaymentMethodSummary[]> => {
    const response = await api.get('/payments/methods');
    return Array.isArray(response) ? response : [];
  },

  /**
   * Set default payment method (by DB id)
   */
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<{ success: true }> => {
    return api.post('/payments/methods/default', { paymentMethodId });
  },

  /**
   * Get current user's payments across all their projects
   */
  getUserPayments: async (): Promise<UserPayment[]> => {
    const response = await api.get('/payments/my');
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get structured payments: one activation payment per project + sub-payments from materials/team
   */
  getUserPaymentsStructured: async (): Promise<StructuredPaymentGroup[]> => {
    const response = await api.get('/payments/my-structured');
    return Array.isArray(response) ? response : [];
  },
};



