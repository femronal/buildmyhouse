import { View, Text, ScrollView, TouchableOpacity, Image, Modal, useWindowDimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User, MapPin, Lock, Clock, X, ArrowUpRight } from "phosphor-react-native";
import AnimatedCtaButton from '@/components/AnimatedCtaButton';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useActiveProjects, usePendingProjects, usePausedProjects, useActivateProject } from '@/hooks';
import { useCreatePaymentIntent } from '@/hooks/usePayment';
import PaymentModal from '@/components/PaymentModal';
import NotificationBell from '@/components/NotificationBell';
import LogoText from '@/components/LogoText';
import { getBackendAssetUrl } from '@/lib/image';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getFloatingTabBarMetrics,
  getScreenHorizontalPadding,
  getTabContentBottomPadding,
} from "@/lib/responsive-layout";
import { needsHomeownerIntroOnboarding } from "@/lib/onboarding";

const CARD_BG = '#151515';

export default function HomeScreen() {
  const DASHBOARD_COMPLETED_VISIBILITY_HOURS = 48;
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarMetrics = useMemo(
    () => getFloatingTabBarMetrics(screenWidth, insets.bottom),
    [screenWidth, insets.bottom],
  );
  const horizontalPadding = useMemo(
    () => getScreenHorizontalPadding(screenWidth),
    [screenWidth],
  );
  const tabContentBottomPadding = useMemo(
    () => getTabContentBottomPadding(tabBarMetrics),
    [tabBarMetrics],
  );
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: activeProjects = [], isLoading: loadingActive } = useActiveProjects();
  const { data: pendingProjects = [], isLoading: loadingPending } = usePendingProjects();
  const { data: pausedProjects = [], isLoading: loadingPaused } = usePausedProjects();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const activateProjectMutation = useActivateProject();
  const queryClient = useQueryClient();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [, setIsProcessingPayment] = useState(false);
  const [showPausedModal, setShowPausedModal] = useState(false);
  const [selectedPausedProject, setSelectedPausedProject] = useState<any>(null);
  const [headerImageFailed, setHeaderImageFailed] = useState(false);

  const userPicture = currentUser?.pictureUrl;

  useEffect(() => {
    if (userLoading) return;
    if (needsHomeownerIntroOnboarding(currentUser)) {
      router.replace('/onboarding-intro');
    }
  }, [currentUser, router, userLoading]);

  useEffect(() => {
    setHeaderImageFailed(false);
  }, [userPicture]);

  // Combine active and pending projects for display, ensuring no duplicates
  // IMPORTANT: Use actual project.status to determine if paid, not just which array it came from
  const activeProjectsWithStatus = activeProjects.map((p: any, idx: number) => ({
    ...p,
    // Completed projects should remain openable like active projects.
    isPaid: p.status === 'active' || p.status === 'completed' || Number(p.progress || 0) >= 100,
    uniqueKey: `active-${p.id || p.projectId || `idx-${idx}`}`
  }));
  const pendingProjectsWithStatus = pendingProjects.map((p: any, idx: number) => ({
    ...p,
    // A project can be effectively complete even if status lagged.
    isPaid: p.status === 'active' || p.status === 'completed' || Number(p.progress || 0) >= 100,
    uniqueKey: `pending-${p.id || p.projectId || `idx-${idx}`}`
  }));

  const pausedProjectsWithStatus = pausedProjects.map((p: any, idx: number) => ({
    ...p,
    // Paused projects should never be treated as "paid/openable"
    isPaid: false,
    uniqueKey: `paused-${p.id || p.projectId || `idx-${idx}`}`,
  }));

  // Filter out duplicates by project ID (in case a project appears in both arrays)
  // Prefer the one with status='active' if there's a conflict
  const projectIds = new Set<string>();
  const allProjects = [
    ...activeProjectsWithStatus,
    ...pendingProjectsWithStatus,
    ...pausedProjectsWithStatus,
  ].filter((project: any) => {
    const projectId = project.id || project.projectId;
    if (!projectId) return false; // Skip projects without IDs
    if (projectIds.has(projectId)) {
      // If duplicate, prefer the one with status='active'
      return false;
    }
    projectIds.add(projectId);
    return true;
  }).map((project: any) => {
    // Ensure isPaid is based on status/progress, not array source
    return {
      ...project,
      isPaid: project.status === 'active' || project.status === 'completed' || Number(project.progress || 0) >= 100,
    };
  });

  const isCompletedProject = (project: any) =>
    project?.status === 'completed' || Number(project?.progress || 0) >= 100;

  const isWithinCompletedDashboardWindow = (project: any) => {
    if (!isCompletedProject(project)) return true;
    const referenceDate = project?.completionDate || project?.updatedAt || project?.respondedAt;
    if (!referenceDate) return false;
    const completedAt = new Date(referenceDate).getTime();
    if (!Number.isFinite(completedAt) || completedAt <= 0) return false;
    const elapsedMs = Date.now() - completedAt;
    return elapsedMs <= DASHBOARD_COMPLETED_VISIBILITY_HOURS * 60 * 60 * 1000;
  };

  const dashboardProjects = allProjects.filter((project: any) =>
    isWithinCompletedDashboardWindow(project),
  );

  const handleProjectPress = async (project: any) => {
    if (project.status === 'paused') {
      setSelectedPausedProject(project);
      setShowPausedModal(true);
      return;
    }
    if (project.isPaid) {
      // Active project - go to dashboard
      router.push(`/dashboard?projectId=${project.id || project.projectId}`);
    } else {
      // Unpaid project - show payment modal
      const budget = getProjectBudget(project);
      let amount = budget * 1.0;

      // Always set selected project and values first so the modal has context
      // even when amount exceeds Stripe limits.
      setSelectedProjectForPayment(project);
      setPaymentAmount(amount);
      setProjectBudget(budget);
      setPaymentClientSecret(null);
      setPaymentError(null);

      // Stripe maximum amount is ₦999,999.99
      const STRIPE_MAX_AMOUNT = 999999.99;
      if (amount > STRIPE_MAX_AMOUNT) {
        setPaymentError(`Payment amount (₦${amount.toLocaleString()}) exceeds the maximum allowed amount of ₦${STRIPE_MAX_AMOUNT.toLocaleString()}. Please contact support.`);
        setShowPaymentModal(true);
        setIsProcessingPayment(false);
        return;
      }

      if (amount <= 0) {
        setPaymentError('Budget information is missing or invalid for this project.');
        setShowPaymentModal(true);
        setIsProcessingPayment(false);
        return;
      }

      setIsProcessingPayment(true);
      setShowPaymentModal(true);

      try {
        const paymentResult = await createPaymentIntentMutation.mutateAsync({
          amount,
          projectId: project.id || project.projectId,
          currency: 'ngn',
          description: `Project activation payment - ${project.name || 'Project'}`,
        });

        if (paymentResult?.paymentIntent?.clientSecret) {
          setPaymentClientSecret(paymentResult.paymentIntent.clientSecret);
          setIsProcessingPayment(false);
        } else {
          setPaymentError('Payment intent created but no client secret received.');
          setIsProcessingPayment(false);
        }
      } catch (error: any) {
        setPaymentError(error?.message || 'Failed to create payment intent');
        setIsProcessingPayment(false);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedProjectForPayment) return;

    try {
      await activateProjectMutation.mutateAsync(selectedProjectForPayment.id || selectedProjectForPayment.projectId);

      // Invalidate all project queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });

      setShowPaymentModal(false);
      setSelectedProjectForPayment(null);
      router.push(`/dashboard?projectId=${selectedProjectForPayment.id || selectedProjectForPayment.projectId}`);
    } catch (error: any) {
      setPaymentError(error?.message || 'Failed to activate project');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setIsProcessingPayment(false);
  };

  const getProjectCoverImage = (project: any) => {
    let aiAnalysis = project?.aiAnalysis;
    if (typeof aiAnalysis === 'string') {
      try {
        aiAnalysis = JSON.parse(aiAnalysis);
      } catch {
        aiAnalysis = null;
      }
    }

    const acceptedReq = (project?.projectRequests || []).find((r: any) => r?.status === 'accepted');
    const parsedFromAcceptedNotes = (() => {
      const notes = acceptedReq?.gcNotes;
      if (!notes || typeof notes !== 'string') return null;
      const match = notes.match(/\{[\s\S]*\}$/);
      if (!match) return null;
      try {
        const parsed = JSON.parse(match[0]);
        return parsed?.projectImageUrl || parsed?.planImageUrl || null;
      } catch {
        return null;
      }
    })();

    const coverUrl =
      aiAnalysis?.projectImageUrl ||
      aiAnalysis?.planImageUrl ||
      project?.projectImageUrl ||
      project?.planImageUrl ||
      parsedFromAcceptedNotes;

    return coverUrl
      ? getBackendAssetUrl(coverUrl)
      : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80';
  };

  const getAcceptedRequest = (project: any) => {
    if (project?.acceptedRequest && project.acceptedRequest.status === 'accepted') {
      return project.acceptedRequest;
    }
    if (!Array.isArray(project?.projectRequests)) {
      return null;
    }
    return project.projectRequests.find((req: any) => req?.status === 'accepted') || null;
  };

  const getProjectBudget = (project: any) => {
    const aiBudget =
      project?.gcEditedAnalysis?.budget ||
      project?.gcEditedAnalysis?.estimatedBudget ||
      project?.aiAnalysis?.budget ||
      project?.aiAnalysis?.estimatedBudget;
    const acceptedRequest = getAcceptedRequest(project);
    const acceptedBudget = Number(acceptedRequest?.estimatedBudget || 0);
    const acceptedTotalQuote =
      Number(acceptedRequest?.totalQuoteAmount || 0) ||
      acceptedBudget +
        Number(acceptedRequest?.monitoringFeeAmount || 0) +
        Number(acceptedRequest?.coordinationFeeAmount || 0) +
        Number(acceptedRequest?.contingencyFeeAmount || 0);
    const baseBudget = project?.budget;
    return Number(acceptedTotalQuote || baseBudget || acceptedBudget || aiBudget || 0);
  };

  const isLoadingProjects = loadingActive || loadingPending || loadingPaused;
  const hasProjects = dashboardProjects.length > 0;
  const isLoggedOut = !currentUser && !userLoading;

  const launchButton = (
    <AnimatedCtaButton
      label={isLoggedOut ? 'Sign up / Log in' : 'Start Building'}
      compact={hasProjects}
      onPress={() => (isLoggedOut ? router.push('/login') : router.push('/location?mode=explore'))}
    />
  );

  return (
    <View className="flex-1 bmh-dark-page" style={{ backgroundColor: '#050505' }}>
      {/* Header */}
      <View
        className="pb-2 flex-row items-center gap-2"
        style={{ paddingTop: Math.max(12, insets.top + 8), paddingHorizontal: horizontalPadding }}
      >
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          className="w-10 h-10 bg-white/10 border border-white/15 rounded-full items-center justify-center overflow-hidden flex-shrink-0 z-10"
        >
          {userPicture && !headerImageFailed ? (
            <View pointerEvents="none" className="w-full h-full">
              <Image
                source={{ uri: getBackendAssetUrl(userPicture) }}
                className="w-full h-full"
                resizeMode="cover"
                onError={() => setHeaderImageFailed(true)}
              />
            </View>
          ) : (
            <User size={22} color="#FFFFFF" weight="bold" />
          )}
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center min-w-0 px-0.5">
          <LogoText variant="white" size="lg" />
        </View>

        <View className="flex-shrink-0">
          <NotificationBell dark />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabContentBottomPadding,
          paddingHorizontal: horizontalPadding,
        }}
      >
        {isLoadingProjects && !hasProjects ? (
          /* Loading — keep the screen calm and centered */
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="small" color="#fff" />
            <Text className="text-white/50 mt-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              Loading projects...
            </Text>
          </View>
        ) : !hasProjects ? (
          /* No projects — the launch button is the only object, centered */
          <View className="flex-1 items-center justify-center py-24">
            {launchButton}
          </View>
        ) : (
          <>
            {/* Launch button moves up to make room for project cards */}
            <View className="mt-4 mb-8">{launchButton}</View>

            {/* Current Projects */}
            <View className="mb-8 w-full max-w-2xl self-center">
              <Text
                className="text-2xl text-white mb-4"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Your Projects
              </Text>

              {dashboardProjects.map((project: any, index: number) => {
                const projectId = project.id || project.projectId || `project-${index}`;
                const uniqueKey = project.uniqueKey || `${project.isPaid ? 'active' : 'pending'}-${projectId}`;
                const isPaid = project.isPaid;
                const isPaused = project.status === 'paused';
                const isCompleted = project.status === 'completed' || Number(project.progress || 0) >= 100;
                const statusLabel = isPaused ? 'Paused' : isCompleted ? 'Completed' : isPaid ? 'Active' : 'Unpaid';
                const budget = getProjectBudget(project);
                const amountDue = budget * 1.0;
                const gradientId = `bmh-project-fade-${projectId}`;

                return (
                  <TouchableOpacity
                    key={uniqueKey}
                    onPress={() => handleProjectPress(project)}
                    activeOpacity={0.9}
                    className="bmh-product-card rounded-[28px] overflow-hidden mb-4"
                    style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                    accessibilityRole="button"
                    accessibilityLabel={`${project.name || 'Untitled Project'} — ${statusLabel}`}
                  >
                    {/* Cover image fading into the dark canvas */}
                    <View className="relative overflow-hidden" style={{ backgroundColor: CARD_BG }}>
                      <Image
                        source={{ uri: getProjectCoverImage(project) }}
                        className="bmh-product-card-img w-full"
                        style={{ height: 168, opacity: 0.85, marginBottom: -2 }}
                        resizeMode="cover"
                      />
                      <Svg
                        pointerEvents="none"
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0 }}
                      >
                        <Defs>
                          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={CARD_BG} stopOpacity="0" />
                            <Stop offset="0.45" stopColor={CARD_BG} stopOpacity="0" />
                            <Stop offset="0.72" stopColor={CARD_BG} stopOpacity="0.82" />
                            <Stop offset="1" stopColor={CARD_BG} stopOpacity="1" />
                          </SvgLinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
                      </Svg>

                      {/* Open / locked indicator */}
                      <View
                        pointerEvents="none"
                        className="bmh-product-card-arrow absolute top-4 right-4 w-10 h-10 rounded-full border border-white/20 bg-black/30 items-center justify-center"
                      >
                        {isPaused ? (
                          <Lock size={17} color="#ffffff" weight="regular" />
                        ) : (
                          <ArrowUpRight size={18} color="#ffffff" weight="regular" />
                        )}
                      </View>
                    </View>

                    <View className="px-5 pb-5" style={{ marginTop: -24, backgroundColor: CARD_BG }}>
                      <Text
                        className="text-[10px] text-white/50 uppercase mb-1.5"
                        style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 2 }}
                      >
                        {statusLabel}
                      </Text>

                      <Text
                        className="text-white text-[22px] leading-7 tracking-tight mb-1.5"
                        style={{ fontFamily: 'Poppins_500Medium' }}
                        numberOfLines={1}
                      >
                        {project.name || 'Untitled Project'}
                      </Text>

                      <View className="flex-row items-center gap-1 mb-3">
                        <MapPin size={11} color="#ffffff" weight="fill" />
                        <Text
                          className="text-xs text-white/60 flex-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                          numberOfLines={2}
                        >
                          {project.address || 'Address not available'}
                        </Text>
                      </View>

                      {isPaused ? (
                        <View className="bg-white/10 border border-white/15 rounded-2xl p-4">
                          <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            This project has been paused by admin
                          </Text>
                          <Text className="text-white/60 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                            Tap to learn why and what to do next.
                          </Text>
                        </View>
                      ) : isPaid ? (
                        <>
                          {/* Progress Bar for Active Projects */}
                          <View className="mb-1">
                            <View className="flex-row justify-between mb-2">
                              <Text
                                className="text-white text-sm"
                                style={{ fontFamily: 'Poppins_600SemiBold' }}
                              >
                                {project.currentStage || 'In Progress'}
                              </Text>
                              <Text
                                className="text-white"
                                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                              >
                                {project.progress || 0}%
                              </Text>
                            </View>
                            <View className="h-2 bg-white/15 rounded-full overflow-hidden">
                              <View
                                className="h-full bg-white rounded-full"
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </View>
                          </View>

                          {/* Budget Info for Active Projects */}
                          <View className="flex-row justify-between border-t border-white/10 mt-3 pt-3.5">
                            <View>
                              <Text
                                className="text-white/50 text-xs mb-1"
                                style={{ fontFamily: 'Poppins_400Regular' }}
                              >
                                Budget
                              </Text>
                              <Text
                                className="text-white"
                                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                              >
                                ₦{budget.toLocaleString()}
                              </Text>
                            </View>
                            <View>
                              <Text
                                className="text-white/50 text-xs mb-1"
                                style={{ fontFamily: 'Poppins_400Regular' }}
                              >
                                Spent
                              </Text>
                              <Text
                                className="text-white"
                                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                              >
                                ₦{(project.spent || 0).toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        /* Payment Info for Unpaid Projects */
                        <View className="bg-white/10 border border-white/15 rounded-2xl p-4">
                          <View className="flex-row items-center mb-2">
                            <Clock size={16} color="#ffffff" weight="bold" />
                            <Text
                              className="text-white ml-2"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              Payment Required
                            </Text>
                          </View>
                          <Text
                            className="text-white/70 text-sm mb-2"
                            style={{ fontFamily: 'Poppins_400Regular' }}
                          >
                            GC has reviewed your project. Pay 100% to start building.
                          </Text>
                          <View className="flex-row justify-between items-center">
                            <Text
                              className="text-white/80"
                              style={{ fontFamily: 'Poppins_500Medium' }}
                            >
                              Amount Due:
                            </Text>
                            <Text
                              className="text-white text-lg"
                              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                            >
                              ₦{amountDue.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Paused Project Modal */}
        <Modal
          visible={showPausedModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPausedModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-md">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Project paused
                </Text>
                <TouchableOpacity onPress={() => setShowPausedModal(false)} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                  <X size={18} color="#000000" weight="bold" />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-700 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Admin has temporarily paused{selectedPausedProject?.name ? ` “${selectedPausedProject.name}”` : ' this project'} to protect both parties while an issue is reviewed.
              </Text>

              <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                <Text className="text-orange-900 text-sm mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Common real‑life reasons projects get paused
                </Text>
                {[
                  'A complaint from the homeowner or contractor that needs investigation',
                  'A payment dispute or suspected fraudulent transaction',
                  'Missing/invalid documents (permits, invoices, proof of delivery)',
                  'Quality or safety concerns reported on-site',
                  'Major change-order disagreement (scope or cost)',
                  'Suspicious activity on the account or unusual behavior',
                ].map((reason) => (
                  <View key={reason} className="flex-row items-start mb-2">
                    <View className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2" />
                    <Text className="text-orange-800 text-xs flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {reason}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  What you should do now
                </Text>
                <Text className="text-gray-600 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Please wait while admin resolves the issue. You’ll be able to continue once the project is activated again.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowPausedModal(false)}
                className="bg-black rounded-2xl py-4 items-center mt-5"
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Okay, I’ll wait for admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsProcessingPayment(false);
          setPaymentClientSecret(null);
          setPaymentError(null);
          setSelectedProjectForPayment(null);
        }}
        amount={paymentAmount}
        projectBudget={projectBudget}
        projectId={selectedProjectForPayment?.id || selectedProjectForPayment?.projectId}
        projectName={selectedProjectForPayment?.name || 'Project'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        clientSecret={paymentClientSecret || undefined}
        externalError={paymentError || undefined}
      />
    </View>
  );
}
