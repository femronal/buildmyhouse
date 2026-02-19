import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Linking, ActivityIndicator, Modal, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Camera, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  ChevronRight,
  Plus,
  AlertCircle,
  FileText,
  Phone,
  X,
  Home,
  Lock,
  Star
} from "lucide-react-native";
import { useState, useMemo } from "react";
import { useProject, useUpdateStageStatus } from "@/hooks/useProjects";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from "@/services/chatService";
import { useConversationUnreadCount } from "@/hooks/useChat";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Helper to get project image
const getProjectImage = (project: any) => {
  // Use a default construction image for now
  return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80";
};

// Format date helper
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export default function GCProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = id as string;
  const queryClient = useQueryClient();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [confirmations, setConfirmations] = useState({
    stageComplete: false,
    evidenceProvided: false,
  });
  
  const { data: project, isLoading: projectLoading, error: projectError, refetch } = useProject(projectId || null);
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
  
  // Reviews/marketplace removed for MVP
  const projectReview = null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-600/20', text: 'text-green-400', icon: '#10B981' };
      case 'in_progress': return { bg: 'bg-blue-600/20', text: 'text-blue-400', icon: '#3B82F6' };
      default: return { bg: 'bg-gray-600/20', text: 'text-gray-400', icon: '#6B7280' };
    }
  };

  const handleDownloadPDF = async () => {
    if (!project?.planPdfUrl) {
      Alert.alert('No Plan Available', 'The project plan PDF is not available.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(project.planPdfUrl);
      if (supported) {
        await Linking.openURL(project.planPdfUrl);
      } else {
        Alert.alert('Error', 'Cannot open PDF URL');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
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

  const handleCompleteStage = (stage: any) => {
    setSelectedStage(stage);
    setConfirmations({ stageComplete: false, evidenceProvided: false });
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!confirmations.stageComplete || !confirmations.evidenceProvided) {
      Alert.alert('Confirmation Required', 'Please confirm both conditions before marking the stage as complete.');
      return;
    }

    if (!id || !selectedStage) return;

    try {
      await updateStageStatusMutation.mutateAsync({
        projectId: id as string,
        stageId: selectedStage.id,
        status: 'completed',
      });
      setShowCompleteModal(false);
      setSelectedStage(null);
      setConfirmations({ stageComplete: false, evidenceProvided: false });
      refetch(); // Refetch to update UI
      Alert.alert('Success', 'Stage marked as complete successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to complete stage. Please try again.');
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
      <View className="flex-1 bg-[#0A1628] items-center justify-center px-6">
        <Modal visible={true} transparent={true} animationType="fade">
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
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
      <View className="flex-1 bg-[#0A1628] items-center justify-center px-6">
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
  const homeownerInitials = getInitials(homeowner?.fullName || 'Homeowner');
  
  // Check if project is complete (all stages completed)
  const isProjectComplete = stages.length > 0 && stages.every((stage: any) => stage.status === 'completed');

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
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
            onPress={() => {
              const homeownerId = (project as any)?.homeownerId || (project as any)?.homeowner?.id;
              const homeownerName = (project as any)?.homeowner?.fullName || 'Homeowner';
              if (homeownerId) {
                router.push(`/contractor/chat?projectId=${project.id}&userId=${homeownerId}&name=${encodeURIComponent(homeownerName)}`);
              } else {
                router.push(`/contractor/chat?projectId=${project.id}`);
              }
            }}
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
        
        <Text 
          className="text-3xl text-white mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          {project.name}
        </Text>
        <View className="flex-row items-center mb-4">
          <MapPin size={16} color="#6B7280" strokeWidth={2} />
          <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            {project.address}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Homeowner Info */}
        <View className="bg-[#1E3A5F] rounded-xl p-4 mb-6 border border-blue-900">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{homeownerInitials}</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{homeowner?.fullName || 'Homeowner'}</Text>
              <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Homeowner</Text>
            </View>
            <TouchableOpacity 
              onPress={handleContactHomeowner}
              className="bg-blue-600 rounded-full px-4 py-2 flex-row items-center"
            >
              <Phone size={14} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row mb-6">
          <View className="flex-1 bg-[#1E3A5F] rounded-xl p-4 mr-2 border border-blue-900">
            <View className="flex-row items-center mb-1">
              <DollarSign size={16} color="#10B981" strokeWidth={2} />
              <Text className="text-gray-400 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text>
            </View>
            <Text className="text-white text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
              ${(project.budget || 0).toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 bg-[#1E3A5F] rounded-xl p-4 mx-2 border border-blue-900">
            <View className="flex-row items-center mb-1">
              <Calendar size={16} color="#F59E0B" strokeWidth={2} />
              <Text className="text-gray-400 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>Due</Text>
            </View>
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {formatDate(project.dueDate)}
            </Text>
          </View>
          <View className="flex-1 bg-blue-600 rounded-xl p-4 ml-2">
            <View className="flex-row items-center mb-1">
              <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white/70 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>Progress</Text>
            </View>
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
              {project.progress || 0}%
            </Text>
          </View>
        </View>

        {/* Progress Timeline - Stages */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Calendar size={24} color="#FFFFFF" strokeWidth={2} />
              <Text 
                className="text-xl text-white ml-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Project Stages
              </Text>
            </View>
            <Text 
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {stages.filter((s: any) => s.status === 'completed').length}/{stages.length} Complete
            </Text>
          </View>
          
          {stages.length === 0 ? (
            <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900">
              <Clock size={48} color="#6B7280" strokeWidth={1.5} />
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
              const canStart = stage.status === 'not_started' && canStartStage(index, stages);
              const isLocked = stage.status === 'not_started' && !canStartStage(index, stages);

              const getDisplayStatus = (status: string) => {
                switch (status) {
                  case 'completed':
                    return 'complete';
                  case 'in_progress':
                    return 'in-progress';
                  default:
                    return 'not-started';
                }
              };

              const getStatusBadge = (status: string) => {
                switch (status) {
                  case 'completed':
                    return (
                      <View className="bg-green-600 rounded-full px-3 py-1">
                        <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>Complete</Text>
                      </View>
                    );
                  case 'in_progress':
                    return (
                      <View className="bg-blue-600 rounded-full px-3 py-1">
                        <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>In Progress</Text>
                      </View>
                    );
                  default:
                    return (
                      <View className="bg-gray-600/20 rounded-full px-3 py-1">
                        <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>Not Started</Text>
                      </View>
                    );
                }
              };

              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'completed':
                    return <CheckCircle size={20} color="#10B981" strokeWidth={2} />;
                  case 'in_progress':
                    return <Clock size={20} color="#3B82F6" strokeWidth={2} />;
                  default:
                    return <View className="w-10 h-10 bg-gray-600/20 rounded-full items-center justify-center">
                      <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>{index + 1}</Text>
                    </View>;
                }
              };

              return (
                <TouchableOpacity
                  key={stage.id}
                  onPress={() => {
                    if (isClickable) {
                      router.push(`/contractor/stage-detail?stageId=${stage.id}&name=${encodeURIComponent(stage.name)}&status=${getDisplayStatus(stage.status)}&projectId=${projectId}`);
                    }
                  }}
                  disabled={!isClickable && !canStart}
                  className={`bg-[#1E3A5F] rounded-xl p-4 mb-3 border border-blue-900 ${!isClickable && !canStart ? 'opacity-60' : ''}`}
                >
                  <View className="flex-row items-center">
                    {getStatusIcon(stage.status)}
                    <View className="flex-1 ml-3">
                      <Text className={`text-base ${isClickable ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>{stage.name}</Text>
                      <Text className={`text-sm ${isClickable ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                        ${(stage.estimatedCost || 0).toLocaleString()}
                      </Text>
                    </View>
                    {getStatusBadge(stage.status)}
                    {isClickable && (
                      <ChevronRight size={20} color="#6B7280" strokeWidth={2} className="ml-2" />
                    )}
                  </View>
                  
                  {isLocked && (
                    <View className="bg-gray-700/50 rounded-lg py-3 mt-3 items-center">
                      <Text className="text-gray-400 text-center text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                        Complete previous stage to unlock
                      </Text>
                    </View>
                  )}

                  {canStart && (
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleStartStage(stage.id);
                      }}
                      disabled={updateStageStatusMutation.isPending}
                      className={`bg-blue-600 rounded-lg py-3 mt-3 ${updateStageStatusMutation.isPending ? 'opacity-50' : ''}`}
                    >
                      {updateStageStatusMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Start Stage
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Project Rating Section */}
        <View className="mb-6">
          {isProjectComplete && projectReview && projectReview.rating ? (
            // Show actual review if project is complete and review exists
            <View className="bg-[#1E3A5F] rounded-xl p-5 border border-blue-900">
              <View className="flex-row items-center mb-3">
                <Star size={24} color="#FCD34D" strokeWidth={2} fill="#FCD34D" />
                <Text 
                  className="text-white text-lg ml-2"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Homeowner's Rating
                </Text>
              </View>
              
              {/* Star Display */}
              <View className="flex-row items-center mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    color={star <= (projectReview.rating || 0) ? "#FCD34D" : "#4B5563"}
                    strokeWidth={star <= (projectReview.rating || 0) ? 0 : 2}
                    fill={star <= (projectReview.rating || 0) ? "#FCD34D" : "transparent"}
                  />
                ))}
                <Text 
                  className="text-gray-300 ml-2"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {projectReview.rating} out of 5
                </Text>
              </View>

              {/* Feedback Display */}
              {projectReview.comment && (
                <View className="bg-[#0A1628] rounded-xl p-4 border border-blue-900">
                  <Text 
                    className="text-gray-300 text-sm"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    "{projectReview.comment}"
                  </Text>
                  {projectReview.user && (
                    <Text 
                      className="text-gray-500 text-xs mt-2"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      — {projectReview.user.fullName}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            // Show reminder message if project is not complete
            <View className="bg-[#1E3A5F] rounded-xl p-5 border border-blue-900">
              <View className="flex-row items-center mb-3">
                <AlertCircle size={24} color="#FCD34D" strokeWidth={2} />
                <Text 
                  className="text-white text-lg ml-2"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Project Review Reminder
                </Text>
              </View>
              
              <View className="bg-[#0A1628] rounded-xl p-4 border border-blue-900">
                <Text 
                  className="text-gray-300 text-sm leading-6"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Your work will be reviewed by the homeowner once all project stages are completed. Please maintain honesty and transparency throughout the building process by:
                </Text>
                <View className="mt-3 space-y-2">
                  <View className="flex-row items-start">
                    <Text className="text-blue-400 mr-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>•</Text>
                    <Text className="text-gray-300 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Providing accurate documentation (photos, videos, receipts) for each stage
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-blue-400 mr-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>•</Text>
                    <Text className="text-gray-300 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Communicating clearly with the homeowner about progress and any issues
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-blue-400 mr-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>•</Text>
                    <Text className="text-gray-300 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Ensuring quality workmanship that meets or exceeds specifications
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Completion Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCompleteModal}
        onRequestClose={() => {
          setShowCompleteModal(false);
          setSelectedStage(null);
          setConfirmations({ stageComplete: false, evidenceProvided: false });
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#1E3A5F] rounded-t-3xl p-6 max-h-[80%] border-t border-blue-900">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-black text-2xl mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Confirm Stage Completion
                </Text>
                <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {selectedStage?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowCompleteModal(false);
                  setSelectedStage(null);
                  setConfirmations({ stageComplete: false, evidenceProvided: false });
                }}
                className="ml-4"
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Warning */}
            <View className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-200">
              <View className="flex-row items-start">
                <AlertCircle size={20} color="#F59E0B" strokeWidth={2} className="mt-0.5" />
                <View className="flex-1 ml-3">
                  <Text className="text-yellow-800 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Important Confirmation Required
                  </Text>
                  <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Please confirm both conditions below before marking this stage as complete. This action will notify the homeowner.
                  </Text>
                </View>
              </View>
            </View>

            {/* Confirmation Checkboxes */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setConfirmations(prev => ({ ...prev, stageComplete: !prev.stageComplete }))}
                className="flex-row items-start mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <View className={`w-6 h-6 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                  confirmations.stageComplete ? 'bg-black border-black' : 'border-gray-400'
                }`}>
                  {confirmations.stageComplete && (
                    <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Stage is Truly Complete
                  </Text>
                  <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    I confirm that this stage of the building process has been fully completed according to specifications.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmations(prev => ({ ...prev, evidenceProvided: !prev.evidenceProvided }))}
                className="flex-row items-start p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <View className={`w-6 h-6 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                  confirmations.evidenceProvided ? 'bg-black border-black' : 'border-gray-400'
                }`}>
                  {confirmations.evidenceProvided && (
                    <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Evidence Provided to Homeowner
                  </Text>
                  <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    I confirm that the homeowner has been provided with sufficient evidence (pictures, videos, documents) documenting this building process stage.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowCompleteModal(false);
                  setSelectedStage(null);
                  setConfirmations({ stageComplete: false, evidenceProvided: false });
                }}
                className="flex-1 bg-gray-200 rounded-full py-4"
              >
                <Text className="text-black text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmComplete}
                disabled={!confirmations.stageComplete || !confirmations.evidenceProvided || updateStageStatusMutation.isPending}
                className={`flex-1 bg-black rounded-full py-4 ${
                  (!confirmations.stageComplete || !confirmations.evidenceProvided || updateStageStatusMutation.isPending) ? 'opacity-50' : ''
                }`}
              >
                {updateStageStatusMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Confirm & Complete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
