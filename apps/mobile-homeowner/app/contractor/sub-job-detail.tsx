import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Camera, 
  CheckCircle, 
  Clock, 
  Package, 
  MessageCircle,
  Phone,
  Upload,
  FileText,
  AlertCircle
} from "lucide-react-native";
import { useState } from "react";

const jobData = {
  id: 1,
  projectName: "Modern Minimalist Villa",
  gcName: "Chukwuemeka Okonkwo",
  gcPhone: "+234 801 234 5678",
  gcAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  stage: "Foundation",
  address: "123 Main Street, Lekki, Lagos",
  status: "in_progress",
  payment: 8500,
  startDate: "Dec 5, 2024",
  dueDate: "Dec 15, 2024",
  instructions: "Complete concrete pouring for foundation. Ensure proper curing time of at least 7 days. Use Grade 40 concrete mix as specified. Coordinate with electrical team for conduit placement.",
  image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
};

const materials = [
  { name: "Cement (Grade 42.5)", quantity: "50 bags", status: "delivered" },
  { name: "Steel Reinforcement Bars", quantity: "200 pcs", status: "delivered" },
  { name: "Gravel (20mm)", quantity: "10 tons", status: "delivered" },
  { name: "Sand (Sharp)", quantity: "8 tons", status: "pending" },
];

const progressPhotos = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&q=80",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&q=80",
];

export default function SubJobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [notes, setNotes] = useState("");

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Job Details</Text>
        <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center">
          <MessageCircle size={20} color="#3B82F6" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Project Image */}
        <View className="px-6 mb-4">
          <Image source={{ uri: jobData.image }} className="w-full h-40 rounded-2xl" resizeMode="cover" />
        </View>

        {/* Job Info */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
              {jobData.projectName}
            </Text>
            <View className="bg-blue-600/20 rounded-full px-3 py-1">
              <Text className="text-blue-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>In Progress</Text>
            </View>
          </View>
          
          <View className="bg-orange-600/20 rounded-xl p-4 mb-4 border border-orange-700/50">
            <Text className="text-orange-400 text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{jobData.stage}</Text>
            <View className="flex-row items-center mt-2">
              <MapPin size={14} color="#6B7280" strokeWidth={2} />
              <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>{jobData.address}</Text>
            </View>
          </View>

          {/* GC Contact */}
          <View className="bg-[#1E3A5F] rounded-xl p-4 flex-row items-center border border-blue-900">
            <Image source={{ uri: jobData.gcAvatar }} className="w-12 h-12 rounded-full" resizeMode="cover" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>General Contractor</Text>
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{jobData.gcName}</Text>
            </View>
            <TouchableOpacity className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-2">
              <Phone size={18} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 bg-blue-600/20 rounded-full items-center justify-center">
              <MessageCircle size={18} color="#3B82F6" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row">
            <View className="flex-1 bg-[#1E3A5F] rounded-xl p-4 mr-2 border border-blue-900">
              <View className="flex-row items-center mb-1">
                <Calendar size={16} color="#F59E0B" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Due Date</Text>
              </View>
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{jobData.dueDate}</Text>
            </View>
            <View className="flex-1 bg-green-600/20 rounded-xl p-4 ml-2 border border-green-700/50">
              <View className="flex-row items-center mb-1">
                <DollarSign size={16} color="#10B981" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Payment</Text>
              </View>
              <Text className="text-green-400" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${jobData.payment.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>Instructions</Text>
          <View className="bg-[#1E3A5F] rounded-xl p-4 border border-blue-900">
            <View className="flex-row items-start">
              <FileText size={18} color="#3B82F6" strokeWidth={2} />
              <Text className="text-gray-300 text-sm ml-3 flex-1 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {jobData.instructions}
              </Text>
            </View>
          </View>
        </View>

        {/* Materials */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>Materials Provided</Text>
          {materials.map((material, index) => (
            <View key={index} className="bg-[#1E3A5F] rounded-xl p-4 mb-2 flex-row items-center border border-blue-900">
              <Package size={18} color="#3B82F6" strokeWidth={2} />
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{material.name}</Text>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{material.quantity}</Text>
              </View>
              <View className={`rounded-full px-3 py-1 ${material.status === 'delivered' ? 'bg-green-600/20' : 'bg-yellow-600/20'}`}>
                <Text className={`text-xs ${material.status === 'delivered' ? 'text-green-400' : 'text-yellow-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {material.status === 'delivered' ? 'Delivered' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Progress Photos */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Progress Photos</Text>
            <TouchableOpacity className="flex-row items-center bg-orange-600 rounded-full px-4 py-2">
              <Camera size={16} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Add Photo</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {progressPhotos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} className="w-32 h-32 rounded-xl mr-3" resizeMode="cover" />
            ))}
            <TouchableOpacity className="w-32 h-32 bg-[#1E3A5F] rounded-xl items-center justify-center border border-dashed border-blue-700">
              <Upload size={24} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-xs mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>Upload</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Work Notes */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>Work Notes</Text>
          <View className="bg-[#1E3A5F] rounded-xl p-4 border border-blue-900">
            <TextInput
              className="text-white text-sm min-h-[100px]"
              style={{ fontFamily: 'Poppins_400Regular', textAlignVertical: 'top' }}
              placeholder="Add notes about your progress..."
              placeholderTextColor="#6B7280"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Warning */}
        <View className="px-6 mb-6">
          <View className="bg-yellow-900/30 rounded-xl p-4 flex-row items-start border border-yellow-700/50">
            <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />
            <View className="flex-1 ml-3">
              <Text className="text-yellow-400 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>Important</Text>
              <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                Only the General Contractor can mark this stage as complete. Upload photos and notes to document your work.
              </Text>
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-6 pb-8 pt-4 bg-[#0A1628] border-t border-blue-900">
        <TouchableOpacity className="bg-orange-600 rounded-full py-4 flex-row items-center justify-center">
          <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Mark Task as Done</Text>
        </TouchableOpacity>
        <Text className="text-gray-500 text-xs text-center mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          GC will review and approve completion
        </Text>
      </View>
    </View>
  );
}
