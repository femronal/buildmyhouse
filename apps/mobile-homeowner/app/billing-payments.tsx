import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, CheckCircle2, Clock, RefreshCcw, Lock, Mail, AlertCircle, DollarSign } from 'lucide-react-native';

import {
  useActiveProjects,
  usePendingProjects,
  useDeclareManualPayment,
} from '@/hooks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PaymentMethodLogo, type PaymentMethodKey } from '@/components/PaymentMethodLogo';

function formatProjectType(type?: string) {
  switch (type) {
    case 'homebuilding':
      return 'Homebuilding';
    case 'interior_design':
      return 'Interior design';
    case 'renovation':
      return 'Renovation';
    default:
      return 'Project';
  }
}

function isHomebuilding(type?: string) {
  return type === 'homebuilding';
}

export default function BillingPaymentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const firstName = (currentUser?.fullName || currentUser?.email || 'there').split(' ')[0];

  const { data: activeProjects = [], isLoading: activeLoading } = useActiveProjects();
  const { data: pendingProjects = [], isLoading: pendingLoading } = usePendingProjects();
  const declareManualPaymentMutation = useDeclareManualPayment();

  const allProjects = useMemo(() => {
    const byId = new Map<string, any>();
    for (const p of [...(activeProjects as any[]), ...(pendingProjects as any[])]) {
      const id = p?.id || p?.projectId;
      if (!id) continue;
      // Prefer active when duplicated
      const existing = byId.get(id);
      if (!existing) byId.set(id, p);
      else if (existing.status !== 'active' && p.status === 'active') byId.set(id, p);
    }
    return Array.from(byId.values());
  }, [activeProjects, pendingProjects]);

  const handleOpenExternalLink = async (url?: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Could not open link', 'Please try again.');
    }
  };

  const handleDeclarePaid = async (projectId: string) => {
    Alert.alert(
      'Confirm deposit',
      "Only tap 'I deposited' after you’ve completed the deposit using the instructions sent to your email.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I deposited',
          style: 'default',
          onPress: async () => {
            try {
              await declareManualPaymentMutation.mutateAsync(projectId);
              Alert.alert('Submitted', 'Thanks! Admin will review your deposit and notify you when tracking is unlocked.');
            } catch (e: any) {
              Alert.alert('Could not submit', e?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/profile'))} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Billing & Payments
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 36 }}>
        {/* How payments work */}
        <View className="bg-black rounded-3xl p-6 mb-6">
          <View className="flex-row items-center mb-3">
            <Lock size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              How payments work
            </Text>
          </View>

          {[
            'Admin emails the GC to confirm readiness and project details.',
            `After the GC confirms, admin emails you (${firstName}) to confirm the project is verified and ready to start.`,
            'You deposit at least 50% (100% recommended) to BuildMyHouse to start the project.',
            'BuildMyHouse holds the funds and releases them only after you approve each stage.',
          ].map((step) => (
            <View key={step} className="flex-row items-start mb-2">
              <View className="w-2 h-2 bg-white rounded-full mt-2 mr-2" />
              <Text className="text-white/80 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {step}
              </Text>
            </View>
          ))}

          <View className="mt-4 bg-white/10 rounded-2xl p-4">
            <View className="flex-row items-start">
              <Mail size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="text-white/80 text-xs ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                Payment instructions are sent to your email after the GC confirms readiness.
              </Text>
            </View>
          </View>
        </View>

        {/* Payment options */}
        <View className="bg-gray-50 rounded-3xl p-6 border border-gray-200 mb-6">
          <Text className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Ways to deposit to BuildMyHouse
          </Text>
          <Text className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Choose the option that best fits your location and transfer size.
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
            <View key={m.title} className="bg-white rounded-2xl p-4 border border-gray-200 mb-3">
              <View className="flex-row items-start">
                <PaymentMethodLogo method={m.key} size={42} />
                <View className="flex-1 ml-3">
                  <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {m.title}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {m.desc}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Project deposits */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
              Project deposits
            </Text>
            <TouchableOpacity onPress={() => queryClient.invalidateQueries({ queryKey: ['projects'] })} className="flex-row items-center">
              <RefreshCcw size={16} color="#6B7280" strokeWidth={2} />
              <Text className="text-gray-500 text-sm ml-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>

          {activeLoading || pendingLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#000000" />
            </View>
          ) : allProjects.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
              <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                No projects yet.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {allProjects.map((project: any) => {
                const projectId = project.id || project.projectId;
                const type = project.projectType;
                const title = project.name || 'Project';

                if (isHomebuilding(type)) {
                  const link = project.externalPaymentLink as string | undefined;
                  const confirmationStatus = (project.paymentConfirmationStatus as string | undefined) || 'not_declared';

                  const declaredAt = project.paymentDeclaredAt ? new Date(project.paymentDeclaredAt).toLocaleDateString() : null;
                  const confirmedAt = project.paymentConfirmedAt ? new Date(project.paymentConfirmedAt).toLocaleDateString() : null;

                  const showDeclare = confirmationStatus === 'not_declared' || confirmationStatus === 'rejected';
                  const declareDisabled = declareManualPaymentMutation.isPending;

                  return (
                    <View key={projectId} className="bg-white rounded-3xl p-5 border border-gray-200">
                      <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                        {title}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {formatProjectType(type)}
                      </Text>

                      <View className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <View className="flex-row items-center">
                          {confirmationStatus === 'confirmed' ? (
                            <CheckCircle2 size={18} color="#059669" strokeWidth={2.5} />
                          ) : confirmationStatus === 'declared' ? (
                            <Clock size={18} color="#F59E0B" strokeWidth={2.5} />
                          ) : confirmationStatus === 'rejected' ? (
                            <AlertCircle size={18} color="#DC2626" strokeWidth={2.5} />
                          ) : (
                            <DollarSign size={18} color="#111827" strokeWidth={2.5} />
                          )}
                          <Text className="text-black text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {confirmationStatus === 'confirmed'
                              ? 'Deposit confirmed'
                              : confirmationStatus === 'declared'
                                ? 'Deposit under review'
                                : confirmationStatus === 'rejected'
                                  ? 'Deposit rejected'
                                  : 'Deposit required'}
                          </Text>
                        </View>

                        <Text className="text-gray-600 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {confirmationStatus === 'confirmed'
                            ? `Confirmed on ${confirmedAt || '—'}. Tracking is unlocked.`
                            : confirmationStatus === 'declared'
                              ? `Declared on ${declaredAt || '—'}. Admin review in progress (up to 72 hours).`
                              : confirmationStatus === 'rejected'
                                ? 'Your deposit was rejected. Please re-check the details and declare again after depositing.'
                                : link
                                  ? 'Use the payment instructions sent to your email (Stripe invoice, Wise, Paystack, or Zelle). Then tap “I deposited”.'
                                  : 'Waiting for admin to email payment instructions.'}
                        </Text>

                        {!!link && (
                          <TouchableOpacity
                            onPress={() => handleOpenExternalLink(link)}
                            className="mt-4 flex-row items-center justify-center bg-black rounded-xl py-3"
                          >
                            <ExternalLink size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              Open payment instructions
                            </Text>
                          </TouchableOpacity>
                        )}

                        {showDeclare && (
                          <TouchableOpacity
                            onPress={() => handleDeclarePaid(projectId)}
                            disabled={!link || declareDisabled}
                            className={`mt-3 flex-row items-center justify-center rounded-xl py-3 ${
                              !link || declareDisabled ? 'bg-gray-200' : 'bg-white border border-gray-300'
                            }`}
                          >
                            <Text className={`text-sm ${!link || declareDisabled ? 'text-gray-500' : 'text-gray-900'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              I deposited
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }

                // Renovation / interior design: simple deposit guidance
                return (
                  <View key={projectId} className="bg-white rounded-3xl p-5 border border-gray-200">
                    <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {title}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {formatProjectType(type)}
                    </Text>

                    <View className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <View className="flex-row items-center">
                        <DollarSign size={18} color="#111827" strokeWidth={2.5} />
                        <Text className="text-black text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Deposit instructions
                        </Text>
                      </View>

                      <Text className="text-gray-600 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Admin will email you the deposit instructions after the GC confirms readiness. For smaller projects, a Stripe Card Invoice may be used.
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
