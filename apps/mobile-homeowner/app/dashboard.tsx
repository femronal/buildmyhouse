import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MessageCircle, Calendar, DollarSign, ChevronRight, FileText, ArrowLeft, Home, CheckCircle, Clock, Lock, MapPin, HardHat, Bed, Bath, Maximize, PartyPopper } from "lucide-react-native";
import { useProject } from "@/hooks/useProject";
import { useProjectAnalysis } from "@/hooks/usePlan";
import { chatService } from "@/services/chatService";
import { useConversationUnreadCount } from "@/hooks/useChat";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from "react";

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId || '');
  const { data: analysisData, isLoading: analysisLoading } = useProjectAnalysis(projectId || null);
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  
  // Get GC info for chat
  const gcId = (project as any)?.generalContractorId || (project as any)?.generalContractor?.id;
  
  
  // Get or create conversation with GC
  const { data: conversation } = useQuery({
    queryKey: ['conversation', projectId, gcId, currentUser?.id],
    queryFn: async () => {
      if (!gcId || !currentUser?.id) return null;
      return chatService.getOrCreateConversation(
        [gcId, currentUser.id],
        projectId || undefined,
      );
    },
    enabled: !!gcId && !!currentUser?.id && !!projectId,
  });
  
  // Get unread count for this conversation
  const { data: unreadCount = 0 } = useConversationUnreadCount(conversation?.id);

  if (!projectId) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-500 text-center mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          No project selected
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/home')}
          className="bg-black rounded-full py-4 px-8"
        >
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (projectLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading project...
        </Text>
      </View>
    );
  }

  if (projectError || !project) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-500 text-center mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Failed to load project
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/home')}
          className="bg-black rounded-full py-4 px-8"
        >
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const aiAnalysis = analysisData?.aiAnalysis || (project as any).aiAnalysis;
  const phases = aiAnalysis?.phases || [];
  const stages = (project as any).stages || [];
  const gcName = (project as any).generalContractor?.fullName || 'Not Assigned';
  const currentStage = stages.find((s: any) => s.status === 'in_progress') || stages.find((s: any) => s.status === 'completed');
  const completedStages = stages.filter((s: any) => s.status === 'completed').length;
  const totalStages = stages.length || phases.length;
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : project.progress || 0;
  const isProjectComplete = totalStages > 0 && completedStages === totalStages;
  
  // Calculate spent from completed stages' estimatedCost
  const calculatedSpent = stages
    .filter((s: any) => s.status === 'completed')
    .reduce((sum: number, stage: any) => sum + (stage.estimatedCost || 0), 0);
  
  // Use calculated spent if available, otherwise fallback to project.spent
  const spent = calculatedSpent || (project.spent || 0);
  
  // Calculate total budget from all stages' estimatedCost
  const calculatedBudget = stages.reduce((sum: number, stage: any) => sum + (stage.estimatedCost || 0), 0);
  
  // Use calculated budget if available, otherwise fallback to project.budget
  const totalBudget = calculatedBudget > 0 ? calculatedBudget : (project.budget || 0);

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#10b981" strokeWidth={2} />;
      case 'in_progress':
        return <Clock size={20} color="#3b82f6" strokeWidth={2} />;
      case 'blocked':
        return <Lock size={20} color="#ef4444" strokeWidth={2} />;
      default:
        return <Lock size={20} color="#9ca3af" strokeWidth={2} />;
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 border-blue-300';
      case 'blocked':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-black rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <Text 
          className="text-3xl text-black mb-1"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          {project.name}
        </Text>
        <View className="flex-row items-center">
          <MapPin size={14} color="#737373" strokeWidth={2} />
        <Text 
            className="text-sm text-gray-500 ml-1"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
            {project.address}
        </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Current Stage Card */}
        <View className="bg-black rounded-3xl p-6 mb-6">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text 
                className="text-sm text-white/50 mb-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Current Stage
              </Text>
              <Text 
                className="text-2xl text-white mb-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                {currentStage?.name || project.currentStage || 'Not Started'}
              </Text>
              <View className="bg-white/20 rounded-full px-3 py-1 self-start mt-2">
                <Text 
                  className="text-white text-xs"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  {currentStage?.status === 'in_progress' ? 'In Progress' : 
                   currentStage?.status === 'completed' ? 'Completed' : 'Not Started'}
                </Text>
              </View>
            </View>
            
            {/* Radial Progress */}
            <View className="items-center">
              <View className="w-24 h-24 rounded-full border-8 border-white/20 items-center justify-center">
                  <Text 
                    className="text-2xl text-white"
                  style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                  >
                  {progress}%
                  </Text>
              </View>
            </View>
          </View>

          <View className="bg-white/10 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <HardHat size={18} color="#FFFFFF" strokeWidth={2} />
              <Text 
                className="text-white/80 text-sm ml-2"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                General Contractor
              </Text>
            </View>
            <Text 
              className="text-white text-base"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {gcName}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => router.push(`/timeline?projectId=${projectId}`)}
            className="bg-white rounded-full py-4 px-6 flex-row items-center justify-center"
          >
            <Text 
              className="text-black text-base mr-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              View Full Timeline
            </Text>
            <ChevronRight size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Project Overview - GC Summary */}
        {aiAnalysis && (
          <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
            <View className="flex-row items-center mb-4">
              <HardHat size={24} color="#000000" strokeWidth={2} />
              <Text 
                className="text-xl text-black ml-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Project Summary
              </Text>
            </View>

            {/* Specs */}
            <View className="flex-row flex-wrap mb-4">
              {aiAnalysis.bedrooms && (
                <View className="bg-white rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                  <Bed size={16} color="#000000" strokeWidth={2} />
                  <Text className="text-black ml-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {aiAnalysis.bedrooms} Bed
                  </Text>
                </View>
              )}
              {aiAnalysis.bathrooms && (
                <View className="bg-white rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                  <Bath size={16} color="#000000" strokeWidth={2} />
                  <Text className="text-black ml-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {aiAnalysis.bathrooms} Bath
                  </Text>
                </View>
              )}
              {aiAnalysis.squareFootage && (
                <View className="bg-white rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                  <Maximize size={16} color="#000000" strokeWidth={2} />
                  <Text className="text-black ml-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {aiAnalysis.squareFootage} sqft
                  </Text>
                </View>
              )}
            </View>

            {aiAnalysis.description && (
              <Text 
                className="text-gray-600 text-sm leading-5"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {aiAnalysis.description}
              </Text>
            )}
          </View>
        )}

        {/* Financial Summary */}
        <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
          <View className="flex-row items-center mb-4">
            <DollarSign size={24} color="#000000" strokeWidth={2} />
            <Text 
              className="text-xl text-black ml-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Financial Summary
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text 
              className="text-gray-500"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Total Budget
            </Text>
            <Text 
              className="text-black"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            >
              ${totalBudget.toLocaleString()}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text 
              className="text-gray-500"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Spent
            </Text>
            <Text 
              className="text-black"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            >
              ${spent.toLocaleString()}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text 
              className="text-gray-500"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Remaining
            </Text>
            <Text 
              className="text-black"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            >
              ${(totalBudget - spent).toLocaleString()}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full bg-black rounded-full" 
              style={{ width: `${totalBudget > 0 ? Math.min((spent / totalBudget * 100), 100) : 0}%` }} 
            />
          </View>
        </View>

        {/* Progress Timeline - Stages/Phases */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
            <Calendar size={24} color="#000000" strokeWidth={2} />
            <Text 
              className="text-xl text-black ml-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
                Progress Timeline
              </Text>
            </View>
            <Text 
              className="text-gray-500 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {completedStages}/{totalStages} Complete
            </Text>
          </View>
          
          {/* Display Stages if available, otherwise use phases from GC analysis */}
          {(stages.length > 0 ? stages : phases).map((item: any, index: number) => {
            const stageName = item.name || item;
            const stageStatus = item.status || 
              (index < completedStages ? 'completed' : 
               index === completedStages ? 'in_progress' : 'not_started');
            const estimatedDuration = item.estimatedDuration || item.duration || '';
            const estimatedCost = item.estimatedCost || item.cost || 0;

            return (
              <View 
                key={item.id || index}
                className={`${getStageStatusColor(stageStatus)} rounded-2xl p-4 mb-3 border`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-2">
                      {getStageStatusIcon(stageStatus)}
                      <Text 
                        className="text-black text-base ml-2"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {index + 1}. {stageName}
                      </Text>
                    </View>
                    {item.description && (
          <Text 
                        className="text-gray-600 text-sm mb-2"
                        style={{ fontFamily: 'Poppins_400Regular' }}
          >
                        {item.description}
          </Text>
                    )}
                    <View className="flex-row items-center mt-2">
                      {estimatedDuration && (
                        <View className="flex-row items-center mr-4">
                          <Clock size={14} color="#6b7280" strokeWidth={2} />
          <Text 
                            className="text-gray-600 text-xs ml-1"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
                            {estimatedDuration}
                          </Text>
                        </View>
                      )}
                      {estimatedCost > 0 && (
                        <Text 
                          className="text-black text-sm"
                          style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                        >
                          ${estimatedCost.toLocaleString()}
          </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Ratings removed for MVP */}

        {/* Project Dates */}
        {(project.startDate || project.dueDate) && (
          <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
            <View className="flex-row items-center mb-4">
              <Calendar size={24} color="#000000" strokeWidth={2} />
              <Text 
                className="text-xl text-black ml-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Timeline
              </Text>
            </View>
            
            {project.startDate && (
              <View className="mb-3">
                <Text 
                  className="text-gray-500 text-sm mb-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Start Date
                </Text>
              <Text 
                className="text-black"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                  {new Date(project.startDate).toLocaleDateString()}
              </Text>
              </View>
            )}
            
            {project.dueDate && (
              <View>
                <Text 
                  className="text-gray-500 text-sm mb-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Estimated Completion
                </Text>
                <Text 
                  className="text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  {new Date(project.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}
        </View>
        )}

        {/* Project Completion Congratulations & Rating */}
        {isProjectComplete && (
          <View className="bg-green-50 rounded-3xl p-6 mb-6 border border-green-200">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-green-600 rounded-full items-center justify-center mb-3">
                <PartyPopper size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text 
                className="text-2xl text-black mb-2 text-center"
                style={{ fontFamily: 'Poppins_800ExtraBold' }}
              >
                🎉 Congratulations!
              </Text>
              <Text 
                className="text-gray-700 text-center mb-1"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Your project is complete!
              </Text>
              <Text 
                className="text-gray-600 text-sm text-center"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                All stages have been successfully completed. Thank you for building with us!
              </Text>
            </View>

            {/* Important Notes */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-green-200">
              <Text 
                className="text-black text-sm mb-2"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Important Notes:
              </Text>
              <Text 
                className="text-gray-600 text-xs mb-2"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                • Even though your project is marked as complete, you can always contact your GC to rework any stage that needs attention.
              </Text>
              <Text 
                className="text-gray-600 text-xs"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                • Your GC can still upload files, materials, and team members to any stage, as this project remains active forever.
              </Text>
            </View>

            {/* Ratings removed for MVP */}
          </View>
        )}
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity 
        onPress={() => router.push(`/chat?projectId=${projectId}`)}
        className="absolute bottom-8 right-6 bg-black rounded-full p-5 shadow-lg"
      >
        <MessageCircle size={28} color="#FFFFFF" strokeWidth={2} />
        {unreadCount > 0 && (
          <View className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full items-center justify-center border-2 border-white">
            <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
