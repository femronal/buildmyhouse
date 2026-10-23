import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  MessageCircle,
  FileText,
  Phone,
  Home,
  Lock,
  Camera,
  Play,
  Eye,
  ThumbsUp,
} from "lucide-react-native";
import { useState } from "react";
import { useProject, useUpdateStageStatus } from "@/hooks/useProjects";
import { useQuery } from '@tanstack/react-query';
import { chatService } from "@/services/chatService";
import { useConversationUnreadCount } from "@/hooks/useChat";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGCEarnings } from "@/hooks/useGC";
import { getBackendAssetUrl } from "@/lib/image";
import { api } from "@/lib/api";
import { useResponsivePadding } from "@/lib/responsive-layout";

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

const naira = (value?: number | null) => `₦${Number(value || 0).toLocaleString()}`;

const stageRouteStatus = (status: string) => {
  if (status === 'completed') return 'complete';
  if (status === 'in_progress') return 'in-progress';
  if (status === 'pending_homeowner_approval') return 'pending_homeowner_approval';
  return 'not-started';
};

export default function GCProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = id as string;
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const { data: project, isLoading: projectLoading, error: projectError, refetch } = useProject(projectId || null);
  const { data: earnings = [], isLoading: loadingEarnings } = useGCEarnings();
  const updateStageStatusMutation = useUpdateStageStatus();
  const { data: currentUser } = useCurrentUser();
  
  // Get homeowner info for chat
  const homeownerId = (project as any)?.homeownerId || (project as any)?.homeowner?.id;
  
  // Get or create conversation with homeowner
  const { data: conversation } = useQuery({
    queryKey: ['conversation', projectId, homeownerId, currentUser?.id],
    queryFn: async () => {
      if (!homeownerId || !currentUser?.id) return null;
      return chatService.getOrCreateConversation(
        [homeownerId, currentUser.id],
        projectId || undefined,
      );
    },
    enabled: !!homeownerId && !!currentUser?.id && !!projectId,
  });
  
  // Get unread count for this conversation
  const { data: unreadCount = 0 } = useConversationUnreadCount(conversation?.id);
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stack");

  const handleDownloadPDF = async () => {
    const rawProjectPdfUrl =
      (project as any)?.homeownerFiles?.pdfUrl || project?.planPdfUrl;
    if (!rawProjectPdfUrl) {
      Alert.alert('No Plan Available', 'The project plan PDF is not available.');
      return;
    }

    try {
      const result = await api.get(`/plans/${projectId}/download-url`);
      const rawUrl = result?.url || rawProjectPdfUrl;
      const pdfUrl = getBackendAssetUrl(rawUrl);
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Error', 'Cannot open PDF URL');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      // Fallback to direct URL for older projects/environments.
      try {
        const fallbackUrl = getBackendAssetUrl(rawProjectPdfUrl);
        const supported = await Linking.canOpenURL(fallbackUrl);
        if (supported) {
          await Linking.openURL(fallbackUrl);
          return;
        }
      } catch {}
      Alert.alert('Error', 'Failed to open PDF. Please try again.');
    }
  };

  const handleContactHomeowner = () => {
    if (project?.homeowner?.phone) {
      Linking.openURL(`tel:${project.homeowner.phone}`);
    } else {
      Alert.alert('No Phone Number', 'Phone number is not available for this homeowner.');
    }
  };

  // Check if a stage can be started (previous stage must be completed)
  const canStartStage = (stageIndex: number, stages: any[]) => {
    if (stageIndex === 0) {
      // First stage can always be started
      return true;
    }
    // Previous stage must be completed
    const previousStage = stages[stageIndex - 1];
    return previousStage?.status === 'completed';
  };

  const handleStartStage = async (stageId: string) => {
    if (!id || !project) return;

    try {
      await updateStageStatusMutation.mutateAsync({
        projectId: id as string,
        stageId,
        status: 'in_progress',
      });
      refetch(); // Refetch to update UI
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to start stage. Please try again.');
    }
  };

  if (projectLoading) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading project...
        </Text>
      </View>
    );
  }

  const projectErrorMessage = (projectError as any)?.message || '';
  const isPausedError =
    typeof projectErrorMessage === 'string' &&
    projectErrorMessage.toLowerCase().includes('paused');

  if ((projectError || !project) && isPausedError) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center" style={{ paddingHorizontal: horizontalPad }}>
        <Modal visible={true} transparent={true} animationType="fade">
          <View className="flex-1 bg-black/50 items-center justify-center" style={{ paddingHorizontal: horizontalPad }}>
            <View className="bg-[#1E3A5F] rounded-3xl p-6 w-full max-w-md border border-orange-600/50">
              <View className="items-center mb-4">
                <View className="w-16 h-16 bg-orange-600/20 rounded-full items-center justify-center mb-3">
                  <Lock size={32} color="#F59E0B" strokeWidth={2} />
                </View>
                <Text className="text-white text-xl text-center mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Project paused
                </Text>
                <Text className="text-gray-300 text-sm text-center leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Admin has temporarily paused this project while an issue is reviewed.
                </Text>
              </View>

              <View className="bg-orange-900/30 border border-orange-700/50 rounded-2xl p-4 mb-4">
                <Text className="text-orange-200 text-sm mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
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
                    <View className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2" />
                    <Text className="text-orange-100 text-xs flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {reason}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="bg-[#0A1628] border border-blue-900 rounded-2xl p-4 mb-4">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  What you should do now
                </Text>
                <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Please wait while admin resolves the issue. You’ll be able to continue once the project is activated again.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.canGoBack() ? router.back() : router.push('/contractor/gc-dashboard')}
                className="bg-blue-600 rounded-2xl py-4 items-center"
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Okay, I’ll wait for admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (projectError || !project) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center" style={{ paddingHorizontal: horizontalPad }}>
        <Text className="text-gray-400 text-center mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Failed to load project
        </Text>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/contractor/gc-dashboard')}
          className="bg-blue-600 rounded-full py-4 px-8"
        >
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stages = project.stages || [];
  const homeowner = project.homeowner;
  const homeownerName = homeowner?.fullName || 'Homeowner';
  const homeownerPhotoUrls = (() => {
    const normalizedFromHomeownerFiles = Array.isArray((project as any)?.homeownerFiles?.photoUrls)
      ? (project as any).homeownerFiles.photoUrls
      : Array.isArray((project as any)?.homeownerFiles?.photos)
        ? (project as any).homeownerFiles.photos
            .map((photo: any) => String(photo?.url || '').trim())
            .filter(Boolean)
        : [];
    if (normalizedFromHomeownerFiles.length > 0) {
      return normalizedFromHomeownerFiles;
    }

    let aiAnalysis = (project as any)?.aiAnalysis;
    if (typeof aiAnalysis === 'string') {
      try {
        aiAnalysis = JSON.parse(aiAnalysis);
      } catch {
        aiAnalysis = null;
      }
    }
    const aiImages = Array.isArray(aiAnalysis?.projectImageUrls)
      ? aiAnalysis.projectImageUrls.map((url: any) => String(url || '').trim()).filter(Boolean)
      : [];
    if (aiImages.length > 0) {
      return aiImages;
    }
    const singleImage = String(aiAnalysis?.projectImageUrl || '').trim();
    return singleImage ? [singleImage] : [];
  })();
  const hasPlan = !!((project as any)?.homeownerFiles?.hasPdf || project?.planPdfUrl);
  const dueLabel = formatDate(project.dueDate);
  const jobMoney = loadingEarnings ? null : earnings.find((item) => item.id === project.id);
  const activeIndex = stages.findIndex(
    (stage: any) => stage.status === 'in_progress' || stage.status === 'pending_homeowner_approval',
  );
  const focusIndex = activeIndex >= 0
    ? activeIndex
    : stages.findIndex((stage: any, index: number) => stage.status === 'not_started' && canStartStage(index, stages));
  const currentStage = focusIndex >= 0 ? stages[focusIndex] : null;
  const allDone = stages.length > 0 && stages.every((stage: any) => stage.status === 'completed');
  const doneStages = stages.filter((stage: any) => stage.status === 'completed');
  const lockedStages = focusIndex >= 0 ? stages.slice(focusIndex + 1) : [];
  const progress = Math.max(0, Math.min(100, Math.round(Number(project.progress || 0))));

  const openHomeownerChat = () => {
    const ownerId = (project as any)?.homeownerId || homeowner?.id;
    if (ownerId) {
      router.push(`/contractor/chat?projectId=${project.id}&userId=${ownerId}&name=${encodeURIComponent(homeownerName)}`);
      return;
    }
    router.push(`/contractor/chat?projectId=${project.id}`);
  };

  const openStage = (stage: any) => {
    router.push(`/contractor/stage-detail?stageId=${stage.id}&name=${encodeURIComponent(stage.name)}&status=${stageRouteStatus(stage.status)}&projectId=${projectId}`);
  };

  const handleOpenPhoto = async (rawUrl?: string | null) => {
    const normalized = getBackendAssetUrl(rawUrl);
    if (!normalized) {
      Alert.alert('Photo Not Available', 'This project photo is not available right now.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(normalized);
      if (!canOpen) {
        Alert.alert('Unable to Open', 'Unable to open this photo on your device.');
        return;
      }
      await Linking.openURL(normalized);
    } catch {
      Alert.alert('Unable to Open', 'Unable to open this photo on your device.');
    }
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View className="pb-4" style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}>
        <View className="flex-row items-center mb-4 flex-wrap gap-2">
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.push('/contractor/gc-dashboard')}
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/contractor/gc-dashboard')}
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openHomeownerChat}
            className="ml-auto w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <MessageCircle size={20} color="#FFFFFF" strokeWidth={2} />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full items-center justify-center border-2 border-[#0A1628]">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-white mb-2" style={{ fontFamily: 'Poppins_800ExtraBold', fontSize: 24, lineHeight: 32 }}>
          {project.name}
        </Text>
        <View className="flex-row items-center">
          <MapPin size={16} color="#CBD5E1" strokeWidth={2} />
          <Text className="ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
            {project.address}
          </Text>
        </View>
        {dueLabel ? (
          <Text className="mt-2" style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#CBD5E1' }}>
            Due {dueLabel}
          </Text>
        ) : null}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingBottom: scrollBottomPadding + 48,
        }}
      >
        {stages.length === 0 ? (
          <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900 mb-6">
            <Text className="text-white text-lg mt-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              No Stages Yet
            </Text>
            <Text className="text-center mt-2" style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
              Stages will appear here once the project is activated
            </Text>
          </View>
        ) : allDone ? (
          <View className="bg-green-900/40 rounded-2xl p-5 mb-6 border border-green-500">
            <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
              All steps done. Well done!
            </Text>
          </View>
        ) : currentStage ? (
          <View className="bg-[#1E3A5F] rounded-2xl p-4 mb-6 border-2 border-blue-600">
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#93C5FD' }}>
              DO THIS NOW · STEP {focusIndex + 1} OF {stages.length}
            </Text>
            <Text className="text-white mt-2" numberOfLines={2} style={{ fontFamily: 'Poppins_700Bold', fontSize: 21, lineHeight: 28 }}>
              {currentStage.name}
            </Text>
            <Text className="mt-2 mb-4" style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, lineHeight: 22, color: '#CBD5E1' }}>
              {currentStage.status === 'pending_homeowner_approval'
                ? 'Waiting for the homeowner to check your work.'
                : currentStage.status === 'in_progress'
                  ? 'When you finish, take photos so the homeowner can see.'
                  : 'Start this step when you are ready.'}
            </Text>
            {currentStage.status === 'not_started' ? (
              <TouchableOpacity
                onPress={() => handleStartStage(currentStage.id)}
                disabled={updateStageStatusMutation.isPending}
                accessibilityRole="button"
                className="bg-blue-600 rounded-2xl px-4 flex-row items-center justify-center"
                style={{ minHeight: 64, opacity: updateStageStatusMutation.isPending ? 0.7 : 1 }}
              >
                {updateStageStatusMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Play size={20} color="#FFFFFF" strokeWidth={2.2} />
                    <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Start this step
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
            {currentStage.status === 'in_progress' ? (
              <>
                <TouchableOpacity
                  onPress={() => openStage(currentStage)}
                  accessibilityRole="button"
                  className="bg-blue-600 rounded-2xl px-4 flex-row items-center justify-center"
                  style={{ minHeight: 64 }}
                >
                  <Camera size={20} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Take photos of this step
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openStage(currentStage)}
                  accessibilityRole="button"
                  className="rounded-2xl px-4 flex-row items-center justify-center mt-3"
                  style={{ minHeight: 64, backgroundColor: '#334E73' }}
                >
                  <CheckCircle size={20} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    This step is done
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
            {currentStage.status === 'pending_homeowner_approval' ? (
              <TouchableOpacity
                onPress={() => openStage(currentStage)}
                accessibilityRole="button"
                className="rounded-2xl px-4 flex-row items-center justify-center"
                style={{ minHeight: 64, backgroundColor: '#334E73' }}
              >
                <Eye size={20} color="#FFFFFF" strokeWidth={2.2} />
                <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  See this step
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {stages.length > 0 ? (
          <View className="bg-[#1E3A5F] rounded-2xl p-4 mb-6 border border-blue-900">
            <Text className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Your job steps
            </Text>
            {doneStages.map((stage: any) => {
              const stepNumber = stages.findIndex((item: any) => item.id === stage.id) + 1;
              return (
              <TouchableOpacity
                key={stage.id}
                onPress={() => openStage(stage)}
                accessibilityRole="button"
                className="flex-row items-center py-2"
                style={{ minHeight: 56 }}
              >
                <View className="w-8 h-8 rounded-full bg-green-600 items-center justify-center mr-3">
                  <CheckCircle size={18} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <View className="flex-1">
                  <Text className="text-white" numberOfLines={2} style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, lineHeight: 22 }}>
                    {stepNumber}. {stage.name}
                  </Text>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
                    Done · {naira(stage.estimatedCost)}
                  </Text>
                </View>
              </TouchableOpacity>
              );
            })}
            {currentStage ? (
              <View className="flex-row items-center py-2" style={{ minHeight: 56 }}>
                <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-3">
                  <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                    {focusIndex + 1}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white" numberOfLines={2} style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, lineHeight: 22 }}>
                    {focusIndex + 1}. {currentStage.name}
                  </Text>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
                    {currentStage.status === 'pending_homeowner_approval' ? 'Waiting for homeowner' : 'Doing now'} · {naira(currentStage.estimatedCost)}
                  </Text>
                </View>
              </View>
            ) : null}
            {lockedStages.length > 0 ? (
              <>
                <TouchableOpacity
                  onPress={() => setStepsExpanded((open) => !open)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: stepsExpanded }}
                  className="flex-row items-center py-2"
                  style={{ minHeight: 56 }}
                >
                  <View className="w-8 h-8 rounded-full bg-[#0A1628] items-center justify-center mr-3">
                    <Lock size={16} color="#CBD5E1" strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>
                      {lockedStages.length === 1 ? '1 more step' : `${lockedStages.length} more steps`}
                    </Text>
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
                      Open after step {focusIndex + 1} · Tap to see
                    </Text>
                  </View>
                </TouchableOpacity>
                {stepsExpanded ? lockedStages.map((stage: any) => (
                  <View key={stage.id} className="pl-11 py-2">
                    <Text numberOfLines={2} style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, lineHeight: 22, color: '#CBD5E1' }}>
                      {stage.name}
                    </Text>
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
                      {naira(stage.estimatedCost)}
                    </Text>
                  </View>
                )) : null}
              </>
            ) : null}
            <Text className="mt-3 mb-2" style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#CBD5E1' }}>
              Job {progress}% done
            </Text>
            <View className="bg-[#0A1628] rounded-full overflow-hidden" style={{ height: 10 }}>
              <View className="bg-green-500 rounded-full" style={{ height: 10, width: `${progress}%` }} />
            </View>
          </View>
        ) : null}

        <View className="bg-[#1E3A5F] rounded-2xl p-4 mb-6 border border-blue-900">
          <Text className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Money for this job
          </Text>
          {jobMoney ? (
            <>
              <View className="flex-row mb-3">
                <View className="flex-1 bg-[#0A1628] rounded-xl p-3 mr-2" style={{ minHeight: 88 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#CBD5E1' }}>Paid to you</Text>
                  <Text className="text-white mt-1" numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'Poppins_700Bold', fontSize: 20 }}>
                    {naira(jobMoney.paidToYou ?? jobMoney.earned)}
                  </Text>
                </View>
                <View className="flex-1 bg-[#0A1628] rounded-xl p-3 ml-2" style={{ minHeight: 88 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#CBD5E1' }}>Left on this job</Text>
                  <Text className="text-white mt-1" numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'Poppins_700Bold', fontSize: 20 }}>
                    {naira(jobMoney.leftOnThisJob ?? jobMoney.pending)}
                  </Text>
                </View>
              </View>
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#CBD5E1' }}>
                Full job price {naira(jobMoney.fullJobPrice ?? jobMoney.budget ?? project.budget)}
              </Text>
              <Text className="mt-2" style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#CBD5E1' }}>
                Paid to shops {naira(jobMoney.paidToShops)}
              </Text>
              <Text className="mt-1" style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
                Shop pays are separate from paid to you.
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#CBD5E1' }}>
              Full job price {naira(project.budget)}
            </Text>
          )}
        </View>

        <View className="bg-[#1E3A5F] rounded-2xl p-4 mb-6 border border-blue-900">
          <Text className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Homeowner: {homeownerName}
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={handleContactHomeowner}
              accessibilityRole="button"
              className="flex-1 bg-blue-600 rounded-2xl px-3 flex-row items-center justify-center mr-2"
              style={{ minHeight: 64 }}
            >
              <Phone size={20} color="#FFFFFF" strokeWidth={2.2} />
              <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openHomeownerChat}
              accessibilityRole="button"
              className="flex-1 rounded-2xl px-3 flex-row items-center justify-center ml-2"
              style={{ minHeight: 64, backgroundColor: '#16A34A' }}
            >
              <MessageCircle size={20} color="#FFFFFF" strokeWidth={2.2} />
              <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {homeownerPhotoUrls.length > 0 || hasPlan ? (
          <View className="mb-6">
            <Text className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Homeowner files
            </Text>
            <View className="flex-row" style={{ gap: 12 }}>
              {homeownerPhotoUrls.length > 0 ? (
                <TouchableOpacity
                  onPress={() => handleOpenPhoto(homeownerPhotoUrls[0])}
                  accessibilityRole="button"
                  className="flex-1 bg-[#1E3A5F] rounded-2xl px-3 flex-row items-center justify-center border border-blue-900"
                  style={{ minHeight: 56 }}
                >
                  <Camera size={18} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {homeownerPhotoUrls.length === 1 ? '1 photo' : `${homeownerPhotoUrls.length} photos`}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {hasPlan ? (
                <TouchableOpacity
                  onPress={handleDownloadPDF}
                  accessibilityRole="button"
                  className="flex-1 bg-[#1E3A5F] rounded-2xl px-3 flex-row items-center justify-center border border-blue-900"
                  style={{ minHeight: 56 }}
                >
                  <FileText size={18} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Open plan
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        <View className="bg-[#1E3A5F] rounded-2xl p-4 border border-blue-900">
          <Text className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Remember
          </Text>
          {[
            { icon: Camera, label: 'Take photos of every step' },
            { icon: MessageCircle, label: 'Tell the homeowner what you did' },
            { icon: ThumbsUp, label: 'Do good, clean work' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.label} className="flex-row items-center mb-3" style={{ minHeight: 56 }}>
                <View className="w-10 h-10 rounded-full bg-[#0A1628] items-center justify-center mr-3">
                  <Icon size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <Text className="text-white flex-1" style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, lineHeight: 22 }}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
