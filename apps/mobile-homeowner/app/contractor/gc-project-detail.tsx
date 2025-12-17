import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Camera, 
  CheckCircle, 
  Clock, 
  Package, 
  MessageCircle,
  ChevronRight,
  Plus,
  Upload,
  AlertCircle
} from "lucide-react-native";
import { useState } from "react";

const projectData = {
  id: 1,
  name: "Modern Minimalist Villa",
  client: "Ifeoma Obi-Uchendu",
  clientPhone: "+234 801 234 5678",
  address: "123 Main Street, Lekki, Lagos",
  progress: 25,
  budget: 285000,
  earned: 71250,
  startDate: "Oct 2024",
  dueDate: "Mar 2025",
  image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
};

const stages = [
  { id: 1, name: "Site Preparation", status: "completed", cost: 15000, paid: true },
  { id: 2, name: "Foundation", status: "in_progress", cost: 45000, paid: false },
  { id: 3, name: "Framing", status: "pending", cost: 55000, paid: false },
  { id: 4, name: "Roofing", status: "pending", cost: 35000, paid: false },
  { id: 5, name: "Plumbing", status: "pending", cost: 28000, paid: false },
  { id: 6, name: "Electrical", status: "pending", cost: 32000, paid: false },
  { id: 7, name: "Interior Finishing", status: "pending", cost: 45000, paid: false },
  { id: 8, name: "Final Inspection", status: "pending", cost: 10000, paid: false },
];

const assignedSubcontractors = [
  { id: 1, name: "Emeka Builders", specialty: "Foundation", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  { id: 2, name: "Lagos Plumbing Co.", specialty: "Plumbing", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" },
  { id: 3, name: "PowerGrid Electric", specialty: "Electrical", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
];

const recentPhotos = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&q=80",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&q=80",
];

export default function GCProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'stages' | 'team' | 'materials'>('stages');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-600/20', text: 'text-green-400', icon: '#10B981' };
      case 'in_progress': return { bg: 'bg-blue-600/20', text: 'text-blue-400', icon: '#3B82F6' };
      default: return { bg: 'bg-gray-600/20', text: 'text-gray-400', icon: '#6B7280' };
    }
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header Image */}
      <View className="relative">
        <Image source={{ uri: projectData.image }} className="w-full h-56" resizeMode="cover" />
        <View className="absolute inset-0 bg-gradient-to-t from-[#0A1628] to-transparent" />
        <TouchableOpacity 
          onPress={() => router.back()}
          className="absolute top-14 left-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity 
          className="absolute top-14 right-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
        >
          <MessageCircle size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 -mt-12" showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View className="px-6 mb-6">
          <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
            {projectData.name}
          </Text>
          <View className="flex-row items-center mt-2">
            <MapPin size={16} color="#6B7280" strokeWidth={2} />
            <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {projectData.address}
            </Text>
          </View>
          
          {/* Client Info */}
          <View className="bg-[#1E3A5F] rounded-xl p-4 mt-4 flex-row items-center border border-blue-900">
            <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>IO</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{projectData.client}</Text>
              <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Homeowner</Text>
            </View>
            <TouchableOpacity className="bg-blue-600 rounded-full px-4 py-2">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View className="px-6 mb-6">
          <View className="flex-row">
            <View className="flex-1 bg-[#1E3A5F] rounded-xl p-4 mr-2 border border-blue-900">
              <View className="flex-row items-center mb-1">
                <DollarSign size={16} color="#10B981" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text>
              </View>
              <Text className="text-white text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                ${projectData.budget.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-[#1E3A5F] rounded-xl p-4 mx-2 border border-blue-900">
              <View className="flex-row items-center mb-1">
                <Calendar size={16} color="#F59E0B" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>Due</Text>
              </View>
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {projectData.dueDate}
              </Text>
            </View>
            <View className="flex-1 bg-blue-600 rounded-xl p-4 ml-2">
              <View className="flex-row items-center mb-1">
                <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white/70 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>Progress</Text>
              </View>
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
                {projectData.progress}%
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Photos */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Progress Photos</Text>
            <TouchableOpacity className="flex-row items-center">
              <Camera size={18} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Add Photo</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentPhotos.map((photo, index) => (
              <Image 
                key={index}
                source={{ uri: photo }} 
                className="w-28 h-28 rounded-xl mr-3" 
                resizeMode="cover" 
              />
            ))}
            <TouchableOpacity className="w-28 h-28 bg-[#1E3A5F] rounded-xl items-center justify-center border border-dashed border-blue-700">
              <Plus size={24} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-xs mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>Upload</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-[#1E3A5F] rounded-xl p-1">
            {['stages', 'team', 'materials'].map((tab) => (
              <TouchableOpacity 
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-blue-600' : ''}`}
              >
                <Text 
                  className={`text-center text-sm ${activeTab === tab ? 'text-white' : 'text-gray-400'}`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View className="px-6 pb-8">
          {activeTab === 'stages' && (
            <View>
              {stages.map((stage, index) => {
                const colors = getStatusColor(stage.status);
                return (
                  <TouchableOpacity 
                    key={stage.id}
                    className="bg-[#1E3A5F] rounded-xl p-4 mb-3 border border-blue-900"
                  >
                    <View className="flex-row items-center">
                      <View className={`w-10 h-10 ${colors.bg} rounded-full items-center justify-center`}>
                        {stage.status === 'completed' ? (
                          <CheckCircle size={20} color={colors.icon} strokeWidth={2} />
                        ) : stage.status === 'in_progress' ? (
                          <Clock size={20} color={colors.icon} strokeWidth={2} />
                        ) : (
                          <Text className="text-gray-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>{index + 1}</Text>
                        )}
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{stage.name}</Text>
                        <Text className="text-gray-400 text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                          ${stage.cost.toLocaleString()}
                        </Text>
                      </View>
                      <View className={`${colors.bg} rounded-full px-3 py-1`}>
                        <Text className={`${colors.text} text-xs`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {stage.status === 'in_progress' ? 'In Progress' : stage.status === 'completed' ? 'Complete' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                    {stage.status === 'in_progress' && (
                      <TouchableOpacity className="bg-blue-600 rounded-lg py-3 mt-3">
                        <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Mark as Complete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {activeTab === 'team' && (
            <View>
              <TouchableOpacity className="bg-blue-600/20 border border-dashed border-blue-600 rounded-xl p-4 mb-4 flex-row items-center justify-center">
                <Plus size={20} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Assign Subcontractor</Text>
              </TouchableOpacity>
              {assignedSubcontractors.map((sub) => (
                <View key={sub.id} className="bg-[#1E3A5F] rounded-xl p-4 mb-3 flex-row items-center border border-blue-900">
                  <Image source={{ uri: sub.avatar }} className="w-12 h-12 rounded-full" resizeMode="cover" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{sub.name}</Text>
                    <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{sub.specialty}</Text>
                  </View>
                  <TouchableOpacity className="w-10 h-10 bg-blue-600/20 rounded-full items-center justify-center">
                    <MessageCircle size={18} color="#3B82F6" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'materials' && (
            <View>
              <TouchableOpacity className="bg-blue-600/20 border border-dashed border-blue-600 rounded-xl p-4 mb-4 flex-row items-center justify-center">
                <Plus size={20} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Order Materials</Text>
              </TouchableOpacity>
              <View className="bg-[#1E3A5F] rounded-xl p-4 mb-3 border border-blue-900">
                <View className="flex-row items-center mb-3">
                  <Package size={20} color="#3B82F6" strokeWidth={2} />
                  <Text className="text-white ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Foundation Materials</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Cement (50 bags)</Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>$2,500</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Steel Rods (200 pcs)</Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>$4,800</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Gravel (10 tons)</Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>$1,200</Text>
                </View>
                <View className="bg-green-600/20 rounded-full px-3 py-1 self-start mt-3">
                  <Text className="text-green-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>Delivered</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
