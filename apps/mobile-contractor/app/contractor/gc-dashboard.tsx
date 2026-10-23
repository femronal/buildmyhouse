import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Bell, Briefcase, Clock, Users, ChevronRight, MessageCircle, FileText, User, AlertCircle, X, Trash2, Lock, DollarSign, Camera, Eye, Check } from "lucide-react-native";
import { useState, useMemo, useEffect } from "react";
import { usePendingRequests, useGCEarnings } from "../../hooks/useGC";
import { useActiveProjects, useUnpaidProjects, useDeleteProject } from "../../hooks/useProjects";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useUserConversations } from "../../hooks/useChat";
import { useAppAlert } from "../../components/AppAlertProvider";
import { useGCProfile } from "@/hooks/useGCProfile";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useResponsivePadding } from "@/lib/responsive-layout";
import { needsContractorIntroOnboarding } from "@/lib/onboarding";
import { api } from "@/lib/api";
import { clearAuthToken } from "@/lib/auth";
import { InviteClientSheet } from "@/components/InviteClientSheet";
import { buildGcWhatsAppSupportUrl } from "@/lib/whatsapp-support";

const shortName = (fullName?: string | null) => {
  const full = String(fullName || '').trim();
  if (!full) return '';
  const [first, last] = full.split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
};

const acceptedQuoteRequest = (project: any) =>
  (project?.projectRequests || []).find((item: any) => item?.status === 'accepted' && !item?.stageId);

export default function GCDashboardScreen() {
  const DASHBOARD_COMPLETED_VISIBILITY_HOURS = 48;
  const router = useRouter();
  const introParams = useLocalSearchParams<{ listingIntro?: string | string[] }>();
  const listingIntro = (Array.isArray(introParams.listingIntro) ? introParams.listingIntro[0] : introParams.listingIntro) === '1';
  const [showListingIntro, setShowListingIntro] = useState(false);
  const [listingIntroDismissed, setListingIntroDismissed] = useState(false);
  const [showInviteClient, setShowInviteClient] = useState(false);
  const [listingCount, setListingCount] = useState(0);
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stackBottomNav");
  const { showAlert } = useAppAlert();
  const { data: profileData } = useGCProfile();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: currentUser, isLoading: loadingCurrentUser } = useCurrentUser();
  const isAuthenticated = !!currentUser?.id;
  const { data: unreadData } = useUnreadCount(isAuthenticated);
  const notificationUnreadCount = unreadData?.unreadCount ?? 0;
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [selectedUnpaidProject, setSelectedUnpaidProject] = useState<any | null>(null);
  const [showPausedModal, setShowPausedModal] = useState(false);
  const [selectedPausedProject, setSelectedPausedProject] = useState<any | null>(null);
  const [showAuthPromptModal, setShowAuthPromptModal] = useState(false);
  const deleteProjectMutation = useDeleteProject();

  useEffect(() => {
    if (loadingCurrentUser) return;
    if (!currentUser?.id) {
      void clearAuthToken();
      router.replace('/');
      return;
    }
    if (needsContractorIntroOnboarding(currentUser)) {
      router.replace('/contractor/onboarding');
    }
  }, [currentUser, loadingCurrentUser, router]);

  useEffect(() => {
    if (!listingIntro || loadingCurrentUser || !currentUser) return;
    if ((currentUser as { listingManagementIntroSeenAt?: string | null }).listingManagementIntroSeenAt) return;
    const timer = setTimeout(() => setShowListingIntro(true), 5000);
    void api.get('/artisans/my-listings').then((rows) => setListingCount(Array.isArray(rows) ? rows.length : 0)).catch(() => setListingCount(0));
    return () => clearTimeout(timer);
  }, [listingIntro, loadingCurrentUser, currentUser]);

  useEffect(() => {
    if (loadingCurrentUser || !currentUser) return;
    const profile = currentUser as { hasClaimedListing?: boolean; inviteClientPromptSeenAt?: string | null; listingManagementIntroSeenAt?: string | null };
    if (!profile.hasClaimedListing || profile.inviteClientPromptSeenAt) return;
    const introPending = listingIntro && !listingIntroDismissed && !profile.listingManagementIntroSeenAt;
    if (introPending || showListingIntro) return;
    const delay = listingIntro ? 1000 : 3000;
    const timer = setTimeout(() => setShowInviteClient(true), delay);
    return () => clearTimeout(timer);
  }, [loadingCurrentUser, currentUser, listingIntro, listingIntroDismissed, showListingIntro]);

  const dismissListingIntro = async (openListings: boolean) => {
    setShowListingIntro(false);
    setListingIntroDismissed(true);
    try {
      await api.post('/artisans/my-listings/intro-seen', {});
    } catch {
      // The modal should still close if the acknowledgement cannot be saved yet.
    }
    if (openListings) router.push('/contractor/listings' as any);
  };
  
  // Fetch real pending requests
  const { data: pendingRequests = [] } = usePendingRequests();

  // Fetch real projects
  const { data: activeProjects = [], isLoading: loadingActive } = useActiveProjects();
  const { data: unpaidProjects = [], isLoading: loadingUnpaid } = useUnpaidProjects();
  const { data: earnings = [], isLoading: loadingEarnings } = useGCEarnings();
  
  // Fetch conversations with unread counts
  const { data: conversations = [] } = useUserConversations(isAuthenticated);
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
  }, [conversations]);

  const handleUnpaidProjectPress = (project: any) => {
    setSelectedUnpaidProject(project);
    setShowUnpaidModal(true);
  };

  const handleCloseModal = () => {
    setShowUnpaidModal(false);
    setSelectedUnpaidProject(null);
  };

  const handlePausedProjectPress = (project: any) => {
    setSelectedPausedProject(project);
    setShowPausedModal(true);
  };

  const handleDeleteSelectedUnpaidProject = async () => {
    if (!selectedUnpaidProject?.id) return;

    showAlert(
      'Delete Unpaid Project?',
      `This will permanently delete "${selectedUnpaidProject.name}".\n\nOnly do this if the homeowner has taken too long to pay. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProjectMutation.mutateAsync(selectedUnpaidProject.id);
              showAlert('Deleted', 'Project deleted successfully.', [{ text: 'OK' }]);
              handleCloseModal();
            } catch (error: any) {
              showAlert('Delete Failed', error?.message || 'Failed to delete project. Please try again.', [
                { text: 'OK' },
              ]);
            }
          },
        },
      ],
    );
  };

  const isCompletedProject = (project: any) =>
    project?.status === 'completed' || Number(project?.progress || 0) >= 100;

  const isWithinCompletedDashboardWindow = (project: any) => {
    if (!isCompletedProject(project)) return true;
    const referenceDate =
      project?.completionDate || project?.updatedAt || project?.respondedAt;
    if (!referenceDate) return false;
    const completedAt = new Date(referenceDate).getTime();
    if (!Number.isFinite(completedAt) || completedAt <= 0) return false;
    const elapsedMs = Date.now() - completedAt;
    return (
      elapsedMs <= DASHBOARD_COMPLETED_VISIBILITY_HOURS * 60 * 60 * 1000
    );
  };

  const dashboardProjects = activeProjects.filter((project: any) =>
    isWithinCompletedDashboardWindow(project),
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = shortName(profileData?.fullName) || 'there';

  const paidToYou = useMemo(
    () => earnings.reduce((sum, item) => sum + (Number(item.paidToYou ?? item.earned) || 0), 0),
    [earnings],
  );
  const leftOnThisJob = useMemo(
    () => earnings.reduce((sum, item) => sum + (Number(item.leftOnThisJob ?? item.pending) || 0), 0),
    [earnings],
  );

  const nextJobs = useMemo(() => {
    const byId = new Map<string, any>();
    for (const project of unpaidProjects) byId.set(project.id, project);
    for (const project of dashboardProjects) byId.set(project.id, project);
    return Array.from(byId.values())
      .map((project) => {
        const progress = Math.max(0, Math.min(100, Math.round(Number(project?.progress || 0))));
        const status = String(project?.status || '');
        const quote = acceptedQuoteRequest(project);
        let line = 'Waiting for homeowner';
        let button = 'See job';
        let action: 'price' | 'photos' | 'paused' | 'unpaid' | 'job' = 'unpaid';
        let priority = 3;
        if (status === 'paused') {
          line = 'Job paused. Talk to BMH';
          button = 'See why';
          action = 'paused';
          priority = 2;
        } else if (status === 'completed' || progress >= 100) {
          line = 'Job finished';
          button = 'See job';
          action = 'job';
          priority = 4;
        } else if (status === 'inspection' && quote?.id) {
          line = 'Visit the site and send your price';
          button = 'Send your price';
          action = 'price';
          priority = 0;
        } else if (status === 'pending_payment') {
          line = 'Waiting for homeowner to pay';
          button = 'See job';
          action = 'unpaid';
          priority = 3;
        } else if (status === 'active') {
          line = "Send photos of today's work";
          button = 'Take photos now';
          action = 'photos';
          priority = 1;
        }
        return { project, progress, line, button, action, priority, quoteId: quote?.id };
      })
      .sort((a, b) => a.priority - b.priority || String(a.project?.name || '').localeCompare(String(b.project?.name || '')));
  }, [dashboardProjects, unpaidProjects]);

  const openNextJob = (job: (typeof nextJobs)[number]) => {
    const project = job.project;
    if (job.action === 'paused') {
      handlePausedProjectPress(project);
      return;
    }
    if (job.action === 'price' && job.quoteId) {
      router.push(`/contractor/gc-request-detail?id=${job.quoteId}&step=quote&projectId=${project.id}` as any);
      return;
    }
    if (job.action === 'unpaid') {
      handleUnpaidProjectPress(project);
      return;
    }
    router.push(`/contractor/gc-project-detail?id=${project.id}`);
  };

  const openWhatsAppHelp = () => {
    Linking.openURL(buildGcWhatsAppSupportUrl()).catch(() => {});
  };

  if (loadingCurrentUser || !isAuthenticated) {
    return (
      <View className="flex-1 bg-[#0A1628] justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View
        className="pb-4 flex-row items-center justify-between"
        style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
      >
        <View className="flex-1 min-w-0 mr-3">
          <Text className="text-slate-300 text-base" style={{ fontFamily: 'Poppins_500Medium' }}>
            {greeting} 👋
          </Text>
          <Text className="text-white text-3xl" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View className="flex-row flex-shrink-0">
          <TouchableOpacity
            onPress={() => router.push('/contractor/chat')}
            accessibilityLabel="Messages"
            className="w-12 h-12 bg-[#1E3A5F] rounded-full items-center justify-center mr-2"
          >
            <MessageCircle size={22} color="#FFFFFF" strokeWidth={2} />
            {totalUnreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full items-center justify-center border-2 border-[#0A1628]">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/contractor/gc-notifications')}
            accessibilityLabel="Notifications"
            className="w-12 h-12 bg-[#1E3A5F] rounded-full items-center justify-center mr-2"
          >
            <Bell size={22} color="#FFFFFF" strokeWidth={2} />
            {notificationUnreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full items-center justify-center border-2 border-[#0A1628]">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!isAuthenticated) {
                setShowAuthPromptModal(true);
                return;
              }
              router.push('/contractor/gc-profile');
            }}
            accessibilityLabel="Profile"
            className="w-12 h-12 bg-[#1E3A5F] rounded-full items-center justify-center"
          >
            <User size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: horizontalPad,
        }}
      >
        {(profileData?.verified || activeProjects.length > 0) && bankAccounts.length === 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/contractor/gc-profile')}
            className="mb-4 bg-white rounded-2xl p-4 border border-black"
          >
            <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              Add your bank details so we can pay you
            </Text>
            <Text className="text-gray-700 text-base mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              This is only needed after BuildMyHouse has approved you.
            </Text>
          </TouchableOpacity>
        ) : null}
        {pendingRequests.length > 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/contractor/gc-requests')}
            accessibilityRole="button"
            accessibilityLabel={`${pendingRequests.length} new jobs waiting`}
            className="bg-amber-500 rounded-2xl px-5 mb-6 flex-row items-center"
            style={{ minHeight: 72 }}
          >
            <Text className="text-black text-3xl mr-3" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
              {pendingRequests.length}
            </Text>
            <Text className="text-black text-base flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>
              {pendingRequests.length === 1 ? 'New job waiting for you' : 'New jobs waiting for you'}
            </Text>
            <ChevronRight size={28} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : null}

        <Text className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
          Do this next
        </Text>
        {loadingActive || loadingUnpaid ? (
          <View className="py-10 items-center mb-6">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : nextJobs.length === 0 ? (
          <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-6 border border-blue-900">
            <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              No jobs to do right now
            </Text>
            <Text className="text-slate-300 text-base mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              New requests and jobs you are working on will show up here.
            </Text>
          </View>
        ) : (
          nextJobs.map((job) => {
            const homeowner = shortName(job.project?.homeowner?.fullName) || 'the homeowner';
            const urgent = job.action === 'photos' || job.action === 'price';
            const StatusIcon = job.action === 'photos' ? Camera : job.action === 'price' ? DollarSign : job.action === 'paused' ? Lock : job.action === 'job' ? Check : Clock;
            const ButtonIcon = job.action === 'photos' ? Camera : job.action === 'price' ? DollarSign : job.action === 'paused' ? Lock : Eye;
            return (
              <View key={job.project.id} className="bg-[#1E3A5F] rounded-2xl p-4 mb-4 border border-blue-900">
                <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {job.project.name}
                </Text>
                <Text className="text-slate-300 text-base mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                  For {homeowner}
                </Text>
                <View className="bg-[#0A1628] rounded-xl px-4 py-3 mb-3 flex-row items-center" style={{ minHeight: 56 }}>
                  <StatusIcon size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-white text-base ml-3 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {job.line}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openNextJob(job)}
                  accessibilityRole="button"
                  className={`${urgent ? 'bg-blue-600' : 'bg-[#0A1628] border border-blue-800'} rounded-2xl px-4 flex-row items-center justify-center`}
                  style={{ minHeight: 64 }}
                >
                  <ButtonIcon size={20} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {job.button}
                  </Text>
                </TouchableOpacity>
                <Text className="text-slate-300 text-base mt-3 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Job {job.progress}% done
                </Text>
                <View className="h-3 bg-[#0A1628] rounded-full overflow-hidden">
                  <View className="h-full bg-green-500 rounded-full" style={{ width: `${job.progress}%` }} />
                </View>
              </View>
            );
          })
        )}

        <Text className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
          Your money
        </Text>
        <View className="flex-row mb-6">
          <TouchableOpacity
            onPress={() => router.push('/contractor/gc-earnings')}
            accessibilityRole="button"
            accessibilityLabel="Paid to you"
            className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 mr-2 border border-blue-900"
            style={{ minHeight: 112 }}
          >
            <View className="flex-row items-center mb-3">
              <Check size={18} color="#4ADE80" strokeWidth={2.5} />
              <Text className="text-slate-300 text-base ml-2 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                Paid to you
              </Text>
            </View>
            {loadingEarnings ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-xl" numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'Poppins_700Bold' }}>
                ₦{paidToYou.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/contractor/gc-earnings')}
            accessibilityRole="button"
            accessibilityLabel="Left on this job"
            className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 ml-2 border border-blue-900"
            style={{ minHeight: 112 }}
          >
            <View className="flex-row items-center mb-3">
              <Clock size={18} color="#FBBF24" strokeWidth={2.5} />
              <Text className="text-slate-300 text-base ml-2 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                Left on this job
              </Text>
            </View>
            {loadingEarnings ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-xl" numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'Poppins_700Bold' }}>
                ₦{leftOnThisJob.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={openWhatsAppHelp}
          accessibilityRole="button"
          accessibilityLabel="Help on WhatsApp"
          className="bg-green-500 rounded-full px-6 flex-row items-center justify-center self-center"
          style={{ minHeight: 64 }}
        >
          <MessageCircle size={20} color="#FFFFFF" strokeWidth={2.2} />
          <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Help on WhatsApp
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Unpaid Project Modal */}
      <Modal
        visible={showUnpaidModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center" style={{ paddingHorizontal: horizontalPad }}>
          <View className="bg-[#1E3A5F] rounded-3xl p-6 w-full max-w-md border border-orange-600/50">
            {/* Warning Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-orange-600/20 rounded-full items-center justify-center mb-3">
                <AlertCircle size={32} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text className="text-white text-xl text-center mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Project Dashboard Unavailable
              </Text>
              <Text className="text-gray-300 text-sm text-center leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                The project dashboard for &quot;{selectedUnpaidProject?.name || 'this project'}&quot; cannot be accessed at this time.
              </Text>
            </View>

            {/* Warning Message */}
            <View className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <View className="mr-2 mt-0.5">
                  <Text className="text-orange-400 text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>₦</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-orange-300 text-sm leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {selectedUnpaidProject?.status === 'inspection'
                      ? 'Inspect the property with the homeowner and agree the price. Submit that quote before they are asked to fund the project.'
                      : 'The invoice is in the homeowner’s email. Once they reply with a receipt and BuildMyHouse confirms that payment, you can open the project dashboard.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Project Info */}
            {selectedUnpaidProject && (
              <View className="bg-[#0A1628] rounded-xl p-4 mb-6 border border-blue-900">
                <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Project Details
                </Text>
                <Text className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {selectedUnpaidProject.name}
                </Text>
                <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {selectedUnpaidProject.homeowner?.fullName || 'Unknown Client'}
                </Text>
                <View className="flex-row items-center justify-between pt-2 border-t border-blue-900">
                  <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Budget
                  </Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    ₦{(selectedUnpaidProject.budget || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {selectedUnpaidProject?.status === 'inspection' ? (
              <TouchableOpacity
                onPress={() => {
                  const quoteRequest = (selectedUnpaidProject.projectRequests || []).find((item: any) => item.status === 'accepted' && !item.stageId);
                  if (!quoteRequest?.id) {
                    showAlert('Quote', 'Open the original request to submit the agreed quote.');
                    return;
                  }
                  setShowUnpaidModal(false);
                  router.push(`/contractor/gc-request-detail?id=${quoteRequest.id}&step=quote&projectId=${selectedUnpaidProject.id}` as any);
                }}
                className="bg-white rounded-xl py-4 items-center mb-3"
              >
                <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Submit agreed quote
                </Text>
              </TouchableOpacity>
            ) : null}
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={handleCloseModal}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 bg-blue-600 rounded-xl py-4 items-center"
                style={{ opacity: deleteProjectMutation.isPending ? 0.6 : 1 }}
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteSelectedUnpaidProject}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 bg-red-600/20 border border-red-600/50 rounded-xl py-4 items-center flex-row justify-center"
                style={{ opacity: deleteProjectMutation.isPending ? 0.6 : 1 }}
              >
                {deleteProjectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash2 size={18} color="#EF4444" strokeWidth={2.5} />
                    <Text className="text-red-400 text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Delete
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paused Project Modal */}
      <Modal
        visible={showPausedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPausedModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center" style={{ paddingHorizontal: horizontalPad }}>
          <View className="bg-[#1E3A5F] rounded-3xl p-6 w-full max-w-md border border-orange-600/50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                Project paused
              </Text>
              <TouchableOpacity
                onPress={() => setShowPausedModal(false)}
                className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
              >
                <X size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-300 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Admin has temporarily paused{selectedPausedProject?.name ? ` “${selectedPausedProject.name}”` : ' this project'} while an issue is reviewed.
            </Text>

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

            <View className="bg-[#0A1628] border border-blue-900 rounded-2xl p-4">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                What you should do now
              </Text>
              <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                Please wait while admin resolves the issue. You’ll be able to continue once the project is activated again.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowPausedModal(false)}
              className="bg-blue-600 rounded-2xl py-4 items-center mt-5"
            >
              <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                Okay, I’ll wait for admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAuthPromptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAuthPromptModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center" style={{ paddingHorizontal: horizontalPad }}>
          <View className="bg-[#1E3A5F] rounded-3xl p-6 w-full max-w-md border border-blue-700">
            <Text className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Account required
            </Text>
            <Text className="text-gray-300 text-sm mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              Sign up or sign in to open your profile and start handling projects.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAuthPromptModal(false);
                router.push('/login');
              }}
              className="bg-blue-600 rounded-xl py-3 px-4 mb-3"
            >
              <Text className="text-white text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                Sign up / Sign in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAuthPromptModal(false)}
              className="border border-blue-800 rounded-xl py-3 px-4"
            >
              <Text className="text-gray-300 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation - Bigger, Clearer */}
      <View
        className="flex-row bg-[#0A1628] border-t border-blue-900 py-4"
        style={{ paddingHorizontal: Math.max(horizontalPad - 4, 12) }}
      >
        <TouchableOpacity 
          onPress={() => router.push('/contractor/gc-dashboard')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-blue-600/20 mb-1">
            <Briefcase size={30} color="#3B82F6" strokeWidth={3} />
          </View>
          <Text className="text-blue-400 text-base mt-1" style={{ fontFamily: 'Poppins_700Bold' }}>Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity  
          onPress={() => router.push('/contractor/chat')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <Users size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
        
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Clients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            router.push('/contractor/gc-requests');
          }}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1 relative">
            <Bell size={30} color="#6B7280" strokeWidth={2.5} />
            {pendingRequests.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center border-2 border-[#0A1628]">
              </View>
            )}
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/contractor/gc-plans')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <FileText size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/contractor/gc-earnings')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <DollarSign size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Earnings</Text>
        </TouchableOpacity>
      </View>
      <InviteClientSheet visible={showInviteClient} onClose={() => setShowInviteClient(false)} />
      <Modal visible={showListingIntro} transparent animationType="fade" onRequestClose={() => dismissListingIntro(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#171717' }}>Manage your listings</Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22, color: '#525252', marginTop: 12 }}>
              Your artisan listing is now connected to this account. You can update your business information, add photos, manage repair services and improve your Trust Score here.
            </Text>
            <TouchableOpacity onPress={() => dismissListingIntro(true)} style={{ marginTop: 20, backgroundColor: '#171717', borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>{listingCount > 1 ? 'Manage my listings' : 'Manage my listing'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => dismissListingIntro(false)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#171717' }}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
