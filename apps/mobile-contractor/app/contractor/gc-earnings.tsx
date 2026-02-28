import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { TrendingUp, ChevronLeft, ChevronRight, Package, Users, Receipt, CheckCircle } from "lucide-react-native";
import { useState } from "react";
import { useGCEarnings } from "@/hooks/useGC";

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

export default function GCEarningsScreen() {
  const router = useRouter();
  const { data: earnings = [], isLoading } = useGCEarnings();
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const totalEarned = earnings.reduce((sum, p) => sum + p.earned, 0);
  const totalBudget = earnings.reduce((sum, p) => sum + p.budget, 0);
  const totalPending = earnings.reduce((sum, p) => sum + p.pending, 0);
  const totalMaterials = earnings.reduce((sum, p) => sum + p.materialsTotal, 0);
  const totalTeam = earnings.reduce((sum, p) => sum + p.teamTotal, 0);
  const totalRecordedCosts = earnings.reduce((sum, p) => sum + p.recordedCosts, 0);

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <ChevronLeft size={24} color="#3B82F6" strokeWidth={2.5} />
          <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>Earnings</Text>
        <View className="w-16" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Loading earnings...
          </Text>
        </View>
      ) : earnings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 text-6xl" style={{ fontFamily: 'Poppins_700Bold' }}>₦</Text>
          <Text className="text-white text-xl mt-4 text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            No Earnings Yet
          </Text>
          <Text className="text-gray-400 text-center mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            Your earnings from active projects will appear here once you have projects and payments.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Total Earned</Text>
                  <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{totalEarned.toLocaleString()}</Text>
                </View>
                <View className="bg-green-600/20 rounded-full px-3 py-1 flex-row items-center">
                  <TrendingUp size={14} color="#10B981" strokeWidth={2} />
                  <Text className="text-green-400 text-xs ml-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {totalBudget > 0 ? `${((totalEarned / totalBudget) * 100).toFixed(0)}%` : '0%'} of budget
                  </Text>
                </View>
              </View>
              <View className="h-2 bg-blue-900 rounded-full overflow-hidden">
                <View className="h-full bg-blue-600 rounded-full" style={{ width: `${totalBudget > 0 ? Math.min(100, (totalEarned / totalBudget) * 100) : 0}%` }} />
              </View>
              <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                ₦{totalEarned.toLocaleString()} of ₦{totalBudget.toLocaleString()} total project value
              </Text>
            </View>

            <View className="flex-row justify-between gap-3">
              <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 border border-blue-900">
                <Text className="text-gray-400 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Pending</Text>
                <Text className="text-amber-400 text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{totalPending.toLocaleString()}</Text>
              </View>
              <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 border border-blue-900">
                <Text className="text-gray-400 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Projects</Text>
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{earnings.length}</Text>
              </View>
            </View>

            {(totalMaterials > 0 || totalTeam > 0) && (
              <View className="bg-[#1E3A5F] rounded-2xl p-4 mt-4 border border-blue-900">
                <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>Recorded Costs</Text>
                <View className="flex-row justify-between">
                  <View className="flex-row items-center">
                    <Package size={16} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Materials</Text>
                    <Text className="text-white text-sm ml-2" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{totalMaterials.toLocaleString()}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Users size={16} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Team</Text>
                    <Text className="text-white text-sm ml-2" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{totalTeam.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Project List */}
          <View className="px-6 mb-8">
            <Text className="text-white text-xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>By Project</Text>
            {earnings.map((project) => {
              const isExpanded = expandedProjectId === project.id;
              return (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => setExpandedProjectId(isExpanded ? null : project.id)}
                  activeOpacity={0.8}
                  className="bg-[#1E3A5F] rounded-2xl mb-4 overflow-hidden border border-blue-900"
                >
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{project.name}</Text>
                        <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{project.clientName}</Text>
                      </View>
                      <View className={`${project.status === 'paused' ? 'bg-orange-600/20' : 'bg-green-600/20'} rounded-full px-3 py-1`}>
                        <Text className={`${project.status === 'paused' ? 'text-orange-300' : 'text-green-400'} text-xs`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {project.status === 'paused' ? 'Paused' : 'Active'}
                        </Text>
                      </View>
                    </View>

                    {project.currentStage && (
                      <View className="bg-blue-600/20 rounded-full px-3 py-1 self-start mb-2">
                        <Text className="text-blue-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{project.currentStage}</Text>
                      </View>
                    )}

                    <View className="flex-row justify-between items-center mb-2">
                      <View>
                        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Earned</Text>
                        <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{project.earned.toLocaleString()}</Text>
                      </View>
                      <View>
                        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text>
                        <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{project.budget.toLocaleString()}</Text>
                      </View>
                      <View>
                        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Pending</Text>
                        <Text className="text-amber-400" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{project.pending.toLocaleString()}</Text>
                      </View>
                    </View>

                    <View className="mb-2">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Progress</Text>
                        <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{project.progress}%</Text>
                      </View>
                      <View className="h-2 bg-blue-900 rounded-full overflow-hidden">
                        <View className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress}%` }} />
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Due {formatDate(project.dueDate)}</Text>
                      <ChevronRight size={20} color="#3B82F6" strokeWidth={2} style={{ transform: [{ rotate: isExpanded ? '270deg' : '90deg' }] }} />
                    </View>
                  </View>

                  {/* Expanded details */}
                  {isExpanded && (
                    <View className="border-t border-blue-900 px-4 py-4">
                      {project.payments.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Payments Received</Text>
                          {project.payments.map((pay) => (
                            <View key={pay.id} className="flex-row justify-between py-2 border-b border-blue-900/50">
                              <View className="flex-row items-center">
                                <Receipt size={14} color="#6B7280" strokeWidth={2} />
                                <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                                  {pay.stageId ? 'Stage payment' : 'Project activation'} • {pay.method === 'manual' ? 'Manual' : 'Stripe'}
                                </Text>
                              </View>
                              <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{pay.amount.toLocaleString()}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {project.stageBreakdown.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Completed Stages</Text>
                          {project.stageBreakdown.map((s, i) => (
                            <View key={i} className="flex-row justify-between py-2 border-b border-blue-900/50">
                              <View className="flex-row items-center">
                                <CheckCircle size={14} color="#10B981" strokeWidth={2} />
                                <Text className="text-gray-300 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>{s.name}</Text>
                              </View>
                              <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{s.estimatedCost.toLocaleString()}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {(project.materialsTotal > 0 || project.teamTotal > 0) && (
                        <View>
                          <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Recorded Costs</Text>
                          {project.materialsTotal > 0 && (
                            <View className="flex-row justify-between py-2 border-b border-blue-900/50">
                              <View className="flex-row items-center">
                                <Package size={14} color="#6B7280" strokeWidth={2} />
                                <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Materials</Text>
                              </View>
                              <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{project.materialsTotal.toLocaleString()}</Text>
                            </View>
                          )}
                          {project.teamTotal > 0 && (
                            <View className="flex-row justify-between py-2 border-b border-blue-900/50">
                              <View className="flex-row items-center">
                                <Users size={14} color="#6B7280" strokeWidth={2} />
                                <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Team</Text>
                              </View>
                              <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{project.teamTotal.toLocaleString()}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
