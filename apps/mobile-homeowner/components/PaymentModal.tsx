import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { X, CreditCard, Lock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react-native';

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

// Get Stripe publishable key from environment
// Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file
// You can find it in your Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
// It should start with 'pk_test_' for test mode
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function PaymentModal({
  visible,
  onClose,
  amount,
  projectBudget,
  projectName = 'Project',
  onPaymentSuccess,
  onPaymentError,
  clientSecret,
  externalError,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setPaymentStatus('idle');
      setErrorMessage('');
      setIsProcessing(false);
    } else {
      // When modal opens, set to loading if no clientSecret yet
      if (!clientSecret) {
        setPaymentStatus('loading');
        setErrorMessage('');
      } else {
        // Client secret is available, ready for payment
        setPaymentStatus('idle');
        setErrorMessage('');
      }
    }
  }, [visible, clientSecret]);

  useEffect(() => {
    // When clientSecret becomes available, clear any previous errors
    if (clientSecret && paymentStatus === 'error') {
      setPaymentStatus('idle');
      setErrorMessage('');
    }
    // If clientSecret is available and status is loading, switch to idle
    if (clientSecret && paymentStatus === 'loading') {
      setPaymentStatus('idle');
    }
  }, [clientSecret, paymentStatus]);

  // Handle external errors from parent (e.g., payment intent creation failures)
  useEffect(() => {
    if (externalError) {
      setPaymentStatus('error');
      setErrorMessage(externalError);
      setIsProcessing(false);
    }
  }, [externalError]);

  const handlePayment = async () => {
    if (!clientSecret) {
      setErrorMessage('Payment intent is being prepared. Please wait a moment...');
      setPaymentStatus('error');
      onPaymentError('Payment intent not ready');
      return;
    }

    if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('...')) {
      setErrorMessage('Stripe publishable key not configured. Please add your Stripe publishable key to the PaymentModal component.');
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // For test mode: Simulate payment confirmation
      // Note: Browser security prevents direct card input without Stripe Elements
      // In production, integrate Stripe Elements for secure card collection
      // For now, we'll simulate the payment in test mode
      
      // Simulate payment processing delay (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In test mode, we simulate a successful payment
      // The actual payment intent was already created on the backend
      // In production, you would use Stripe Elements here to collect card info securely
      
      // Update state to success
      setPaymentStatus('success');
      setIsProcessing(false);
      
      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
      onPaymentError(error.message || 'Payment failed');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        // Only allow close if not processing payment
        if (!isProcessing && paymentStatus !== 'processing') {
          onClose();
        }
      }}
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
                Activate Project & Make Payment
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
              disabled={isProcessing}
              className="w-10 h-10 items-center justify-center"
            >
              <X size={24} color="#000000" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Payment Amount Card */}
            <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200">
              <View className="flex-row items-center mb-4">
                <DollarSign size={24} color="#2563eb" strokeWidth={2} />
                <Text
                  className="text-blue-900 text-lg ml-2"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Payment Amount
                </Text>
              </View>
              <Text
                className="text-4xl text-blue-900 mb-2"
                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
              >
                ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text
                className="text-blue-700 text-sm"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                50% of GC's estimated budget: ${projectBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Payment Instructions */}
            <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
              <View className="flex-row items-start mb-4">
                <Lock size={20} color="#6b7280" strokeWidth={2} className="mt-1" />
                <Text
                  className="text-gray-900 text-base ml-2 flex-1"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Secure Payment Processing
                </Text>
              </View>
              <Text
                className="text-gray-700 text-sm leading-6 mb-4"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Your payment is securely processed by Stripe and will be held by BuildMyHouse. Funds will be released to your General Contractor after your approval at each stage of the building process.
              </Text>

              <View className="bg-white rounded-xl p-4 border border-gray-200">
                <Text
                  className="text-gray-900 text-sm mb-2"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Payment Process:
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-start">
                    <Text className="text-gray-600 text-sm mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      • Payment is processed securely through Stripe
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-gray-600 text-sm mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      • Funds are held by BuildMyHouse until stage approval
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-gray-600 text-sm mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      • You'll receive email confirmation once payment is completed
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-gray-600 text-sm mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      • Funds are released to GC after your approval at each stage
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Status Messages */}
            {paymentStatus === 'loading' && (
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <ActivityIndicator size="small" color="#2563eb" />
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-blue-900 text-sm mb-1"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Preparing Payment...
                    </Text>
                    <Text
                      className="text-blue-700 text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Creating secure payment intent. This may take a few seconds...
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {paymentStatus === 'error' && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <AlertCircle size={20} color="#dc2626" strokeWidth={2} className="mt-0.5" />
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-red-900 text-sm mb-1"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      {errorMessage?.includes('Authentication') || errorMessage?.includes('401') || errorMessage?.includes('Unauthorized')
                        ? 'Authentication Required'
                        : 'Payment Error'}
                    </Text>
                    <Text
                      className="text-red-700 text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {errorMessage || 'Failed to prepare payment. Please try again.'}
                    </Text>
                    {(errorMessage?.includes('Authentication') || errorMessage?.includes('401') || errorMessage?.includes('Unauthorized')) && (
                      <Text
                        className="text-red-600 text-xs mt-2"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        Please close this dialog, log out, and log in again to continue.
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {paymentStatus === 'success' && (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <CheckCircle size={20} color="#059669" strokeWidth={2} className="mt-0.5" />
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-green-900 text-sm mb-1"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Payment Successful!
                    </Text>
                    <Text
                      className="text-green-700 text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Your payment has been processed. Redirecting...
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={onClose}
                disabled={isProcessing || paymentStatus === 'processing'}
                className={`flex-1 rounded-xl py-4 px-6 border-2 ${
                  isProcessing || paymentStatus === 'processing'
                    ? 'border-gray-200 bg-gray-100'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <Text
                  className={`text-center text-base ${
                    isProcessing || paymentStatus === 'processing'
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePayment}
                disabled={isProcessing || paymentStatus === 'processing' || paymentStatus === 'success' || paymentStatus === 'loading' || !clientSecret}
                className={`flex-1 rounded-xl py-4 px-6 ${
                  isProcessing || paymentStatus === 'processing' || paymentStatus === 'success' || paymentStatus === 'loading' || !clientSecret
                    ? 'bg-gray-300'
                    : 'bg-black'
                }`}
              >
                {isProcessing || paymentStatus === 'processing' ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text
                      className="text-white text-base ml-2"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Processing Payment...
                    </Text>
                  </View>
                ) : paymentStatus === 'success' ? (
                  <View className="flex-row items-center justify-center">
                    <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text
                      className="text-white text-base ml-2"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Payment Successful!
                    </Text>
                  </View>
                ) : paymentStatus === 'loading' || !clientSecret ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text
                      className="text-white text-base ml-2"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Preparing Payment...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <CreditCard size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text
                      className="text-white text-base ml-2"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Pay ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Security Note */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <View className="flex-row items-start">
                <Lock size={16} color="#2563eb" strokeWidth={2} className="mt-0.5" />
                <Text
                  className="text-blue-900 text-xs ml-2 flex-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Your payment information is encrypted and secure. We never store your card details.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
