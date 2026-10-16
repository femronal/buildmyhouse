import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Copy, X } from 'lucide-react-native';
import { PaymentMethodLogo, type PaymentMethodKey } from '@/components/PaymentMethodLogo';
import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  projectBudget: number;
  baseQuoteAmount?: number;
  monitoringFeeAmount?: number;
  coordinationFeeAmount?: number;
  contingencyFeeAmount?: number;
  totalQuoteAmount?: number;
  projectId?: string;
  projectName?: string;
  externalPaymentLink?: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  clientSecret?: string;
  externalError?: string;
}

const PAYMENT_STEPS = [
  'Check your quote. Your total is the price you agreed with your contractor, plus BuildMyHouse\'s contingency.',
  'Pay BuildMyHouse\'s verified account only. Never pay into your contractor\'s account.',
  'Send your receipt and your signed quote to us on WhatsApp at +234 813 903 6559.',
  'We confirm your payment and tell your contractor to start.',
  'At each stage, your contractor uploads photos of the work. You review them in the app.',
  'You approve, and we pay that stage. If something isn\'t right, raise it in the app and the payment waits until it\'s fixed.',
];

const METHODS: Array<{ key: PaymentMethodKey; title: string; description: string }> = [
  { key: 'stripe', title: 'Stripe card invoice', description: 'Pay by card using an invoice link.' },
  { key: 'wise', title: 'Wise', description: 'International bank transfer.' },
  { key: 'paystack', title: 'Paystack', description: 'Local cards and bank transfer in Nigeria and Ghana.' },
  { key: 'zelle', title: 'Zelle', description: 'Bank transfer for customers in the USA.' },
  { key: 'bank', title: 'Bank transfer (Moniepoint)', description: 'Pay into the BuildMyHouse Moniepoint account.' },
];

const BANK_ROWS = [
  { label: 'Bank', value: 'Moniepoint MFB' },
  { label: 'Account number', value: '8139036559' },
  { label: 'Account name', value: 'Amala Class Concepts (or Godswill Oluwafemi Okunola)' },
];

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function copyText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  throw new Error('Clipboard is not available');
}

export default function PaymentModal({
  visible,
  onClose,
  amount,
  projectBudget,
  contingencyFeeAmount = 0,
  totalQuoteAmount = 0,
  projectName = 'Project',
  externalPaymentLink,
  onPaymentSuccess: _onPaymentSuccess,
  onPaymentError: _onPaymentError,
  clientSecret: _clientSecret,
  externalError: _externalError,
}: PaymentModalProps) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethodKey | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const agreedTotal = Math.max(Number(totalQuoteAmount || 0), Number(projectBudget || 0), Number(amount || 0), 0);
  const visibleSteps = stepsOpen ? PAYMENT_STEPS : PAYMENT_STEPS.slice(0, 2);
  const selected = METHODS.find((item) => item.key === method);

  const onCopy = async (label: string, value: string) => {
    try {
      await copyText(value);
      setCopied(label);
    } catch {
      setCopied(null);
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Project: ${projectName}`);
    const url = `https://wa.me/2348139036559?text=${text}`;
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-5 pt-4 pb-6 max-h-[92%] w-full self-center" style={{ maxWidth: 560 }}>
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-3">
              <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
                Fund your project
              </Text>
              <Text className="text-gray-600 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {projectName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={18} color="#000000" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-4xl text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {money(agreedTotal)}
            </Text>
            <Text className="text-gray-700 text-sm mt-2 mb-4" style={{ fontFamily: 'Poppins_400Regular', lineHeight: 20 }}>
              Fund 100% of the agreed total. Nothing goes to the contractor until you approve a stage.
            </Text>

            <View className="border border-gray-200 rounded-2xl px-4 py-3 mb-4">
              <View className="flex-row justify-between items-start">
                <Text className="text-black text-sm flex-1 pr-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Contingency
                </Text>
                <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                  {money(contingencyFeeAmount)}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular', lineHeight: 20 }}>
                Covers emergencies and changes you agree to. Whatever isn't used becomes BuildMyHouse's project management fee.
              </Text>
            </View>

            <View className="border border-gray-200 rounded-2xl p-4 mb-4">
              <Text className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                How payment works
              </Text>
              {visibleSteps.map((step, index) => (
                <View key={step} className="flex-row items-start mb-2">
                  <Text className="text-black text-sm w-5" style={{ fontFamily: 'Poppins_600SemiBold', lineHeight: 20 }}>
                    {index + 1}.
                  </Text>
                  <Text className="text-gray-800 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular', lineHeight: 20 }}>
                    {step}
                  </Text>
                </View>
              ))}
              <TouchableOpacity onPress={() => setStepsOpen((open) => !open)} className="mt-1 py-1">
                <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: '#16a34a' }}>
                  {stepsOpen ? 'Show fewer steps' : 'Show all steps'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Payment method
            </Text>
            <View className="border border-gray-200 rounded-2xl overflow-hidden mb-4">
              {METHODS.map((item, index) => {
                const active = method === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setMethod(item.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    className="flex-row items-center px-4 py-3"
                    style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#e5e7eb' }}
                  >
                    <PaymentMethodLogo method={item.key} size={36} />
                    <View className="flex-1 mx-3">
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {item.title}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {item.description}
                      </Text>
                    </View>
                    <View
                      className="rounded-full items-center justify-center"
                      style={{ width: 22, height: 22, borderWidth: 1.5, borderColor: active ? '#22c55e' : '#d1d5db' }}
                    >
                      {active ? <View className="rounded-full" style={{ width: 12, height: 12, backgroundColor: '#22c55e' }} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selected ? (
              <View className="border border-gray-200 rounded-2xl p-4 mb-4">
                <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {selected.title}
                </Text>
                {selected.key === 'bank' ? (
                  BANK_ROWS.map((row) => (
                    <View key={row.label} className="flex-row items-center py-3 border-t border-gray-100">
                      <View className="flex-1 pr-3">
                        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {row.label}
                        </Text>
                        <Text className="text-black text-sm mt-0.5" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {row.value}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => onCopy(row.label, row.value)}
                        accessibilityRole="button"
                        accessibilityLabel={`Copy ${row.label}`}
                        className="flex-row items-center"
                      >
                        <Copy size={16} color="#16a34a" strokeWidth={2.4} />
                        <Text className="text-xs ml-1" style={{ fontFamily: 'Poppins_600SemiBold', color: '#16a34a' }}>
                          {copied === row.label ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View>
                    <Text className="text-gray-700 text-sm" style={{ fontFamily: 'Poppins_400Regular', lineHeight: 20 }}>
                      {selected.description}
                    </Text>
                    {externalPaymentLink ? (
                      <TouchableOpacity onPress={() => Linking.openURL(externalPaymentLink).catch(() => undefined)} className="mt-3">
                        <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: '#16a34a' }}>
                          Open payment instructions
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            ) : null}

            <TouchableOpacity onPress={openWhatsApp} className="rounded-full py-4 items-center mb-3" style={{ backgroundColor: '#22c55e' }}>
              <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                Send receipt on WhatsApp
              </Text>
            </TouchableOpacity>
            <Text className="text-gray-500 text-xs text-center mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {BUILDMYHOUSE_CONTACT.phoneDisplay}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
