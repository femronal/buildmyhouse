import React from 'react';
import { StripeProvider as NativeStripeProvider, useStripe as nativeUseStripe } from '@stripe/stripe-react-native';

export const STRIPE_SUPPORTED = true;

export const StripeProvider = NativeStripeProvider;
export const useStripe = nativeUseStripe;

export type StripeProviderProps = React.ComponentProps<typeof NativeStripeProvider>;

