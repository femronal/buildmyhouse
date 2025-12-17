import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Phone, Video, Send, Paperclip, Mic, FileText, Image as ImageIcon, Play, Home } from "lucide-react-native";
import { useState } from "react";

const messages = [
  {
    id: 1,
    sender: "gc",
    type: "text",
    content: "Good morning Ifeoma! Just wanted to update you on the foundation progress.",
    time: "9:00 AM",
  },
  {
    id: 2,
    sender: "user",
    type: "text",
    content: "Good morning John! Yes, please share the update.",
    time: "9:05 AM",
  },
  {
    id: 3,
    sender: "gc",
    type: "text",
    content: "We've completed the excavation and the concrete pour is scheduled for tomorrow.",
    time: "9:07 AM",
  },
  {
    id: 4,
    sender: "gc",
    type: "file",
    content: "Foundation_Progress_Report.pdf",
    fileType: "pdf",
    time: "9:08 AM",
  },
  {
    id: 5,
    sender: "user",
    type: "text",
    content: "That's great news! Can you send me some photos of the current state?",
    time: "9:15 AM",
  },
  {
    id: 6,
    sender: "gc",
    type: "image",
    content: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80",
    time: "9:18 AM",
  },
  {
    id: 7,
    sender: "gc",
    type: "text",
    content: "Here's the current state. The rebar installation is complete.",
    time: "9:18 AM",
  },
  {
    id: 8,
    sender: "user",
    type: "text",
    content: "Looks perfect! 👍",
    time: "9:20 AM",
  },
  {
    id: 9,
    sender: "gc",
    type: "call",
    content: "Voice call - 5 min",
    callType: "voice",
    time: "9:25 AM",
  },
  {
    id: 10,
    sender: "gc",
    type: "text",
    content: "As discussed on the call, I'll send the updated timeline shortly.",
    time: "9:32 AM",
  },
  {
    id: 11,
    sender: "gc",
    type: "file",
    content: "Updated_Timeline_Dec2024.pdf",
    fileType: "pdf",
    time: "9:35 AM",
  },
  {
    id: 12,
    sender: "user",
    type: "text",
    content: "Received. Thanks for the quick update!",
    time: "9:40 AM",
  },
  {
    id: 13,
    sender: "gc",
    type: "call",
    content: "Video call - 12 min",
    callType: "video",
    time: "10:00 AM",
  },
  {
    id: 14,
    sender: "gc",
    type: "video",
    content: "Site_Walkthrough.mp4",
    time: "10:15 AM",
  },
  {
    id: 15,
    sender: "user",
    type: "text",
    content: "The video walkthrough was very helpful. Everything looks on track!",
    time: "10:20 AM",
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const renderMessage = (msg: typeof messages[0]) => {
    const isUser = msg.sender === "user";
    
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
              source={{ uri: msg.content }}
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
        
        {msg.type === "video" && (
          <TouchableOpacity className="max-w-[80%] bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center">
            <View className="w-10 h-10 bg-black rounded-xl items-center justify-center">
              <Play size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View className="ml-3 flex-1">
              <Text 
                className="text-black"
                style={{ fontFamily: 'Poppins_500Medium' }}
                numberOfLines={1}
              >
                {msg.content}
              </Text>
              <Text 
                className="text-gray-500 text-xs"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Video File
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {msg.type === "call" && (
          <View className="max-w-[80%] bg-gray-50 rounded-2xl px-4 py-3 flex-row items-center border border-gray-200">
            <View className="w-10 h-10 bg-black rounded-full items-center justify-center">
              {msg.callType === "video" ? (
                <Video size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Phone size={20} color="#FFFFFF" strokeWidth={2} />
              )}
            </View>
            <View className="ml-3">
              <Text 
                className="text-black"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                {msg.callType === "video" ? "Video Call" : "Voice Call"}
              </Text>
              <Text 
                className="text-gray-500 text-xs"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        )}
        
        <Text 
          className="text-gray-400 text-xs mt-1 px-2"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {msg.time}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
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
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" }}
            className="w-10 h-10 rounded-full"
            resizeMode="cover"
          />
          <View className="ml-2 flex-1">
            <Text 
              className="text-base text-black"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Chukwuemeka Okonkwo
            </Text>
            <Text 
              className="text-gray-500 text-xs"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              GC • Online
            </Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-2">
            <Phone size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
            <Video size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView className="flex-1 px-6 py-4">
        {/* Date Separator */}
        <View className="items-center mb-6">
          <View className="bg-gray-100 rounded-full px-4 py-2">
            <Text 
              className="text-gray-500 text-xs"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Today - Foundation Stage
            </Text>
          </View>
        </View>
        
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Input Area */}
      <View className="px-6 py-4 border-t border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-2">
            <Paperclip size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <View className="flex-1 bg-gray-100 rounded-full px-5 py-3 flex-row items-center">
            <TextInput
              className="flex-1 text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Type a message..."
              placeholderTextColor="#A3A3A3"
              value={message}
              onChangeText={setMessage}
            />
          </View>
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center ml-2">
            <Mic size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-black rounded-full items-center justify-center ml-2">
            <Send size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
