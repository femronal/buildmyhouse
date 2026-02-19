import React from 'react';
import { View, Text } from 'react-native';

export type PaymentMethodKey = 'stripe' | 'wise' | 'paystack' | 'zelle';

const BRAND: Record<
  PaymentMethodKey,
  {
    short: string;
    bg: string;
    fg: string;
    label: string;
  }
> = {
  stripe: { short: 'S', bg: '#635BFF', fg: '#FFFFFF', label: 'Stripe' },
  wise: { short: 'W', bg: '#00B9A7', fg: '#062A2B', label: 'Wise' },
  paystack: { short: 'P', bg: '#0BA4DB', fg: '#062A2B', label: 'Paystack' },
  zelle: { short: 'Z', bg: '#6D1ED4', fg: '#FFFFFF', label: 'Zelle' },
};

export function PaymentMethodLogo(props: { method: PaymentMethodKey; size?: number }) {
  const size = props.size ?? 40;
  const brand = BRAND[props.method];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${brand.label} logo`}
      className="rounded-2xl items-center justify-center border border-gray-200"
      style={{ width: size, height: size, backgroundColor: brand.bg }}
    >
      <Text style={{ fontFamily: 'Poppins_800ExtraBold', color: brand.fg, fontSize: Math.max(14, Math.floor(size * 0.45)) }}>
        {brand.short}
      </Text>
    </View>
  );
}

