import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Paperclip, FileText, Home, Check, CheckCheck, User } from "lucide-react-native";
import { useState, useRef, useEffect } from "react";
import { chatService, Message } from "@/services/chatService";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProject } from "@/hooks/useProject";
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';

// Format time helper
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24 && messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string | undefined;
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [newMessage, setNewMessage] = useState("");
  
  // Fetch project to get GC info
  const { data: project, isLoading: projectLoading } = useProject(projectId || '');
  const gcId = project?.generalContractorId || (project as any)?.generalContractor?.id;
  const currentStage = (project as any)?.stages?.find((s: any) => s.status === 'in_progress') || 
                       (project as any)?.stages?.find((s: any) => s.status === 'completed');
  const stageName = currentStage?.name || 'General';
  
  // Get or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', projectId, gcId, currentUser?.id],
    queryFn: async () => {
      if (!gcId || !currentUser?.id) return null;
      return chatService.getOrCreateConversation(
        [gcId, currentUser.id],
        projectId,
      );
    },
    enabled: !!gcId && !!currentUser?.id && !!projectId,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const conversationParticipant = conversation?.participants?.find((p) => p.id === gcId);
  const gcName =
    conversationParticipant?.fullName ||
    (project as any)?.generalContractor?.fullName ||
    'General Contractor';
  const gcPicture = getBackendAssetUrl(
    conversationParticipant?.pictureUrl || (project as any)?.generalContractor?.pictureUrl,
  );

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

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const uploadImageAttachment = async (uri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const res = await fetch(uri);
      const blob = await res.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as any);
    }
    const uploadRes = await api.post('/upload/image', formData);
    return chatService.sendMessage(conversation!.id, uploadRes.url, 'image');
  };

  const handlePickPhoto = async () => {
    if (!conversation?.id) return;
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'Please allow photo library access to send images.');
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
      const fileName = asset.fileName || `chat-image-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      await uploadImageAttachment(asset.uri, fileName, mimeType);

      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Could not send image.');
    }
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.senderId === currentUser?.id;
    
    return (
      <View 
        key={msg.id} 
        className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}
      >
        {msg.type === "text" && (
          <View className={`max-w-[80%] rounded-3xl px-5 py-3 ${isUser ? 'bg-black' : 'bg-gray-100'}`}>
            <Text 
              className={isUser ? 'text-white' : 'text-black'}
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {msg.content}
            </Text>
          </View>
        )}
        
        {msg.type === "image" && (
          <View className="max-w-[80%]">
            <Image
              source={{ uri: getBackendAssetUrl(msg.content) }}
              className="w-64 h-48 rounded-2xl"
              resizeMode="cover"
            />
          </View>
        )}
        
        {msg.type === "file" && (
          <TouchableOpacity className={`max-w-[80%] rounded-2xl px-4 py-3 flex-row items-center ${isUser ? 'bg-black' : 'bg-gray-100'}`}>
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${isUser ? 'bg-white/20' : 'bg-white'}`}>
              <FileText size={20} color={isUser ? '#FFFFFF' : '#000000'} strokeWidth={2} />
            </View>
            <View className="ml-3 flex-1">
              <Text 
                className={isUser ? 'text-white' : 'text-black'}
                style={{ fontFamily: 'Poppins_500Medium' }}
                numberOfLines={1}
              >
                {msg.content}
              </Text>
              <Text 
                className={isUser ? 'text-white/70 text-xs' : 'text-gray-500 text-xs'}
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                PDF Document
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        <View className="flex-row items-center mt-1 px-2">
          <Text 
            className="text-gray-400 text-xs"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {formatTime(msg.createdAt)}
          </Text>
          {isUser && (
            <View className="ml-1">
              {msg.read ? (
                <CheckCheck size={14} color="#3B82F6" strokeWidth={2} />
              ) : (
                <Check size={14} color="#6B7280" strokeWidth={2} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (projectLoading || conversationLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading chat...
        </Text>
      </View>
    );
  }

  if (!projectId || !gcId) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-500 text-center mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          No project or GC found
        </Text>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')}
          className="bg-black rounded-full py-4 px-8"
        >
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mr-2"
          >
            <ArrowLeft size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-9 h-9 bg-black rounded-full items-center justify-center mr-3"
          >
            <Home size={18} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          {gcPicture ? (
            <Image
              source={{ uri: gcPicture }}
              className="w-10 h-10 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
              <User size={18} color="#4B5563" strokeWidth={2} />
            </View>
          )}
          <View className="ml-2 flex-1">
            <Text 
              className="text-base text-black"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              {gcName}
            </Text>
            <Text 
              className="text-gray-500 text-xs"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              GC • Online
            </Text>
          </View>
        </View>
        <View />
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Date Separator */}
        {messages.length > 0 && (
          <View className="items-center mb-6">
            <View className="bg-gray-100 rounded-full px-4 py-2">
              <Text 
                className="text-gray-500 text-xs"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                {stageName} Stage
              </Text>
            </View>
          </View>
        )}
        
        {messages.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      {/* Input Area */}
      <View className="px-6 py-4 border-t border-gray-100 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handlePickPhoto}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-2"
          >
            <Paperclip size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <View className="flex-1 bg-gray-100 rounded-full px-5 py-3 flex-row items-center">
            <TextInput
              className="flex-1 text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Type a message..."
              placeholderTextColor="#A3A3A3"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity 
            onPress={handleSend}
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            className={`w-10 h-10 bg-black rounded-full items-center justify-center ml-2 ${(sendMessageMutation.isPending || !newMessage.trim()) ? 'opacity-50' : ''}`}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
