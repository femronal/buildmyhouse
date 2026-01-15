import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Camera,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  X,
  Trash2
} from "lucide-react-native";
import { useState, useRef, useEffect, useMemo } from "react";
import { chatService, Message } from "@/services/chatService";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { requestService } from "@/services/requestService";
import type { ProjectRequest } from "@/services/requestService";
import { AlertCircle, CheckCircle, XCircle, MessageCircle, ChevronRight, MapPin, DollarSign, Calendar, FileText } from "lucide-react-native";
import { useProject, useActiveProjects, useUnpaidProjects } from "@/hooks/useProjects";
import { useUserConversations } from "@/hooks/useChat";

// Mock data removed - using real data from API

export default function ContractorChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string | undefined;
  const userId = params.userId as string | undefined;
  const userName = params.name as string | undefined;
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearMessagesConfirm, setShowClearMessagesConfirm] = useState(false);
  const [isClearingMessages, setIsClearingMessages] = useState(false);

  // Get or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', projectId, userId, currentUser?.id],
    queryFn: async () => {
      if (!userId || !currentUser?.id) return null;
      return chatService.getOrCreateConversation(
        [userId, currentUser.id],
        projectId,
      );
    },
    enabled: !!userId && !!currentUser?.id,
  });

  // Fetch project details if projectId is provided
  const { data: project } = useProject(projectId || null);

  // Track if we've marked this conversation as read
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

  // Get messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      return chatService.getMessages(conversation.id);
    },
    enabled: !!conversation?.id,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Mark conversation as read once when user views it
  useEffect(() => {
    if (conversation?.id && messages.length > 0 && !hasMarkedAsRead) {
      const markAsRead = async () => {
        try {
          await chatService.markConversationAsRead(conversation.id);
          setHasMarkedAsRead(true);
          // Invalidate unread count query to update badge
          queryClient.invalidateQueries({ queryKey: ['conversation-unread-count', conversation.id] });
          queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
        } catch (error) {
          console.error('Error marking conversation as read:', error);
        }
      };
      markAsRead();
    }
  }, [conversation?.id, messages.length, hasMarkedAsRead, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id) throw new Error('No conversation found');
      return chatService.sendMessage(conversation.id, content);
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to send message');
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationIdToDelete: string) => {
      if (!conversationIdToDelete) throw new Error('No conversation ID provided');
      return chatService.deleteConversation(conversationIdToDelete);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['accepted-contractors'] });
      await queryClient.cancelQueries({ queryKey: ['conversation'] });
      
      // Get the previous state for rollback
      const previousAccepted = queryClient.getQueryData<any[]>(['accepted-contractors']);
      
      // Optimistically remove the specific conversation from the list
      // Match by both userId and projectId to ensure we remove the correct one
      if (previousAccepted && userId && projectId) {
        queryClient.setQueryData<any[]>(
          ['accepted-contractors'],
          previousAccepted.filter((contractor: any) => {
            // Keep contractors that don't match this specific conversation
            return !(contractor.id === userId && contractor.projectId === projectId);
          })
        );
      } else if (previousAccepted && userId) {
        // Fallback: if no projectId, remove first match with this userId
        const indexToRemove = previousAccepted.findIndex((c: any) => c.id === userId);
        if (indexToRemove !== -1) {
          queryClient.setQueryData<any[]>(
            ['accepted-contractors'],
            previousAccepted.filter((_, index) => index !== indexToRemove)
          );
        }
      }
      
      return { previousAccepted };
    },
    onSuccess: async () => {
      // Close modals first
      setShowDeleteConfirm(false);
      setShowOptionsModal(false);
      
      // Invalidate all related queries to ensure consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversation'] }),
        queryClient.invalidateQueries({ queryKey: ['messages'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['accepted-contractors'] }),
      ]);
      
      // Refetch to get updated list
      queryClient.refetchQueries({ queryKey: ['accepted-contractors'] });
      
      // Navigate back to messages list
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/contractor/chat');
      }
    },
    onError: (error: any, _, context) => {
      // Rollback optimistic update on error
      if (context?.previousAccepted) {
        queryClient.setQueryData(['accepted-contractors'], context.previousAccepted);
      }
      Alert.alert('Error', error?.message || 'Failed to delete conversation');
    },
  });

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // If projectId and userId are provided, show direct chat
  if (projectId && userId && userName) {
    if (conversationLoading) {
      return (
        <View className="flex-1 bg-[#0A1628] items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Loading conversation...
          </Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView 
        className="flex-1 bg-[#0A1628]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View className="pt-16 px-6 pb-4 flex-row items-center bg-[#0A1628] border-b border-blue-900">
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                // Navigate to messages list
                router.replace('/contractor/chat');
              }
            }}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <View className="flex-1 ml-3">
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{userName}</Text>
            <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
              {(() => {
                // Determine role based on project data
                if (project) {
                  const homeownerId = (project as any)?.homeownerId || (project as any)?.homeowner?.id;
                  if (userId && homeownerId && userId === homeownerId) {
                    return 'Homeowner';
                  }
                }
                // Default fallback (MVP: GC ↔ Homeowner)
                return 'Homeowner';
              })()}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert('Audio Call', 'Audio call feature coming soon!');
            }}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2"
          >
            <Phone size={18} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowOptionsModal(true)}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center"
          >
            <MoreVertical size={18} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Project Context Card - Similar to WhatsApp */}
          {projectId && project && (
            <View className="mb-4 bg-[#1E3A5F] rounded-xl p-4 border border-blue-900/50">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 bg-blue-600/20 rounded-full items-center justify-center mr-3">
                  <FileText size={20} color="#3B82F6" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {project.name}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-0.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Project Details
                  </Text>
                </View>
              </View>
              
              {project.address && (
                <View className="flex-row items-start mb-2">
                  <MapPin size={14} color="#6B7280" strokeWidth={2} className="mt-0.5" />
                  <Text className="text-gray-300 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {project.address}
                  </Text>
                </View>
              )}
              
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-blue-900/50">
                {project.budget && (
                  <View className="flex-row items-center">
                    <DollarSign size={14} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-300 text-sm ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      ${project.budget.toLocaleString()}
                    </Text>
                  </View>
                )}
                
                {project.dueDate && (
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-300 text-sm ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                )}
              </View>
              
              {project.progress !== undefined && (
                <View className="mt-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Progress
                    </Text>
                    <Text className="text-blue-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {project.progress}%
                    </Text>
                  </View>
                  <View className="h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </View>
                </View>
              )}
            </View>
          )}
          
          {messages.map((message: Message) => {
            const isMe = message.senderId === currentUser?.id;
            return (
            <View 
              key={message.id} 
                className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}
            >
              <View 
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMe 
                    ? 'bg-blue-600 rounded-br-sm' 
                    : 'bg-[#1E3A5F] rounded-bl-sm'
                }`}
              >
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {message.content}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                  <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {formatTime(message.createdAt)}
                  </Text>
                  {isMe && (
                  <View className="ml-1">
                    {message.read ? (
                      <CheckCheck size={14} color="#3B82F6" strokeWidth={2} />
                    ) : (
                      <Check size={14} color="#6B7280" strokeWidth={2} />
                    )}
                  </View>
                )}
              </View>
            </View>
            );
          })}
        </ScrollView>

        {/* Message Input */}
        <View className="px-6 pb-8 pt-4 bg-[#0A1628] border-t border-blue-900">
          <View className="flex-row items-center">
            <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2">
              <Paperclip size={20} color="#3B82F6" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2">
              <Camera size={20} color="#3B82F6" strokeWidth={2} />
            </TouchableOpacity>
            <View className="flex-1 bg-[#1E3A5F] rounded-full px-4 py-3 flex-row items-center border border-blue-900">
              <TextInput
                className="flex-1 text-white"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Type a message..."
                placeholderTextColor="#6B7280"
                value={newMessage}
                onChangeText={setNewMessage}
                onSubmitEditing={() => {
                  if (newMessage.trim() && !sendMessageMutation.isPending) {
                    sendMessageMutation.mutate(newMessage.trim());
                  }
                }}
              />
            </View>
            <TouchableOpacity 
              onPress={() => {
                if (newMessage.trim() && !sendMessageMutation.isPending) {
                  sendMessageMutation.mutate(newMessage.trim());
                }
              }}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className={`w-10 h-10 bg-blue-600 rounded-full items-center justify-center ml-2 ${(!newMessage.trim() || sendMessageMutation.isPending) ? 'opacity-50' : ''}`}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
              <Send size={18} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showOptionsModal}
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowOptionsModal(false)}
            className="flex-1 bg-black/50 justify-end"
          >
            <View className="bg-[#1E3A5F] rounded-t-3xl p-6 border-t border-blue-900">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Chat Options
                </Text>
                <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                  <X size={24} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setShowOptionsModal(false);
                  Alert.alert('Video Call', 'Video call feature coming soon!');
                }}
                className="flex-row items-center py-4 border-b border-blue-900"
              >
                <View className="w-12 h-12 bg-blue-600/20 rounded-full items-center justify-center mr-4">
                  <Video size={24} color="#3B82F6" strokeWidth={2} />
                </View>
                <Text className="text-white text-lg flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Video Call
                </Text>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowOptionsModal(false);
                  Alert.alert('Audio Call', 'Audio call feature coming soon!');
                }}
                className="flex-row items-center py-4 border-b border-blue-900"
              >
                <View className="w-12 h-12 bg-green-600/20 rounded-full items-center justify-center mr-4">
                  <Phone size={24} color="#10B981" strokeWidth={2} />
                </View>
                <Text className="text-white text-lg flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Audio Call
                </Text>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowOptionsModal(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex-row items-center py-4"
              >
                <View className="w-12 h-12 bg-red-600/20 rounded-full items-center justify-center mr-4">
                  <Trash2 size={24} color="#EF4444" strokeWidth={2} />
                </View>
                <Text className="text-red-400 text-lg flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Delete Chat
                </Text>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showDeleteConfirm}
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900">
              <View className="items-center mb-6">
                <View className="w-16 h-16 bg-red-600/20 rounded-full items-center justify-center mb-4">
                  <AlertCircle size={32} color="#EF4444" strokeWidth={2} />
                </View>
                <Text className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Delete Chat?
                </Text>
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  This action cannot be undone. All messages in this conversation will be permanently deleted.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-[#0A1628] rounded-xl py-4 items-center border border-blue-900"
                >
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (conversation?.id) {
                      deleteConversationMutation.mutate(conversation.id);
                    } else {
                      Alert.alert('Error', 'Conversation not found');
                    }
                  }}
                  disabled={deleteConversationMutation.isPending || !conversation?.id}
                  className={`flex-1 bg-red-600 rounded-xl py-4 items-center ${(deleteConversationMutation.isPending || !conversation?.id) ? 'opacity-50' : ''}`}
                >
                  {deleteConversationMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Delete
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // MVP: contractor app is GC-only
  const isGC = currentUser?.role === 'general_contractor';

  // Fetch active and unpaid projects for GC (to filter conversations)
  const { data: activeProjects = [] } = useActiveProjects();
  const { data: unpaidProjects = [] } = useUnpaidProjects();
  
  // Fetch all conversations for GC
  const { data: allConversations = [] } = useUserConversations();

  // Get protected project IDs (active and unpaid projects)
  const protectedProjectIds = useMemo(() => {
    const activeIds = activeProjects.map((p: any) => p.id);
    const unpaidIds = unpaidProjects.map((p: any) => p.id);
    return new Set([...activeIds, ...unpaidIds]);
  }, [activeProjects, unpaidProjects]);

  // Clear messages mutation (only for GC)
  const clearMessagesMutation = useMutation({
    mutationFn: async (conversationIds: string[]) => {
      // Delete conversations in parallel
      const deletePromises = conversationIds.map(id => chatService.deleteConversation(id));
      await Promise.all(deletePromises);
      return { success: true, deletedCount: conversationIds.length };
    },
    onSuccess: () => {
      setShowClearMessagesConfirm(false);
      setIsClearingMessages(false);
      // Invalidate all conversation-related queries
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['accepted-contractors'] });
      queryClient.invalidateQueries({ queryKey: ['sent-requests'] });
      Alert.alert('Success', 'Messages cleared successfully');
    },
    onError: (error: any) => {
      setIsClearingMessages(false);
      Alert.alert('Error', error?.message || 'Failed to clear messages');
    },
  });

  const handleClearMessages = () => {
    if (!isGC) return;
    
    // Filter conversations: exclude those linked to active/unpaid projects
    const conversationsToDelete = allConversations.filter((conv: any) => {
      // Keep conversations that are NOT linked to protected projects
      if (!conv.projectId) return true; // Delete conversations with no project
      return !protectedProjectIds.has(conv.projectId); // Delete if project is not protected
    });

    if (conversationsToDelete.length === 0) {
      Alert.alert('No Messages to Clear', 'All your conversations are linked to active or unpaid projects and cannot be cleared.');
      return;
    }

    setShowClearMessagesConfirm(true);
  };

  const confirmClearMessages = () => {
    setIsClearingMessages(true);
    
    // Filter conversations: exclude those linked to active/unpaid projects
    const conversationsToDelete = allConversations.filter((conv: any) => {
      if (!conv.projectId) return true;
      return !protectedProjectIds.has(conv.projectId);
    });

    const conversationIds = conversationsToDelete.map((conv: any) => conv.id);
    clearMessagesMutation.mutate(conversationIds);
  };

  // Subcontractor/vendor request flows removed for MVP
  // Fetch sent requests for GC
  const { data: sentRequests = [], refetch: refetchSentRequests, isLoading: loadingSentRequests } = useQuery({
    queryKey: ['sent-requests'],
    queryFn: async () => requestService.getSentRequests(),
    enabled: !projectId && !userId && isGC && !!currentUser?.id, // Only fetch for GC when not in a direct chat and user is loaded
    refetchInterval: 5000, // Poll every 5 seconds for new requests
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
  });

  // Fetch accepted counterparts for GC
  const { data: acceptedContractors = [], refetch: refetchAccepted } = useQuery({
    queryKey: ['accepted-contractors'],
    queryFn: () => requestService.getAcceptedContractors(),
    enabled: !projectId && !userId && isGC,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Subcontractor request accept/reject removed for MVP

  // Delete request mutation (for GC to delete rejected requests)
  const deleteRequestMutation = useMutation({
    mutationFn: (requestId: string) => requestService.deleteRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-requests'] });
      refetchSentRequests();
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to delete request');
    },
  });

  // Format time helper
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get project name from request
  const getProjectName = (request: ProjectRequest) => {
    return request.project?.name || 'Project Request';
  };

  // Get contractor name from request
  const getContractorName = (request: ProjectRequest) => {
    return request.contractor?.fullName || request.contractor?.contractorProfile?.name || 'Contractor';
  };

  // Get contractor image from request
  const getContractorImage = (request: ProjectRequest) => {
    return request.contractor?.contractorProfile?.imageUrl || request.contractor?.pictureUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80';
  };

  // Default: Show conversations list with real project requests
  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              // Navigate to appropriate dashboard based on role
              if (isGC) {
                router.replace('/contractor/gc-dashboard');
              } else {
                router.replace('/contractor');
              }
            }
          }}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>Messages</Text>
        {isGC && (
          <TouchableOpacity
            onPress={handleClearMessages}
            className="bg-red-600/20 border border-red-600/50 rounded-xl px-4 py-2 flex-row items-center"
          >
            <Trash2 size={16} color="#EF4444" strokeWidth={2} />
            <Text className="text-red-400 text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* GC View: Sent Requests Section */}
        {isGC && (
          <View className="px-6 mb-4">
            <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Requests Sent ({sentRequests.length})
            </Text>
            {loadingSentRequests ? (
              <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Loading requests...
                </Text>
              </View>
            ) : sentRequests.length === 0 ? (
              <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900">
                <AlertCircle size={48} color="#6B7280" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Pending Requests
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  You haven't sent any work requests yet. Send requests from the project detail page.
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-gray-500 text-xs mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Waiting for response. Chat will be available once accepted.
                </Text>
                {sentRequests.map((request: ProjectRequest) => {
                  const isRejected = request.status === 'rejected';
                  return (
                    <View
                      key={request.id}
                      className={`bg-[#1E3A5F] rounded-xl p-4 mb-3 border-2 ${isRejected ? 'border-red-600/50' : 'border-yellow-600/50'}`}
                    >
                      <View className="flex-row items-start mb-3">
                        <Image 
                          source={{ uri: getContractorImage(request) }} 
                          className="w-12 h-12 rounded-full mr-3" 
                          resizeMode="cover" 
                        />
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                              {getContractorName(request)}
                            </Text>
                            <View className={`rounded-full px-3 py-1 ${isRejected ? 'bg-red-600/20' : 'bg-yellow-600/20'}`}>
                              <Text className={`text-xs ${isRejected ? 'text-red-400' : 'text-yellow-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                {isRejected ? 'Rejected' : 'Pending'}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                            {request.project?.name || 'Project'}
                          </Text>
                          {request.gcNotes && (
                            <Text className="text-gray-300 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={2}>
                              {request.gcNotes}
                            </Text>
                          )}
                          <View className="flex-row items-center mt-2">
                            <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                              {formatTimeAgo(request.sentAt)}
                            </Text>
                            {request.estimatedBudget && (
                              <>
                                <Text className="text-gray-500 text-xs mx-2">•</Text>
                                <Text className="text-yellow-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                  ${request.estimatedBudget.toLocaleString()}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                        {isRejected && (
                          <TouchableOpacity
                            onPress={() => {
                              Alert.alert(
                                'Delete Request',
                                'Are you sure you want to delete this rejected request?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => {
                                      deleteRequestMutation.mutate(request.id);
                                    },
                                  },
                                ]
                              );
                            }}
                            disabled={deleteRequestMutation.isPending}
                            className="ml-2 w-8 h-8 bg-red-600/20 rounded-full items-center justify-center"
                          >
                            {deleteRequestMutation.isPending ? (
                              <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                              <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* GC View: Accepted Contractors Section */}
        {isGC && (
          <View className="px-6 mb-4">
            <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Active Conversations ({acceptedContractors.length})
            </Text>
            {acceptedContractors.length === 0 ? (
              <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900">
                <MessageCircle size={48} color="#6B7280" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Active Conversations
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {sentRequests.length > 0 
                    ? 'Wait for contractors to accept your requests to start chatting'
                    : 'Send work requests to contractors to start conversations'}
                </Text>
              </View>
            ) : (
              acceptedContractors.map((contractor: any, index: number) => (
          <TouchableOpacity
                  key={contractor.requestId || `accepted-gc-${contractor.id}-${contractor.projectId}-${index}`}
                  onPress={() => {
                    router.push(`/contractor/chat?projectId=${contractor.projectId}&userId=${contractor.id}&name=${encodeURIComponent(contractor.fullName)}`);
                  }}
            className="bg-[#1E3A5F] rounded-xl p-4 mb-3 flex-row items-center border border-blue-900"
          >
                  <Image 
                    source={{ uri: contractor.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' }} 
                    className="w-14 h-14 rounded-full" 
                    resizeMode="cover" 
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {contractor.fullName}
                      </Text>
                    </View>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {contractor.role === 'homeowner' ? 'Homeowner' : contractor.specialty || contractor.type || 'Contractor'}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {contractor.projectName}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Subcontractor/vendor chat sections removed for MVP */}
      </ScrollView>

      {/* Clear Messages Confirmation Modal - Only for GC */}
      {isGC && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showClearMessagesConfirm}
          onRequestClose={() => setShowClearMessagesConfirm(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900">
              <View className="items-center mb-6">
                <View className="w-16 h-16 bg-red-600/20 rounded-full items-center justify-center mb-4">
                  <Trash2 size={32} color="#EF4444" strokeWidth={2} />
                </View>
                <Text className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Clear Messages?
                </Text>
                <Text className="text-gray-400 text-center mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  This will delete all conversations that are NOT linked to active or unpaid projects.
                </Text>
                <Text className="text-gray-500 text-center text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Conversations for active and unpaid projects will be preserved. This action cannot be undone.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowClearMessagesConfirm(false)}
                  disabled={isClearingMessages}
                  className="flex-1 bg-[#0A1628] rounded-xl py-4 items-center border border-blue-900"
                >
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmClearMessages}
                  disabled={isClearingMessages}
                  className={`flex-1 bg-red-600 rounded-xl py-4 items-center ${isClearingMessages ? 'opacity-50' : ''}`}
                >
                  {isClearingMessages ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Clear
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
