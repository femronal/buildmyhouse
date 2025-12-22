import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Settings, Briefcase, Clock, CheckCircle, DollarSign, Users, ChevronRight, Plus, MessageCircle, TrendingUp, Calendar } from "lucide-react-native";
import { useState } from "react";
import { usePendingRequests } from "../../hooks/useGC";

const activeProjects = [
  {
    id: 1,
    name: "Modern Minimalist Villa",
    client: "Ifeoma Obi-Uchendu",
    address: "123 Main Street, Lekki, Lagos",
    progress: 25,
    currentStage: "Foundation",
    budget: 285000,
    earned: 71250,
    dueDate: "Mar 2025",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80",
  },
  {
    id: 2,
    name: "Classic Colonial Estate",
    client: "Adaeze Nwosu",
    address: "456 Oak Avenue, Abuja",
    progress: 65,
    currentStage: "Electrical",
    budget: 385000,
    earned: 250250,
    dueDate: "Dec 2024",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80",
  },
];

const pendingProjects = [
  {
    id: 3,
    name: "Luxury Penthouse",
    client: "Chidi Okonkwo",
    address: "789 Victoria Island, Lagos",
    budget: 520000,
    requestDate: "2 days ago",
  },
];

const recentActivity = [
  { id: 1, type: "payment", message: "Payment received for Foundation stage", amount: 35000, time: "2 hours ago" },
  { id: 2, type: "message", message: "New message from Ifeoma Obi-Uchendu", time: "5 hours ago" },
  { id: 3, type: "stage", message: "Site Preparation marked complete", project: "Modern Minimalist Villa", time: "1 day ago" },
];

export default function GCDashboardScreen() {
  console.log('🚀 [GC Dashboard] Component loaded - NEW VERSION WITH REQUESTS BUTTON!');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  
  // Fetch real pending requests
  const { data: pendingRequests = [], isLoading: loadingPendingRequests } = usePendingRequests();
  console.log('📊 [GC Dashboard] Pending requests count:', pendingRequests.length);

  const totalEarnings = activeProjects.reduce((sum, p) => sum + p.earned, 0);
  const totalBudget = activeProjects.reduce((sum, p) => sum + p.budget, 0);

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" }}
            className="w-12 h-12 rounded-full"
            resizeMode="cover"
          />
          <View className="ml-3">
            <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Welcome back,</Text>
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Chukwuemeka O.</Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={() => router.push('/contractor/chat')}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2"
          >
            <MessageCircle size={20} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
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
            <View className="flex-1 bg-blue-600 rounded-2xl p-4 mr-2">
              <View className="flex-row items-center mb-2">
                <Briefcase size={18} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white/70 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Active Projects</Text>
              </View>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{activeProjects.length}</Text>
            </View>
            <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 ml-2 border border-blue-900">
              <View className="flex-row items-center mb-2">
                <Clock size={18} color="#F59E0B" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Pending</Text>
              </View>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{pendingRequests.length}</Text>
            </View>
          </View>

          <View className="bg-[#1E3A5F] rounded-2xl p-5 mt-4 border border-blue-900">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Total Earnings</Text>
                <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${totalEarnings.toLocaleString()}</Text>
              </View>
              <View className="bg-green-600/20 rounded-full px-3 py-1 flex-row items-center">
                <TrendingUp size={14} color="#10B981" strokeWidth={2} />
                <Text className="text-green-400 text-xs ml-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>+12.5%</Text>
              </View>
            </View>
            <View className="h-2 bg-blue-900 rounded-full overflow-hidden">
              <View className="h-full bg-blue-600 rounded-full" style={{ width: `${(totalEarnings / totalBudget) * 100}%` }} />
            </View>
            <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              ${totalEarnings.toLocaleString()} of ${totalBudget.toLocaleString()} total project value
            </Text>
          </View>
        </View>

        {/* Projects Section */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-3xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>Projects</Text>
            <View className="flex-row bg-[#1E3A5F] rounded-full p-1">
              <TouchableOpacity 
                onPress={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-full ${activeTab === 'active' ? 'bg-blue-600' : ''}`}
              >
                <Text className={`text-xs ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-full ${activeTab === 'pending' ? 'bg-blue-600' : ''}`}
              >
                <Text className={`text-xs ${activeTab === 'pending' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>Pending</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'active' ? (
            activeProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                onPress={() => router.push(`/contractor/gc-project-detail?id=${project.id}`)}
                className="bg-[#1E3A5F] rounded-2xl mb-4 overflow-hidden border border-blue-900"
              >
                <Image source={{ uri: project.image }} className="w-full h-32" resizeMode="cover" />
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{project.name}</Text>
                      <Text className="text-gray-400 text-lg" style={{ fontFamily: 'Poppins_500Medium' }}>{project.client}</Text>
                    </View>
                    <View className="bg-blue-600/20 rounded-full px-3 py-1">
                      <Text className="text-blue-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{project.currentStage}</Text>
                    </View>
                  </View>
                  
                  <View className="mb-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Progress</Text>
                      <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{project.progress}%</Text>
                    </View>
                    <View className="h-2 bg-blue-900 rounded-full overflow-hidden">
                      <View className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress}%` }} />
                    </View>
                  </View>

                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Earned</Text>
                      <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${project.earned.toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Due Date</Text>
                      <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>{project.dueDate}</Text>
                    </View>
                    <ChevronRight size={24} color="#3B82F6" strokeWidth={2} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : loadingPendingRequests ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Loading pending requests...
              </Text>
            </View>
          ) : pendingRequests.length === 0 ? (
            <View className="items-center py-10">
              <Clock size={48} color="#6B7280" strokeWidth={1.5} />
              <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                No Pending Requests
              </Text>
              <Text className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                New project requests will appear here
              </Text>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                className="bg-[#1E3A5F] rounded-2xl p-4 mb-4 border border-yellow-700/50"
                onPress={() => router.push(`/contractor/gc-request-detail?id=${request.id}`)}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {request.project.name || 'Project Request'}
                    </Text>
                    <Text className="text-gray-400 text-base" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {request.project.homeowner.fullName}
                    </Text>
                  </View>
                  <View className="bg-yellow-600/20 rounded-full px-3 py-1">
                    <Text className="text-yellow-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      New Request
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {request.project.address}
                </Text>
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text>
                    <Text className="text-white text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${request.project.budget?.toLocaleString() || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row">
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log('Decline request:', request.id);
                      }}
                      className="bg-red-600/20 rounded-full px-5 py-3 mr-2"
                    >
                      <Text className="text-red-400 text-base" style={{ fontFamily: 'Poppins_700Bold' }}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log('Accept request:', request.id);
                        router.push(`/contractor/gc-request-detail?id=${request.id}`);
                      }}
                      className="bg-blue-600 rounded-full px-5 py-3"
                    >
                      <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>Review</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity> 
            )) 
          )} 
        </View>

        {/* Recent Activity */}
        <View className="px-6 pb-8">
            <Text className="text-white text-3xl mb-4" style={{ fontFamily: 'Poppins_800ExtraBold' }}>Recent Activity</Text>
          {recentActivity.map((activity) => (
            <View key={activity.id} className="bg-[#1E3A5F] rounded-xl p-4 mb-3 flex-row items-center border border-blue-900">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                activity.type === 'payment' ? 'bg-green-600/20' : 
                activity.type === 'message' ? 'bg-blue-600/20' : 'bg-purple-600/20'
              }`}>
                {activity.type === 'payment' ? <DollarSign size={20} color="#10B981" strokeWidth={2} /> :
                 activity.type === 'message' ? <MessageCircle size={20} color="#3B82F6" strokeWidth={2} /> :
                 <CheckCircle size={20} color="#A855F7" strokeWidth={2} />}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{activity.message}</Text>
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{activity.time}</Text>
              </View>
              {activity.amount && (
                <Text className="text-green-400" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>+${activity.amount.toLocaleString()}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Bigger, Clearer */}
      <View className="flex-row bg-[#0A1628] border-t border-blue-900 px-4 py-4">
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
        
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Team</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            console.log('🔔 Requests button clicked! Navigating to /contractor/gc-requests');
            router.push('/contractor/gc-requests');
          }}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-yellow-600/20 mb-1 relative border border-yellow-600/50">
            <Bell size={30} color="#F59E0B" strokeWidth={2.5} />
            {pendingRequests.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-6 h-6 items-center justify-center">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {pendingRequests.length}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-yellow-400 text-base mt-1 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
            REQUESTS
          </Text>
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
