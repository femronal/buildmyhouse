import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { 
  Bell, 
  Settings, 
  Wrench, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  ChevronRight, 
  MessageCircle, 
  Calendar,
  MapPin,
  Camera,
  Star,
  Briefcase
} from "lucide-react-native";
import { useState } from "react";

const assignedJobs = [
  {
    id: 1,
    projectName: "Modern Minimalist Villa",
    gcName: "Chukwuemeka Okonkwo",
    stage: "Foundation",
    address: "123 Main Street, Lekki, Lagos",
    status: "in_progress",
    payment: 8500,
    dueDate: "Dec 15, 2024",
    instructions: "Complete concrete pouring for foundation. Ensure proper curing time.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80",
  },
  {
    id: 2,
    projectName: "Classic Colonial Estate",
    gcName: "Adaeze Builders Ltd",
    stage: "Plumbing Rough-In",
    address: "456 Oak Avenue, Abuja",
    status: "pending",
    payment: 12000,
    dueDate: "Dec 22, 2024",
    instructions: "Install main water lines and drainage system.",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80",
  },
];

const completedJobs = [
  {
    id: 3,
    projectName: "Luxury Penthouse",
    stage: "Plumbing Installation",
    payment: 15000,
    completedDate: "Nov 28, 2024",
    rating: 5,
  },
  {
    id: 4,
    projectName: "Garden Villa",
    stage: "Water Heater Setup",
    payment: 4500,
    completedDate: "Nov 15, 2024",
    rating: 4,
  },
];

const services = [
  "Plumbing Installation",
  "Pipe Repair",
  "Water Heater Installation",
  "Drainage Systems",
  "Bathroom Fixtures",
];

export default function SubcontractorDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const totalEarnings = completedJobs.reduce((sum, j) => sum + j.payment, 0);
  const pendingEarnings = assignedJobs.reduce((sum, j) => sum + j.payment, 0);

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-orange-600 rounded-full items-center justify-center">
            <Wrench size={24} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View className="ml-3">
            <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Welcome back,</Text>
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Lagos Plumbing Co.</Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2">
            <Bell size={20} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center">
            <Settings size={20} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row">
            <View className="flex-1 bg-orange-600 rounded-2xl p-4 mr-2">
              <View className="flex-row items-center mb-2">
                <Briefcase size={18} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white/70 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Active Jobs</Text>
              </View>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{assignedJobs.length}</Text>
            </View>
            <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 ml-2 border border-blue-900">
              <View className="flex-row items-center mb-2">
                <Star size={18} color="#F59E0B" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Rating</Text>
              </View>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>4.8</Text>
            </View>
          </View>

          <View className="bg-[#1E3A5F] rounded-2xl p-5 mt-4 border border-blue-900">
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Total Earnings</Text>
                <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${totalEarnings.toLocaleString()}</Text>
              </View>
              <View className="bg-orange-600/20 rounded-full px-3 py-1">
                <Text className="text-orange-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>This Month</Text>
              </View>
            </View>
            <View className="flex-row items-center mt-2">
              <Clock size={14} color="#6B7280" strokeWidth={2} />
              <Text className="text-gray-500 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                ${pendingEarnings.toLocaleString()} pending from active jobs
              </Text>
            </View>
          </View>
        </View>

        {/* Services Offered */}
        <View className="px-6 mb-6">
            <Text className="text-white text-3xl mb-4" style={{ fontFamily: 'Poppins_800ExtraBold' }}>Services Offered</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {services.map((service, index) => (
              <View key={index} className="bg-[#1E3A5F] rounded-full px-4 py-2 mr-2 border border-blue-900">
                <Text className="text-gray-300 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{service}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Jobs Section */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-3xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>My Jobs</Text>
            <View className="flex-row bg-[#1E3A5F] rounded-full p-1">
              <TouchableOpacity 
                onPress={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-full ${activeTab === 'active' ? 'bg-orange-600' : ''}`}
              >
                <Text className={`text-xs ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-full ${activeTab === 'completed' ? 'bg-orange-600' : ''}`}
              >
                <Text className={`text-xs ${activeTab === 'completed' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>Completed</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'active' ? (
            assignedJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => router.push(`/contractor/sub-job-detail?id=${job.id}`)}
                className="bg-[#1E3A5F] rounded-2xl mb-4 overflow-hidden border border-blue-900"
              >
                <Image source={{ uri: job.image }} className="w-full h-28" resizeMode="cover" />
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{job.projectName}</Text>
                      <Text className="text-gray-400 text-lg" style={{ fontFamily: 'Poppins_500Medium' }}>GC: {job.gcName}</Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${job.status === 'in_progress' ? 'bg-blue-600/20' : 'bg-yellow-600/20'}`}>
                      <Text className={`text-xs ${job.status === 'in_progress' ? 'text-blue-400' : 'text-yellow-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {job.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="bg-orange-600/10 rounded-lg p-3 mb-3">
                    <Text className="text-orange-400 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>{job.stage}</Text>
                    <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>{job.instructions}</Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#6B7280" strokeWidth={2} />
                      <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Due: {job.dueDate}</Text>
                    </View>
                    <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${job.payment.toLocaleString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            completedJobs.map((job) => (
              <View key={job.id} className="bg-[#1E3A5F] rounded-2xl p-4 mb-3 border border-green-900/50">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{job.projectName}</Text>
                    <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{job.stage}</Text>
                  </View>
                  <View className="bg-green-600/20 rounded-full px-3 py-1">
                    <Text className="text-green-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>Completed</Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center mt-2">
                  <View className="flex-row items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} color={i < job.rating ? "#F59E0B" : "#374151"} fill={i < job.rating ? "#F59E0B" : "transparent"} strokeWidth={2} />
                    ))}
                  </View>
                  <Text className="text-green-400" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>+${job.payment.toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Bigger, Clearer */}
      <View className="flex-row bg-[#0A1628] border-t border-blue-900 px-4 py-4">
        <TouchableOpacity 
          onPress={() => router.push('/contractor/sub-dashboard')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-orange-600/20 mb-1">
            <Briefcase size={30} color="#F97316" strokeWidth={3} />
          </View>
          <Text className="text-orange-400 text-base mt-1" style={{ fontFamily: 'Poppins_700Bold' }}>Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/contractor/chat')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <MessageCircle size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {/* Navigate to schedule */}}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <Calendar size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {/* Navigate to earnings */}}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <DollarSign size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Earnings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
