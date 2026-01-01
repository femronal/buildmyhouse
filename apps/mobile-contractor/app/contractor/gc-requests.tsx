import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock, MapPin, DollarSign, User, CheckCircle, XCircle } from "lucide-react-native";
import { usePendingRequests, useAcceptRequest, useRejectRequest } from "../../hooks/useGC";
import { useState } from "react";

export default function GCRequestsScreen() {
  const router = useRouter();
  const { data: pendingRequests = [], isLoading, error, refetch } = usePendingRequests();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  console.log('═══════════════════════════════════════');
  console.log('📋 [GC Requests Screen] RENDER');
  console.log('  isLoading:', isLoading);
  console.log('  error:', error);
  console.log('  pendingRequests:', pendingRequests);
  console.log('  pendingRequests.length:', pendingRequests?.length || 0);
  console.log('  pendingRequests type:', typeof pendingRequests);
  console.log('  pendingRequests is array?', Array.isArray(pendingRequests));
  console.log('═══════════════════════════════════════');

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-6 border-b border-blue-900">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/contractor/gc-dashboard');
              }
            }}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#3B82F6" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl flex-1 text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            Project Requests
          </Text>
          <View className="w-10" />
        </View>
        <Text className="text-gray-400 text-center text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
          {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
        </Text>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        <View className="px-6 py-6">
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Loading requests...
              </Text>
            </View>
          ) : pendingRequests.length === 0 ? (
            <View className="items-center py-20">
              <View className="w-20 h-20 bg-[#1E3A5F] rounded-full items-center justify-center mb-4">
                <Clock size={40} color="#6B7280" strokeWidth={1.5} />
              </View>
              <Text className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                No Pending Requests
              </Text>
              <Text className="text-gray-400 text-center text-sm px-8" style={{ fontFamily: 'Poppins_400Regular' }}>
                New project requests from homeowners will appear here
              </Text>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <View
                key={request.id}
                className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border-2 border-yellow-600/30"
              >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-white text-xl mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {request.project.name || 'New Project'}
                    </Text>
                    <View className="flex-row items-center">
                      <User size={14} color="#9CA3AF" strokeWidth={2} />
                      <Text className="text-gray-400 text-sm ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {request.project.homeowner.fullName}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-yellow-600/20 rounded-full px-3 py-1.5">
                    <Text className="text-yellow-400 text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                      NEW
                    </Text>
                  </View>
                </View>

                {/* Project Details */}
                <View className="space-y-3 mb-4">
                  {/* Location */}
                  <View className="flex-row items-start">
                    <MapPin size={16} color="#6B7280" strokeWidth={2} className="mt-0.5" />
                    <Text className="text-gray-300 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {request.project.address}
                    </Text>
                  </View>

                  {/* Budget */}
                  <View className="flex-row items-center">
                    <DollarSign size={16} color="#10B981" strokeWidth={2} />
                    <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Budget:{' '}
                      <Text className="text-green-400 text-base" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                        ${request.project.budget?.toLocaleString() || 'N/A'}
                      </Text>
                    </Text>
                  </View>

                  {/* Date */}
                  <View className="flex-row items-center">
                    <Clock size={16} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-500 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Received {new Date(request.sentAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>

                {/* Contact Info */}
                {request.project.homeowner.email && (
                  <View className="bg-[#0A1628] rounded-xl p-3 mb-4">
                    <Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Contact
                    </Text>
                    <Text className="text-blue-400 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {request.project.homeowner.email}
                    </Text>
                    {request.project.homeowner.phone && (
                      <Text className="text-gray-300 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {request.project.homeowner.phone}
                      </Text>
                    )}
                  </View>
                )}

                {/* Action Button - Only Review */}
                <TouchableOpacity 
                  onPress={() => {
                    console.log('Review request:', request.id);
                    router.push(`/contractor/gc-request-detail?id=${request.id}`);
                  }}
                  className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center shadow-lg"
                >
                  <CheckCircle size={20} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Review Project
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}


