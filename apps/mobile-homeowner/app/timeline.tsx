import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle, Clock, Lock, House, WarningCircle, ArrowSquareOut, CreditCard, CaretDown, CaretUp } from "phosphor-react-native";
import { useProject } from "@/hooks/useProject";
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getScreenHorizontalPadding } from "@/lib/responsive-layout";
import { cardShadowStyle } from "@/lib/card-styles";

export default function TimelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = useMemo(() => getScreenHorizontalPadding(width), [width]);
  const contentBottomPadding = Math.max(24, insets.bottom + 16);
  const projectId = params.projectId as string;
  const [isStageHistoryExpanded, setIsStageHistoryExpanded] = useState(false);

  const { data: project, isLoading, error } = useProject(projectId || '');

  // Get stages from project data
  const stages = project?.stages || [];
  const stageChangeHistory = useMemo(() => {
    const rows = (stages || []).flatMap((stage: any) =>
      ((stage?.changeRequests || []) as any[]).map((request: any) => ({
        ...request,
        stageName: stage?.name || 'Stage',
      })),
    );
    return rows.sort((a: any, b: any) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [stages]);

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
        return <CheckCircle size={24} color="#000000" weight="fill" />;
      case "in_progress":
        return <Clock size={24} color="#000000" weight="regular" />;
      default:
        return <Lock size={24} color="#D4D4D4" weight="regular" />;
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

  const getChangeStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <View className="bg-green-100 rounded-full px-2 py-1">
          <Text className="text-green-700 text-[10px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Approved
          </Text>
        </View>
      );
    }
    if (status === 'rejected') {
      return (
        <View className="bg-red-100 rounded-full px-2 py-1">
          <Text className="text-red-700 text-[10px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Rejected
          </Text>
        </View>
      );
    }
    return (
      <View className="bg-amber-100 rounded-full px-2 py-1">
        <Text className="text-amber-700 text-[10px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Pending
        </Text>
      </View>
    );
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
        <WarningCircle size={48} color="#EF4444" weight="regular" />
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
        <View
          className="pb-4"
          style={{ paddingTop: Math.max(16, insets.top + 8), paddingHorizontal: horizontalPadding }}
        >
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/home'))}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
            >
              <ArrowLeft size={22} color="#000000" weight="bold" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}
              className="w-10 h-10 bg-black rounded-full items-center justify-center"
            >
              <House size={20} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          </View>

          <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
            Build Timeline
          </Text>
          <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
            Tracking is locked until payment is confirmed
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: contentBottomPadding, paddingHorizontal: horizontalPadding }}
        >
          <View style={cardShadowStyle} className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
            <View className="flex-row items-center mb-3">
              {paymentConfirmationStatus === 'declared' ? (
                <Clock size={22} color="#F59E0B" weight="bold" />
              ) : (
                <CreditCard size={22} color="#111827" weight="bold" />
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
                <ArrowSquareOut size={18} color="#FFFFFF" weight="bold" />
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
      <View
        className="pb-4"
        style={{ paddingTop: Math.max(16, insets.top + 8), paddingHorizontal: horizontalPadding }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#000000" weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-black rounded-full items-center justify-center"
          >
            <House size={20} color="#FFFFFF" weight="bold" />
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: contentBottomPadding, paddingHorizontal: horizontalPadding }}
      >
        <View className="pb-8">
          {stageChangeHistory.length > 0 && (
            <View className="mb-8 bg-gray-50 rounded-2xl border border-gray-200 p-4">
              <TouchableOpacity
                onPress={() => setIsStageHistoryExpanded((prev) => !prev)}
                className="flex-row items-start justify-between"
                activeOpacity={0.8}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-black text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Stage Change History
                  </Text>
                  <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Timeline of scope changes submitted by your GC and reviewed by admin.
                  </Text>
                  {!isStageHistoryExpanded && (
                    <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {stageChangeHistory.length} update{stageChangeHistory.length === 1 ? '' : 's'} hidden
                    </Text>
                  )}
                </View>
                <View className="w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center">
                  {isStageHistoryExpanded ? (
                    <CaretUp size={16} color="#171717" weight="bold" />
                  ) : (
                    <CaretDown size={16} color="#171717" weight="bold" />
                  )}
                </View>
              </TouchableOpacity>

              {isStageHistoryExpanded && (
                <View className="mt-4">
                  {stageChangeHistory.map((change: any, index: number) => (
                    <View key={change.id || index} className="flex-row mb-4">
                      <View className="items-center mr-3">
                        <View
                          className={`w-3 h-3 rounded-full ${
                            change.status === 'approved'
                              ? 'bg-green-500'
                              : change.status === 'rejected'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                          }`}
                        />
                        {index < stageChangeHistory.length - 1 && (
                          <View className="w-0.5 flex-1 mt-1 bg-gray-300" style={{ minHeight: 30 }} />
                        )}
                      </View>
                      <View className="flex-1 bg-white rounded-xl border border-gray-200 p-3">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {change.stageName}
                          </Text>
                          {getChangeStatusBadge(change.status)}
                        </View>

                        <View className="flex-row flex-wrap mb-2">
                          {(change.requestTypes || []).map((type: string) => (
                            <View key={`${change.id}-${type}`} className="bg-gray-100 rounded-full px-2 py-1 mr-1 mb-1">
                              <Text className="text-gray-700 text-[10px]" style={{ fontFamily: 'Poppins_500Medium' }}>
                                {type.replace(/_/g, ' ')}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {!!change.additionalAmount && (
                          <Text className="text-gray-700 text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                            Cost adjustment: +₦{Number(change.additionalAmount).toLocaleString()}
                          </Text>
                        )}
                        {!!change.additionalDurationDays && (
                          <Text className="text-gray-700 text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                            Duration adjustment: +{change.additionalDurationDays} day(s)
                          </Text>
                        )}
                        {!!change.siteChangeDetails && (
                          <Text className="text-gray-700 text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                            Site change: {change.siteChangeDetails}
                          </Text>
                        )}
                        {!!change.adminReviewNote && (
                          <Text className="text-gray-600 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                            Admin note: {change.adminReviewNote}
                          </Text>
                        )}
                        <Text className="text-gray-400 text-[11px] mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {change.createdAt ? new Date(change.createdAt).toLocaleString() : 'Recent'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {stages.length === 0 ? (
            <View className="items-center py-10">
              <Clock size={48} color="#D4D4D4" weight="light" />
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
                      <Clock size={16} color={isClickable ? "#737373" : "#D4D4D4"} weight="regular" />
                      <Text 
                        className={`text-sm ml-2 ${isClickable ? 'text-gray-500' : 'text-gray-300'}`}
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {stage.estimatedDuration || 'Duration not specified'}
                      </Text>
                      {!isClickable && (
                        <View className="flex-row items-center ml-auto">
                          <Lock size={14} color="#D4D4D4" weight="regular" />
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
