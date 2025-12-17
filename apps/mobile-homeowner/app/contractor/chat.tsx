import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Camera,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck
} from "lucide-react-native";
import { useState, useRef } from "react";

const conversations = [
  {
    id: 1,
    name: "Ifeoma Obi-Uchendu",
    role: "Homeowner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    lastMessage: "Thank you for the update!",
    time: "2 min ago",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Lagos Plumbing Co.",
    role: "Subcontractor",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    lastMessage: "Materials have arrived on site",
    time: "1 hour ago",
    unread: 0,
    online: true,
  },
  {
    id: 3,
    name: "BuildMart Supplies",
    role: "Vendor",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    lastMessage: "Order confirmed. Delivery on Monday.",
    time: "3 hours ago",
    unread: 0,
    online: false,
  },
  {
    id: 4,
    name: "Adaeze Nwosu",
    role: "Homeowner",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    lastMessage: "When will the electrical work start?",
    time: "Yesterday",
    unread: 1,
    online: false,
  },
];

const messages = [
  { id: 1, sender: "them", text: "Hi, I wanted to check on the progress of the foundation work.", time: "10:30 AM", read: true },
  { id: 2, sender: "me", text: "Good morning! The foundation work is progressing well. We completed the concrete pouring yesterday.", time: "10:32 AM", read: true },
  { id: 3, sender: "me", text: "I'll send you some photos shortly.", time: "10:32 AM", read: true },
  { id: 4, sender: "them", text: "That's great to hear! How long until it's fully cured?", time: "10:35 AM", read: true },
  { id: 5, sender: "me", text: "The curing process takes about 7 days. We'll start the framing work next week.", time: "10:38 AM", read: true },
  { id: 6, sender: "them", text: "Perfect. Thank you for the update!", time: "10:40 AM", read: false },
];

export default function ContractorChatScreen() {
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  if (selectedChat && selectedConversation) {
    return (
      <KeyboardAvoidingView 
        className="flex-1 bg-[#0A1628]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View className="pt-16 px-6 pb-4 flex-row items-center bg-[#0A1628] border-b border-blue-900">
          <TouchableOpacity 
            onPress={() => setSelectedChat(null)}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <View className="relative">
            <Image source={{ uri: selectedConversation.avatar }} className="w-10 h-10 rounded-full" resizeMode="cover" />
            {selectedConversation.online && (
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A1628]" />
            )}
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{selectedConversation.name}</Text>
            <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
              {selectedConversation.online ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2">
            <Phone size={18} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center">
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
          {messages.map((message) => (
            <View 
              key={message.id} 
              className={`mb-3 ${message.sender === 'me' ? 'items-end' : 'items-start'}`}
            >
              <View 
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === 'me' 
                    ? 'bg-blue-600 rounded-br-sm' 
                    : 'bg-[#1E3A5F] rounded-bl-sm'
                }`}
              >
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {message.text}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{message.time}</Text>
                {message.sender === 'me' && (
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
          ))}
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
              />
            </View>
            <TouchableOpacity className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center ml-2">
              <Send size={18} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>Messages</Text>
      </View>

      {/* Search */}
      <View className="px-6 mb-4">
        <View className="bg-[#1E3A5F] rounded-xl px-4 py-3 border border-blue-900">
          <TextInput
            className="text-white"
            style={{ fontFamily: 'Poppins_400Regular' }}
            placeholder="Search conversations..."
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            onPress={() => setSelectedChat(conversation.id)}
            className="bg-[#1E3A5F] rounded-xl p-4 mb-3 flex-row items-center border border-blue-900"
          >
            <View className="relative">
              <Image source={{ uri: conversation.avatar }} className="w-14 h-14 rounded-full" resizeMode="cover" />
              {conversation.online && (
                <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1E3A5F]" />
              )}
            </View>
            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{conversation.name}</Text>
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{conversation.time}</Text>
              </View>
              <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{conversation.role}</Text>
              <Text className="text-gray-400 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
            </View>
            {conversation.unread > 0 && (
              <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center ml-2">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{conversation.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
