import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle, Clock, Lock, Home, AlertCircle, ExternalLink, CreditCard } from "lucide-react-native";
import { useProject } from "@/hooks/useProject";
import * as WebBrowser from 'expo-web-browser';

export default function TimelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;

  const { data: project, isLoading, error } = useProject(projectId || '');

  // Get stages from project data
  const stages = project?.stages || [];

  // Derive an effective project type to handle legacy rows where projectType may be missing/mismatched.
  const projectType =
    ((project as any)?.projectType as string | undefined) ||
    (((project as any)?.aiAnalysis as any)?.projectType as string | undefined);
  const paymentConfirmationStatus =
    ((project as any)?.paymentConfirmationStatus as string | undefined) || 'not_declared';
  const externalPaymentLink = (project as any)?.externalPaymentLink as string | undefined;
  const paymentDeclaredAt = (project as any)?.paymentDeclaredAt as string | undefined;
  const declaredAt = paymentDeclaredAt ? new Date(paymentDeclaredAt) : null;
  const isHomebuilding = projectType === 'homebuilding';
  const hasCompletedPayment = Array.isArray((project as any)?.payments)
    ? (project as any).payments.some((p: any) => p?.status === 'completed')
    : false;
  const isPaymentSettled =
    paymentConfirmationStatus === 'confirmed' ||
    (project as any)?.status === 'active' ||
    hasCompletedPayment;
  const isTrackingLocked = isHomebuilding && !isPaymentSettled;

  const reviewHoursRemaining = (() => {
    if (!declaredAt) return null;
    const reviewEndsAt = declaredAt.getTime() + 72 * 60 * 60 * 1000;
    const msRemaining = reviewEndsAt - Date.now();
    if (msRemaining <= 0) return 0;
    return Math.ceil(msRemaining / (60 * 60 * 1000));
  })();

  const handleOpenExternalLink = async () => {
    if (!externalPaymentLink) return;
    try {
      await WebBrowser.openBrowserAsync(externalPaymentLink);
    } catch {
      // no-op; we show fallback UI below
    }
  };

  // Map database status to display status
  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'complete';
      case 'in_progress':
        return 'in-progress';
      case 'not_started':
      default:
        return 'not-started';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={24} color="#000000" strokeWidth={2} fill="#000000" />;
      case "in_progress":
        return <Clock size={24} color="#000000" strokeWidth={2} />;
      default:
        return <Lock size={24} color="#D4D4D4" strokeWidth={2} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <View className="bg-black rounded-full px-3 py-1">
            <Text 
              className="text-white text-xs"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Complete
            </Text>
          </View>
        );
      case "in_progress":
        return (
          <View className="bg-gray-100 rounded-full px-3 py-1 border border-black">
            <Text 
              className="text-black text-xs"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              In Progress
            </Text>
          </View>
        );
      default:
        return (
          <View className="bg-gray-100 rounded-full px-3 py-1">
            <Text 
              className="text-gray-400 text-xs"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Not Started
            </Text>
          </View>
        );
    }
  };

  const handleStagePress = (stage: any) => {
    // Only allow clicking on complete or in-progress stages
    if (stage.status === 'completed' || stage.status === 'in_progress') {
      router.push(`/stage-detail?stageId=${stage.id}&projectId=${projectId}&name=${stage.name}&status=${getDisplayStatus(stage.status)}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading timeline...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <AlertCircle size={48} color="#EF4444" strokeWidth={2} />
        <Text className="text-red-500 text-center text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Failed to load project timeline
        </Text>
        <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          {error?.message || 'Please try again later'}
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-black rounded-full py-3 px-6 mt-6"
        >
          <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Tracking lock screen (homebuilding manual payment flow)
  if (isTrackingLocked) {
    const title =
      paymentConfirmationStatus === 'declared'
        ? 'Payment under review'
        : paymentConfirmationStatus === 'rejected'
          ? 'Payment rejected'
          : 'Payment required';

    const description =
      paymentConfirmationStatus === 'declared'
        ? `We’re reviewing your payment. This can take up to 72 hours.${
            typeof reviewHoursRemaining === 'number'
              ? reviewHoursRemaining > 0
                ? ` About ${reviewHoursRemaining}h remaining.`
                : ` If it has been more than 72 hours, please contact support.`
              : ''
          }`
        : paymentConfirmationStatus === 'rejected'
          ? 'Your payment was rejected. Please re-check the transfer and declare again after paying.'
          : externalPaymentLink
            ? 'Use the payment instructions (Stripe invoice, Wise, Paystack, or Zelle). Then tap “I paid” in Billing & Payments.'
            : 'Waiting for BuildMyHouse/GC to email payment instructions.';

    return (
      <View className="flex-1 bg-white">
        <View className="pt-16 px-6 pb-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/home'))}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
            >
              <ArrowLeft size={22} color="#000000" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}
              className="w-10 h-10 bg-black rounded-full items-center justify-center"
            >
              <Home size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
            Build Timeline
          </Text>
          <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
            Tracking is locked until payment is confirmed
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
            <View className="flex-row items-center mb-3">
              {paymentConfirmationStatus === 'declared' ? (
                <Clock size={22} color="#F59E0B" strokeWidth={2.5} />
              ) : (
                <CreditCard size={22} color="#111827" strokeWidth={2.5} />
              )}
              <Text className="text-black text-xl ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {title}
              </Text>
            </View>

            <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              {description}
            </Text>

            {!!externalPaymentLink && (
              <TouchableOpacity
                onPress={handleOpenExternalLink}
                className="mt-4 flex-row items-center justify-center bg-black rounded-xl py-3"
              >
                <ExternalLink size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Open payment link
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.push('/billing-payments')}
              className="mt-3 flex-row items-center justify-center bg-white border border-gray-300 rounded-xl py-3"
            >
              <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Go to Billing & Payments
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-black rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <Text 
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Build Timeline
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Track your construction progress
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="pb-8">
          {stages.length === 0 ? (
            <View className="items-center py-10">
              <Clock size={48} color="#D4D4D4" strokeWidth={1.5} />
              <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                No Stages Yet
              </Text>
              <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                Stages will appear here once the project is activated
              </Text>
            </View>
          ) : (
            stages.map((stage: any, index: number) => {
              const isClickable = stage.status === 'completed' || stage.status === 'in_progress';
              
              return (
                <View key={stage.id} className="flex-row mb-6">
                  {/* Timeline Spine */}
                  <View className="items-center mr-4">
                    {getStatusIcon(stage.status)}
                    {index < stages.length - 1 && (
                      <View 
                        className={`w-0.5 flex-1 mt-2 ${
                          stage.status === 'completed' ? 'bg-black' : 'bg-gray-200'
                        }`}
                        style={{ minHeight: 40 }}
                      />
                    )}
                  </View>

                  {/* Stage Card */}
                  <TouchableOpacity
                    onPress={() => handleStagePress(stage)}
                    disabled={!isClickable}
                    className={`flex-1 rounded-2xl p-5 border ${
                      isClickable 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-50 border-gray-100'
                    }`}
                    style={{ opacity: isClickable ? 1 : 0.6 }}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <Text 
                        className={`text-lg flex-1 ${isClickable ? 'text-black' : 'text-gray-400'}`}
                        style={{ fontFamily: 'Poppins_700Bold' }}
                      >
                        {stage.name}
                      </Text>
                      {getStatusBadge(stage.status)}
                    </View>
                    
                    <View className="flex-row items-center">
                      <Clock size={16} color={isClickable ? "#737373" : "#D4D4D4"} strokeWidth={2} />
                      <Text 
                        className={`text-sm ml-2 ${isClickable ? 'text-gray-500' : 'text-gray-300'}`}
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {stage.estimatedDuration || 'Duration not specified'}
                      </Text>
                      {!isClickable && (
                        <View className="flex-row items-center ml-auto">
                          <Lock size={14} color="#D4D4D4" strokeWidth={2} />
                          <Text 
                            className="text-gray-300 text-xs ml-1"
                            style={{ fontFamily: 'Poppins_400Regular' }}
                          >
                            Locked
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
