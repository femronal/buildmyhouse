import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Check,
  CheckCheck,
  Trash2
} from "lucide-react-native";
import { useState, useRef, useEffect, useMemo } from "react";
import * as ImagePicker from 'expo-image-picker';
import { chatService, Message } from "@/services/chatService";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { requestService } from "@/services/requestService";
import type { ProjectRequest } from "@/services/requestService";
import { AlertCircle, CheckCircle, XCircle, MessageCircle, ChevronRight, MapPin, Calendar, FileText } from "lucide-react-native";
import { useProject } from "@/hooks/useProjects";
import { useUserConversations } from "@/hooks/useChat";
import { getBackendAssetUrl } from "@/lib/image";
import { api } from "@/lib/api";

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

  // Get or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', projectId, userId, currentUser?.id],
    queryFn: async () => {
      if (!userId || !currentUser?.id) return null;
      if (userId === currentUser.id) return null; // Guard: never create a self-chat
      return chatService.getOrCreateConversation(
        [userId, currentUser.id],
        projectId,
      );
    },
    enabled: !!userId && !!currentUser?.id,
  });
  const chatParticipant = conversation?.participants?.find((p) => p.id === userId);
  const displayName = chatParticipant?.fullName || userName || 'User';

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
  const sendImageMutation = useMutation({
    mutationFn: async (asset: { uri: string; fileName?: string; mimeType?: string }) => {
      if (!conversation?.id) throw new Error('No conversation found');
      const formData = new FormData();
      const fileName = asset.fileName || `chat-image-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      if (Platform.OS === 'web') {
        const res = await fetch(asset.uri);
        const blob = await res.blob();
        formData.append('file', blob, fileName);
      } else {
        formData.append('file', { uri: asset.uri, name: fileName, type: mimeType } as any);
      }
      const uploaded = await api.post('/upload/image', formData);
      return chatService.sendMessage(conversation.id, uploaded.url, 'image');
    },
    onSuccess: () => {
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
    },
    onError: (error: any) => {
      Alert.alert('Upload failed', error?.message || 'Failed to send image');
    },
  });

  const handlePickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'Please allow photo library access.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      sendImageMutation.mutate({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Could not pick image');
    }
  };

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
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{displayName}</Text>
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
                    <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>₦</Text>
                    <Text className="text-gray-300 text-sm ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      ₦{project.budget.toLocaleString()}
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
            const isImageMessage =
              message.type === 'image' ||
              (typeof message.content === 'string' && message.content.includes('/uploads/images/'));
            return (
            <View 
              key={message.id} 
                className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}
            >
              {isImageMessage ? (
                <Image
                  source={{ uri: getBackendAssetUrl(message.content) }}
                  className="w-56 h-44 rounded-2xl"
                  resizeMode="cover"
                />
              ) : (
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
              )}
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
            <TouchableOpacity
              onPress={handlePickPhoto}
              disabled={sendImageMutation.isPending}
              className={`w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2 ${sendImageMutation.isPending ? 'opacity-50' : ''}`}
            >
              <Paperclip size={20} color="#3B82F6" strokeWidth={2} />
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
      </KeyboardAvoidingView>
    );
  }

  // MVP: contractor app is GC-only
  const isGC = currentUser?.role === 'general_contractor';
  const isAuthenticated = !!currentUser?.id;

  // Used to show per-chat unread badges and sort by newest activity.
  const { data: allConversations = [] } = useUserConversations(isAuthenticated);

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
    return (
      getBackendAssetUrl(request.contractor?.contractorProfile?.imageUrl || request.contractor?.pictureUrl) ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'
    );
  };

  const visibleAcceptedContractors = useMemo(() => {
    return (acceptedContractors || []).filter((c: any) => c?.id && c.id !== currentUser?.id);
  }, [acceptedContractors, currentUser?.id]);

  const enrichedAcceptedConversations = useMemo(() => {
    const conversations = Array.isArray(allConversations) ? allConversations : [];

    const byParticipantAndProject = new Map<string, any>();
    const byParticipantOnly = new Map<string, any>();

    for (const conv of conversations) {
      const participants = Array.isArray(conv?.participants) ? conv.participants : [];
      const other = participants.find((p: any) => p?.id && p.id !== currentUser?.id);
      if (!other?.id) continue;

      const key = `${other.id}:${conv?.projectId || ''}`;
      byParticipantAndProject.set(key, conv);

      const existing = byParticipantOnly.get(other.id);
      const existingTs = existing ? new Date(existing.updatedAt || 0).getTime() : 0;
      const currentTs = new Date(conv?.updatedAt || 0).getTime();
      if (!existing || currentTs > existingTs) {
        byParticipantOnly.set(other.id, conv);
      }
    }

    return visibleAcceptedContractors
      .map((contractor: any) => {
        const key = `${contractor.id}:${contractor.projectId || ''}`;
        const conversation = byParticipantAndProject.get(key) || byParticipantOnly.get(contractor.id);
        const unreadCount = Number(conversation?.unreadCount || 0);
        const lastMessage = conversation?.messages?.[0];
        const lastActivityAt = conversation?.updatedAt || lastMessage?.createdAt || null;
        return {
          contractor,
          conversationId: conversation?.id || null,
          unreadCount,
          lastMessage,
          lastActivityAt,
        };
      })
      .sort((a, b) => {
        const aTs = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const bTs = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        return bTs - aTs;
      });
  }, [allConversations, currentUser?.id, visibleAcceptedContractors]);

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
                                  ₦{request.estimatedBudget.toLocaleString()}
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
              Active Conversations ({enrichedAcceptedConversations.length})
            </Text>
            {enrichedAcceptedConversations.length === 0 ? (
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
              enrichedAcceptedConversations.map(({ contractor, unreadCount, lastMessage, lastActivityAt }: any, index: number) => (
          <TouchableOpacity
                  key={contractor.requestId || `accepted-gc-${contractor.id}-${contractor.projectId}-${index}`}
                  onPress={() => {
                    router.push(`/contractor/chat?projectId=${contractor.projectId}&userId=${contractor.id}&name=${encodeURIComponent(contractor.fullName)}`);
                  }}
            className={`rounded-xl p-4 mb-3 flex-row items-center border ${unreadCount > 0 ? 'bg-[#244A7A] border-blue-600' : 'bg-[#1E3A5F] border-blue-900'}`}
          >
                  <Image 
                    source={{ uri: getBackendAssetUrl(contractor.imageUrl) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' }} 
                    className="w-14 h-14 rounded-full" 
                    resizeMode="cover" 
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white flex-1" style={{ fontFamily: unreadCount > 0 ? 'Poppins_700Bold' : 'Poppins_600SemiBold' }}>
                        {contractor.fullName}
                      </Text>
                      {unreadCount > 0 && (
                        <View className="bg-red-500 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center ml-2">
                          <Text className="text-white text-[10px]" style={{ fontFamily: 'Poppins_700Bold' }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {contractor.role === 'homeowner' ? 'Homeowner' : contractor.specialty || contractor.type || 'Contractor'}
                    </Text>
                    <Text className="text-gray-300 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>
                      {lastMessage?.content
                        ? `${lastMessage.type === 'image' ? 'Photo' : lastMessage.content}`
                        : contractor.projectName}
                    </Text>
                    <Text className="text-gray-500 text-[10px] mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {lastActivityAt ? formatTimeAgo(lastActivityAt) : ''}
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

    </View>
  );
}
