import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Lock, ExternalLink } from 'lucide-react-native';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PaymentMethodLogo, type PaymentMethodKey } from '@/components/PaymentMethodLogo';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  projectBudget: number;
  projectName?: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  clientSecret?: string;
  externalError?: string; // Error message from parent component
}

export default function PaymentModal({
  visible,
  onClose,
  amount,
  projectBudget,
  projectName = 'Project',
  // These callbacks/fields are kept for compatibility with the existing call sites.
  onPaymentSuccess: _onPaymentSuccess,
  onPaymentError: _onPaymentError,
  clientSecret: _clientSecret,
  externalError: _externalError,
}: PaymentModalProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const firstName = (currentUser?.fullName || currentUser?.email || 'there').split(' ')[0];
  const minDeposit = Math.max(amount * 0.5, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
          {/* Drag Handle */}
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />

          {/* Header */}
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text
                className="text-3xl text-black mb-2"
                style={{ fontFamily: 'Poppins_800ExtraBold' }}
              >
                Project deposit
              </Text>
              <Text
                className="text-gray-600 text-sm"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {projectName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center"
            >
              <X size={24} color="#000000" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount card */}
            <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
              <View className="flex-row items-center mb-4">
                <Text className="text-gray-900 text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>₦</Text>
                <Text
                  className="text-gray-900 text-lg ml-2"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Deposit required to start
                </Text>
              </View>
              <Text
                className="text-4xl text-black mb-2"
                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
              >
                ₦{minDeposit.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}+
              </Text>
              <Text
                className="text-gray-700 text-sm"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Minimum deposit is 50% of the project budget. 100% is recommended for faster execution.
              </Text>

              <View className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Recommended amounts
                </Text>
                <Text className="text-gray-600 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  50% minimum: ₦{minDeposit.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text className="text-gray-600 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  100% recommended: ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* How it works */}
            <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
              <View className="flex-row items-start mb-4">
                <Lock size={20} color="#111827" strokeWidth={2} className="mt-1" />
                <Text
                  className="text-gray-900 text-base ml-2 flex-1"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  How payment works
                </Text>
              </View>
              {[
                'Admin contacts the GC by email to confirm readiness and project details.',
                `After the GC confirms, admin emails you (${firstName}) with payment instructions.`,
                'You deposit at least 50% (100% recommended) to BuildMyHouse to start.',
                'BuildMyHouse holds the funds and releases them only after you approve each stage.',
              ].map((step) => (
                <View key={step} className="flex-row items-start mb-2">
                  <View className="w-2 h-2 bg-black rounded-full mt-2 mr-2" />
                  <Text className="text-gray-700 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>

            {/* Payment options */}
            <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
              <Text className="text-gray-900 text-base mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                Ways to deposit to BuildMyHouse
              </Text>

              {[
                {
                  key: 'stripe' as PaymentMethodKey,
                  title: 'Stripe Card Invoice',
                  desc: 'Best for smaller projects like renovations and interior designing. Pay by card using an invoice link.',
                },
                {
                  key: 'wise' as PaymentMethodKey,
                  title: 'Wise Transfer',
                  desc: 'Best for bigger projects like building a new home or buying a home/plot. Great for large international transfers (diaspora).',
                },
                {
                  key: 'paystack' as PaymentMethodKey,
                  title: 'Paystack',
                  desc: 'Ideal for Nigerians and Ghanaians. Works like Stripe and supports multiple local payment methods.',
                },
                {
                  key: 'zelle' as PaymentMethodKey,
                  title: 'Zelle Transfer',
                  desc: 'Fast and easy for USA-based customers who prefer bank-to-bank transfers.',
                },
              ].map((m) => (
                <View key={m.title} className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
                  <View className="flex-row items-start">
                    <PaymentMethodLogo method={m.key} size={40} />
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {m.title}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {m.desc}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              <Text className="text-gray-600 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                Payment instructions are sent by email after the GC confirms readiness.
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="mb-3">
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push('/billing-payments' as any);
                }}
                className="w-full rounded-xl py-4 px-6 bg-black"
              >
                <View className="flex-row items-center justify-center">
                  <ExternalLink size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    View payment options
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              className="w-full rounded-xl py-3 px-6 border-2 border-gray-300 bg-white"
            >
              <Text
                className="text-center text-base text-gray-700"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Close
              </Text>
            </TouchableOpacity>

            {/* Security Note */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
              <View className="flex-row items-start">
                <Lock size={16} color="#2563eb" strokeWidth={2} className="mt-0.5" />
                <Text
                  className="text-blue-900 text-xs ml-2 flex-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  For safety and peace of mind, BuildMyHouse holds funds and releases them only after your stage-by-stage approval.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
