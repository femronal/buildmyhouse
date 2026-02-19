import React from 'react';

export const STRIPE_SUPPORTED = false;

export type StripeProviderProps = {
  publishableKey?: string;
  urlScheme?: string;
  merchantIdentifier?: string;
  children: React.ReactNode;
};

export function StripeProvider(props: StripeProviderProps) {
  return <>{props.children}</>;
}

export function useStripe(): never {
  throw new Error('Stripe is not supported on web.');
}

